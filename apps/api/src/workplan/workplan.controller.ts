/**
 * WorkPlan Controller - REST API endpoints
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { WorkPlanService } from './workplan.service';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfGuard } from '../common/csrf.guard';
import { PermissionsGuard } from '../governance/guards';
import { CanView, CanCreate, CanEdit, CanDelete, CanSubmit, CanApprove, CanReject } from '../governance/decorators';

@UseGuards(AuthGuard, CsrfGuard, PermissionsGuard)
@Controller('workplan')
export class WorkPlanController {
  constructor(private readonly service: WorkPlanService) {}

  // ==================== WORK PLAN ====================
  @CanCreate('workplan')
  @Post('plans')
  createWorkPlan(@Req() req: any, @Body() dto: any) { return this.service.createWorkPlan(req.user?.id, dto); }

  @CanView('workplan')
  @Get('plans')
  findAllWorkPlans(@Query() filters: { skip?: string; take?: string; yearId?: string; orgUnitId?: string; status?: string; search?: string; priority?: string; approvalStatus?: string }) { const params = { ...filters, yearId: filters.yearId ? +filters.yearId : undefined, orgUnitId: filters.orgUnitId ? +filters.orgUnitId : undefined, skip: filters.skip ? +filters.skip : undefined, take: filters.take ? +filters.take : undefined }; return this.service.findAllWorkPlans(params); }

  @CanView('workplan')
  @Get('plans/:id')
  findWorkPlanById(@Param('id') id: string) { return this.service.findWorkPlanById(+id); }

  @CanEdit('workplan')
  @Put('plans/:id')
  updateWorkPlan(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.service.updateWorkPlan(req.user?.id, +id, dto); }

  @CanDelete('workplan')
  @Delete('plans/:id')
  deleteWorkPlan(@Req() req: any, @Param('id') id: string) { return this.service.deleteWorkPlan(req.user?.id, +id); }

  @CanSubmit('workplan')
  @Post('plans/:id/submit')
  submitWorkPlan(@Req() req: any, @Param('id') id: string) { return this.service.submitWorkPlanForApproval(req.user?.id, +id); }

  @CanApprove('workplan')
  @Post('plans/:id/approve')
  approveWorkPlan(@Req() req: any, @Param('id') id: string) { return this.service.approveWorkPlan(req.user?.id, +id); }

  // ==================== ACTIVITIES ====================
  @CanCreate('activity')
  @Post('activities')
  createActivity(@Req() req: any, @Body() dto: any) { return this.service.createActivity(req.user?.id, dto); }

  @CanView('activity')
  @Get('activities')
  findAllActivities(@Query() filters: { skip?: string; take?: string; yearId?: string; orgUnitId?: string; status?: string; search?: string; priority?: string; approvalStatus?: string }) { const params = { ...filters, yearId: filters.yearId ? +filters.yearId : undefined, orgUnitId: filters.orgUnitId ? +filters.orgUnitId : undefined, skip: filters.skip ? +filters.skip : undefined, take: filters.take ? +filters.take : undefined }; return this.service.findAllActivities(params); }

  @CanView('activity')
  @Get('activities/:id')
  findActivityById(@Param('id') id: string) { return this.service.findActivityById(+id); }

  @CanEdit('activity')
  @Put('activities/:id')
  updateActivity(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.service.updateActivity(req.user?.id, +id, dto); }

  @CanDelete('activity')
  @Delete('activities/:id')
  deleteActivity(@Req() req: any, @Param('id') id: string) { return this.service.deleteActivity(req.user?.id, +id); }

  @CanSubmit('activity')
  @Post('activities/:id/submit')
  submitActivity(@Req() req: any, @Param('id') id: string) { return this.service.submitActivityForApproval(req.user?.id, +id); }

  @CanApprove('activity')
  @Post('activities/:id/approve')
  approveActivity(@Req() req: any, @Param('id') id: string) { return this.service.approveActivity(req.user?.id, +id); }

  @CanReject('activity')
  @Post('activities/:id/reject')
  rejectActivity(@Req() req: any, @Param('id') id: string, @Body() body: { comments?: string }) { return this.service.rejectActivity(req.user?.id, +id, body.comments); }

  @CanSubmit('activity')
  @Post('activities/:id/resubmit')
  resubmitActivity(@Req() req: any, @Param('id') id: string) { return this.service.resubmitActivity(req.user?.id, +id); }

  @CanSubmit('activity')
  @Post('activities/:id/progress')
  updateActivityProgress(@Req() req: any, @Param('id') id: string, @Body() body: { progress: number; note?: string; evidence?: string; submittedBy?: number }) {
    return this.service.updateActivityProgress(req.user?.id, +id, body.progress, body.note, body.evidence, body.submittedBy);
  }

  @CanEdit('activity')
  @Post('activities/bulk-update')
  bulkUpdateActivities(@Req() req: any, @Body() body: { ids: number[]; status?: string; orgUnitId?: number; employeeId?: number }) {
    return this.service.bulkUpdateActivities(req.user?.id, body.ids, body);
  }

  // ==================== SUBTASKS ====================
  @CanCreate('sub_task')
  @Post('subtasks')
  createSubTask(@Req() req: any, @Body() dto: any) { return this.service.createSubTask(req.user?.id, dto); }

  @CanView('sub_task')
  @Get('subtasks/activity/:activityId')
  findSubTasksByActivity(@Param('activityId') id: string) { return this.service.findSubTasksByActivity(+id); }

  @CanEdit('sub_task')
  @Put('subtasks/:id')
  updateSubTask(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.service.updateSubTask(req.user?.id, +id, dto); }

  @CanDelete('sub_task')
  @Delete('subtasks/:id')
  deleteSubTask(@Req() req: any, @Param('id') id: string) { return this.service.deleteSubTask(req.user?.id, +id); }

  @CanSubmit('sub_task')
  @Post('subtasks/:id/progress')
  updateSubTaskProgress(@Req() req: any, @Param('id') id: string, @Body() body: { progress: number }) { return this.service.updateSubTaskProgress(req.user?.id, +id, body.progress); }

  // ==================== DELIVERABLES ====================
  @CanCreate('deliverable')
  @Post('deliverables')
  createDeliverable(@Req() req: any, @Body() dto: any) { return this.service.createDeliverable(req.user?.id, dto); }

  @CanView('deliverable')
  @Get('deliverables/activity/:activityId')
  findDeliverablesByActivity(@Param('activityId') id: string) { return this.service.findDeliverablesByActivity(+id); }

  @CanEdit('deliverable')
  @Put('deliverables/:id')
  updateDeliverable(@Req() req: any, @Param('id') id: string, @Body() dto: any) { return this.service.updateDeliverable(req.user?.id, +id, dto); }

  @CanDelete('deliverable')
  @Delete('deliverables/:id')
  deleteDeliverable(@Req() req: any, @Param('id') id: string) { return this.service.deleteDeliverable(req.user?.id, +id); }

  @CanSubmit('deliverable')
  @Post('deliverables/:id/complete')
  completeDeliverable(@Req() req: any, @Param('id') id: string, @Body() body: { evidence?: string }) { return this.service.completeDeliverable(req.user?.id, +id, body.evidence); }

  // ==================== SCHEDULE & STATISTICS ====================
  @CanView('workplan')
  @Get('schedule/:yearId')
  getQuarterlySchedule(@Param('yearId') id: string, @Query('orgUnitId') orgUnitId?: string) {
    return this.service.getQuarterlySchedule(+id, orgUnitId ? +orgUnitId : undefined);
  }

  @CanView('workplan')
  @Get('overdue/:yearId')
  getOverdueActivities(@Param('yearId') id: string, @Query('orgUnitId') orgUnitId?: string) {
    return this.service.getOverdueActivities(+id, orgUnitId ? +orgUnitId : undefined);
  }

  @CanView('workplan')
  @Get('statistics/:yearId')
  getWorkPlanStatistics(@Param('yearId') id: string, @Query('orgUnitId') orgUnitId?: string) {
    return this.service.getWorkPlanStatistics(+id, orgUnitId ? +orgUnitId : undefined);
  }

  // ==================== COPY TO YEAR ====================
  @CanEdit('workplan')
  @Post('copy-to-year')
  copyWorkPlanToYear(@Req() req: any, @Body() body: { sourceYearId: number; targetYearId: number; copyProgress?: boolean }) {
    return this.service.copyWorkPlanToYear(req.user?.id, body.sourceYearId, body.targetYearId, body.copyProgress);
  }
}
