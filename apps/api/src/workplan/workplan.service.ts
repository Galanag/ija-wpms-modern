/**
 * WorkPlan Service - Annual Work Plan and Activity Management
 */

import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GovernanceService } from '../governance/governance.service';

export interface CreateWorkPlanDto {
  yearId: number;
  name: string;
  description?: string;
  orgUnitId?: number;
  ownerId?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface CreateActivityDto {
  workPlanId?: number;
  yearId: number;
  objectiveId?: number;
  projectId?: number;
  orgUnitId?: number;
  employeeId?: number;
  code?: string;
  title: string;
  description?: string;
  quarter?: string;
  startDate?: string;
  endDate?: string;
  plannedQuantity?: number;
  unit?: string;
  priority?: string;
  weight?: number;
  budget?: number;
  status?: string;
  progress?: number;
}

export interface CreateSubTaskDto {
  activityId: number;
  title: string;
  description?: string;
  employeeId?: number;
  startDate?: string;
  endDate?: string;
  progress?: number;
  status?: string;
}

export interface CreateDeliverableDto {
  activityId: number;
  title: string;
  description?: string;
  dueDate?: string;
  completedDate?: string;
  status?: string;
  evidence?: string;
}

export interface WorkPlanFilters {
  yearId?: number;
  orgUnitId?: number;
  status?: string;
  ownerId?: number;
}

export interface ActivityFilters {
  yearId?: number;
  workPlanId?: number;
  orgUnitId?: number;
  employeeId?: number;
  objectiveId?: number;
  status?: string;
  priority?: string;
  overdue?: boolean;
}

@Injectable()
export class WorkPlanService {
  constructor(private prisma: PrismaService, private governanceService: GovernanceService) {}

  // ==================== WORK PLAN CRUD ====================

  async createWorkPlan(userId: number, dto: CreateWorkPlanDto) {
    await this.governanceService.assertYearWritable(userId, 'work_plan', dto.yearId);
    return this.prisma.workPlan.create({
      data: {
        yearId: dto.yearId,
        name: dto.name,
        description: dto.description,
        orgUnitId: dto.orgUnitId,
        ownerId: dto.ownerId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: dto.status || 'draft',
        approvalStatus: 'draft',
      },
      include: {
        PlanningYear: true,
        OrgUnit: true,
        Activity: { include: { _count: { select: { SubTask: true, Deliverable: true } } } },
      },
    });
  }

