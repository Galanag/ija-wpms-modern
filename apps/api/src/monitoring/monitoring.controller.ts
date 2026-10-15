import {Controller, UseGuards, Get, Post, Put, Delete, Body, Param, Query, Req} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfGuard } from '../common/csrf.guard';
import { PermissionsGuard } from '../governance/guards';
import { CanView, CanCreate, CanEdit, CanDelete, CanSubmit, CanApprove } from '../governance/decorators';
import { MonitoringService} from './monitoring.service';

@Controller('monitoring')
@UseGuards(AuthGuard, CsrfGuard, PermissionsGuard)
export class MonitoringController {
  constructor(private readonly service: MonitoringService) {}

  // Period Definitions
  @CanCreate('period')
  @Post('periods')
  createPeriod(@Req() req: any, @Body() data: any) { return this.service.createPeriodDefinition(req.user?.id, data); }

  @CanView('period')
  @Get('periods')
  findAllPeriods(@Query() q: { yearId?: string }) {
    const params = { yearId: q.yearId ? +q.yearId : undefined };
    return this.service.findAllPeriodDefinitions(params);
  }

  @CanView('period')
  @Get('periods/:id')
  findOnePeriod(@Param('id') id: string) { return this.service.findPeriodDefinitionById(+id); }

  @CanEdit('period')
  @Put('periods/:id')
  updatePeriod(@Req() req: any, @Param('id') id: string, @Body() data: any) { return this.service.updatePeriodDefinition(req.user?.id, +id, data); }

  @CanDelete('period')
  @Delete('periods/:id')
  deletePeriod(@Req() req: any, @Param('id') id: string) { return this.service.deletePeriodDefinition(req.user?.id, +id); }

  // Reports
  @CanCreate('report')
  @Post('reports')
  createReport(@Req() req: any, @Body() data: any) { return this.service.createReport(req.user?.id, data); }

  @CanView('report')
  @Get('reports')
  findReports(@Query() q: { yearId?: string; orgUnitId?: string; status?: string; skip?: string; take?: string }) {
    const params = {
      ...q,
      yearId: q.yearId ? +q.yearId : undefined,
      orgUnitId: q.orgUnitId ? +q.orgUnitId : undefined,
      skip: q.skip ? +q.skip : undefined,
      take: q.take ? +q.take : undefined,
    };
    return this.service.findAllReports(params);
  }

  @CanView('report')
  @Get('reports/:id')
  findReportById(@Param('id') id: string) { return this.service.findReportById(+id); }

  @CanEdit('report')
  @Put('reports/:id')
  updateReport(@Req() req: any, @Param('id') id: string, @Body() data: any) { return this.service.updateReport(req.user?.id, +id, data); }

  @CanDelete('report')
  @Delete('reports/:id')
  deleteReport(@Req() req: any, @Param('id') id: string) { return this.service.deleteReport(req.user?.id, +id); }

  @CanSubmit('report')
  @Post('reports/:id/submit')
  submitReport(@Req() req: any, @Param('id') id: string, @Body() body: { submittedBy: number }) { return this.service.submitReport(req.user?.id, +id, body.submittedBy); }

  @CanApprove('report')
  @Post('reports/:id/approve')
  approveReport(@Req() req: any, @Param('id') id: string, @Body() body: { approvedBy: number }) { return this.service.approveReport(req.user?.id, +id, body.approvedBy); }

  // Monitoring Visits
  @CanCreate('report')
  @Post('visits')
  createVisit(@Req() req: any, @Body() data: any) { return this.service.createMonitoringVisit(req.user?.id, data); }

  @CanView('report')
  @Get('visits')
  findVisits(@Query() q: { yearId?: string; orgUnitId?: string; status?: string; skip?: string; take?: string }) {
    const params = {
      ...q,
      yearId: q.yearId ? +q.yearId : undefined,
      orgUnitId: q.orgUnitId ? +q.orgUnitId : undefined,
      skip: q.skip ? +q.skip : undefined,
      take: q.take ? +q.take : undefined,
    };
    return this.service.findMonitoringVisits(params);
  }

  @CanView('report')
  @Get('visits/:id')
  findVisitById(@Param('id') id: string) { return this.service.findMonitoringVisitById(+id); }

  @CanEdit('report')
  @Put('visits/:id')
  updateVisit(@Req() req: any, @Param('id') id: string, @Body() data: any) { return this.service.updateMonitoringVisit(req.user?.id, +id, data); }

  @CanDelete('report')
  @Delete('visits/:id')
  deleteVisit(@Req() req: any, @Param('id') id: string) { return this.service.deleteMonitoringVisit(req.user?.id, +id); }

  // Dashboard
  @CanView('dashboard')
  @Get('dashboard')
  getDashboard(@Query('yearId') yearId: string) { return this.service.getMonitoringDashboard(+yearId); }
}
