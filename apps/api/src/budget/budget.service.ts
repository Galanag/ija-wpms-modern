import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GovernanceService } from '../governance/governance.service';

@Injectable()
export class BudgetService {
  constructor(
    private prisma: PrismaService,
    private governanceService: GovernanceService,
  ) {}

  // ==================== BUDGET CRUD ====================

  async createBudget(userId: number, data: any) {
    await this.governanceService.assertYearWritable(userId, 'budget', data.yearId);
    return this.prisma.budget.create({
      data: {
        yearId: data.yearId,
        planAllocationId: data.planAllocationId,
        orgUnitId: data.orgUnitId,
        category: data.category,
        plannedAmount: data.plannedAmount ?? 0,
        revisedAmount: data.revisedAmount ?? data.plannedAmount ?? 0,
        currencyId: data.currencyId ?? 1,
        approvalStatus: 'draft',
      },
      include: { OrgUnit: true, PlanningYear: true, BudgetLine: true, currency: true },
    });
  }

  async findAllBudgets(params: { yearId?: number; orgUnitId?: number; status?: string }) {
    const where: any = {};
    if (params.yearId) where.yearId = params.yearId;
    if (params.orgUnitId) where.orgUnitId = params.orgUnitId;
    if (params.status) where.approvalStatus = params.status;
    return this.prisma.budget.findMany({
      where,
      include: { OrgUnit: true, PlanningYear: true, BudgetLine: true, currency: true, _count: { select: { FinanceEntry: true } } },
      orderBy: { category: 'asc' },
    });
  }