  async findAllWorkPlans(filters: WorkPlanFilters) {
    return this.prisma.workPlan.findMany({
      where: {
        ...(filters.yearId && { yearId: filters.yearId }),
        ...(filters.orgUnitId && { orgUnitId: filters.orgUnitId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.ownerId && { ownerId: filters.ownerId }),
      },
      include: {
        PlanningYear: true,
        OrgUnit: true,
        Activity: {
          include: { _count: { select: { SubTask: true, Deliverable: true } } },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  async findWorkPlanById(id: number) {
    const workPlan = await this.prisma.workPlan.findUnique({
      where: { id },
      include: {
        PlanningYear: true,
        OrgUnit: true,
        Activity: {
          include: {
            SubTask: true,
            Deliverable: true,
            Objective: true,
          },
        },
      },
    });
    if (!workPlan) throw new NotFoundException('Work Plan not found');
    return workPlan;
  }

  async updateWorkPlan(userId: number, id: number, dto: Partial<CreateWorkPlanDto>) {
    const existing = await this.prisma.workPlan.findUnique({ where: { id }, select: { yearId: true } });
    if (!existing) throw new NotFoundException('Work Plan not found');
    await this.governanceService.assertYearWritable(userId, 'work_plan', existing.yearId);
    return this.prisma.workPlan.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: { PlanningYear: true, OrgUnit: true },
    });
  }

  async deleteWorkPlan(userId: number, id: number) {
    const existing = await this.prisma.workPlan.findUnique({ where: { id }, select: { yearId: true } });
    if (!existing) throw new NotFoundException('Work Plan not found');
    await this.governanceService.assertYearWritable(userId, 'work_plan', existing.yearId);
    return this.prisma.workPlan.delete({ where: { id } });
  }

  async submitWorkPlanForApproval(userId: number, id: number) {
    const existing = await this.prisma.workPlan.findUnique({ where: { id }, select: { yearId: true } });
    if (!existing) throw new NotFoundException('Work Plan not found');
    await this.governanceService.assertYearWritable(userId, 'work_plan', existing.yearId);
    return this.prisma.workPlan.update({
      where: { id },
      data: { approvalStatus: 'pending' },
    });
  }

  async approveWorkPlan(userId: number, id: number) {
    const existing = await this.prisma.workPlan.findUnique({ where: { id }, select: { yearId: true } });
    if (!existing) throw new NotFoundException('Work Plan not found');
    await this.governanceService.assertYearWritable(userId, 'work_plan', existing.yearId);
    return this.prisma.workPlan.update({
      where: { id },
      data: { approvalStatus: 'approved' },
    });
  }

  // ==================== ACTIVITY CRUD ====================

  async createActivity(userId: number, dto: CreateActivityDto) {
    await this.governanceService.assertYearWritable(userId, 'activity', dto.yearId);
    return this.prisma.activity.create({
      data: {
        yearId: dto.yearId,
        workPlanId: dto.workPlanId,
        objectiveId: dto.objectiveId,
        projectId: dto.projectId,
        orgUnitId: dto.orgUnitId,
        employeeId: dto.employeeId,
        code: dto.code,
        title: dto.title,
        description: dto.description,
        quarter: dto.quarter,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.endDate ? new Date(dto.endDate) : undefined,
        plannedQuantity: dto.plannedQuantity,
        unit: dto.unit,
        priority: dto.priority || 'medium',
        weight: dto.weight || 1,
        budget: dto.budget ? String(dto.budget) : '0',
        implementationStatus: dto.status || 'not_started',
        progress: dto.progress || 0,
      },
    });
  }

  async findAllActivities(filters: ActivityFilters) {
    const now = new Date();
    return this.prisma.activity.findMany({
      where: {
        ...(filters.yearId && { yearId: filters.yearId }),
        ...(filters.workPlanId && { workPlanId: filters.workPlanId }),
        ...(filters.orgUnitId && { orgUnitId: filters.orgUnitId }),
        ...(filters.employeeId && { employeeId: filters.employeeId }),
        ...(filters.objectiveId && { objectiveId: filters.objectiveId }),
        ...(filters.status && { implementationStatus: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.overdue && {
          dueDate: { lt: now },
          implementationStatus: { notIn: ['completed', 'cancelled'] },
        }),
      },
      include: {
        WorkPlan: true,
        Objective: true,
        OrgUnit_Activity_orgUnitIdToOrgUnit: true,
        Employee: true,
        SubTask: true,
        Deliverable: true,
        _count: { select: { SubTask: true, Deliverable: true } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });
  }

  async findActivityById(id: number) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        WorkPlan: true,
        Objective: true,
        OrgUnit_Activity_orgUnitIdToOrgUnit: true,
        Employee: true,
        SubTask: true,
        Deliverable: true,
        TaskUpdate: { orderBy: { updateDate: 'desc' }, take: 10 },
      },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async updateActivity(userId: number, id: number, dto: Partial<CreateActivityDto>) {
    const existing = await this.prisma.activity.findUnique({ where: { id }, select: { yearId: true } });
    if (!existing) throw new NotFoundException('Activity not found');
    await this.governanceService.assertYearWritable(userId, 'activity', existing.yearId);
    return this.prisma.activity.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.endDate ? new Date(dto.endDate) : undefined,
        budget: dto.budget ? String(dto.budget) : undefined,
      },
      include: {
        WorkPlan: true,
        Objective: true,
        OrgUnit_Activity_orgUnitIdToOrgUnit: true,
        Employee: true,
      },
    });
  }

  async deleteActivity(userId: number, id: number) {
    const existing = await this.prisma.activity.findUnique({ where: { id }, select: { yearId: true } });
    if (!existing) throw new NotFoundException('Activity not found');
    await this.governanceService.assertYearWritable(userId, 'activity', existing.yearId);
    return this.prisma.activity.delete({ where: { id } });
  }

  async updateActivityProgress(userId: number, id: number, progress: number, note?: string, evidence?: string, submittedBy?: number) {
    const existing = await this.prisma.activity.findUnique({ where: { id }, select: { yearId: true } });
    if (!existing) throw new NotFoundException('Activity not found');
    await this.governanceService.assertYearWritable(userId, 'activity', existing.yearId);
    const activity = await this.prisma.activity.update({
      where: { id },
      data: {
        progress,
        implementationStatus: progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started',
        completedDate: progress >= 100 ? new Date() : undefined,
      },
    });

    await this.prisma.taskUpdate.create({
      data: {
        activityId: id,
        updateDate: new Date(),
        progress,
        note,
        evidence,
        submittedBy,
      },
    });

    return activity;
  }

  async bulkUpdateActivities(userId: number, ids: number[], dto: { status?: string; orgUnitId?: number; employeeId?: number }) {
    const existingActivities = await this.prisma.activity.findMany({
      where: { id: { in: ids } },
      select: { id: true, yearId: true },
    });
    for (const activity of existingActivities) {
      await this.governanceService.assertYearWritable(userId, 'activity', activity.yearId);
    }
    return this.prisma.activity.updateMany({
      where: { id: { in: ids } },
      data: {
        ...(dto.status && { implementationStatus: dto.status }),
        ...(dto.orgUnitId && { orgUnitId: dto.orgUnitId }),
        ...(dto.employeeId && { employeeId: dto.employeeId }),
      },
    });
  }

  // ==================== ACTIVITY APPROVAL WORKFLOW ====================

  async submitActivityForApproval(userId: number, id: number) {
    const existing = await this.prisma.activity.findUnique({ where: { id }, select: { yearId: true, approvalStatus: true } });
    if (!existing) throw new NotFoundException('Activity not found');
    await this.governanceService.assertYearWritable(userId, 'activity', existing.yearId);
    if (existing.approvalStatus === 'approved') {
      throw new BadRequestException('Cannot submit an already approved activity');
    }
    const activity = await this.prisma.activity.update({
      where: { id },
      data: { approvalStatus: 'submitted' },
      include: {
        WorkPlan: true,
        Objective: true,
        OrgUnit_Activity_orgUnitIdToOrgUnit: true,
        Employee: true,
      },
    });
    
    await this.governanceService.logAudit({
      userId,
      action: 'SUBMIT',
      entity: 'Activity',
      recordId: id,
      oldValue: { approvalStatus: existing.approvalStatus },
      newValue: { approvalStatus: 'submitted' },
    });
    
    return activity;
  }

  async approveActivity(userId: number, id: number) {
    const existing = await this.prisma.activity.findUnique({ where: { id }, select: { yearId: true, approvalStatus: true } });
    if (!existing) throw new NotFoundException('Activity not found');
    await this.governanceService.assertYearWritable(userId, 'activity', existing.yearId);
    
    // Check separation of duties - approver cannot be the submitter
    const canApprove = await this.governanceService.checkSeparationOfDuties(userId, 'activity', id);
    if (!canApprove) {
      throw new ForbiddenException('Cannot approve your own submission (separation of duties)');
    }
    
    const activity = await this.prisma.activity.update({
      where: { id },
      data: { approvalStatus: 'approved' },
      include: {
        WorkPlan: true,
        Objective: true,
        OrgUnit_Activity_orgUnitIdToOrgUnit: true,
        Employee: true,
      },
    });
    
    await this.governanceService.logAudit({
      userId,
      action: 'APPROVE',
      entity: 'Activity',
      recordId: id,
      oldValue: { approvalStatus: existing.approvalStatus },
      newValue: { approvalStatus: 'approved' },
    });
    
    return activity;
  }

  async rejectActivity(userId: number, id: number, comments?: string) {
    const existing = await this.prisma.activity.findUnique({ where: { id }, select: { yearId: true, approvalStatus: true } });
    if (!existing) throw new NotFoundException('Activity not found');
    await this.governanceService.assertYearWritable(userId, 'activity', existing.yearId);
    
    // Check separation of duties
    const canApprove = await this.governanceService.checkSeparationOfDuties(userId, 'activity', id);
    if (!canApprove) {
      throw new ForbiddenException('Cannot reject your own submission (separation of duties)');
    }
    
    const activity = await this.prisma.activity.update({
      where: { id },
      data: { approvalStatus: 'rejected' },
      include: {
        WorkPlan: true,
        Objective: true,
        OrgUnit_Activity_orgUnitIdToOrgUnit: true,
        Employee: true,
      },
    });
    
    // Log audit
    await this.governanceService.logAudit({
      userId,
      action: 'REJECT',
      entity: 'Activity',
      recordId: id,
      oldValue: { approvalStatus: existing.approvalStatus },
      newValue: { approvalStatus: 'rejected', comments },
    });
    
    return activity;
  }

  async resubmitActivity(userId: number, id: number) {
    const existing = await this.prisma.activity.findUnique({ where: { id }, select: { yearId: true, approvalStatus: true } });
    if (!existing) throw new NotFoundException('Activity not found');
    await this.governanceService.assertYearWritable(userId, 'activity', existing.yearId);
    if (existing.approvalStatus !== 'rejected') {
      throw new BadRequestException('Can only resubmit rejected activities');
    }
    const activity = await this.prisma.activity.update({
      where: { id },
      data: { approvalStatus: 'submitted' },
      include: {
        WorkPlan: true,
        Objective: true,
        OrgUnit_Activity_orgUnitIdToOrgUnit: true,
        Employee: true,
      },
    });
    
    await this.governanceService.logAudit({
      userId,
      action: 'RESUBMIT',
      entity: 'Activity',
      recordId: id,
      oldValue: { approvalStatus: existing.approvalStatus },
      newValue: { approvalStatus: 'submitted' },
    });
    
    return activity;
  }

  // ==================== SUBTASK CRUD ====================

  async createSubTask(userId: number, dto: CreateSubTaskDto) {
    const parentActivity = await this.prisma.activity.findUnique({
      where: { id: dto.activityId },
      select: { yearId: true },
    });
    if (!parentActivity) throw new NotFoundException('Parent activity not found');
    await this.governanceService.assertYearWritable(userId, 'subtask', parentActivity.yearId);
    return this.prisma.subTask.create({
      data: {
        activityId: dto.activityId,
        title: dto.title,
        description: dto.description,
        employeeId: dto.employeeId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        progress: dto.progress || 0,
        status: dto.status || 'pending',
      },
      include: { Employee: true },
    });
  }

  async findSubTasksByActivity(activityId: number) {
    return this.prisma.subTask.findMany({
      where: { activityId },
      include: { Employee: true },
    });
  }

  async updateSubTask(userId: number, id: number, dto: Partial<CreateSubTaskDto>) {
    const existing = await this.prisma.subTask.findUnique({
      where: { id },
      include: { Activity: { select: { yearId: true } } },
    });
    if (!existing) throw new NotFoundException('SubTask not found');
    const yearId = (existing as any).Activity?.yearId ?? (existing as any).yearId;
    await this.governanceService.assertYearWritable(userId, 'subtask', yearId);
    return this.prisma.subTask.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: { Employee: true },
    });
  }

  async deleteSubTask(userId: number, id: number) {
    const existing = await this.prisma.subTask.findUnique({
      where: { id },
      include: { Activity: { select: { yearId: true } } },
    });
    if (!existing) throw new NotFoundException('SubTask not found');
    const yearId = (existing as any).Activity?.yearId ?? (existing as any).yearId;
    await this.governanceService.assertYearWritable(userId, 'subtask', yearId);
    return this.prisma.subTask.delete({ where: { id } });
  }

  async updateSubTaskProgress(userId: number, id: number, progress: number) {
    const existing = await this.prisma.subTask.findUnique({
      where: { id },
      include: { Activity: { select: { yearId: true } } },
    });
    if (!existing) throw new NotFoundException('SubTask not found');
    const yearId = (existing as any).Activity?.yearId ?? (existing as any).yearId;
    await this.governanceService.assertYearWritable(userId, 'subtask', yearId);
    return this.prisma.subTask.update({
      where: { id },
      data: {
        progress,
        status: progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending',
      },
    });
  }

  // ==================== DELIVERABLE CRUD ====================

  async createDeliverable(userId: number, dto: CreateDeliverableDto) {
    const parentActivity = await this.prisma.activity.findUnique({
      where: { id: dto.activityId },
      select: { yearId: true },
    });
    if (!parentActivity) throw new NotFoundException('Parent activity not found');
    await this.governanceService.assertYearWritable(userId, 'deliverable', parentActivity.yearId);
    return this.prisma.deliverable.create({
      data: {
        activityId: dto.activityId,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        completedDate: dto.completedDate ? new Date(dto.completedDate) : undefined,
        status: dto.status || 'pending',
        evidence: dto.evidence,
      },
    });
  }

  async findDeliverablesByActivity(activityId: number) {
    return this.prisma.deliverable.findMany({
      where: { activityId },
      orderBy: { dueDate: 'asc' },
    });
  }

  async updateDeliverable(userId: number, id: number, dto: Partial<CreateDeliverableDto>) {
    const existing = await this.prisma.deliverable.findUnique({
      where: { id },
      include: { Activity: { select: { yearId: true } } },
    });
    if (!existing) throw new NotFoundException('Deliverable not found');
    const yearId = existing.Activity?.yearId;
    if (yearId) await this.governanceService.assertYearWritable(userId, 'deliverable', yearId);
    return this.prisma.deliverable.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        completedDate: dto.completedDate ? new Date(dto.completedDate) : undefined,
      },
    });
  }

  async deleteDeliverable(userId: number, id: number) {
    const existing = await this.prisma.deliverable.findUnique({
      where: { id },
      include: { Activity: { select: { yearId: true } } },
    });
    if (!existing) throw new NotFoundException('Deliverable not found');
    const yearId = existing.Activity?.yearId;
    if (yearId) await this.governanceService.assertYearWritable(userId, 'deliverable', yearId);
    return this.prisma.deliverable.delete({ where: { id } });
  }

  async completeDeliverable(userId: number, id: number, evidence?: string) {
    const existing = await this.prisma.deliverable.findUnique({
      where: { id },
      include: { Activity: { select: { yearId: true } } },
    });
    if (!existing) throw new NotFoundException('Deliverable not found');
    const yearId = existing.Activity?.yearId;
    if (yearId) await this.governanceService.assertYearWritable(userId, 'deliverable', yearId);
    return this.prisma.deliverable.update({
      where: { id },
      data: {
        status: 'completed',
        completedDate: new Date(),
        evidence,
      },
    });
  }

  // ==================== QUARTERLY SCHEDULE ====================

  async getQuarterlySchedule(yearId: number, orgUnitId?: number) {
    const activities = await this.prisma.activity.findMany({
      where: {
        yearId,
        ...(orgUnitId && { orgUnitId }),
      },
      include: {
        WorkPlan: true,
        OrgUnit_Activity_orgUnitIdToOrgUnit: true,
        Employee: true,
        _count: { select: { SubTask: true, Deliverable: true } },
      },
      orderBy: [{ quarter: 'asc' }, { startDate: 'asc' }],
    });

    const schedule: Record<string, any[]> = {
      Q1: [],
      Q2: [],
      Q3: [],
      Q4: [],
      unscheduled: [],
    };

    for (const activity of activities) {
      const quarter = activity.quarter || 'unscheduled';
      const bucket = schedule[quarter];
      if (bucket) {
        bucket.push(activity);
      } else {
        (schedule.unscheduled as any[]).push(activity);
      }
    }

    return schedule;
  }

  // ==================== GANTT DATA ====================

  async getGanttData(yearId: number, orgUnitId?: number) {
    return this.prisma.activity.findMany({
      where: {
        yearId,
        ...(orgUnitId && { orgUnitId }),
        startDate: { not: null },
        dueDate: { not: null },
      },
      include: {
        WorkPlan: true,
        OrgUnit_Activity_orgUnitIdToOrgUnit: true,
        Employee: true,
        SubTask: { where: { status: { not: 'completed' } } },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  // ==================== STATISTICS ====================

  async getWorkPlanStatistics(yearId: number, orgUnitId?: number) {
    const activities = await this.prisma.activity.findMany({
      where: {
        yearId,
        ...(orgUnitId && { orgUnitId }),
      },
    });

    const stats = {
      total: activities.length,
      notStarted: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      overdue: 0,
      totalBudget: 0,
      totalProgress: 0,
    };

    const now = new Date();

    for (const activity of activities) {
      const budget = parseFloat(String(activity.budget || 0));
      stats.totalBudget += budget;
      stats.totalProgress += activity.progress || 0;

      switch (activity.implementationStatus) {
        case 'not_started': stats.notStarted++; break;
        case 'in_progress': stats.inProgress++; break;
        case 'completed': stats.completed++; break;
        case 'cancelled': stats.cancelled++; break;
      }

      if (activity.dueDate && activity.dueDate < now && activity.implementationStatus !== 'completed') {
        stats.overdue++;
      }
    }

    return {
      ...stats,
      averageProgress: stats.total > 0 ? Math.round(stats.totalProgress / stats.total * 100) / 100 : 0,
      completionRate: stats.total > 0 ? Math.round(stats.completed / stats.total * 10000) / 100 : 0,
    };
  }

  // ==================== COPY TO YEAR ====================

  async copyWorkPlanToYear(userId: number, sourceYearId: number, targetYearId: number, copyProgress: boolean = false) {
    await this.governanceService.assertYearWritable(userId, 'work_plan', targetYearId);
    const sourceWorkPlans = await this.findAllWorkPlans({ yearId: sourceYearId });
    const results = [];

    for (const workPlan of sourceWorkPlans) {
      const newWorkPlan = await this.prisma.workPlan.create({
        data: {
          yearId: targetYearId,
          name: workPlan.name,
          description: workPlan.description,
          orgUnitId: workPlan.orgUnitId,
          status: 'draft',
          approvalStatus: 'draft',
        },
      });

      for (const activity of workPlan.Activity || []) {
        await this.governanceService.assertYearWritable(userId, 'activity', targetYearId);
        await this.prisma.activity.create({
          data: {
            workPlanId: newWorkPlan.id,
            yearId: targetYearId,
            objectiveId: activity.objectiveId,
            projectId: activity.projectId,
            orgUnitId: activity.orgUnitId,
            employeeId: activity.employeeId,
            code: activity.code,
            title: activity.title,
            description: activity.description,
            quarter: activity.quarter,
            startDate: activity.startDate,
            dueDate: activity.dueDate,
            plannedQuantity: activity.plannedQuantity,
            unit: activity.unit,
            priority: activity.priority,
            weight: activity.weight,
            budget: activity.budget,
            implementationStatus: copyProgress ? activity.implementationStatus : 'not_started',
            progress: copyProgress ? activity.progress : 0,
          },
        });
      }

      results.push({
        workPlanId: workPlan.id,
        newWorkPlanId: newWorkPlan.id,
        activitiesCopied: workPlan.Activity?.length || 0,
      });
    }

    return {
      sourceYearId,
      targetYearId,
      workPlansCopied: results.length,
      results,
    };
  }

  // ==================== OVERDUE DETECTION ====================

  async getOverdueActivities(yearId: number, orgUnitId?: number) {
    const now = new Date();
    return this.prisma.activity.findMany({
      where: {
        yearId,
        ...(orgUnitId && { orgUnitId }),
        dueDate: { lt: now },
        implementationStatus: { notIn: ['completed', 'cancelled'] },
      },
      include: {
        WorkPlan: true,
        OrgUnit_Activity_orgUnitIdToOrgUnit: true,
        Employee: true,
        SubTask: true,
        Deliverable: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}
