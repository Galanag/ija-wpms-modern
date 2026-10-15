import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RolloverService, RolloverRequest } from './rollover.service';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfGuard } from '../common/csrf.guard';
import { PermissionsGuard } from '../governance/guards';
import { CanView, CanCreate, CanEdit } from '../governance/decorators';

@UseGuards(AuthGuard, CsrfGuard, PermissionsGuard)
@Controller('rollover')
export class RolloverController {
  constructor(private rolloverService: RolloverService) {}

  /** Guided wizard step 1-2: analyze what can be carried forward. */
  @CanCreate('planning')
  @Post('preview')
  async preview(@Body() dto: RolloverRequest, @Request() req: any) {
    return this.rolloverService.previewRollover(dto, req.user?.id ?? 1);
  }

  /** Guided wizard final step: execute the rollover. */
  @CanEdit('planning')
  @Post('execute')
  async execute(@Body() dto: RolloverRequest, @Request() req: any) {
    return this.rolloverService.executeRollover(dto, req.user?.id ?? 1);
  }

  /** Available structure items for the wizard selection step. */
  @CanView('planning')
  @Get('items')
  getItems() {
    return this.rolloverService.getStructureItems();
  }

  @CanView('planning')
  @Get('jobs')
  async listJobs(
    @Query('sourceYearId') sourceYearId?: string,
    @Query('targetYearId') targetYearId?: string,
  ) {
    return this.rolloverService.listJobs(
      sourceYearId ? parseInt(sourceYearId, 10) : undefined,
      targetYearId ? parseInt(targetYearId, 10) : undefined,
    );
  }

  @CanView('planning')
  @Get('jobs/:id')
  async getJob(@Param('id') id: string) {
    return this.rolloverService.getJob(parseInt(id, 10));
  }

  @CanEdit('planning')
  @Post('jobs/:id/cancel')
  async cancelJob(@Param('id') id: string, @Request() req: any) {
    return this.rolloverService.cancelJob(parseInt(id, 10), req.user?.id ?? 1);
  }
}