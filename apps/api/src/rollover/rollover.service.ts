import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GovernanceService } from '../governance/governance.service';
import { ResourceType, PermissionAction } from '../governance/permissions';
import {
  ROLLOVER_ITEMS,
  STRUCTURE_ITEMS,
  ROLLOVER_MODES,
  YEAR_STRUCTURE_MODELS,
  RolloverItemKey,
  RolloverMode,
} from './rollover.types';

export interface RolloverRequest {
  sourceYearId: number;
  targetYearId: number;
  mode?: RolloverMode;
  items?: RolloverItemKey[];
  orgUnitIds?: number[];
  goalIds?: number[];
  modules?: string[];
}

@Injectable()
export class RolloverService {
  constructor(
    private db: PrismaService,
    private governance: GovernanceService,
  ) {}

  // ==================== PREVIEW ====================
  async previewRollover(dto: RolloverRequest, _userId: number) {
    const source = await this.db.planningYear.findUnique({ where: { id: dto.sourceYearId } });
    const target = await this.db.planningYear.findUnique({ where: { id: dto.targetYearId } });
    if (!source || !target) throw new NotFoundException('Year not found');
    if (source.id === target.id) throw new BadRequestException('Source and target year must differ');

    const selected = dto.items && dto.items.length ? dto.items : this.resolveModeItems(dto);
    const filters = this.buildFilters(dto);

    const preview: any = {
      sourceYear: { id: source.id, year: source.year, label: source.label },
      targetYear: { id: target.id, year: target.year, label: target.label },
      mode: dto.mode || ROLLOVER_MODES.ALL,
      items: [],
      performanceNotCopied: this.performanceNotCopied(),
      protection: this.warnings({ source, target }),
    };

    for (const key of selected) {
      const count = await this.countSourceItems(key, source.id, filters);
      preview.items.push({
        key,
        label: STRUCTURE_ITEMS.find(i => i.key === key)?.label || key,
        sourceCount: count,
        copied: count > 0,
      });
    }
    return preview;
  }

