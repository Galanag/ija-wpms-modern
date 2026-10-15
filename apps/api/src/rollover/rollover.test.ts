import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RolloverService } from './rollover.service';
import {
  ROLLOVER_ITEMS,
  ROLLOVER_MODES,
  STRUCTURE_ITEMS,
  YEAR_STRUCTURE_MODELS,
} from './rollover.types';

// ==================== MOCK INFRASTRUCTURE ====================

function makeModelMock() {
  return {
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
    deleteMany: vi.fn().mockResolvedValue({}),
  };
}

const db: any = {
  planningYear: makeModelMock(),
  user: makeModelMock(),
  rolloverJob: makeModelMock(),
  rolloverItem: makeModelMock(),
  strategicTheme: makeModelMock(),
  strategicResult: makeModelMock(),
  goal: makeModelMock(),
  objective: makeModelMock(),
  kpi: makeModelMock(),
  kpiPlan: makeModelMock(),
  activity: makeModelMock(),
  project: makeModelMock(),
  projectMilestone: makeModelMock(),
  risk: makeModelMock(),
  complianceRequirement: makeModelMock(),
  budget: makeModelMock(),
  budgetCategory: makeModelMock(),
  fundingSource: makeModelMock(),
};

const governance: any = {
  hasPermission: vi.fn().mockResolvedValue(true),
  logAudit: vi.fn().mockResolvedValue({}),
};

const createService = () => new RolloverService(db, governance);

const SOURCE = { id: 1, year: 2026, label: '2026 Plan', status: 'active' };
const TARGET = { id: 2, year: 2027, label: '2027 Plan', status: 'draft' };

beforeEach(() => {
  vi.clearAllMocks();
  governance.hasPermission.mockResolvedValue(true);
  governance.logAudit.mockResolvedValue({ id: 1 });

  db.planningYear.findUnique.mockImplementation(({ where }: any) => {
    if (where.id === SOURCE.id) return Promise.resolve(SOURCE);
    if (where.id === TARGET.id) return Promise.resolve(TARGET);
    return Promise.resolve(null);
  });
  db.user.findUnique.mockResolvedValue({
    id: 1,
    fullName: 'Admin User',
    Role: { code: 'super_admin' },
  });
  db.rolloverJob.findUnique.mockResolvedValue(null);
  db.rolloverJob.create.mockImplementation(({ data }: any) =>
    Promise.resolve({ id: 99, ...data }));
  db.rolloverJob.update.mockImplementation(({ data }: any) =>
    Promise.resolve({ id: 99, ...data }));
  // No prior copies by default (remap + per-item idempotency both use findFirst)
  db.rolloverItem.findFirst.mockResolvedValue(null);
  db.rolloverItem.findMany.mockResolvedValue([]);
  db.rolloverItem.create.mockImplementation(({ data }: any) =>
    Promise.resolve({ id: Math.floor(Math.random() * 100000), ...data }));
  db.rolloverItem.deleteMany.mockResolvedValue({});
});

/** Differentiates the service's two uses of rolloverItem.findFirst. */
function mockLedger(remaps: Record<string, number> = {}, priorCopies: number[] = []) {
  db.rolloverItem.findFirst.mockImplementation(({ where }: any) => {
    if (where.status === 'copied') {
      // remap lookup: { itemKey, sourceId, status: 'copied', targetId: { not: null } }
      const target = remaps[`${where.itemKey}:${where.sourceId}`];
      return Promise.resolve(target ? { targetId: target } : null);
    }
    // per-item idempotency lookup
    if (priorCopies.includes(where.sourceId)) {
      return Promise.resolve({ sourceId: where.sourceId });
    }
    return Promise.resolve(null);
  });
}

// ==================== STRUCTURE COPY: STATUS + TARGET RESETS ====================

