import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GovernanceService } from '../governance/governance.service';

@Injectable()
export class MonitoringService {
  constructor(private prisma: PrismaService, private governanceService: GovernanceService) {}

  async createPeriodDefinition(userId: number, data: any) {
    await this.governanceService.assertYearWritable(userId, 'period', data.yearId);
    return this.prisma.periodDefinition.create({
      data: {
        yearId: data.yearId,
        periodType: data.periodType,
        periodKey: data.periodKey,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        label: data.label,
        active: data.active ?? true,
      },
      include: { PlanningYear: true },
    });
  }

  async findAllPeriodDefinitions(params: { yearId?: number; periodType?: string }) {
    const where: any = {};
    if (params.yearId) where.yearId = params.yearId;
    if (params.periodType) where.periodType = params.periodType;
    return this.prisma.periodDefinition.findMany({ where, orderBy: { startDate: 'asc' }, include: { PlanningYear: true } });
  }

  async findPeriodDefinitionById(id: number) {
    return this.prisma.periodDefinition.findUnique({ where: { id }, include: { PlanningYear: true } });
  }

  async updatePeriodDefinition(userId: number, id: number, data: any) {
    const existing = await this.prisma.periodDefinition.findUnique({ where: { id } });
    if (!existing) throw new ForbiddenException('Cannot modify records in closed fiscal years');
    await this.governanceService.assertYearWritable(userId, 'period', existing.yearId);
    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    return this.prisma.periodDefinition.update({ where: { id }, data: updateData });
  }

  async deletePeriodDefinition(userId: number, id: number) {
    const existing = await this.prisma.periodDefinition.findUnique({ where: { id } });
    if (!existing) throw new ForbiddenException('Cannot modify records in closed fiscal years');
    await this.governanceService.assertYearWritable(userId, 'period', existing.yearId);
    return this.prisma.periodDefinition.delete({ where: { id } });
  }

  async createReport(userId: number, data: any) {
    await this.governanceService.assertYearWritable(userId, 'report', data.yearId);
    return this.prisma.report.create({
      data: {
        yearId: data.yearId,
        reportType: data.reportType,
        periodKey: data.periodKey,
        title: data.title,
        summary: data.summary,
        status: data.status ?? 'draft',
        submittedBy: data.submittedBy,
        approvedBy: data.approvedBy,
        orgUnitId: data.orgUnitId,
      },
      include: { OrgUnit: true, PlanningYear: true },
    });
  }

  async findAllReports(params: { yearId?: number; reportType?: string; status?: string; orgUnitId?: number }) {
    const where: any = {};
    if (params.yearId) where.yearId = params.yearId;
    if (params.reportType) where.reportType = params.reportType;
    if (params.status) where.status = params.status;
    if (params.orgUnitId) where.orgUnitId = params.orgUnitId;
    return this.prisma.report.findMany({ where, orderBy: { createdAt: 'desc' }, include: { OrgUnit: true, PlanningYear: true } });
  }

  async findReportById(id: number) {
    return this.prisma.report.findUnique({ where: { id }, include: { OrgUnit: true, PlanningYear: true } });
  }

  async updateReport(userId: number, id: number, data: any) {
    const existing = await this.prisma.report.findUnique({ where: { id } });
    if (!existing) throw new ForbiddenException('Cannot modify records in closed fiscal years');
    await this.governanceService.assertYearWritable(userId, 'report', existing.yearId);
    return this.prisma.report.update({ where: { id }, data: { ...data } });
  }

  async deleteReport(userId: number, id: number) {
    const existing = await this.prisma.report.findUnique({ where: { id } });
    if (!existing) throw new ForbiddenException('Cannot modify records in closed fiscal years');
    await this.governanceService.assertYearWritable(userId, 'report', existing.yearId);
    return this.prisma.report.delete({ where: { id } });
  }

  async submitReport(userId: number, id: number, submittedBy: number) {
    const existing = await this.prisma.report.findUnique({ where: { id } });
    if (!existing) throw new ForbiddenException('Cannot modify records in closed fiscal years');
    await this.governanceService.assertYearWritable(userId, 'report', existing.yearId);
    return this.prisma.report.update({ where: { id }, data: { status: 'submitted', submittedBy } });
  }

  async approveReport(userId: number, id: number, approvedBy: number) {
    const existing = await this.prisma.report.findUnique({ where: { id } });
    if (!existing) throw new ForbiddenException('Cannot modify records in closed fiscal years');
    await this.governanceService.assertYearWritable(userId, 'report', existing.yearId);
    return this.prisma.report.update({ where: { id }, data: { status: 'approved', approvedBy } });
  }

  async createMonitoringVisit(userId: number, data: any) {
    await this.governanceService.assertYearWritable(userId, 'monitoring_visit', data.yearId);
    return this.prisma.monitoringVisit.create({
      data: {
        yearId: data.yearId,
        orgUnitId: data.orgUnitId,
        visitDate: data.visitDate ? new Date(data.visitDate) : new Date(),
        officer: data.officer,
        findings: data.findings,
        recommendations: data.recommendations,
        status: data.status ?? 'planned',
      },
      include: { OrgUnit: true, PlanningYear: true },
    });
  }

  async findMonitoringVisits(params: { yearId?: number; orgUnitId?: number; status?: string }) {
    const where: any = {};
    if (params.yearId) where.yearId = params.yearId;
    if (params.orgUnitId) where.orgUnitId = params.orgUnitId;
    if (params.status) where.status = params.status;
    return this.prisma.monitoringVisit.findMany({ where, orderBy: { visitDate: 'desc' }, include: { OrgUnit: true, PlanningYear: true } });
  }

  async findMonitoringVisitById(id: number) {
    return this.prisma.monitoringVisit.findUnique({ where: { id }, include: { OrgUnit: true, PlanningYear: true } });
  }

  async updateMonitoringVisit(userId: number, id: number, data: any) {
    const existing = await this.prisma.monitoringVisit.findUnique({ where: { id } });
    if (!existing) throw new ForbiddenException('Cannot modify records in closed fiscal years');
    await this.governanceService.assertYearWritable(userId, 'monitoring_visit', existing.yearId);
    const updateData: any = { ...data };
    if (data.visitDate) updateData.visitDate = new Date(data.visitDate);
    return this.prisma.monitoringVisit.update({ where: { id }, data: updateData });
  }

  async deleteMonitoringVisit(userId: number, id: number) {
    const existing = await this.prisma.monitoringVisit.findUnique({ where: { id } });
    if (!existing) throw new ForbiddenException('Cannot modify records in closed fiscal years');
    await this.governanceService.assertYearWritable(userId, 'monitoring_visit', existing.yearId);
    return this.prisma.monitoringVisit.delete({ where: { id } });
  }

  async getMonitoringDashboard(yearId: number) {
    const [periods, reports, visits] = await Promise.all([
      this.prisma.periodDefinition.findMany({ where: { yearId } }),
      this.prisma.report.findMany({ where: { yearId } }),
      this.prisma.monitoringVisit.findMany({ where: { yearId } }),
    ]);
    return {
      totalPeriods: periods.length,
      activePeriods: periods.filter(p => p.active).length,
      totalReports: reports.length,
      submittedReports: reports.filter(r => r.status === 'submitted' || r.status === 'approved').length,
      draftReports: reports.filter(r => r.status === 'draft').length,
      totalVisits: visits.length,
      completedVisits: visits.filter(v => v.status === 'completed').length,
      plannedVisits: visits.filter(v => v.status === 'planned').length,
    };
  }
}
