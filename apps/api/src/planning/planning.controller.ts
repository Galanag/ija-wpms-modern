import {Controller, UseGuards, Get, Post, Put, Delete, Body, Param, Query, Req} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfGuard } from '../common/csrf.guard';
import { PermissionsGuard } from '../governance/guards';
import { CanView, CanCreate, CanEdit, CanDelete, CanSubmit, CanApprove } from '../governance/decorators';
import { PlanningService} from './planning.service';
import { FastifyRequest } from 'fastify';

@Controller('planning')
@UseGuards(AuthGuard, CsrfGuard, PermissionsGuard)
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @CanView('planning')
  @Get('years')
  getPlanningYears() { return this.planningService.getPlanningYears(); }

  @CanView('planning')
  @Get('years/:id')
  getPlanningYearById(@Param('id') id: string) { return this.planningService.getPlanningYearById(+id); }

  @CanCreate('planning')
  @Post('years')
  createPlanningYear(@Body() data: any) { return this.planningService.createPlanningYear(data); }

  @CanEdit('planning')
  @Put('years/:id')
  updatePlanningYear(@Param('id') id: string, @Body() data: any) { return this.planningService.updatePlanningYear(+id, data); }

  @CanDelete('planning')
  @Delete('years/:id')
  deletePlanningYear(@Param('id') id: string) { return this.planningService.deletePlanningYear(+id); }

  @CanView('planning')
  @Get('summary/:yearId')
  getPlanningSummary(@Param('yearId') yearId: string) { return this.planningService.getPlanningSummary(+yearId); }

  @CanView('planning')
  @Get('calendar/:yearId')
  getYearlyCalendar(@Param('yearId') yearId: string) { return this.planningService.getYearlyCalendar(+yearId); }

  // Year status transitions
  @CanApprove('planning')
  @Post('years/:id/close')
  closeYear(@Req() req: FastifyRequest & { user?: { id: number } }, @Param('id') id: string) {
    return this.planningService.closeYear(req.user!.id, +id);
  }

  @CanApprove('planning')
  @Post('years/:id/reopen')
  reopenYear(@Req() req: FastifyRequest & { user?: { id: number } }, @Param('id') id: string) {
    return this.planningService.reopenYear(req.user!.id, +id);
  }

  // Plans endpoints
  @CanView('planning')
  @Get('plans')
  getPlans(@Query() q: { yearId?: string; status?: string; skip?: string; take?: string }) {
    const params = {
      ...q,
      yearId: q.yearId ? +q.yearId : undefined,
      skip: q.skip ? +q.skip : undefined,
      take: q.take ? +q.take : undefined,
    };
    return this.planningService.getPlans(params);
  }

  @CanView('planning')
  @Get('plans/:id')
  getPlanById(@Param('id') id: string) { return this.planningService.getPlanById(+id); }

  @CanCreate('planning')
  @Post('plans')
  createPlan(@Req() req: FastifyRequest & { user?: { id: number } }, @Body() data: any) {
    return this.planningService.createPlan(req.user!.id, data);
  }

  @CanEdit('planning')
  @Put('plans/:id')
  updatePlan(@Req() req: FastifyRequest & { user?: { id: number } }, @Param('id') id: string, @Body() data: any) {
    return this.planningService.updatePlan(req.user!.id, +id, data);
  }

  @CanDelete('planning')
  @Delete('plans/:id')
  deletePlan(@Req() req: FastifyRequest & { user?: { id: number } }, @Param('id') id: string) {
    return this.planningService.deletePlan(req.user!.id, +id);
  }

  @CanSubmit('planning')
  @Post('plans/:id/transition')
  transitionPlan(@Req() req: FastifyRequest & { user?: { id: number } }, @Param('id') id: string, @Body() body: { action: string }) {
    return this.planningService.transitionPlan(req.user!.id, +id, body.action);
  }

  @CanView('planning')
  @Get('plans/:id/transitions')
  getPlanTransitions(@Param('id') id: string) { return this.planningService.getPlanTransitions(+id); }

  @CanEdit('planning')
  @Post('plans/copy')
  copyPlan(@Req() req: FastifyRequest & { user?: { id: number } }, @Body() data: any) {
    return this.planningService.copyPlanToYear(req.user!.id, data);
  }
}
