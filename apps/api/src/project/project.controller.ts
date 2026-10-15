import {Controller, UseGuards, Get, Post, Put, Delete, Body, Param, Query, Req} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfGuard } from '../common/csrf.guard';
import { PermissionsGuard } from '../governance/guards';
import { CanView, CanCreate, CanEdit, CanDelete } from '../governance/decorators';
import { ProjectService} from './project.service';

@Controller('project')
@UseGuards(AuthGuard, CsrfGuard, PermissionsGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @CanCreate('projects')
  @Post('projects')
  create(@Req() req: any, @Body() data: any) { return this.projectService.create(data, req.user?.id); }

  @CanView('projects')
  @Get('projects')
  findAll(@Query() q: { skip?: number; take?: number; yearId?: string; orgUnitId?: string; status?: string; search?: string }) { const params = { ...q, yearId: q.yearId ? +q.yearId : undefined, orgUnitId: q.orgUnitId ? +q.orgUnitId : undefined, skip: q.skip ? +q.skip : undefined, take: q.take ? +q.take : undefined }; return this.projectService.findAll(params); }

  @CanView('projects')
  @Get('projects/summary')
  getSummary(@Query() q: { yearId?: string; orgUnitId?: string }) {
    return this.projectService.getSummary(q.yearId ? +q.yearId : undefined, q.orgUnitId ? +q.orgUnitId : undefined);
  }

  @CanView('projects')
  @Get('projects/:id')
  findOne(@Param('id') id: string) { return this.projectService.findOne(+id); }

  @CanEdit('projects')
  @Put('projects/:id')
  update(@Param('id') id: string, @Req() req: any, @Body() data: any) { return this.projectService.update(+id, data, req.user?.id); }

  @CanDelete('projects')
  @Delete('projects/:id')
  delete(@Param('id') id: string, @Req() req: any) { return this.projectService.delete(+id, req.user?.id); }

  // Milestones
  @CanCreate('projects')
  @Post('milestones')
  createMilestone(@Req() req: any, @Body() data: any) { return this.projectService.createMilestone(data, req.user?.id); }

  @CanView('projects')
  @Get('milestones/:projectId')
  findMilestones(@Param('projectId') projectId: string) { return this.projectService.findMilestones(+projectId); }

  @CanEdit('projects')
  @Put('milestones/:id')
  updateMilestone(@Param('id') id: string, @Req() req: any, @Body() data: any) { return this.projectService.updateMilestone(+id, data, req.user?.id); }

  @CanDelete('projects')
  @Delete('milestones/:id')
  deleteMilestone(@Param('id') id: string, @Req() req: any) { return this.projectService.deleteMilestone(+id, req.user?.id); }
}
