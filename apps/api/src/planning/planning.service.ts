import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GovernanceService } from '../governance/governance.service';

@Injectable()
export class PlanningService {
  constructor(
    private prisma: PrismaService,
    private governanceService: GovernanceService,
  ) {}

  async assertYearWritableForResource(userId: number, resource: string, yearId: number) {
    await this.governanceService.assertYearWritable(userId, resource, yearId);
  }

  // ==================== PLANNING YEARS ====================

  async getPlanningYears() {
    return this.prisma.planningYear.findMany({
      orderBy: { year: 'desc' },
      include: { _count: { select: { Activity: true, Goal: true, Objective: true, Budget: true, Project: true } } },
    });
  }

  async getPlanningYearById(id: number) {
    return this.prisma.planningYear.findUnique({
      where: { id },
      include: { _count: { select: { Activity: true, Goal: true, Objective: true, Budget: true, Project: true } } },
    });
  }

  async createPlanningYear(data: { year: number; label: string; startDate?: string; endDate?: string }) {
    return this.prisma.planningYear.create({
      data: {
        year: data.year,
        label: data.label,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: 'draft',
      },
    });
  }

  async updatePlanningYear(id: number, data: any) {
    return this.prisma.planningYear.update({
      where: { id },
      data: { ...data, startDate: data.startDate ? new Date(data.startDate) : undefined, endDate: data.endDate ? new Date(data.endDate) : undefined },
    });
  }

  async deletePlanningYear(id: number) {
    return this.prisma.planningYear.delete({ where: { id } });
  }

  async getPlanningSummary(yearId: number) {
    const [year, activities, goals, objectives, budgets, projects] = await Promise.all([
      this.prisma.planningYear.findUnique({ where: { id: yearId } }),
      this.prisma.activity.findMany({ where: { yearId } }),
      this.prisma.goal.findMany({ where: { yearId } }),
      this.prisma.objective.findMany({ where: { yearId } }),
      this.prisma.budget.findMany({ where: { yearId } }),
      this.prisma.project.findMany({ where: { yearId } }),
    ]);
    return {
      year,
      activities: { total: activities.length, completed: activities.filter(a => a.implementationStatus === 'completed').length },
      goals: { total: goals.length },
      objectives: { total: objectives.length },
      budgets: { total: budgets.length, planned: budgets.reduce((s, b) => s + Number(b.plannedAmount), 0) },
      projects: { total: projects.length, completed: projects.filter(p => p.status === 'completed').length },
    };
  }

  async getYearlyCalendar(yearId: number) {
    const year = await this.prisma.planningYear.findUnique({ where: { id: yearId } });
    if (!year) return null;

    const [activities, milestones] = await Promise.all([
      this.prisma.activity.findMany({ where: { yearId }, select: { id: true, title: true, startDate: true, dueDate: true, implementationStatus: true } }),
      this.prisma.projectMilestone.findMany({
        where: { Project: { yearId } },
        select: { id: true, name: true, plannedDate: true, actualDate: true, status: true },
      }),
    ]);
    return { year, activities, milestones };
  }

  // ==================== PLANS (simplified - plans use the Plan model) ====================

  async getPlans(filters?: { yearId?: number }) {
    const where: any = {};
    if (filters?.yearId) where.yearId = filters.yearId;
    
    return this.prisma.plan.findMany({
      where,
      include: { PlanningYear: true },
      orderBy: { id: 'desc' },
    });
  }

  async getPlanById(id: number) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: { PlanningYear: true },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async createPlan(userId: number, data: { yearId: number; name: string; description?: string; planningType?: string }) {
    await this.assertYearWritableForResource(userId, 'plan', data.yearId);
    return this.prisma.plan.create({
      data: {
        yearId: data.yearId,
        name: data.name,
        description: data.description,
        planningType: data.planningType || 'annual',
        isCurrent: true,
        updatedAt: new Date(),
      },
      include: { PlanningYear: true },
    });
  }

  async updatePlan(userId: number, id: number, data: any) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    await this.assertYearWritableForResource(userId, 'plan', plan.yearId);
    