  async findBudgetById(id: number) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: { OrgUnit: true, PlanningYear: true, BudgetLine: { include: { FinanceEntry: true } }, FinanceEntry: true, currency: true },
    });
    if (!budget) throw new NotFoundException('Budget not found');
    return budget;
  }

  async updateBudget(userId: number, id: number, data: any) {
    const budget = await this.prisma.budget.findUnique({ where: { id }, select: { yearId: true } });
    if (!budget) throw new NotFoundException('Budget not found');
    await this.governanceService.assertYearWritable(userId, 'budget', budget.yearId);
    return this.prisma.budget.update({ where: { id }, data: { ...data }, include: { OrgUnit: true } });
  }

  async deleteBudget(userId: number, id: number) {
    const budget = await this.prisma.budget.findUnique({ where: { id }, select: { yearId: true } });
    if (!budget) throw new NotFoundException('Budget not found');
    await this.governanceService.assertYearWritable(userId, 'budget', budget.yearId);
    return this.prisma.budget.delete({ where: { id } });
  }

  async submitBudget(userId: number, id: number) {
    const budget = await this.prisma.budget.findUnique({ where: { id }, select: { yearId: true } });
    if (!budget) throw new NotFoundException('Budget not found');
    await this.governanceService.assertYearWritable(userId, 'budget', budget.yearId);
    return this.prisma.budget.update({ where: { id }, data: { approvalStatus: 'pending' } });
  }

  async approveBudget(userId: number, id: number) {
    const budget = await this.prisma.budget.findUnique({ where: { id }, select: { yearId: true } });
    if (!budget) throw new NotFoundException('Budget not found');
    await this.governanceService.assertYearWritable(userId, 'budget', budget.yearId);
    return this.prisma.budget.update({ where: { id }, data: { approvalStatus: 'approved' } });
  }

  // ==================== BUDGET LINES ====================

  private async getBudgetYearId(budgetId: number): Promise<number> {
    const budget = await this.prisma.budget.findUnique({
      where: { id: budgetId },
      select: { yearId: true },
    });
    if (!budget) throw new NotFoundException('Budget not found');
    return budget.yearId;
  }

  async createBudgetLine(userId: number, data: any) {
    const yearId = await this.getBudgetYearId(data.budgetId);
    await this.governanceService.assertYearWritable(userId, 'budget_line', yearId);
    return this.prisma.budgetLine.create({
      data: {
        budgetId: data.budgetId,
        lineName: data.lineName,
        plannedAmount: data.plannedAmount ?? 0,
        revisedAmount: data.revisedAmount ?? data.plannedAmount ?? 0,
        currencyId: data.currencyId ?? 1,
      },
      include: { Budget: true, currency: true },
    });
  }

  async findBudgetLines(budgetId: number) {
    return this.prisma.budgetLine.findMany({
      where: { budgetId },
      include: { Budget: true, FinanceEntry: true, currency: true },
    });
  }

  async updateBudgetLine(userId: number, id: number, data: any) {
    const line = await this.prisma.budgetLine.findUnique({
      where: { id },
      include: { Budget: { select: { yearId: true } } },
    });
    if (!line) throw new NotFoundException('Budget line not found');
    await this.governanceService.assertYearWritable(userId, 'budget_line', line.Budget.yearId);
    return this.prisma.budgetLine.update({ where: { id }, data: { ...data } });
  }

  async deleteBudgetLine(userId: number, id: number) {
    const line = await this.prisma.budgetLine.findUnique({
      where: { id },
      include: { Budget: { select: { yearId: true } } },
    });
    if (!line) throw new NotFoundException('Budget line not found');
    await this.governanceService.assertYearWritable(userId, 'budget_line', line.Budget.yearId);
    return this.prisma.budgetLine.delete({ where: { id } });
  }

  // ==================== FINANCE ENTRIES ====================

  async createFinanceEntry(userId: number, data: any) {
    const yearId = data.yearId ?? await this.getBudgetYearId(data.budgetId);
    await this.governanceService.assertYearWritable(userId, 'finance_entry', yearId);
    return this.prisma.financeEntry.create({
      data: {
        yearId,
        budgetId: data.budgetId,
        budgetLineId: data.budgetLineId,
        orgUnitId: data.orgUnitId,
        entryType: data.entryType,
        amount: data.amount,
        currencyId: data.currencyId ?? 1,
        description: data.description,
        transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
        status: data.status ?? 'draft',
        reference: data.reference,
      },
      include: { Budget: true, BudgetLine: true, currency: true },
    });
  }

  async findFinanceEntries(params: { yearId?: number; budgetId?: number; status?: string }) {
    const where: any = {};
    if (params.yearId) where.yearId = params.yearId;
    if (params.budgetId) where.budgetId = params.budgetId;
    if (params.status) where.status = params.status;
    return this.prisma.financeEntry.findMany({
      where,
      include: { Budget: true, BudgetLine: true, currency: true },
      orderBy: { transactionDate: 'desc' },
    });
  }

  async updateFinanceEntry(userId: number, id: number, data: any) {
    const entry = await this.prisma.financeEntry.findUnique({
      where: { id },
      select: { yearId: true },
    });
    if (!entry) throw new NotFoundException('Finance entry not found');
    await this.governanceService.assertYearWritable(userId, 'finance_entry', entry.yearId);
    return this.prisma.financeEntry.update({ where: { id }, data: { ...data } });
  }

  async deleteFinanceEntry(userId: number, id: number) {
    const entry = await this.prisma.financeEntry.findUnique({
      where: { id },
      select: { yearId: true },
    });
    if (!entry) throw new NotFoundException('Finance entry not found');
    await this.governanceService.assertYearWritable(userId, 'finance_entry', entry.yearId);
    return this.prisma.financeEntry.delete({ where: { id } });
  }

  async postFinanceEntry(userId: number, id: number) {
    const entry = await this.prisma.financeEntry.findUnique({
      where: { id },
      select: { yearId: true },
    });
    if (!entry) throw new NotFoundException('Finance entry not found');
    await this.governanceService.assertYearWritable(userId, 'finance_entry', entry.yearId);
    return this.prisma.financeEntry.update({ where: { id }, data: { status: 'posted' } });
  }

  // ==================== CALCULATIONS ====================

  async getBudgetVsActual(yearId: number) {
    const budgets = await this.prisma.budget.findMany({
      where: { yearId },
      include: { FinanceEntry: true },
    });

    let totalPlanned = 0;
    let totalRevised = 0;
    let totalActual = 0;

    for (const budget of budgets) {
      totalPlanned += Number(budget.plannedAmount || 0);
      totalRevised += Number(budget.revisedAmount || budget.plannedAmount || 0);
      totalActual += budget.FinanceEntry
        .filter(e => e.status === 'posted')
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    }

    return {
      summary: {
        totalPlanned,
        totalRevised,
        totalActual,
        variance: totalActual - totalRevised,
        utilizationRate: totalRevised > 0 ? (totalActual / totalRevised) * 100 : 0,
      },
    };
  }

  async getQuarterlyBudget(yearId: number) {
    const budgets = await this.prisma.budget.findMany({
      where: { yearId },
      include: { FinanceEntry: true },
    });

    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const result = [];

    for (let i = 0; i < quarters.length; i++) {
      const q = quarters[i];
      const quarterBudget = budgets[i % budgets.length];
      const planned = quarterBudget ? Number(quarterBudget.plannedAmount || 0) / 4 : 0;
      const revised = quarterBudget ? Number(quarterBudget.revisedAmount || quarterBudget.plannedAmount || 0) / 4 : 0;

      const entries = quarterBudget?.FinanceEntry.filter(e => e.status === 'posted') || [];
      const actual = entries.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      result.push({
        period: q,
        planned,
        revised,
        actual,
        variance: actual - revised,
        utilizationRate: revised > 0 ? (actual / revised) * 100 : 0,
      });
    }

    return result;
  }

  async getExpenseBreakdown(yearId: number) {
    const entries = await this.prisma.financeEntry.findMany({
      where: { yearId, status: 'posted' },
    });

    let opex = 0;
    let capex = 0;
    let other = 0;

    for (const entry of entries) {
      const amount = Number(entry.amount || 0);
      if (entry.entryType === 'opex' || entry.entryType === 'expense') {
        opex += amount;
      } else if (entry.entryType === 'capex' || entry.entryType === 'capital') {
        capex += amount;
      } else {
        other += amount;
      }
    }

    const total = opex + capex + other;

    return { opex, capex, other, total };
  }

  async getBudgetSummary(yearId: number) {
    const budgets = await this.prisma.budget.findMany({
      where: { yearId },
      include: { OrgUnit: true, FinanceEntry: true },
    });

    const byOrgUnit: Record<string, any> = {};
    const byCategory: Record<string, any> = {};

    for (const budget of budgets) {
      const orgName = budget.OrgUnit?.name || 'Unknown';
      const category = budget.category || 'General';

      if (!byOrgUnit[orgName]) {
        byOrgUnit[orgName] = { planned: 0, actual: 0, variance: 0 };
      }
      if (!byCategory[category]) {
        byCategory[category] = { planned: 0, actual: 0, variance: 0 };
      }

      const planned = Number(budget.plannedAmount || 0);
      const revised = Number(budget.revisedAmount || budget.plannedAmount || 0);
      const actual = budget.FinanceEntry
        .filter(e => e.status === 'posted')
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      byOrgUnit[orgName].planned += planned;
      byOrgUnit[orgName].actual += actual;
      byOrgUnit[orgName].variance += actual - revised;

      byCategory[category].planned += planned;
      byCategory[category].actual += actual;
      byCategory[category].variance += actual - revised;
    }

    return { byOrgUnit, byCategory, total: budgets.length };
  }
}
