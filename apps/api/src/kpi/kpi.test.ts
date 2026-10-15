import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KpiCalculationService } from './kpi-calculation.service';

// Minimal Prisma stub for the delegates the service touches.
function makeDelegate() {
  return {
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
  };
}

const prisma: any = {
  kpi: makeDelegate(),
  kpiPlan: makeDelegate(),
  kpiActual: makeDelegate(),
};

const service = () => new KpiCalculationService(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('KpiCalculationService.calculateKpiPerformance', () => {
  it('returns null when the KPI does not exist', async () => {
    prisma.kpi.findUnique.mockResolvedValue(null);
    await expect(service().calculateKpiPerformance(999)).resolves.toBeNull();
  });

  it('returns null when the KPI has no plans', async () => {
    prisma.kpi.findUnique.mockResolvedValue({ id: 1, name: 'Revenue', KpiPlan: [] });
    await expect(service().calculateKpiPerformance(1)).resolves.toBeNull();
  });

  it('averages actuals and computes performance against the annual target', async () => {
    prisma.kpi.findUnique.mockResolvedValue({
      id: 7,
      name: 'Enrolment Rate',
      KpiPlan: [{ id: 3, annualTarget: 100, baselineValue: 40 }],
    });
    prisma.kpiActual.findMany.mockResolvedValue([
      { actualValue: 80, submittedAt: new Date('2027-03-31') },
      { actualValue: 60, submittedAt: new Date('2027-02-28') },
    ]);

    const result = await service().calculateKpiPerformance(7);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Enrolment Rate');
    expect(result!.target).toBe(100);
    expect(result!.baseline).toBe(40);
    expect(result!.current).toBe(70); // (80 + 60) / 2
    expect(result!.performance).toBe(70); // 70 / 100 * 100
    expect(result!.trendDirection).toBe('up'); // newest actual (80) higher than oldest (60)
  });

  it('reports a stable trend with fewer than two data points', async () => {
    prisma.kpi.findUnique.mockResolvedValue({
      id: 8,
      name: 'Single',
      KpiPlan: [{ id: 4, annualTarget: 50, baselineValue: 0 }],
    });
    prisma.kpiActual.findMany.mockResolvedValue([{ actualValue: 25 }]);

    const result = await service().calculateKpiPerformance(8);
    expect(result!.trend).toBe(0);
    expect(result!.trendDirection).toBe('stable');
  });
});

describe('KpiCalculationService.getKpiTrends', () => {
  it('maps each plan to its actual series', async () => {
    prisma.kpiPlan.findMany.mockResolvedValue([
      {
        id: 11,
        annualTarget: 200,
        Kpi: { name: 'Visitors' },
        KpiActual: [{ actualValue: 10 }, { actualValue: 20 }],
      },
    ]);

    const trends = await service().getKpiTrends(2);
    expect(trends).toHaveLength(1);
    expect(trends[0]).toEqual({
      id: 11,
      name: 'Visitors',
      data: [
        { value: 10, target: 200 },
        { value: 20, target: 200 },
      ],
    });
  });
});

describe('KpiCalculationService.getDepartmentKpiSummary', () => {
  it('computes performance from the first actual against the annual target', async () => {
    prisma.kpiPlan.findMany.mockResolvedValue([
      { id: 1, annualTarget: 40, Kpi: { name: 'A' }, Employee: null, KpiActual: [{ actualValue: 30 }] },
    ]);

    const summary = await service().getDepartmentKpiSummary(5, 3);
    expect(summary).toHaveLength(1);
    expect(summary[0]!.performance).toBe(75);
  });

  it('avoids division by zero when the target is missing', async () => {
    prisma.kpiPlan.findMany.mockResolvedValue([
      { id: 2, annualTarget: 0, Kpi: { name: 'B' }, Employee: null, KpiActual: [{ actualValue: 5 }] },
    ]);

    const summary = await service().getDepartmentKpiSummary(5, 3);
    expect(summary[0]!.performance).toBe(0);
  });
});
