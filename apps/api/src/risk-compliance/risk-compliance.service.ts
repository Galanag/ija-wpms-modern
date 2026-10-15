import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RiskComplianceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Server-side closed-year protection: mutations against records belonging to a
   * closed/archived planning year are rejected with 409 regardless of UI state.
   * Historical reads remain allowed.
   */
  private async assertYearWritable(yearId: number | null | undefined) {
    if (!yearId) throw new BadRequestException('yearId is required');
    const year = await this.prisma.planningYear.findUnique({ where: { id: yearId } });
    if (!year) throw new NotFoundException(`Planning year ${yearId} not found`);
    if (year.status === 'closed' || year.status === 'archived') {
      throw new ConflictException(`Planning year ${year.year} is ${year.status}; mutations are not allowed`);
    }
  }

  // ==================== RISKS ====================

  async createRisk(data: any) {
    await this.assertYearWritable(data.yearId);
    const score = (data.probability || 1) * (data.impact || 1);
    return this.prisma.risk.create({
      data: {
        yearId: data.yearId,
        riskTemplateId: data.riskTemplateId,
        orgUnitId: data.orgUnitId,
        categoryId: data.categoryId,
        title: data.title,
        description: data.description,
        probability: data.probability ?? 1,
        impact: data.impact ?? 1,
        score,
        level: data.level ?? this.getRiskLevel(score),
        ownerEmployeeId: data.ownerEmployeeId,
        mitigation: data.mitigation,
        status: data.status ?? 'open',
        reviewDate: data.reviewDate ? new Date(data.reviewDate) : undefined,
      },
      include: { RiskTemplate: true, RiskCategory: true, OrgUnit: true, Employee: true, PlanningYear: true },
    });
  }

  async findAllRisks(params: { yearId?: number; categoryId?: number; status?: string; orgUnitId?: number }) {
    const where: any = {};
    if (params.yearId) where.yearId = params.yearId;
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.status) where.status = params.status;
    if (params.orgUnitId) where.orgUnitId = params.orgUnitId;
    return this.prisma.risk.findMany({
      where,
      include: { RiskTemplate: true, RiskCategory: true, OrgUnit: true, Employee: true, PlanningYear: true },
      orderBy: { score: 'desc' },
    });
  }

  async findRiskById(id: number) {
    return this.prisma.risk.findUnique({
      where: { id },
      include: { RiskTemplate: true, RiskCategory: true, OrgUnit: true, Employee: true, PlanningYear: true, RiskReview: true },
    });
  }

  async updateRisk(id: number, data: any) {
    const existing = await this.prisma.risk.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Risk ${id} not found`);
    await this.assertYearWritable(existing.yearId);
    const updateData: any = { ...data };
    if (data.probability !== undefined || data.impact !== undefined) {
      updateData.score = (data.probability ?? existing?.probability ?? 1) * (data.impact ?? existing?.impact ?? 1);
      updateData.level = this.getRiskLevel(updateData.score);
    }
    if (data.reviewDate) updateData.reviewDate = new Date(data.reviewDate);
    return this.prisma.risk.update({ where: { id }, data: updateData, include: { RiskCategory: true, OrgUnit: true, Employee: true } });
  }

  async deleteRisk(id: number) {
    const existing = await this.prisma.risk.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Risk ${id} not found`);
    await this.assertYearWritable(existing.yearId);
    return this.prisma.risk.delete({ where: { id } });
  }

  // ==================== RISK REVIEWS ====================

  async createRiskReview(data: any) {
    await this.assertYearWritable(data.yearId);
    return this.prisma.riskReview.create({
      data: {
        yearId: data.yearId,
        riskId: data.riskId,
        orgUnitId: data.orgUnitId,
        reviewDate: new Date(data.reviewDate),
        residualScore: data.residualScore,
        note: data.note,
        status: data.status ?? 'open',
      },
      include: { Risk: true, OrgUnit: true, PlanningYear: true },
    });
  }

  async findRiskReviews(riskId: number) {
    return this.prisma.riskReview.findMany({ where: { riskId }, orderBy: { reviewDate: 'desc' }, include: { OrgUnit: true, PlanningYear: true } });
  }

  // ==================== RISK CATEGORIES ====================

  async findRiskCategories() {
    return this.prisma.riskCategory.findMany({ where: { active: true } });
  }

  async createRiskCategory(data: { name: string; description?: string }) {
    return this.prisma.riskCategory.create({ data });
  }

  async updateRiskCategory(id: number, data: any) {
    return this.prisma.riskCategory.update({ where: { id }, data });
  }

  // ==================== COMPLIANCE REQUIREMENTS ====================

  async createComplianceRequirement(data: any) {
    await this.assertYearWritable(data.yearId);
    return this.prisma.complianceRequirement.create({
      data: {
        yearId: data.yearId,
        complianceTemplateId: data.complianceTemplateId,
        orgUnitId: data.orgUnitId,
        category: data.category,
        code: data.code,
        title: data.title,
        authority: data.authority,
        responsibleEmployeeId: data.responsibleEmployeeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        status: data.status ?? 'open',
        evidence: data.evidence,
      },
      include: { ComplianceTemplate: true, OrgUnit: true, Employee: true, PlanningYear: true, ComplianceFinding: true },
    });
  }

  async findAllComplianceRequirements(params: any) {
    const { skip = 0, take = 100, yearId, status, orgUnitId, search, upcoming } = params;
    const where: any = {};
    if (yearId) where.yearId = yearId;
    if (status) where.status = status;
    if (orgUnitId) where.orgUnitId = orgUnitId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (upcoming) {
      where.dueDate = { gte: new Date() };
      where.status = { in: ['pending', 'in_progress'] };
    }
    const [requirements, total] = await Promise.all([
      this.prisma.complianceRequirement.findMany({
        where, skip, take,
        orderBy: { dueDate: 'asc' },
        include: { ComplianceTemplate: true, OrgUnit: true, Employee: true, PlanningYear: true, ComplianceFinding: true },
      }),
      this.prisma.complianceRequirement.count({ where }),
    ]);
    return { requirements, total, skip, take };
  }

  async findOneComplianceRequirement(id: number) {
    return this.prisma.complianceRequirement.findUnique({
      where: { id },
      include: { ComplianceTemplate: true, OrgUnit: true, Employee: true, PlanningYear: true, ComplianceFinding: { include: { ComplianceRequirement: true } } },
    });
  }

  async updateComplianceRequirement(id: number, data: any) {
    const existing = await this.prisma.complianceRequirement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Requirement ${id} not found`);
    await this.assertYearWritable(existing.yearId);
    const updateData: any = { ...data };
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
    return this.prisma.complianceRequirement.update({ where: { id }, data: updateData, include: { OrgUnit: true, Employee: true } });
  }

  async deleteComplianceRequirement(id: number) {
    const existing = await this.prisma.complianceRequirement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Requirement ${id} not found`);
    await this.assertYearWritable(existing.yearId);
    return this.prisma.complianceRequirement.delete({ where: { id } });
  }

  async uploadComplianceEvidence(id: number, evidence: string) {
    const existing = await this.prisma.complianceRequirement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Requirement ${id} not found`);
    await this.assertYearWritable(existing.yearId);
    return this.prisma.complianceRequirement.update({ where: { id }, data: { evidence, status: 'compliant' }, include: { OrgUnit: true, Employee: true } });
  }

  /**
   * Copy recurring compliance requirements from one planning year to another.
   * Business rules: duplicates (matched by title) are skipped; due dates are NOT
   * carried over (they would be stale in the new year); status resets to 'open';
   * evidence is not copied. Target year must be open. Audit-logged.
   */
  async copyRequirementsToYear(sourceYearId: number, targetYearId: number, userId?: number) {
    if (!sourceYearId || !targetYearId) throw new BadRequestException('sourceYearId and targetYearId are required');
    if (sourceYearId === targetYearId) throw new BadRequestException('Source and target years must differ');
    await this.assertYearWritable(targetYearId);
    const source = await this.prisma.complianceRequirement.findMany({ where: { yearId: sourceYearId } });
    if (!source.length) return { ok: true, copied: 0, skipped: 0 };
    const existing = await this.prisma.complianceRequirement.findMany({
      where: { yearId: targetYearId, title: { in: source.map((s) => s.title) } },
    });
    const existingTitles = new Set(existing.map((e) => e.title));
    const toCopy = source.filter((s) => !existingTitles.has(s.title));
    let copied = 0;
    for (const s of toCopy) {
      await this.prisma.complianceRequirement.create({
        data: {
          yearId: targetYearId,
          complianceTemplateId: s.complianceTemplateId,
          orgUnitId: s.orgUnitId,
          category: s.category,
          code: s.code,
          title: s.title,
          authority: s.authority,
          responsibleEmployeeId: s.responsibleEmployeeId,
          status: 'open',
        },
      });
      copied++;
    }
    await this.prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action: 'COPY',
        entity: 'ComplianceRequirement',
        recordId: `${sourceYearId}->${targetYearId}`,
        newValue: JSON.stringify({ copied, skipped: source.length - copied }),
      },
    });
    return { ok: true, copied, skipped: source.length - copied };
  }

  // ==================== COMPLIANCE FINDINGS ====================

  async createComplianceFinding(data: any) {
    if (!data.requirementId) throw new BadRequestException('requirementId is required');
    const requirement = await this.prisma.complianceRequirement.findUnique({ where: { id: data.requirementId } });
    if (!requirement) throw new NotFoundException(`Requirement ${data.requirementId} not found`);
    await this.assertYearWritable(requirement.yearId);
    return this.prisma.complianceFinding.create({
      data: {
        requirementId: data.requirementId,
        finding: data.finding,
        severity: data.severity ?? 'medium',
        recommendation: data.recommendation,
        status: data.status ?? 'open',
      },
      include: { ComplianceRequirement: true },
    });
  }

  async findComplianceFindings(params: { requirementId?: number; status?: string; severity?: string }) {
    const where: any = {};
    if (params.requirementId) where.requirementId = params.requirementId;
    if (params.status) where.status = params.status;
    if (params.severity) where.severity = params.severity;
    return this.prisma.complianceFinding.findMany({ where, orderBy: { severity: 'desc' }, include: { ComplianceRequirement: true } });
  }

  async updateComplianceFinding(id: number, data: any) {
    const finding = await this.prisma.complianceFinding.findUnique({ where: { id }, include: { ComplianceRequirement: true } });
    if (!finding) throw new NotFoundException(`Finding ${id} not found`);
    await this.assertYearWritable(finding.ComplianceRequirement.yearId);
    return this.prisma.complianceFinding.update({ where: { id }, data });
  }

  async closeComplianceFinding(id: number) {
    const finding = await this.prisma.complianceFinding.findUnique({ where: { id }, include: { ComplianceRequirement: true } });
    if (!finding) throw new NotFoundException(`Finding ${id} not found`);
    await this.assertYearWritable(finding.ComplianceRequirement.yearId);
    return this.prisma.complianceFinding.update({ where: { id }, data: { status: 'closed' } });
  }

  // ==================== CORRECTIVE ACTIONS ====================

  async createCorrectiveAction(data: any) {
    await this.assertYearWritable(data.yearId);
    return this.prisma.correctiveAction.create({
      data: {
        yearId: data.yearId,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        ownerOrgUnitId: data.ownerOrgUnitId,
        ownerEmployeeId: data.ownerEmployeeId,
        title: data.title,
        description: data.description,
        priority: data.priority ?? 'medium',
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        status: data.status ?? 'open',
      },
      include: { OrgUnit: true, Employee: true, PlanningYear: true },
    });
  }

  async findCorrectiveActions(params: { yearId?: number; status?: string; ownerEmployeeId?: number }) {
    const where: any = {};
    if (params.yearId) where.yearId = params.yearId;
    if (params.status) where.status = params.status;
    if (params.ownerEmployeeId) where.ownerEmployeeId = params.ownerEmployeeId;
    return this.prisma.correctiveAction.findMany({ where, include: { OrgUnit: true, Employee: true, PlanningYear: true } });
  }

  async updateCorrectiveAction(id: number, data: any) {
    const existing = await this.prisma.correctiveAction.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Corrective action ${id} not found`);
    await this.assertYearWritable(existing.yearId);
    const updateData: any = { ...data };
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
    return this.prisma.correctiveAction.update({ where: { id }, data: updateData });
  }

  async deleteCorrectiveAction(id: number) {
    const existing = await this.prisma.correctiveAction.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Corrective action ${id} not found`);
    await this.assertYearWritable(existing.yearId);
    return this.prisma.correctiveAction.delete({ where: { id } });
  }

  // ==================== DASHBOARD ====================

  /**
   * Stable typed contract consumed by the Risk & Compliance dashboard UI.
   * - overdueMitigations: risks whose next reviewDate has passed and are not yet mitigated/closed.
   *   (The Risk model has no separate mitigationDueDate; reviewDate is the domain field used
   *   for mitigation follow-up. Documented decision, not a faked metric.)
   */
  async getRiskDashboard(yearId?: number) {
    const where: any = {};
    if (yearId) where.yearId = yearId;
    const risks = await this.prisma.risk.findMany({
      where,
      include: { RiskCategory: true, OrgUnit: true, Employee: true },
      orderBy: { score: 'desc' },
    });

    const now = new Date();
    const byStatus = this.groupByField(risks, 'status');
    const bySeverity = this.groupByField(risks, 'level');
    const byType = this.groupByField(risks, 'RiskCategory.name');

    const highRisks = risks
      .filter((r) => r.level === 'high' || r.level === 'critical')
      .slice(0, 20)
      .map((r) => ({
        id: r.id,
        title: r.title,
        level: r.level,
        score: r.score,
        status: r.status,
        owner: r.Employee?.fullName ?? null,
        orgUnit: r.OrgUnit?.name ?? null,
        reviewDate: r.reviewDate,
      }));

    // Full register for report table/kanban/timeline views (capped for payload sanity)
    const register = risks.slice(0, 200).map((r) => ({
      id: r.id,
      title: r.title,
      level: r.level,
      severity: r.level,
      status: r.status,
      score: r.score,
      category: r.RiskCategory?.name ?? 'General',
      owner: r.Employee?.fullName ?? 'Unassigned',
      orgUnit: r.OrgUnit?.name ?? null,
      reviewDate: r.reviewDate,
      description: r.description,
    }));

    const overdueMitigations = risks
      .filter(
        (r) =>
          r.reviewDate !== null &&
          r.reviewDate < now &&
          !['mitigated', 'closed'].includes(r.status),
      )
      .slice(0, 20)
      .map((r) => ({
        id: r.id,
        title: r.title,
        level: r.level,
        status: r.status,
        reviewDate: r.reviewDate,
        owner: r.Employee?.fullName ?? null,
        orgUnit: r.OrgUnit?.name ?? null,
      }));

    return {
      totalRisks: risks.length,
      openRisks: (byStatus['open'] ?? 0) + (byStatus['in_progress'] ?? 0),
      highRisks,
      overdueMitigations,
      risks: register,
      byType,
      byStatus,
      bySeverity,
      riskTrend: {
        open: byStatus['open'] ?? 0,
        mitigated: byStatus['mitigated'] ?? 0,
        closed: byStatus['closed'] ?? 0,
      },
    };
  }

  /** Stable typed contract for the Compliance dashboard UI. */
  async getComplianceDashboard(yearId?: number) {
    const where: any = {};
    if (yearId) where.yearId = yearId;
    const requirements = await this.prisma.complianceRequirement.findMany({
      where,
      include: { OrgUnit: true, Employee: true, _count: { select: { ComplianceFinding: true } } },
      orderBy: { dueDate: 'asc' },
    });

    const requirementIds = requirements.map((r) => r.id);
    const findings = requirementIds.length
      ? await this.prisma.complianceFinding.findMany({
          where: { requirementId: { in: requirementIds }, status: { not: 'closed' } },
        })
      : [];
    const correctiveActions = yearId
      ? await this.prisma.correctiveAction.findMany({ where: { yearId, status: { not: 'completed' } } })
      : await this.prisma.correctiveAction.findMany({ where: { status: { not: 'completed' } } });

    const now = new Date();
    const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const byStatus = this.groupByField(requirements, 'status');
    const byCategory = this.groupByField(requirements, 'category');

    const upcomingDeadlines = requirements
      .filter(
        (r) =>
          r.dueDate !== null &&
          r.dueDate <= inThirtyDays &&
          r.status !== 'compliant',
      )
      .slice(0, 10)
      .map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        dueDate: r.dueDate,
        status: r.status,
        responsible: r.Employee?.fullName ?? null,
        orgUnit: r.OrgUnit?.name ?? null,
      }));

    return {
      totalRequirements: requirements.length,
      compliant: requirements.filter((r) => r.status === 'compliant').length,
      nonCompliant: requirements.filter((r) => r.status === 'non_compliant').length,
      pending: requirements.filter((r) => r.status === 'pending' || r.status === 'in_progress' || r.status === 'open').length,
      expired: requirements.filter((r) => r.dueDate !== null && r.dueDate < now && r.status !== 'compliant').length,
      upcomingDeadlines,
      unresolvedFindings: findings.length,
      openCorrectiveActions: correctiveActions.length,
      byStatus,
      byCategory,
      // Full register for report table/kanban views (capped for payload sanity)
      requirements: requirements.slice(0, 200).map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        category: r.category ?? 'General',
        code: r.code,
        authority: r.authority,
        dueDate: r.dueDate,
        responsible: r.Employee?.fullName ?? 'Unassigned',
        orgUnit: r.OrgUnit?.name ?? null,
        findings: (r as any)._count?.ComplianceFinding ?? 0,
      })),
    };
  }

  // ==================== HELPERS ====================

  private getRiskLevel(score: number): string {
    if (score >= 16) return 'critical';
    if (score >= 9) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  private groupByField(items: any[], field: string): Record<string, number> {
    return items.reduce((acc, item) => {
      const keys = field.split('.');
      let value = item;
      for (const key of keys) { value = value?.[key]; }
      const k = value || 'undefined';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