  // ==================== EXECUTION ====================
  async executeRollover(dto: RolloverRequest, userId: number) {
    await this.assertPermission(userId, 'create');

    const source = await this.db.planningYear.findUnique({ where: { id: dto.sourceYearId } });
    const target = await this.db.planningYear.findUnique({ where: { id: dto.targetYearId } });
    if (!source || !target) throw new NotFoundException('Year not found');
    if (source.id === target.id) throw new BadRequestException('Source and target year must differ');

    const mode = dto.mode || ROLLOVER_MODES.ALL;

    // Idempotency: one job per (source, target, mode).
    // completed/in_progress jobs block duplicates; failed/cancelled jobs are
    // reset and reused so a retry never creates duplicate structure.
    const existingJob = await this.db.rolloverJob.findUnique({
      where: { sourceYearId_targetYearId_mode: { sourceYearId: source.id, targetYearId: target.id, mode } },
    });
    if (existingJob && ['completed', 'in_progress'].includes(existingJob.status)) {
      throw new BadRequestException(
        `Rollover ${source.year} -> ${target.year} (${mode}) already ran (status '${existingJob.status}'). Protected against duplicates.`,
      );
    }

    const w = this.warnings({ source, target });
    if (w.targetClosed) {
      throw new ForbiddenException(`Target year ${target.year} is closed/archived and cannot receive rollover data.`);
    }

    // Enforce canonical copy order so parents are always copied before
    // children (themes -> goals -> objectives -> projects -> activities -> kpis ...).
    const canonicalOrder = STRUCTURE_ITEMS.map(i => i.key);
    const selected = (dto.items && dto.items.length ? dto.items : this.resolveModeItems(dto))
      .slice()
      .sort((a, b) => canonicalOrder.indexOf(a) - canonicalOrder.indexOf(b));

    const filters = this.buildFilters(dto);
    const user = await this.db.user.findUnique({ where: { id: userId } });

    let job;
    if (existingJob) {
      // Retry path: reuse the existing job row, clearing its item ledger.
      await this.db.rolloverItem.deleteMany({ where: { jobId: existingJob.id } });
      job = await this.db.rolloverJob.update({
        where: { id: existingJob.id },
        data: {
          status: 'in_progress',
          selection: selected as any,
          summary: undefined as any,
          createdBy: userId,
          createdByName: user?.fullName || null,
          startedAt: new Date(),
          completedAt: null,
          cancelledAt: null,
        },
      });
    } else {
      job = await this.db.rolloverJob.create({
        data: {
          sourceYearId: source.id,
          targetYearId: target.id,
          status: 'in_progress',
          mode,
          selection: selected as any,
          createdBy: userId,
          createdByName: user?.fullName || null,
          startedAt: new Date(),
        },
      });
    }

    const summary: any = { copied: {}, skipped: [], failed: [] };
    try {
      for (const key of selected) {
        const result = await this.copyStructureItem(key, source.id, target.id, filters, job.id);
        summary.copied[key] = result;
      }

      await this.db.rolloverJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          preview: { sourceYear: source.year, targetYear: target.year, items: selected },
          summary,
        },
      });

      await this.governance.logAudit({
        userId,
        action: 'ROLLOVER',
        entity: 'PlanningYear',
        recordId: target.id,
        oldValue: { sourceYearId: source.id, targetYearId: target.id, mode },
        newValue: { summary, sourceYear: source.year, targetYear: target.year },
        metadata: { mode, items: selected },
      });

      return { jobId: job.id, sourceYear: source.year, targetYear: target.year, summary };
    } catch (error: any) {
      await this.db.rolloverJob.update({
        where: { id: job.id },
        data: { status: 'failed', summary: { ...summary, error: error.message } },
      });
      throw new BadRequestException(`Rollover failed: ${error.message}`);
    }
  }

  // ==================== JOB MANAGEMENT ====================
  /** Wizard metadata: selectable structure items + isolation guarantees. */
  getStructureItems() {
    return {
      structureItems: STRUCTURE_ITEMS,
      neverCopied: this.performanceNotCopied(),
      modes: Object.values(ROLLOVER_MODES),
    };
  }

  async listJobs(sourceYearId?: number, targetYearId?: number) {
    const where: any = {};
    if (sourceYearId) where.sourceYearId = sourceYearId;
    if (targetYearId) where.targetYearId = targetYearId;
    return this.db.rolloverJob.findMany({
      where,
      include: {
        sourceYear: { select: { year: true, label: true } },
        targetYear: { select: { year: true, label: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJob(id: number) {
    const job = await this.db.rolloverJob.findUnique({
      where: { id },
      include: { sourceYear: true, targetYear: true, items: { orderBy: { id: 'asc' } } },
    });
    if (!job) throw new NotFoundException('Rollover job not found');
    return job;
  }

  // ==================== COPY ENGINE ====================
  // Copies one category of STRUCTURE from the source year into the target
  // year. Never copies performance data. Resets year-specific statuses and
  // records a source-year reference on every created row.

  private async copyStructureItem(
    key: RolloverItemKey,
    sourceYearId: number,
    targetYearId: number,
    filters: { org: any; goal: any },
    jobId: number,
  ): Promise<{ copied: number; skipped: number; failed: number }> {
    const sources = await this.loadSourceItems(key, sourceYearId, filters);
    let copied = 0;
    let skipped = 0;
    let failed = 0;

    for (const src of sources) {
      // Per-item idempotency: was this source record already rolled to this target?
      const already = await this.db.rolloverItem.findFirst({
        where: { sourceYearId, targetYearId, itemKey: key, sourceId: src.id },
      });
      if (already) {
        skipped++;
        continue;
      }

      try {
        const targetId = await this.copyOne(key, src, targetYearId);
        await this.db.rolloverItem.create({
          data: {
            jobId,
            itemKey: key,
            sourceId: src.id,
            targetId: targetId ?? null,
            sourceYearId,
            targetYearId,
            status: 'copied',
            copiedData: { title: src.title || src.name || String(src.id) },
            copiedAt: new Date(),
          },
        });
        copied++;
      } catch (e: any) {
        failed++;
        await this.db.rolloverItem.create({
          data: {
            jobId,
            itemKey: key,
            sourceId: src.id,
            sourceYearId,
            targetYearId,
            status: 'failed',
            error: e?.message || 'unknown error',
          },
        }).catch(() => {});
      }
    }

    return { copied, skipped, failed };
  }

  /**
   * Copies a single source record into the target year.
   * - Preserves reusable definitions (names, descriptions, weights, formulas)
   * - Resets year-specific statuses (draft / not_started / planned / open)
   * - Resets targets so they must be reviewed (never carries performance data)
   * - Shifts dates forward one year as a review convenience
   * - Remaps parent references to their rolled-over counterparts
   */
  private async copyOne(key: RolloverItemKey, src: any, targetYearId: number): Promise<number | null> {
    const db = this.db as any;
    const shift = (d: any) => this.addYears(d, 1);

    switch (key) {
      case ROLLOVER_ITEMS.THEME: {
        // Strategic themes are shared definitions; ensure they exist.
        const existing = await db.strategicTheme.findFirst({
          where: { OR: [{ code: src.code || undefined }, { name: src.name }] },
        });
        if (existing) return null; // already present (shared structure)
        const created = await db.strategicTheme.create({
          data: { code: src.code, name: src.name, description: src.description, active: true },
        });
        // Carry the year-scoped strategic results of this theme into the target year.
        const results = await db.strategicResult.findMany({ where: { themeId: src.id } });
        for (const r of results) {
          const dup = await db.strategicResult.findFirst({
            where: { themeId: created.id, name: r.name, yearId: targetYearId },
          });
          if (dup) continue;
          await db.strategicResult.create({
            data: {
              themeId: created.id,
              yearId: targetYearId,
              code: r.code,
              name: r.name,
              description: r.description,
            },
          });
        }
        return created.id;
      }

      case ROLLOVER_ITEMS.ORG_UNIT:
        // Org structure is shared master data — nothing to duplicate.
        return null;

      case ROLLOVER_ITEMS.BUDGET_CATEGORY: {
        const existing = await db.budgetCategory.findFirst({ where: { name: src.name } });
        if (existing) return null;
        const created = await db.budgetCategory.create({
          data: { code: src.code, name: src.name, description: src.description, active: true },
        });
        return created.id;
      }

      case ROLLOVER_ITEMS.FUNDING_SOURCE: {
        const existing = await db.fundingSource.findFirst({ where: { name: src.name } });
        if (existing) return null;
        const created = await db.fundingSource.create({
          data: {
            code: src.code,
            name: src.name,
            type: src.type || 'government',
            description: src.description,
            active: true,
          },
        });
        return created.id;
      }

      case ROLLOVER_ITEMS.GOAL: {
        const resultId = await this.remap('strategic_result', src.resultId);
        const created = await db.goal.create({
          data: {
            yearId: targetYearId,
            resultId: resultId ?? null,
            orgUnitId: src.orgUnitId ?? null,
            code: src.code,
            name: src.name,
            description: src.description,
            weight: src.weight ?? 1,
            approvalStatus: 'draft',
          },
        });
        return created.id;
      }

      case ROLLOVER_ITEMS.OBJECTIVE: {
        const goalId = await this.remap(ROLLOVER_ITEMS.GOAL, src.goalId);
        if (goalId == null) throw new Error('parent goal was not rolled over');
        const created = await db.objective.create({
          data: {
            yearId: targetYearId,
            goalId,
            orgUnitId: src.orgUnitId ?? null,
            code: src.code,
            name: src.name,
            description: src.description,
            targetValue: null,   // targets require review
            baselineValue: null, // prior-year performance is never carried
            unit: src.unit,
            direction: src.direction || 'higher_is_better',
            weight: src.weight ?? 1,
            approvalStatus: 'draft',
          },
        });
        return created.id;
      }

      default:
        return this.copyOnePerformanceFree(key, src, targetYearId, shift);
    }
  }

  /**
   * Second half of the copy engine: project templates, activities,
   * KPI definitions/plans, risk templates and compliance templates.
   */
  private async copyOnePerformanceFree(
    key: RolloverItemKey,
    src: any,
    targetYearId: number,
    shift: (d: any) => any,
  ): Promise<number | null> {
    const db = this.db as any;

    switch (key) {
      case ROLLOVER_ITEMS.PROJECT_TEMPLATE: {
        const created = await db.project.create({
          data: {
            yearId: targetYearId,
            code: src.code,
            name: src.name,
            location: src.location,
            description: src.description,
            orgUnitId: src.orgUnitId ?? null,
            managerEmployeeId: src.managerEmployeeId ?? null,
            plannedBudget: src.plannedBudget || 0,
            actualSpend: 0,          // financial actuals never carried
            physicalProgress: 0,     // progress never carried
            financialProgress: 0,
            startDate: shift(src.startDate),
            endDate: shift(src.endDate),
            status: 'planned',
            approvalStatus: 'draft',
          },
        });
        const milestones = await db.projectMilestone.findMany({ where: { projectId: src.id } });
        for (const m of milestones) {
          await db.projectMilestone.create({
            data: {
              projectId: created.id,
              name: m.name,
              plannedDate: shift(m.plannedDate),
              actualDate: null,
              progress: 0,
              status: 'pending',
            },
          });
        }
        return created.id;
      }

      case ROLLOVER_ITEMS.ACTIVITY: {
        const objectiveId = await this.remap(ROLLOVER_ITEMS.OBJECTIVE, src.objectiveId);
        const projectId = await this.remap(ROLLOVER_ITEMS.PROJECT_TEMPLATE, src.projectId);
        const created = await db.activity.create({
          data: {
            yearId: targetYearId,
            objectiveId: objectiveId ?? null,
            projectId: projectId ?? null,
            orgUnitId: src.orgUnitId ?? null,
            branchOrgUnitId: src.branchOrgUnitId ?? null,
            employeeId: src.employeeId ?? null,
            code: src.code,
            title: src.title,
            description: src.description,
            quarter: src.quarter,
            startDate: shift(src.startDate),
            dueDate: shift(src.dueDate),
            progress: 0,                    // progress never carried
            implementationStatus: 'not_started',
            approvalStatus: 'draft',
            budget: 0,                      // planned budget requires review
            weight: src.weight ?? 1,
          },
        });
        return created.id;
      }

      default:
        return this.copyOneCompliance(key, src, targetYearId, shift);
    }
  }

  /** Third segment: KPI plans, risk templates, compliance templates. */
  private async copyOneCompliance(
    key: RolloverItemKey,
    src: any,
    targetYearId: number,
    shift: (d: any) => any,
  ): Promise<number | null> {
    const db = this.db as any;

    switch (key) {
      case ROLLOVER_ITEMS.KPI: {
        // Ensure the shared KPI definition exists (Kpi is year-independent).
        let kpiId = src.kpiId;
        const kpiDef = await db.kpi.findUnique({ where: { id: src.kpiId } });
        if (kpiDef) {
          const existingDef = await db.kpi.findFirst({ where: { name: kpiDef.name } });
          kpiId = existingDef
            ? existingDef.id
            : (await db.kpi.create({
                data: {
                  code: kpiDef.code || undefined,
                  name: kpiDef.name,
                  area: kpiDef.area,
                  definition: kpiDef.definition,
                  formula: kpiDef.formula,
                  unit: kpiDef.unit,
                  frequency: kpiDef.frequency,
                  direction: kpiDef.direction,
                  active: true,
                  categoryId: kpiDef.categoryId,
                },
              })).id;
        }

        const objectiveId = await this.remap(ROLLOVER_ITEMS.OBJECTIVE, src.objectiveId);
        // KpiPlan unique [yearId, kpiId, orgUnitId] gives natural idempotency.
        const dup = await db.kpiPlan.findFirst({
          where: { yearId: targetYearId, kpiId, orgUnitId: src.orgUnitId ?? null },
        });
        if (dup) return null;
        const created = await db.kpiPlan.create({
          data: {
            yearId: targetYearId,
            kpiId,
            objectiveId: objectiveId ?? null,
            orgUnitId: src.orgUnitId ?? null,
            ownerEmployeeId: src.ownerEmployeeId ?? null,
            baselineValue: null, // prior-year actuals never carried
            annualTarget: null,  // targets require review
            q1Target: null,
            q2Target: null,
            q3Target: null,
            q4Target: null,
            weight: src.weight ?? 1,
            approvalStatus: 'draft',
          },
        });
        return created.id;
      }

      case ROLLOVER_ITEMS.RISK_TEMPLATE: {
        const created = await db.risk.create({
          data: {
            yearId: targetYearId,
            orgUnitId: src.orgUnitId ?? null,
            categoryId: src.categoryId ?? null,
            title: src.title,
            description: src.description,
            probability: src.probability ?? 1,
            impact: src.impact ?? 1,
            score: src.score ?? 1,
            level: src.level || 'medium',
            ownerEmployeeId: src.ownerEmployeeId ?? null,
            mitigation: src.mitigation,
            status: 'open',
            reviewDate: null,
          },
        });
        return created.id;
      }

      case ROLLOVER_ITEMS.COMPLIANCE_TEMPLATE: {
        const created = await db.complianceRequirement.create({
          data: {
            yearId: targetYearId,
            orgUnitId: src.orgUnitId ?? null,
            category: src.category,
            code: src.code,
            title: src.title,
            authority: src.authority,
            responsibleEmployeeId: src.responsibleEmployeeId ?? null,
            dueDate: shift(src.dueDate),
            status: 'open',
            evidence: null,
          },
        });
        return created.id;
      }

      default:
        return null;
    }
  }

  // ==================== HELPERS ====================

  /** Looks up the rolled-over counterpart of a source record via the ledger. */
  private async remap(itemKey: string, sourceId: number | null | undefined): Promise<number | null> {
    if (sourceId == null) return null;
    const row = await this.db.rolloverItem.findFirst({
      where: { itemKey, sourceId, status: 'copied', targetId: { not: null } },
      orderBy: { id: 'desc' },
    });
    return row?.targetId ?? null;
  }

  private addYears(date: any, years: number): any {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    d.setFullYear(d.getFullYear() + years);
    return d;
  }

  private isYearScoped(key: string): boolean {
    return [
      ROLLOVER_ITEMS.GOAL,
      ROLLOVER_ITEMS.OBJECTIVE,
      ROLLOVER_ITEMS.KPI,
      ROLLOVER_ITEMS.ACTIVITY,
      ROLLOVER_ITEMS.PROJECT_TEMPLATE,
      ROLLOVER_ITEMS.RISK_TEMPLATE,
      ROLLOVER_ITEMS.COMPLIANCE_TEMPLATE,
    ].includes(key as any);
  }

  /**
   * Resolves which item categories apply for a given selection mode.
   * Module mode maps functional modules to their item categories.
   */
  private resolveModeItems(dto: RolloverRequest): RolloverItemKey[] {
    const mode = dto.mode || ROLLOVER_MODES.ALL;

    if (mode === ROLLOVER_MODES.SELECTED) {
      return dto.items && dto.items.length ? dto.items : [];
    }

    if (mode === ROLLOVER_MODES.MODULE && dto.modules?.length) {
      const moduleMap: Record<string, RolloverItemKey[]> = {
        strategic: [ROLLOVER_ITEMS.THEME, ROLLOVER_ITEMS.GOAL, ROLLOVER_ITEMS.OBJECTIVE],
        kpi: [ROLLOVER_ITEMS.KPI],
        workplan: [ROLLOVER_ITEMS.ACTIVITY],
        activity: [ROLLOVER_ITEMS.ACTIVITY],
        project: [ROLLOVER_ITEMS.PROJECT_TEMPLATE],
        risk: [ROLLOVER_ITEMS.RISK_TEMPLATE],
        compliance: [ROLLOVER_ITEMS.COMPLIANCE_TEMPLATE],
        budget: [ROLLOVER_ITEMS.BUDGET_CATEGORY, ROLLOVER_ITEMS.FUNDING_SOURCE],
        organization: [ROLLOVER_ITEMS.ORG_UNIT],
      };
      const items = new Set<RolloverItemKey>();
      for (const m of dto.modules) {
        (moduleMap[m] || []).forEach(i => items.add(i));
      }
      return Array.from(items);
    }

    // all / org_unit / goal modes use every structure category.
    return STRUCTURE_ITEMS.map(i => i.key);
  }

  /**
   * Explicit list of performance/transient data that is NEVER copied.
   * Surfaced in the preview so users see the isolation guarantee.
   */
  private performanceNotCopied() {
    return [
      { key: 'kpi_actuals', label: 'KPI actuals', reason: 'Prior-year measurements are performance data' },
      { key: 'activity_progress', label: 'Activity progress & task updates', reason: 'Completed progress is historical' },
      { key: 'reporting_results', label: 'Historical reporting results', reason: 'Reports belong to their year' },
      { key: 'approval_state', label: 'Historical approval state', reason: 'New year starts in draft' },
      { key: 'audit_records', label: 'Audit & monitoring records', reason: 'Audit trail is immutable history' },
      { key: 'closed_year_financials', label: 'Closed-year financial actuals', reason: 'Actuals are never rolled forward' },
    ];
  }

  private warnings(args: { source: any; target: any }) {
    const closedStatuses = ['closed', 'archived'];
    return {
      sourceClosed: closedStatuses.includes(args.source?.status),
      targetClosed: closedStatuses.includes(args.target?.status),
      targetNotDraft: !['draft', 'active'].includes(args.target?.status),
    };
  }

  /**
   * Permission gate. Uses the governance service when permissions are
   * configured; legacy administrator roles are always allowed so that
   * creating a new year requires NO code changes.
   */
  private async assertPermission(userId: number, action: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: { Role: true },
    });
    if (!user) throw new ForbiddenException('User not found');

    const adminCodes = ['SYS_ADMIN', 'super_admin'];
    if (adminCodes.includes(user.Role?.code)) return;

    const allowed = await this.governance.hasPermission(
      userId,
      ResourceType.PLANNING_YEAR,
      action,
    );
    if (!allowed) {
      throw new ForbiddenException(`Permission denied: ${action} on planning_year`);
    }
  }

  /** Cancels a job so a replacement rollover can be run (idempotency escape hatch). */
  async cancelJob(id: number, userId: number) {
    const job = await this.db.rolloverJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Rollover job not found');
    if (job.status === 'completed') {
      throw new BadRequestException('Completed rollover jobs cannot be cancelled');
    }
    const updated = await this.db.rolloverJob.update({
      where: { id },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });
    await this.governance.logAudit({
      userId,
      action: 'ROLLOVER_CANCELLED',
      entity: 'RolloverJob',
      recordId: id,
      oldValue: { status: job.status },
      newValue: { status: 'cancelled' },
    });
    return updated;
  }

  // ==================== FILTER / SOURCE HELPERS ====================

  private buildFilters(dto: RolloverRequest): { org: any; goal: any } {
    return {
      org: dto.mode === ROLLOVER_MODES.ORG_UNIT && dto.orgUnitIds?.length
        ? { orgUnitId: { in: dto.orgUnitIds } }
        : {},
      goal: dto.mode === ROLLOVER_MODES.GOAL && dto.goalIds?.length
        ? { goalId: { in: dto.goalIds } }
        : {},
    };
  }

  private async countSourceItems(key: string, yearId: number, filters: { org: any; goal: any }): Promise<number> {
    const model = YEAR_STRUCTURE_MODELS[key as RolloverItemKey];
    if (!model) return 0;
    const table = (this.db as any)[model];
    if (!table || typeof table.count !== 'function') return 0;

    // Budget categories are derived from the year's budget rows.
    if (key === ROLLOVER_ITEMS.BUDGET_CATEGORY) {
      const budgets = await this.db.budget.findMany({
        where: { yearId, ...filters.org },
        select: { category: true },
      });
      const seen = new Set<string>();
      for (const b of budgets) {
        const name = (b.category || '').trim();
        if (name) seen.add(name.toLowerCase());
      }
      return seen.size;
    }

    const where: any = { ...filters.org, ...filters.goal };
    if (this.isYearScoped(key)) where.yearId = yearId;
    try {
      return await table.count({ where });
    } catch {
      return 0;
    }
  }

  private async loadSourceItems(key: RolloverItemKey, yearId: number, filters: { org: any; goal: any }): Promise<any[]> {
    const model = YEAR_STRUCTURE_MODELS[key];
    if (!model) return [];
    const table = (this.db as any)[model];
    if (!table || typeof table.findMany !== 'function') return [];

    // Budget categories for a year are derived from the distinct category
    // strings used by that year's budgets (BudgetCategory is master data).
    if (key === ROLLOVER_ITEMS.BUDGET_CATEGORY) {
      const budgets = await this.db.budget.findMany({
        where: { yearId, ...filters.org },
        select: { id: true, category: true },
      });
      const seen = new Set<string>();
      const derived: any[] = [];
      for (const b of budgets) {
        const name = (b.category || '').trim();
        if (!name || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());
        derived.push({ id: b.id, name, code: null, description: null });
      }
      return derived;
    }

    const where: any = { ...filters.org, ...filters.goal };
    if (this.isYearScoped(key)) where.yearId = yearId;
    try {
      return await table.findMany({ where });
    } catch {
      return [];
    }
  }
}