describe('RolloverService — structure copy resets', () => {
  it('copies goals as draft with reusable definitions preserved', async () => {
    const service = createService();
    db.goal.findMany.mockResolvedValue([
      { id: 10, yearId: 1, resultId: 5, orgUnitId: 3, code: 'G1', name: 'Service Quality', description: 'Improve services', weight: 2, approvalStatus: 'approved' },
    ]);
    db.goal.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 110, ...data }));

    await service.executeRollover({ sourceYearId: 1, targetYearId: 2, items: ['goal'] }, 1);

    expect(db.goal.create).toHaveBeenCalledTimes(1);
    const data = db.goal.create.mock.calls[0][0].data;
    expect(data.yearId).toBe(2);                    // new target-year reference
    expect(data.approvalStatus).toBe('draft');      // historical approval state reset
    expect(data.name).toBe('Service Quality');      // reusable definition preserved
    expect(data.weight).toBe(2);
  });

  it('copies objectives with targets reset and parent goal remapped', async () => {
    const service = createService();
    mockLedger({ 'goal:20': 120 }); // source goal 20 -> target goal 120
    db.objective.findMany.mockResolvedValue([
      { id: 30, yearId: 1, goalId: 20, orgUnitId: 3, code: 'O1', name: 'Expand Coverage', targetValue: 95, baselineValue: 78, unit: '%', direction: 'higher_is_better', weight: 1, approvalStatus: 'approved' },
    ]);
    db.objective.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 130, ...data }));

    await service.executeRollover({ sourceYearId: 1, targetYearId: 2, items: ['objective'] }, 1);

    const data = db.objective.create.mock.calls[0][0].data;
    expect(data.yearId).toBe(2);
    expect(data.goalId).toBe(120);                  // remapped to rolled-over goal
    expect(data.targetValue).toBeNull();            // targets require review
    expect(data.baselineValue).toBeNull();          // prior-year performance never carried
    expect(data.approvalStatus).toBe('draft');
    expect(data.name).toBe('Expand Coverage');      // definition preserved
  });

  it('copies KPI plans with all targets and baseline reset to null', async () => {
    const service = createService();
    db.kpiPlan.findMany.mockResolvedValue([
      {
        id: 40, yearId: 1, kpiId: 7, objectiveId: 30, orgUnitId: 3, ownerEmployeeId: 9,
        baselineValue: 55.5, annualTarget: 90, q1Target: 20, q2Target: 22, q3Target: 24, q4Target: 24,
        weight: 1.5, approvalStatus: 'approved',
      },
    ]);
    db.kpi.findUnique.mockResolvedValue({ id: 7, code: 'KPI-7', name: 'Response Rate', formula: 'x/y', unit: '%', frequency: 'quarterly', direction: 'higher_is_better', categoryId: null });
    db.kpi.findFirst.mockResolvedValue({ id: 7 });   // definition already exists
    db.kpiPlan.findFirst.mockResolvedValue(null);    // no duplicate in target year
    db.kpiPlan.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 140, ...data }));

    await service.executeRollover({ sourceYearId: 1, targetYearId: 2, items: ['kpi'] }, 1);

    const data = db.kpiPlan.create.mock.calls[0][0].data;
    expect(data.yearId).toBe(2);
    expect(data.baselineValue).toBeNull();          // prior-year actuals never carried
    expect(data.annualTarget).toBeNull();           // all targets require review
    expect(data.q1Target).toBeNull();
    expect(data.q2Target).toBeNull();
    expect(data.q3Target).toBeNull();
    expect(data.q4Target).toBeNull();
    expect(data.approvalStatus).toBe('draft');
  });

  it('copies activities with progress, status and budget fully reset and dates shifted one year', async () => {
    const service = createService();
    db.activity.findMany.mockResolvedValue([
      {
        id: 50, yearId: 1, objectiveId: 30, projectId: 60, orgUnitId: 3, branchOrgUnitId: null,
        employeeId: 9, code: 'A1', title: 'Community Outreach', description: 'Run outreach',
        quarter: 'Q2', startDate: new Date('2026-04-01'), dueDate: new Date('2026-06-30'),
        progress: 100, implementationStatus: 'completed', approvalStatus: 'approved',
        budget: 5000, weight: 1,
      },
    ]);
    db.activity.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 150, ...data }));

    await service.executeRollover({ sourceYearId: 1, targetYearId: 2, items: ['activity'] }, 1);

    const data = db.activity.create.mock.calls[0][0].data;
    expect(data.yearId).toBe(2);
    expect(data.progress).toBe(0);                          // completed progress never carried
    expect(data.implementationStatus).toBe('not_started');  // execution state reset
    expect(data.approvalStatus).toBe('draft');              // approval state reset
    expect(data.budget).toBe(0);                            // planned budget requires review
    expect(data.title).toBe('Community Outreach');          // definition preserved
    expect(data.startDate.getFullYear()).toBe(2027);        // dates shifted +1 year for review
    expect(data.dueDate.getFullYear()).toBe(2027);
  });

  it('copies projects with actuals and progress zeroed, milestones reset to pending', async () => {
    const service = createService();
    db.project.findMany.mockResolvedValue([
      {
        id: 60, yearId: 1, code: 'PRJ-1', name: 'Road Upgrade', location: 'North', description: 'Upgrade road',
        orgUnitId: 3, managerEmployeeId: 9, plannedBudget: 100000, actualSpend: 85000,
        physicalProgress: 75, financialProgress: 85,
        startDate: new Date('2026-01-15'), endDate: new Date('2026-11-30'),
        status: 'in_progress', approvalStatus: 'approved',
      },
    ]);
    db.project.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 160, ...data }));
    db.projectMilestone.findMany.mockResolvedValue([
      { id: 61, projectId: 60, name: 'Design done', plannedDate: new Date('2026-03-01'), actualDate: new Date('2026-03-05'), progress: 100, status: 'completed' },
    ]);
    db.projectMilestone.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 161, ...data }));

    await service.executeRollover({ sourceYearId: 1, targetYearId: 2, items: ['project_template'] }, 1);

    const data = db.project.create.mock.calls[0][0].data;
    expect(data.yearId).toBe(2);
    expect(data.actualSpend).toBe(0);            // closed-year financial actuals never carried
    expect(data.physicalProgress).toBe(0);       // progress never carried
    expect(data.financialProgress).toBe(0);
    expect(data.status).toBe('planned');
    expect(data.approvalStatus).toBe('draft');
    expect(data.plannedBudget).toBe(100000);     // planned budget is reusable structure
    expect(data.startDate.getFullYear()).toBe(2027);

    const milestone = db.projectMilestone.create.mock.calls[0][0].data;
    expect(milestone.progress).toBe(0);
    expect(milestone.actualDate).toBeNull();
    expect(milestone.status).toBe('pending');
    expect(milestone.plannedDate.getFullYear()).toBe(2027);
  });

  it('copies risk templates as open with review date cleared', async () => {
    const service = createService();
    db.risk.findMany.mockResolvedValue([
      { id: 70, yearId: 1, orgUnitId: 3, categoryId: 2, title: 'Funding shortfall', description: 'Delay in disbursement', probability: 3, impact: 4, score: 12, level: 'high', ownerEmployeeId: 9, mitigation: 'Reserve funds', status: 'closed', reviewDate: new Date('2026-09-01') },
    ]);
    db.risk.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 170, ...data }));

    await service.executeRollover({ sourceYearId: 1, targetYearId: 2, items: ['risk_template'] }, 1);

    const data = db.risk.create.mock.calls[0][0].data;
    expect(data.yearId).toBe(2);
    expect(data.status).toBe('open');            // year-specific status reset
    expect(data.reviewDate).toBeNull();          // prior-year review state cleared
    expect(data.title).toBe('Funding shortfall');
    expect(data.mitigation).toBe('Reserve funds');
    expect(data.score).toBe(12);                 // inherent assessment preserved
  });

  it('copies compliance templates as open with evidence cleared', async () => {
    const service = createService();
    db.complianceRequirement.findMany.mockResolvedValue([
      { id: 80, yearId: 1, orgUnitId: 3, category: 'Legal', code: 'C-1', title: 'Annual license renewal', authority: 'Ministry', responsibleEmployeeId: 9, dueDate: new Date('2026-05-01'), status: 'closed', evidence: 'license.pdf' },
    ]);
    db.complianceRequirement.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 180, ...data }));

    await service.executeRollover({ sourceYearId: 1, targetYearId: 2, items: ['compliance_template'] }, 1);

    const data = db.complianceRequirement.create.mock.calls[0][0].data;
    expect(data.yearId).toBe(2);
    expect(data.status).toBe('open');
    expect(data.evidence).toBeNull();            // prior-year evidence never carried
    expect(data.title).toBe('Annual license renewal');
    expect(data.dueDate.getFullYear()).toBe(2027);
  });
});

