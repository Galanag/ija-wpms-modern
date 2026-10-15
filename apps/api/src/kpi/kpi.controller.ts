import {Controller, UseGuards, Get, Post, Put, Delete, Body, Param, Query} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfGuard } from '../common/csrf.guard';
import { PermissionsGuard } from '../governance/guards';
import { CanView, CanCreate, CanEdit, CanDelete, CanSubmit, CanApprove } from '../governance/decorators';
import { KpiService} from './kpi.service';

@Controller('kpi')
@UseGuards(AuthGuard, CsrfGuard, PermissionsGuard)
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  // KPI Definition CRUD
  @CanView('kpi')
  @Get('definitions')
  findAllKpis(@Query() q: any) { return this.kpiService.findAllKpis(q); }

  @CanView('kpi')
  @Get('definitions/:id')
  findKpiById(@Param('id') id: string) { return this.kpiService.findKpiById(+id); }

  @CanCreate('kpi')
  @Post('definitions')
  createKpi(@Body() body: any) { return this.kpiService.createKpi(body); }

  @CanEdit('kpi')
  @Put('definitions/:id')
  updateKpi(@Param('id') id: string, @Body() body: any) { return this.kpiService.updateKpi(+id, body); }

  @CanDelete('kpi')
  @Delete('definitions/:id')
  deleteKpi(@Param('id') id: string) { return this.kpiService.deleteKpi(+id); }

  // KPI Categories
  @CanView('kpi_category')
  @Get('categories')
  findAllCategories() { return this.kpiService.findAllCategories(); }

  // KPI Plans
  @CanView('kpi_plan')
  @Get('plans')
  findKpiPlans(@Query() q: { yearId?: string; kpiId?: string; orgUnitId?: string; objectiveId?: string; skip?: string; take?: string }) { const params = { ...q, yearId: q.yearId ? +q.yearId : undefined, kpiId: q.kpiId ? +q.kpiId : undefined, orgUnitId: q.orgUnitId ? +q.orgUnitId : undefined, objectiveId: q.objectiveId ? +q.objectiveId : undefined, skip: q.skip ? +q.skip : undefined, take: q.take ? +q.take : undefined }; return this.kpiService.findKpiPlans(params); }

  @CanView('kpi_plan')
  @Get('plans/:id')
  findKpiPlanById(@Param('id') id: string) { return this.kpiService.findKpiPlanById(+id); }

  @CanCreate('kpi_plan')
  @Post('plans')
  createKpiPlan(@Body() body: any) { return this.kpiService.createKpiPlan(body); }

  @CanEdit('kpi_plan')
  @Put('plans/:id')
  updateKpiPlan(@Param('id') id: string, @Body() body: any) { return this.kpiService.updateKpiPlan(+id, body); }

  @CanDelete('kpi_plan')
  @Delete('plans/:id')
  deleteKpiPlan(@Param('id') id: string) { return this.kpiService.deleteKpiPlan(+id); }

  @CanSubmit('kpi_plan')
  @Post('plans/:id/submit')
  submitKpiPlan(@Param('id') id: string) { return this.kpiService.submitKpiPlanForApproval(+id); }

  @CanApprove('kpi_plan')
  @Post('plans/:id/approve')
  approveKpiPlan(@Param('id') id: string) { return this.kpiService.approveKpiPlan(+id); }

  // KPI Actuals
  @CanCreate('kpi_actual')
  @Post('actuals')
  createKpiActual(@Body() body: any) { return this.kpiService.createKpiActual(body); }

  @CanView('kpi_actual')
  @Get('actuals/:kpiPlanId')
  findKpiActuals(@Param('kpiPlanId') kpiPlanId: string) { return this.kpiService.findKpiActuals(+kpiPlanId); }

  @CanEdit('kpi_actual')
  @Put('actuals/:id')
  updateKpiActual(@Param('id') id: string, @Body() body: any) { return this.kpiService.updateKpiActual(+id, body); }

  @CanEdit('kpi_actual')
  @Post('actuals/:id/verify')
  verifyKpiActual(@Param('id') id: string, @Body() body: { userId: number }) { return this.kpiService.verifyKpiActual(+id, body.userId); }

  @CanDelete('kpi_actual')
  @Delete('actuals/:id')
  deleteKpiActual(@Param('id') id: string) { return this.kpiService.deleteKpiActual(+id); }

  // Dashboard & Analytics
  @CanView('kpi')
  @Get('dashboard/metrics')
  getDashboardMetrics(@Query() q: { yearId?: string; orgUnitId?: string }) {
    return this.kpiService.getDashboardMetrics({
      yearId: q.yearId ? +q.yearId : undefined,
      orgUnitId: q.orgUnitId ? +q.orgUnitId : undefined,
    });
  }

  @CanView('kpi')
  @Get('dashboard/status')
  getDashboardStatus(@Query() q: { yearId?: string }) {
    return this.kpiService.getDashboardStatus({ yearId: q.yearId ? +q.yearId : undefined });
  }

  @CanView('kpi_plan')
  @Get('metrics/:planId')
  getKpiMetrics(@Param('planId') planId: string) { return this.kpiService.getKpiMetrics(+planId); }

  @CanView('kpi_plan')
  @Get('trend/:planId')
  getKpiTrend(@Param('planId') planId: string) { return this.kpiService.getKpiTrend(+planId); }

  @CanView('kpi_plan')
  @Get('compare-years/:kpiId')
  compareYears(@Param('kpiId') kpiId: string, @Query('yearIds') yearIds: string) { return this.kpiService.compareYears(+kpiId, yearIds ? yearIds.split(',').map(Number) : []); }

  @CanEdit('kpi_plan')
  @Post('copy-to-year')
  copyPlansToYear(@Body() body: { sourceYearId: number; targetYearId: number }) { return this.kpiService.copyPlansToYear(body.sourceYearId, body.targetYearId); }
}