    return this.prisma.plan.update({
      where: { id },
      data: {
        name: data.name ?? plan.name,
        description: data.description ?? plan.description,
        updatedAt: new Date(),
      },
      include: { PlanningYear: true },
    });
  }

  async deletePlan(userId: number, id: number) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    await this.assertYearWritableForResource(userId, 'plan', plan.yearId);
    return this.prisma.plan.update({
      where: { id },
      data: { archivedAt: new Date(), updatedAt: new Date() },
    });
  }

  async transitionPlan(userId: number, id: number, action: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    await this.assertYearWritableForResource(userId, 'plan', plan.yearId);

    const stateTransitions: Record<string, Record<string, number>> = {
      '1': { submit: 2 },
      '2': { approve: 3, reject: 1 },
      '3': { activate: 4 },
      '4': { close: 5 },
    };

    const currentStateId = plan.workflowStateId;
    const nextStateId = stateTransitions[currentStateId]?.[action];
    
    if (!nextStateId) {
      throw new Error(`Invalid transition: ${action} from state ${currentStateId}`);
    }

    return this.prisma.plan.update({
      where: { id },
      data: { workflowStateId: nextStateId, updatedAt: new Date() },
      include: { PlanningYear: true },
    });
  }

  async getPlanTransitions(id: number) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');

    const stateTransitions: Record<string, { action: string; toState: string }[]> = {
      '1': [{ action: 'submit', toState: 'submitted' }],
      '2': [{ action: 'approve', toState: 'approved' }, { action: 'reject', toState: 'draft' }],
      '3': [{ action: 'activate', toState: 'active' }],
      '4': [{ action: 'close', toState: 'closed' }],
      '5': [],
    };

    return stateTransitions[plan.workflowStateId] || [];
  }

  async copyPlanToYear(userId: number, data: { sourcePlanId: number; targetYearId: number }) {
    const sourcePlan = await this.prisma.plan.findUnique({
      where: { id: data.sourcePlanId },
    });

    if (!sourcePlan) throw new NotFoundException('Source plan not found');

    await this.assertYearWritableForResource(userId, 'plan', data.targetYearId);

    const newPlan = await this.prisma.plan.create({
      data: {
        yearId: data.targetYearId,
        name: `${sourcePlan.name} (Copy)`,
        description: sourcePlan.description,
        planningType: sourcePlan.planningType,
        updatedAt: new Date(),
      },
    });

    return { planId: newPlan.id, goalsCopied: 0, objectivesCopied: 0 };
  }

  async closeYear(userId: number, yearId: number) {
    await this.assertYearWritableForResource(userId, 'planning_year', yearId);
    const year = await this.prisma.planningYear.findUnique({ where: { id: yearId } });
    if (!year) throw new NotFoundException('Planning year not found');
    if (year.status === 'closed' || year.status === 'archived') {
      throw new ForbiddenException(`Year is already ${year.status}`);
    }
    const updated = await this.prisma.planningYear.update({
      where: { id: yearId },
      data: { status: 'closed' },
    });
    await this.governanceService.logAudit({
      userId,
      action: 'CLOSE_YEAR',
      entity: 'PlanningYear',
      recordId: yearId,
      oldValue: { status: year.status },
      newValue: { status: 'closed' },
    });
    return updated;
  }

  async reopenYear(userId: number, yearId: number) {
    await this.assertYearWritableForResource(userId, 'planning_year', yearId);
    const year = await this.prisma.planningYear.findUnique({ where: { id: yearId } });
    if (!year) throw new NotFoundException('Planning year not found');
    if (year.status !== 'closed') {
      throw new ForbiddenException('Only closed years can be reopened');
    }
    const updated = await this.prisma.planningYear.update({
      where: { id: yearId },
      data: { status: 'active' },
    });
    await this.governanceService.logAudit({
      userId,
      action: 'REOPEN_YEAR',
      entity: 'PlanningYear',
      recordId: yearId,
      oldValue: { status: year.status },
      newValue: { status: 'active' },
    });
    return updated;
  }
}
