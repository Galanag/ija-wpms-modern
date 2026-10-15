import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KpiService {
  constructor(private prisma: PrismaService) {}

  // ==================== KPI DEFINITION CRUD ====================

  async createKpi(data: any) {
    return this.prisma.kpi.create({
      data: {
        code: data.code,
        name: data.name,
        area: data.area,
        definition: data.definition,
        formula: data.formula,
        unit: data.unit,
        frequency: data.frequency || 'quarterly',
        direction: data.direction || 'higher_is_better',
        categoryId: data.categoryId,
        active: true,
      },
      include: { KpiCategory: true },
    });
  }

  async findAllKpis(filters?: { categoryId?: number; active?: boolean }) {
    const where: any = {};
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.active !== undefined) where.active = filters.active;
    return this.prisma.kpi.findMany({
      where,
      include: { KpiCategory: true, KpiPlan: { take: 1, orderBy: { yearId: 'desc' } } },
      orderBy: { code: 'asc' },
    });
  }

  async findKpiById(id: number) {
    const kpi = await this.prisma.kpi.findUnique({
      where: { id },
      include: { KpiCategory: true, KpiPlan: { include: { PlanningYear: true, OrgUnit: true, Objective: true, KpiActual: true }, orderBy: { yearId: 'desc' } } },
    });
    if (!kpi) throw new NotFoundException('KPI not found');
    return kpi;
  }

  async updateKpi(id: number, data: any) {
    return this.prisma.kpi.update({ where: { id }, data: { ...data } });
  }

  async deleteKpi(id: number) {
    return this.prisma.kpi.update({ where: { id }, data: { active: false } });
  }

  // ==================== KPI CATEGORY CRUD ====================

  async createCategory(data: { name: string; description?: string }) {
    return this.prisma.kpiCategory.create({ data: { name: data.name, description: data.description, active: true } });
  }

  async findAllCategories() {
    return this.prisma.kpiCategory.findMany({
      where: { active: true },
      include: { _count: { select: { Kpi: true } } },
      orderBy: { name: 'asc' },
    });
  }

  // ==================== KPI PLAN (TARGET) CRUD ====================

  async createKpiPlan(data: any) {
    const existing = await this.prisma.kpiPlan.findFirst({
      where: { yearId: data.yearId, kpiId: data.kpiId, orgUnitId: data.orgUnitId },
    });
    if (existing) throw new BadRequestException('KPI Plan already exists for this combination');

    return this.prisma.kpiPlan.create({
      data: {
        yearId: data.yearId,
        kpiId: data.kpiId,
        objectiveId: data.objectiveId,
        orgUnitId: data.orgUnitId,
        ownerEmployeeId: data.ownerEmployeeId,
        baselineValue: data.baselineValue,
        annualTarget: data.annualTarget,
        q1Target: data.q1Target,
        q2Target: data.q2Target,
        q3Target: data.q3Target,
        q4Target: data.q4Target,
        weight: data.weight ?? 1,
        approvalStatus: 'draft',
      },
      include: { Kpi: true, PlanningYear: true, KpiActual: true },
    });
  }

  async findKpiPlans(filters?: { yearId?: number; kpiId?: number; orgUnitId?: number; objectiveId?: number }) {
    const where: any = {};
    if (filters?.yearId) where.yearId = filters.yearId;
    if (filters?.kpiId) where.kpiId = filters.kpiId;
    if (filters?.orgUnitId) where.orgUnitId = filters.orgUnitId;
    if (filters?.objectiveId) where.objectiveId = filters.objectiveId;
    return this.prisma.kpiPlan.findMany({
      where,
      include: { Kpi: { include: { KpiCategory: true } }, PlanningYear: true, OrgUnit: true, Objective: true, KpiActual: true },
      orderBy: { id: 'desc' },
    });
  }

  async findKpiPlanById(id: number) {
    const plan = await this.prisma.kpiPlan.findUnique({
      where: { id },
      include: { Kpi: { include: { KpiCategory: true } }, PlanningYear: true, OrgUnit: true, Objective: true, KpiActual: { orderBy: { periodKey: 'asc' } } },
    });
    if (!plan) throw new NotFoundException('KPI Plan not found');
    return plan;
  }

  async updateKpiPlan(id: number, data: any) {
    return this.prisma.kpiPlan.update({ where: { id }, data: { ...data }, include: { Kpi: true, KpiActual: true } });
  }

  async deleteKpiPlan(id: number) {
    const plan = await this.prisma.kpiPlan.findUnique({ where: { id }, include: { KpiActual: true } });
    if (!plan) throw new NotFoundException('KPI Plan not found');
    if (plan.KpiActual.length > 0) throw new BadRequestException('Cannot delete KPI Plan with actuals');
    return this.prisma.kpiPlan.delete({ where: { id } });
  }

  async submitKpiPlanForApproval(id: number) {
    return this.prisma.kpiPlan.update({ where: { id }, data: { approvalStatus: 'pending' } });
  }

  async approveKpiPlan(id: number) {
    return this.prisma.kpiPlan.update({ where: { id }, data: { approvalStatus: 'approved' } });
  }

  // ==================== KPI ACTUAL CRUD ====================

  async createKpiActual(data: any) {
    const existing = await this.prisma.kpiActual.findUnique({
      where: { kpiPlanId_periodType_periodKey: { kpiPlanId: data.kpiPlanId, periodType: data.periodType, periodKey: data.periodKey } },
    });
    if (existing) throw new BadRequestException(`Actual already exists for ${data.periodType}:${data.periodKey}`);

    return this.prisma.kpiActual.create({
      data: {
        kpiPlanId: data.kpiPlanId,
        periodType: data.periodType,
        periodKey: data.periodKey,
        actualValue: data.actualValue,
        comment: data.comment,
        evidence: data.evidence,
        submittedBy: data.submittedBy,
        approvalStatus: 'submitted',
      },
      include: { KpiPlan: { include: { Kpi: true } } },
    });
  }

  async findKpiActuals(kpiPlanId: number) {
    return this.prisma.kpiActual.findMany({ where: { kpiPlanId }, orderBy: [{ periodType: 'asc' }, { periodKey: 'asc' }] });
  }

  async updateKpiActual(id: number, data: { actualValue?: number; comment?: string; evidence?: string }) {
    const existing = await this.prisma.kpiActual.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('KPI Actual not found');
    if (existing.approvalStatus === 'verified') throw new BadRequestException('Verified actuals cannot be modified');
    return this.prisma.kpiActual.update({ where: { id }, data });
  }

  async verifyKpiActual(id: number, userId: number) {
    return this.prisma.kpiActual.update({ where: { id }, data: { approvalStatus: 'verified', verifiedBy: userId, verifiedAt: new Date() } });
  }

  async deleteKpiActual(id: number) {
    const existing = await this.prisma.kpiActual.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('KPI Actual not found');
    if (existing.approvalStatus === 'verified') throw new BadRequestException('Verified actuals cannot be deleted');
    return this.prisma.kpiActual.delete({ where: { id } });
  }

  // ==================== DASHBOARD & ANALYTICS ====================

  async getDashboardMetrics(filters?: { yearId?: number; orgUnitId?: number }) {
    const where: any = {};
    if (filters?.yearId) where.yearId = filters.yearId;
    if (filters?.orgUnitId) where.orgUnitId = filters.orgUnitId;

    const plans = await this.prisma.kpiPlan.findMany({
      where,
      include: { Kpi: true, KpiActual: true },
    });

    let totalTarget = 0;
    let totalActual = 0;
    let totalWeight = 0;
    let onTrack = 0;
    let atRisk = 0;
    let belowTarget = 0;

    for (const plan of plans) {
      const target = plan.annualTarget || 0;
      const actual = plan.KpiActual.reduce((sum, a) => sum + Number(a.actualValue || 0), 0);
      const weight = plan.weight || 1;

      totalTarget += target * weight;
      totalActual += actual * weight;
      totalWeight += weight;

      const achievement = target > 0 ? (actual / target) * 100 : 0;
      if (achievement >= 80) onTrack++;
      else if (achievement >= 50) atRisk++;
      else belowTarget++;
    }

    return {
      totalTarget: totalTarget / (totalWeight || 1),
      totalActual: totalActual / (totalWeight || 1),
      weightedAchievement: totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0,
      count: plans.length,
      onTrack,
      atRisk,
      belowTarget,
    };
  }

  async getDashboardStatus(filters?: { yearId?: number }) {
    const where: any = {};
    if (filters?.yearId) where.yearId = filters.yearId;

    const plans = await this.prisma.kpiPlan.findMany({
      where,
      select: { approvalStatus: true },
    });

    const statusCounts = plans.reduce((acc, p) => {
      acc[p.approvalStatus] = (acc[p.approvalStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return statusCounts;
  }

  async getKpiMetrics(planId: number) {
    const plan = await this.prisma.kpiPlan.findUnique({
      where: { id: planId },
      include: { Kpi: true, KpiActual: true },
    });

    if (!plan) throw new NotFoundException('KPI Plan not found');

    const target = plan.annualTarget || 0;
    const actual = plan.KpiActual.reduce((sum, a) => sum + Number(a.actualValue || 0), 0);
    const achievementPercentage = target > 0 ? (actual / target) * 100 : null;
    const variance = target > 0 ? actual - target : null;

    return {
      target,
      actual,
      achievementPercentage,
      variance,
      status: achievementPercentage !== null 
        ? (achievementPercentage >= 80 ? 'on_track' : achievementPercentage >= 50 ? 'at_risk' : 'below_target')
        : 'no_data',
      trend: 'stable',
    };
  }

  async getKpiTrend(planId: number) {
    const actuals = await this.prisma.kpiActual.findMany({
      where: { kpiPlanId: planId },
      orderBy: [{ periodType: 'asc' }, { periodKey: 'asc' }],
    });

    return actuals.map(a => ({
      period: `${a.periodType}:${a.periodKey}`,
      value: a.actualValue,
      date: a.submittedAt,
    }));
  }

  async compareYears(kpiId: number, yearIds: number[]) {
    const plans = await this.prisma.kpiPlan.findMany({
      where: { kpiId, yearId: { in: yearIds } },
      include: { KpiActual: true, PlanningYear: true },
    });

    return plans.map(plan => ({
      year: plan.PlanningYear.year,
      yearId: plan.yearId,
      target: plan.annualTarget,
      actual: plan.KpiActual.reduce((sum, a) => sum + Number(a.actualValue || 0), 0),
      achievement: Number(plan.annualTarget || 0) > 0 
        ? (plan.KpiActual.reduce((sum, a) => sum + Number(a.actualValue || 0), 0) / Number(plan.annualTarget || 0)) * 100 
        : 0,
    }));
  }

  async copyPlansToYear(sourceYearId: number, targetYearId: number) {
    const sourcePlans = await this.prisma.kpiPlan.findMany({
      where: { yearId: sourceYearId },
    });

    const results = [];
    for (const plan of sourcePlans) {
      const newPlan = await this.prisma.kpiPlan.create({
        data: {
          yearId: targetYearId,
          kpiId: plan.kpiId,
          objectiveId: plan.objectiveId,
          orgUnitId: plan.orgUnitId,
          ownerEmployeeId: plan.ownerEmployeeId,
          baselineValue: plan.baselineValue,
          annualTarget: plan.annualTarget,
          q1Target: plan.q1Target,
          q2Target: plan.q2Target,
          q3Target: plan.q3Target,
          q4Target: plan.q4Target,
          weight: plan.weight,
          approvalStatus: 'draft',
        },
      });
      results.push({ originalId: plan.id, newId: newPlan.id });
    }

    return { copied: results.length, plans: results };
  }
}