// ==================== CROSS-YEAR DATA ISOLATION ====================
// The core guarantee: PERFORMANCE data never crosses year boundaries.

describe('RolloverService — cross-year data isolation', () => {
  it('exposes an explicit never-copy list covering every forbidden category', () => {
    const service = createService();
    const never = (service as any).performanceNotCopied();
    const keys = never.map((n: any) => n.key);
    expect(keys).toEqual(expect.arrayContaining([
      'kpi_actuals',
      'activity_progress',
      'reporting_results',
      'approval_state',
      'audit_records',
      'closed_year_financials',
    ]));
  });

  it('has no code path to copy performance models (they are outside the copy engine)', () => {
    // The copy-engine registry contains ONLY structure models.
    const structureModels = Object.values(YEAR_STRUCTURE_MODELS);
    expect(structureModels).toEqual(expect.arrayContaining([
      'strategicTheme', 'goal', 'objective', 'kpiPlan', 'orgUnit', 'activity',
      'project', 'risk', 'complianceRequirement', 'budgetCategory', 'fundingSource',
    ]));
    // Performance models must never be registered for copying.
    expect(structureModels).not.toContain('kpiActual');
    expect(structureModels).not.toContain('financeEntry');
    expect(structureModels).not.toContain('report');
    expect(structureModels).not.toContain('audit');
    expect(structureModels).not.toContain('auditLog');
    expect(structureModels).not.toContain('taskUpdate');
    expect(structureModels).not.toContain('approval');
  });

  it('refuses to copy unknown/performance item keys (defence in depth)', async () => {
    const service = createService();
    // kpi_actuals is NOT a structure key — the engine must return null without
    // touching the database at all.
    const result = await (service as any).copyOne('kpi_actuals', { id: 1 }, 2);
    expect(result).toBeNull();
    expect(db.kpiPlan.create).not.toHaveBeenCalled();
    expect(db.goal.create).not.toHaveBeenCalled();
  });

  it('never reads KPI actuals, reports, finance entries or audit records during execution', async () => {
    const service = createService();
    db.goal.findMany.mockResolvedValue([
      { id: 10, yearId: 1, name: 'G', description: 'd', weight: 1, approvalStatus: 'approved' },
    ]);
    db.goal.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 110, ...data }));

    await service.executeRollover({ sourceYearId: 1, targetYearId: 2, items: ['goal'] }, 1);

    // The engine never touches these models — they are not even present on
    // the mock database, proving there is no read/write path for them.
    expect(db.kpiActual).toBeUndefined();
    expect(db.financeEntry).toBeUndefined();
    expect(db.report).toBeUndefined();
    expect(db.auditLog).toBeUndefined();
    expect(db.taskUpdate).toBeUndefined();
  });

  it('does not carry source-year approval state into any copied record', async () => {
    const service = createService();
    db.goal.findMany.mockResolvedValue([
      { id: 10, yearId: 1, name: 'G', weight: 1, approvalStatus: 'approved' },
    ]);
    db.activity.findMany.mockResolvedValue([
      { id: 50, yearId: 1, title: 'A', progress: 80, implementationStatus: 'in_progress', approvalStatus: 'approved', weight: 1 },
    ]);
    db.goal.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 110, ...data }));
    db.activity.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 150, ...data }));

    await service.executeRollover({ sourceYearId: 1, targetYearId: 2, items: ['goal', 'activity'] }, 1);

    for (const call of db.goal.create.mock.calls) {
      expect(call[0].data.approvalStatus).toBe('draft');
    }
    for (const call of db.activity.create.mock.calls) {
      expect(call[0].data.approvalStatus).toBe('draft');
      expect(call[0].data.implementationStatus).toBe('not_started');
    }
  });

  it('retains a source-year reference for every copied item via the ledger', async () => {
    const service = createService();
    db.goal.findMany.mockResolvedValue([
      { id: 10, yearId: 1, name: 'G1', weight: 1, approvalStatus: 'approved' },
      { id: 11, yearId: 1, name: 'G2', weight: 1, approvalStatus: 'draft' },
    ]);
    db.goal.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: data.name === 'G1' ? 110 : 111, ...data }));

    await service.executeRollover({ sourceYearId: 1, targetYearId: 2, items: ['goal'] }, 1);

    const ledgerRows = db.rolloverItem.create.mock.calls.map((c: any) => c[0].data);
    expect(ledgerRows).toHaveLength(2);
    for (const row of ledgerRows) {
      expect(row.sourceYearId).toBe(1);   // source-year reference retained
      expect(row.targetYearId).toBe(2);   // target-year reference assigned
      expect(row.itemKey).toBe('goal');
      expect(row.status).toBe('copied');
      expect(row.targetId).toBeGreaterThan(0);
    }
    expect(ledgerRows.map((r: any) => r.sourceId).sort()).toEqual([10, 11]);
  });
});

