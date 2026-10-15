import {Controller, UseGuards, Get, Post, Put, Delete, Body, Param, Query, Req} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfGuard } from '../common/csrf.guard';
import { PermissionsGuard } from '../governance/guards';
import { CanView, CanCreate, CanEdit, CanDelete } from '../governance/decorators';
import { StrategicService} from './strategic.service';

@Controller('strategic')
@UseGuards(AuthGuard, CsrfGuard, PermissionsGuard)
export class StrategicController {
  constructor(private readonly strategicService: StrategicService) {}

  @CanCreate('strategy')
  @Post('plans')
  createPlan(@Req() req: any, @Body() body: any) { return this.strategicService.createStrategicPlan(req.user?.id, body); }

  @CanView('strategy')
  @Get('plans')
  findAllPlans() { return this.strategicService.findAllStrategicPlans(); }

  @CanView('strategy')
  @Get('plans/:id')
  findPlanById(@Param('id') id: string) { return this.strategicService.findStrategicPlanById(+id); }

  @CanEdit('strategy')
  @Put('plans/:id')
  updatePlan(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.strategicService.updateStrategicPlan(req.user?.id, +id, body); }

  @CanDelete('strategy')
  @Delete('plans/:id')
  deletePlan(@Req() req: any, @Param('id') id: string) { return this.strategicService.deleteStrategicPlan(req.user?.id, +id); }

  @CanCreate('strategy')
  @Post('themes')
  createTheme(@Req() req: any, @Body() body: any) { return this.strategicService.createTheme(req.user?.id, body); }

  @CanEdit('strategy')
  @Put('themes/:id')
  updateTheme(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.strategicService.updateTheme(req.user?.id, +id, body); }

  @CanDelete('strategy')
  @Delete('themes/:id')
  deleteTheme(@Req() req: any, @Param('id') id: string) { return this.strategicService.deleteTheme(req.user?.id, +id); }

  @CanCreate('strategy')
  @Post('results')
  createResult(@Req() req: any, @Body() body: any) { return this.strategicService.createResult(req.user?.id, body); }

  @CanEdit('strategy')
  @Put('results/:id')
  updateResult(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.strategicService.updateResult(req.user?.id, +id, body); }

  @CanDelete('strategy')
  @Delete('results/:id')
  deleteResult(@Req() req: any, @Param('id') id: string) { return this.strategicService.deleteResult(req.user?.id, +id); }

  @CanCreate('strategy')
  @Post('goals')
  createGoal(@Req() req: any, @Body() body: any) { return this.strategicService.createGoal(req.user?.id, body); }

  @CanView('strategy')
  @Get('goals')
  findGoalsByYear(@Query('yearId') yearId: string) { return this.strategicService.findGoalsByYear(+yearId); }

  @CanView('strategy')
  @Get('goals/:id')
  findGoalById(@Param('id') id: string) { return this.strategicService.findGoalsByYear(+id); }

  @CanEdit('strategy')
  @Put('goals/:id')
  updateGoal(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.strategicService.updateGoal(req.user?.id, +id, body); }

  @CanDelete('strategy')
  @Delete('goals/:id')
  deleteGoal(@Req() req: any, @Param('id') id: string) { return this.strategicService.deleteGoal(req.user?.id, +id); }

  @CanCreate('strategy')
  @Post('objectives')
  createObjective(@Req() req: any, @Body() body: any) { return this.strategicService.createObjective(req.user?.id, body); }

  @CanView('strategy')
  @Get('objectives')
  findObjectives(@Query('yearId') yearId?: string) { return this.strategicService.findGoalsByYear(yearId ? +yearId : 0); }

  @CanEdit('strategy')
  @Put('objectives/:id')
  updateObjective(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.strategicService.updateObjective(req.user?.id, +id, body); }

  @CanDelete('strategy')
  @Delete('objectives/:id')
  deleteObjective(@Req() req: any, @Param('id') id: string) { return this.strategicService.deleteObjective(req.user?.id, +id); }

  @CanEdit('strategy')
  @Post('copy-to-year')
  copyStructureToYear(@Req() req: any, @Body() body: any) { return this.strategicService.copyStructureToYear(req.user?.id, body); }

  @CanView('strategy')
  @Get('hierarchy/:yearId')
  getHierarchyForYear(@Param('yearId') yearId: string) { return this.strategicService.getHierarchyForYear(+yearId); }

  @CanView('strategy')
  @Get('statistics')
  getStatistics(@Query('yearId') yearId?: string) { return this.strategicService.getStatistics(yearId ? +yearId : undefined); }
}
