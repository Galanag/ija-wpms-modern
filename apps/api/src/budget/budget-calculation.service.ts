import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BudgetCalculationService {
  constructor(private prisma: PrismaService) {}

  async getBudgetSummary(yearId: number, orgUnitId?: number) {
    const where: any = { yearId };
    if (orgUnitId) where.orgUnitId = orgUnitId;

    const budgets = await this.prisma.budget.findMany({
      where,
      include: { BudgetLine: { include: { FinanceEntry: true } }, FinanceEntry: true, currency: true },
    });

    const byCurrency = new Map<number, { planned: number; revised: number; actual: number; revenue: number; currency: any }>();
    for (const b of budgets) {
      const cid = b.currencyId ?? 1;
      const entry = byCurrency.get(cid) ?? { planned: 0, revised: 0, actual: 0, revenue: 0, currency: b.currency };
      entry.planned += Number(b.plannedAmount);
      entry.revised += Number(b.revisedAmount);
      byCurrency.set(cid, entry);
      for (const e of b.FinanceEntry) {
        if (e.status !== 'posted') continue;
        const amt = Number(e.amount);
        if (e.entryType === 'expense') entry.actual += amt;
        else if (e.entryType === 'revenue') entry.revenue += amt;
      }
    }

    const summary = Array.from(byCurrency.values()).map(entry => ({
      planned: entry.planned,
      revised: entry.revised,
      actual: entry.actual,
      revenue: entry.revenue,
      utilization: entry.revised ? (entry.actual / entry.revised) * 100 : 0,
      variance: entry.revised - entry.actual,
      currency: entry.currency,
    }));

    return summary;
  }

  async getBudgetTrends(yearId: number) {
    const entries = await this.prisma.financeEntry.findMany({
      where: { yearId, status: 'posted' },
      orderBy: { transactionDate: 'asc' },
    });
    return entries;
  }

  async getOrgUnitBudgetComparison(yearId: number) {
    const budgets = await this.prisma.budget.findMany({
      where: { yearId },
      include: { OrgUnit: true, FinanceEntry: { where: { status: 'posted' } }, currency: true },
    });
    return budgets.map(b => ({
      orgUnit: b.OrgUnit?.name || 'Unassigned',
      planned: Number(b.plannedAmount),
      revised: Number(b.revisedAmount),
      actual: b.FinanceEntry.reduce((s, e) => s + Number(e.amount), 0),
      currency: b.currency,
    }));
  }
}