// ==================== IDEMPOTENCY / DUPLICATE PROTECTION ====================

describe('RolloverService — idempotency and duplicate protection', () => {
  it('blocks a second execution of the same completed rollover', async () => {
    const service = createService();
    db.rolloverJob.findUnique.mockResolvedValue({ id: 99, status: 'completed' });

    await expect(
      service.executeRollover({ sourceYearId: 1, targetYearId: 2 }, 1),
    ).rejects.toThrow(/already ran.*duplicates/i);
    expect(db.goal.create).not.toHaveBeenCalled();
    expect(db.rolloverItem.create).not.toHaveBeenCalled();
  });

  it('blocks a second execution while a job is still in progress', async () => {
    const service = createService();
    db.rolloverJob.findUnique.mockResolvedValue({ id: 99, status: 'in_progress' });

    await expect(
      service.executeRollover({ sourceYearId: 1, targetYearId: 2 }, 1),
    ).rejects.toThrow(/already ran/i);
  });

  it('skips items already copied to the target year in a prior run (per-item ledger)', async () => {
    const service = createService();
    // goal 10 was already rolled over; goal 11 was not.
    mockLedger({}, [10]);
    db.goal.findMany.mockResolvedValue([
      { id: 10, yearId: 1, name: 'G1', weight: 1, approvalStatus: 'draft' },
      { id: 11, yearId: 1, name: 'G2', weight: 1, approvalStatus: 'draft' },
    ]);
    db.goal.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 111, ...data }));

    const summary = await service.executeRollover({ sourceYearId: 1, targetYearId: 2, items: ['goal'] }, 1);

    expect(db.goal.create).toHaveBeenCalledTimes(1);          // only the new item
    expect(db.goal.create.mock.calls[0][0].data.name).toBe('G2');
    expect(summary.summary.copied.goal.skipped).toBe(1);      // duplicate avoided
  });

  it('reuses (never duplicates) the job row when retrying a failed rollover', async () => {
    const service = createService();
    db.rolloverJob.findUnique.mockResolvedValue({ id: 99, status: 'failed' });
    db.goal.findMany.mockResolvedValue([
      { id: 10, yearId: 1, name: 'G1', weight: 1, approvalStatus: 'draft' },
    ]);
    db.goal.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 110, ...data }));

    const result = await service.executeRollover({ sourceYearId: 1, targetYearId: 2, items: ['goal'] }, 1);

    expect(db.rolloverJob.create).not.toHaveBeenCalled();     // row reused, not duplicated
    expect(db.rolloverJob.update).toHaveBeenCalled();
    expect(db.rolloverItem.deleteMany).toHaveBeenCalledWith({ where: { jobId: 99 } });
    expect(result.jobId).toBe(99);
  });

  it('cancelling a completed job is rejected, keeping executed history intact', async () => {
    const service = createService();
    db.rolloverJob.findUnique.mockResolvedValue({ id: 99, status: 'completed' });

    await expect(service.cancelJob(99, 1)).rejects.toThrow(/cannot be cancelled/i);
  });

  it('uses the same job ledger key per (job, item, source) to prevent double-ledger entries', async () => {
    const service = createService();
    db.goal.findMany.mockResolvedValue([
      { id: 10, yearId: 1, name: 'G1', weight: 1, approvalStatus: 'draft' },
    ]);
    db.goal.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 110, ...data }));

    await service.executeRollover({ sourceYearId: 1, targetYearId: 2, items: ['goal'] }, 1);

    expect(db.rolloverItem.create).toHaveBeenCalledTimes(1);
  });
});

