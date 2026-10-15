import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StrategicService } from './strategic.service';

function makeDelegate() {
  return {
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
  };
}

const prisma: any = {
  strategicPlan: makeDelegate(),
  strategicTheme: makeDelegate(),
  strategicResult: makeDelegate(),
  goal: makeDelegate(),
  objective: makeDelegate(),
  planningYear: makeDelegate(),
};

const governanceService: any = {
  assertYearWritable: vi.fn().mockResolvedValue(undefined),
};

const service = () => new StrategicService(prisma, governanceService);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('StrategicService.createGoal', () => {
  it('defaults the weight to 1 and forwards the fields', async () => {
    prisma.goal.create.mockImplementation(({ data }: any) => ({ id: 1, ...data }));

    const goal = await service().createGoal(1, { yearId: 2, code: 'G1', name: 'Goal one' });
    expect(goal.weight).toBe(1);
    expect(prisma.goal.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ yearId: 2, code: 'G1', weight: 1 }) }),
    );
  });
});

describe('StrategicService.createObjective', () => {
  it('defaults direction and weight', async () => {
    prisma.objective.create.mockImplementation(({ data }: any) => ({ id: 1, ...data }));

    const obj = await service().createObjective(1, { yearId: 2, goalId: 1, name: 'Obj' });
    expect(obj.direction).toBe('higher_is_better');
    expect(obj.weight).toBe(1);
  });
});

describe('StrategicService.findGoalsByYear', () => {
  it('excludes cancelled goals', async () => {
    await service().findGoalsByYear(7);
    expect(prisma.goal.findMany).toHaveBeenCalledWith({
      where: {
        yearId: 7,
        approvalStatus: { not: 'cancelled' },
      },
      include: { StrategicResult: true, OrgUnit: true, Objective: true },
    });
  });
});

describe('StrategicService.deleteStrategicPlan', () => {
  it('archives instead of hard-deleting', async () => {
    prisma.strategicPlan.update.mockResolvedValue({ id: 3, status: 'archived' });
    await service().deleteStrategicPlan(1, 3);
    expect(prisma.strategicPlan.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { status: 'archived' },
    });
  });
});

describe('StrategicService.getHierarchyForYear', () => {
  it('throws when the year does not exist', async () => {
    prisma.planningYear.findUnique.mockResolvedValue(null);
    await expect(service().getHierarchyForYear(999)).rejects.toThrow('Year not found');
  });

  it('returns the active plan hierarchy for the year', async () => {
    prisma.planningYear.findUnique.mockResolvedValue({ id: 2, year: 2027 });
    prisma.strategicPlan.findFirst.mockResolvedValue({
      id: 1,
      status: 'active',
      StrategicTheme: [{ id: 10, name: 'Theme A' }],
    });

    const result = await service().getHierarchyForYear(2);
    expect(result.year).toEqual({ id: 2, year: 2027 });
    expect(result.hierarchy).toEqual([{ id: 10, name: 'Theme A' }]);
  });
});

describe('StrategicService.getStatistics', () => {
  it('shapes total/active/achieved counts', async () => {
    prisma.goal.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(4);
    prisma.objective.count
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2);

    const stats = await service().getStatistics(2);
    expect(stats.goals).toEqual({ total: 10, active: 6, achieved: 4 });
    expect(stats.objectives).toEqual({ total: 8, active: 5, achieved: 2 });
  });
});
