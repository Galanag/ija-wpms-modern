import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GovernanceService } from '../governance/governance.service';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService, private governanceService: GovernanceService) {}

  async create(data: any, userId?: number) {
    if (data.yearId) {
      await this.governanceService.assertYearWritable(userId!, 'project', data.yearId);
    }
    return this.prisma.project.create({
      data: {
        yearId: data.yearId,
        projectTemplateId: data.projectTemplateId,
        code: data.code,
        name: data.name,
        location: data.location,
        description: data.description,
        orgUnitId: data.orgUnitId,
        managerEmployeeId: data.managerEmployeeId,
        plannedBudget: data.plannedBudget,
        actualSpend: data.actualSpend,
        physicalProgress: data.physicalProgress ?? 0,
        financialProgress: data.financialProgress ?? 0,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status ?? 'planned',
        approvalStatus: 'draft',
      },
      include: { OrgUnit: true, Employee: true, ProjectTemplate: true, PlanningYear: true, ProjectMilestone: true },
    });
  }

  async findAll(params: { skip?: number; take?: number; yearId?: number; orgUnitId?: number; status?: string; search?: string }) {
    const { skip = 0, take = 100, yearId, orgUnitId, status, search } = params;
    const where: any = {};
    if (yearId) where.yearId = yearId;
    if (orgUnitId) where.orgUnitId = orgUnitId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where, skip, take,
        orderBy: { id: 'desc' },
        include: { OrgUnit: true, Employee: true, PlanningYear: true, ProjectMilestone: true, _count: { select: { Activity: true } } },
      }),
      this.prisma.project.count({ where }),
    ]);
    return { projects, total, skip, take };
  }

  async findOne(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { OrgUnit: true, Employee: true, ProjectTemplate: true, PlanningYear: true, ProjectMilestone: { orderBy: { plannedDate: 'asc' } }, Activity: true },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async update(id: number, data: any, userId?: number) {
    const existing = await this.prisma.project.findUnique({ where: { id }, select: { yearId: true } });
    if (existing) {
      await this.governanceService.assertYearWritable(userId!, 'project', existing.yearId);
    }
    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    return this.prisma.project.update({ where: { id }, data: updateData, include: { OrgUnit: true } });
  }

  async delete(id: number, userId?: number) {
    const existing = await this.prisma.project.findUnique({ where: { id }, select: { yearId: true } });
    if (existing) {
      await this.governanceService.assertYearWritable(userId!, 'project', existing.yearId);
    }
    return this.prisma.project.delete({ where: { id } });
  }

  async getSummary(yearId?: number, orgUnitId?: number) {
    const where: any = {};
    if (yearId) where.yearId = yearId;
    if (orgUnitId) where.orgUnitId = orgUnitId;
    
    const projects = await this.prisma.project.findMany({
      where,
      select: {
        id: true,
        status: true,
        plannedBudget: true,
        actualSpend: true,
        physicalProgress: true,
        financialProgress: true,
      },
    });

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'in_progress').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const totalBudget = projects.reduce((s, p) => s + Number(p.plannedBudget || 0), 0);
    const totalSpend = projects.reduce((s, p) => s + Number(p.actualSpend || 0), 0);
    const avgCompletion = totalProjects 
      ? projects.reduce((s, p) => s + (p.physicalProgress || 0), 0) / totalProjects 
      : 0;
    const budgetUtilization = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;

    // Count by status
    const byStatus: Record<string, number> = {};
    projects.forEach(p => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    });

    // Count high risks per project
    const highRisks = await this.prisma.risk.count({
      where: { ...where, level: { in: ['high', 'critical'] } },
    });

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalBudget,
      totalSpend,
      budgetUtilization,
      avgCompletion,
      byStatus,
      highRisks,
    };
  }

  async createMilestone(data: any, userId?: number) {
    const project = await this.prisma.project.findUnique({ where: { id: data.projectId }, select: { yearId: true } });
    if (project) {
      await this.governanceService.assertYearWritable(userId!, 'milestone', project.yearId);
    }
    return this.prisma.projectMilestone.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        plannedDate: data.plannedDate ? new Date(data.plannedDate) : undefined,
        actualDate: data.actualDate ? new Date(data.actualDate) : undefined,
        status: data.status ?? 'pending',
      },
    });
  }

  async findMilestones(projectId: number) {
    return this.prisma.projectMilestone.findMany({
      where: { projectId },
      orderBy: { plannedDate: 'asc' },
    });
  }

  async updateMilestone(id: number, data: any, userId?: number) {
    const milestone = await this.prisma.projectMilestone.findUnique({ where: { id }, select: { projectId: true } });
    if (milestone) {
      const project = await this.prisma.project.findUnique({ where: { id: milestone.projectId }, select: { yearId: true } });
      if (project) {
        await this.governanceService.assertYearWritable(userId!, 'milestone', project.yearId);
      }
    }
    return this.prisma.projectMilestone.update({ where: { id }, data: { ...data } });
  }

  async deleteMilestone(id: number, userId?: number) {
    const milestone = await this.prisma.projectMilestone.findUnique({ where: { id }, select: { projectId: true } });
    if (milestone) {
      const project = await this.prisma.project.findUnique({ where: { id: milestone.projectId }, select: { yearId: true } });
      if (project) {
        await this.governanceService.assertYearWritable(userId!, 'milestone', project.yearId);
      }
    }
    return this.prisma.projectMilestone.delete({ where: { id } });
  }
}