// ==================== SELECTION MODES + WIZARD ====================

describe('RolloverService — selection modes and wizard', () => {
  it('supports all eleven selectable structure categories', () => {
    const keys = STRUCTURE_ITEMS.map(i => i.key);
    expect(keys).toEqual(expect.arrayContaining([
      ROLLOVER_ITEMS.THEME, ROLLOVER_ITEMS.GOAL, ROLLOVER_ITEMS.OBJECTIVE,
      ROLLOVER_ITEMS.KPI, ROLLOVER_ITEMS.ORG_UNIT, ROLLOVER_ITEMS.ACTIVITY,
      ROLLOVER_ITEMS.PROJECT_TEMPLATE, ROLLOVER_ITEMS.RISK_TEMPLATE,
      ROLLOVER_ITEMS.COMPLIANCE_TEMPLATE, ROLLOVER_ITEMS.BUDGET_CATEGORY,
      ROLLOVER_ITEMS.FUNDING_SOURCE,
    ]));
    expect(keys).toHaveLength(11);
  });

  it('mode "module" maps a module to its item categories', async () => {
    const service = createService();
    db.goal.findMany.mockResolvedValue([{ id: 10, yearId: 1, name: 'G', weight: 1, approvalStatus: 'draft' }]);
    db.objective.findMany.mockResolvedValue([]);
    db.strategicTheme.findMany.mockResolvedValue([]);
    db.goal.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 110, ...data }));

    await service.executeRollover(
      { sourceYearId: 1, targetYearId: 2, mode: ROLLOVER_MODES.MODULE, modules: ['strategic'] }, 1,
    );

    // Strategic module -> themes, goals and objectives only.
    expect(db.strategicTheme.findMany).toHaveBeenCalled();
    expect(db.goal.findMany).toHaveBeenCalled();
    expect(db.objective.findMany).toHaveBeenCalled();
    expect(db.activity.findMany).not.toHaveBeenCalled();
    expect(db.risk.findMany).not.toHaveBeenCalled();
  });

  it('mode "org_unit" scopes source lookups to the selected organization units', async () => {
    const service = createService();
    db.goal.findMany.mockResolvedValue([]);
    db.objective.findMany.mockResolvedValue([]);

    await service.executeRollover(
      { sourceYearId: 1, targetYearId: 2, mode: ROLLOVER_MODES.ORG_UNIT, orgUnitIds: [7, 9] }, 1,
    );

    const where = db.goal.findMany.mock.calls[0][0].where;
    expect(where.orgUnitId).toEqual({ in: [7, 9] });
  });

  it('mode "goal" scopes objectives and activities to the selected goals', async () => {
    const service = createService();
    db.objective.findMany.mockResolvedValue([]);

    await service.executeRollover(
      { sourceYearId: 1, targetYearId: 2, mode: ROLLOVER_MODES.GOAL, goalIds: [20] }, 1,
    );

    const where = db.objective.findMany.mock.calls[0][0].where;
    expect(where.goalId).toEqual({ in: [20] });
  });

  it('preview reports counts per item plus the performance-isolation list', async () => {
    const service = createService();
    db.goal.count.mockResolvedValue(4);
    db.activity.count.mockResolvedValue(12);

    const preview = await service.previewRollover(
      { sourceYearId: 1, targetYearId: 2, items: ['goal', 'activity'] }, 1,
    );

    expect(preview.sourceYear.year).toBe(2026);
    expect(preview.targetYear.year).toBe(2027);
    expect(preview.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'goal', sourceCount: 4 }),
      expect.objectContaining({ key: 'activity', sourceCount: 12 }),
    ]));
    expect(preview.performanceNotCopied).toHaveLength(6);
  });

  it('refuses rollover into a closed or archived target year', async () => {
    const service = createService();
    db.planningYear.findUnique.mockImplementation(({ where }: any) => {
      if (where.id === SOURCE.id) return Promise.resolve(SOURCE);
      return Promise.resolve({ id: 2, year: 2027, label: '2027', status: 'closed' });
    });

    await expect(
      service.executeRollover({ sourceYearId: 1, targetYearId: 2 }, 1),
    ).rejects.toThrow(/closed\/archived/);
  });

  it('enforces governance permissions for non-admin users', async () => {
    const service = createService();
    db.user.findUnique.mockResolvedValue({ id: 5, fullName: 'RO', Role: { code: 'READ_ONLY' } });
    governance.hasPermission.mockResolvedValue(false);

    await expect(
      service.executeRollover({ sourceYearId: 1, targetYearId: 2 }, 5),
    ).rejects.toThrow(/Permission denied/);
    expect(db.rolloverJob.create).not.toHaveBeenCalled();
  });
});

