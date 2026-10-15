import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PlanningService } from './planning.service';

function makeDelegate() {
  return {
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

const prisma: any = {
  planningYear: makeDelegate(),
  activity: makeDelegate(),
  goal: makeDelegate(),
  objective: makeDelegate(),
  budget: makeDelegate(),
  project: makeDelegate(),
  plan: makeDelegate(),
  projectMilestone: makeDelegate(),
};

const governanceService: any = {
  assertYearWritable: vi.fn().mockResolvedValue(undefined),
};

const service = () => new PlanningService(prisma, governanceService);

const userId = 1;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PlanningService.createPlanningYear', () => {
  it('creates a draft year and parses the optional dates', async () => {
    prisma.planningYear.create.mockImplementation(({ data }: any) => ({ id: 1, ...data }));

    const created = await service().createPlanningYear({
      year: 2035,
      label: 'FY2035',
      startDate: '2035-01-01',
      endDate: '2035-12-31',
    });

    expect(created.status).toBe('draft');
    expect(created.year).toBe(2035);
    expect(created.startDate).toBeInstanceOf(Date);
    expect(created.endDate).toBeInstanceOf(Date);
  });

  it('leaves dates undefined when not provided', async () => {
    prisma.planningYear.create.mockImplementation(({ data }: any) => ({ id: 2, ...data }));

    const created = await service().createPlanningYear({ year: 2036, label: 'FY2036' });
    expect(created.startDate).toBeUndefined();
    expect(created.endDate).toBeUndefined();
  });
});

describe('PlanningService.getPlanningSummary', () => {
  it('aggregates counts and planned budget totals', async () => {
    prisma.planningYear.findUnique.mockResolvedValue({ id: 1, year: 2027 });
    prisma.activity.findMany.mockResolvedValue([
      { implementationStatus: 'completed' },
      { implementationStatus: 'in_progress' },
    ]);
    prisma.goal.findMany.mockResolvedValue([{ id: 1 }]);
    prisma.objective.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    prisma.budget.findMany.mockResolvedValue([{ plannedAmount: '1000.50' }, { plannedAmount: 499.5 }]);
    prisma.project.findMany.mockResolvedValue([
      { status: 'completed' },
      { status: 'active' },
    ]);

    const summary = await service().getPlanningSummary(1);
    expect(summary.activities).toEqual({ total: 2, completed: 1 });
    expect(summary.goals.total).toBe(1);
    expect(summary.objectives.total).toBe(2);
    expect(summary.budgets).toEqual({ total: 2, planned: 1500 });
    expect(summary.projects).toEqual({ total: 2, completed: 1 });
  });
});

describe('PlanningService.getPlanById', () => {
  it('throws NotFound when the plan is missing', async () => {
    prisma.plan.findUnique.mockResolvedValue(null);
    await expect(service().getPlanById(42)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('PlanningService.transitionPlan', () => {
  it('moves draft (1) to submitted (2)', async () => {
    prisma.plan.findUnique.mockResolvedValue({ id: 5, workflowStateId: '1' });
    prisma.plan.update.mockImplementation(({ data }: any) => ({ id: 5, ...data }));

    const updated = await service().transitionPlan(userId, 5, 'submit');
    expect(updated.workflowStateId).toBe(2);
  });

  it('rejects an invalid transition', async () => {
    prisma.plan.findUnique.mockResolvedValue({ id: 5, workflowStateId: '1' });
    await expect(service().transitionPlan(userId, 5, 'approve')).rejects.toThrow(/Invalid transition/);
  });

  it('throws NotFound for a missing plan', async () => {
    prisma.plan.findUnique.mockResolvedValue(null);
    await expect(service().transitionPlan(userId, 99, 'submit')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('PlanningService.copyPlanToYear', () => {
  it('creates an independent copy pointing at the target year', async () => {
    prisma.plan.findUnique.mockResolvedValue({
      id: 1,
      name: 'Annual Plan',
      description: 'desc',
      planningType: 'annual',
    });
    prisma.plan.create.mockImplementation(({ data }: any) => ({ id: 77, ...data }));

    const result = await service().copyPlanToYear(userId, { sourcePlanId: 1, targetYearId: 2 });
    expect(result.planId).toBe(77);
    expect(prisma.plan.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ yearId: 2, name: 'Annual Plan (Copy)' }) }),
    );
  });

  it('throws NotFound when the source plan is missing', async () => {
    prisma.plan.findUnique.mockResolvedValue(null);
    await expect(
      service().copyPlanToYear(userId, { sourcePlanId: 404, targetYearId: 2 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
