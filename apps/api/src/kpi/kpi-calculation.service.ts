import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KpiCalculationService {
  constructor(private prisma: PrismaService) {}

  async calculateKpiPerformance(kpiId: number) {
    const kpi = await this.prisma.kpi.findUnique({ where: { id: kpiId }, include: { KpiPlan: true } });
    if (!kpi || !kpi.KpiPlan.length) return null;

    const plan = kpi.KpiPlan[0]!;
    const actuals = await this.prisma.kpiActual.findMany({
      where: { kpiPlanId: plan.id },
      orderBy: { submittedAt: 'desc' },
    });

    const total = actuals.reduce((s: number, a: any) => s + (a.actualValue || 0), 0);
    const count = actuals.length;
    const avg = count ? total / count : 0;
    const target = plan.annualTarget || 0;
    const baseline = plan.baselineValue || 0;

    return {
      kpiId, name: kpi.name,
      target, baseline,
      current: avg,
      performance: target ? (avg / target) * 100 : 0,
      trend: count >= 2 ? ((actuals[0]?.actualValue || 0) - (actuals[count - 1]?.actualValue || 0)) / (count - 1) : 0,
      trendDirection: count >= 2 ? ((actuals[0]?.actualValue || 0) > (actuals[count - 1]?.actualValue || 0)) ? 'up' : 'down' : 'stable',
    };
  }

  async getKpiTrends(yearId: number) {
    const plans = await this.prisma.kpiPlan.findMany({
      where: { yearId },
      include: { Kpi: true, KpiActual: { orderBy: { submittedAt: 'asc' }, take: 12 } },
    });
    return plans.map(plan => ({
      id: plan.id, name: plan.Kpi?.name,
      data: plan.KpiActual.map((m: any) => ({ value: m.actualValue, target: plan.annualTarget })),
    }));
  }

  async getDepartmentKpiSummary(orgUnitId: number, yearId: number) {
    const plans = await this.prisma.kpiPlan.findMany({
      where: { yearId, orgUnitId },
      include: { Kpi: true, Employee: true, KpiActual: true },
    });
    return plans.map(p => ({ ...p, performance: p.annualTarget ? ((p.KpiActual[0]?.actualValue || 0) / p.annualTarget) * 100 : 0 }));
  }
}