// ==================== NO CODE CHANGES REQUIRED ====================

describe('RolloverService — creating a new year requires NO code changes', () => {
  it('rolls over to a brand-new year created purely through data', async () => {
    const service = createService();
    // 2028 was created at runtime through the planning API — the rollover
    // engine has no hardcoded year, id or structure knowledge about it.
    const BRAND_NEW = { id: 3, year: 2028, label: '2028 Plan', status: 'draft' };
    db.planningYear.findUnique.mockImplementation(({ where }: any) => {
      if (where.id === SOURCE.id) return Promise.resolve(SOURCE);
      if (where.id === BRAND_NEW.id) return Promise.resolve(BRAND_NEW);
      return Promise.resolve(null);
    });
    db.goal.findMany.mockResolvedValue([
      { id: 10, yearId: 1, name: 'Carried Goal', weight: 1, approvalStatus: 'approved' },
    ]);
    db.goal.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 210, ...data }));

    const result = await service.executeRollover(
      { sourceYearId: 1, targetYearId: 3, items: ['goal'] }, 1,
    );

    const data = db.goal.create.mock.calls[0][0].data;
    expect(data.yearId).toBe(3);                    // dynamic target year from request
    expect(data.approvalStatus).toBe('draft');      // statuses reset by rule, not by year
    expect(result.targetYear).toBe(2028);
    expect(result.summary.copied.goal.copied).toBe(1);
  });

  it('treats item categories as data-driven configuration, not per-year code', () => {
    const service = createService();
    const items = service.getStructureItems();
    // The wizard inventory is static configuration consumed for ANY year pair.
    expect(items.structureItems).toHaveLength(11);
    expect(items.modes).toContain('all');
    expect(items.neverCopied.length).toBeGreaterThan(0);
    // No year-specific entries exist anywhere in the configuration.
    const json = JSON.stringify(items);
    expect(json).not.toContain('2026');
    expect(json).not.toContain('2027');
  });
});