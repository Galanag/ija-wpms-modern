import { Controller, UseGuards, Get, Post, Patch, Body, Param, Query, Req, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfGuard } from '../common/csrf.guard';
import { PermissionsGuard, YearProtectionGuard } from '../governance/guards';
import { CanView, CanCreate, CanEdit, CanClose } from '../governance/decorators';
import { ManagementReviewService } from './management-review.service';

function toId(value: string, name = 'id'): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new BadRequestException(`Invalid ${name}`);
  return n;
}

@Controller('management-reviews')
@UseGuards(AuthGuard, CsrfGuard, PermissionsGuard, YearProtectionGuard)
export class ManagementReviewController {
  constructor(private readonly mr: ManagementReviewService) {}

  @CanView('management_review')
  @Get()
  findAll(@Query() q: { yearId?: string; status?: string }) {
    const params = {
      yearId: q.yearId ? +q.yearId : undefined,
      status: q.status,
    };
    return this.mr.findAllReviews(params);
  }

  @CanView('management_review')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mr.findReviewById(toId(id));
  }

  @CanCreate('management_review')
  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.mr.createReview(req.user?.id, body);
  }

  @CanEdit('management_review')
  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.mr.updateReview(req.user?.id, toId(id), body);
  }

  @CanCreate('management_review')
  @Post(':id/findings')
  addFinding(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.mr.addFinding(req.user?.id, toId(id), body);
  }

  @CanCreate('management_review')
  @Post(':id/decisions')
  addDecision(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.mr.addDecision(req.user?.id, toId(id), body);
  }

  @CanCreate('management_review')
  @Post(':id/actions')
  addAction(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.mr.addAction(req.user?.id, toId(id), body);
  }

  @CanEdit('management_review')
  @Patch(':id/actions/:actionId')
  updateAction(@Req() req: any, @Param('id') id: string, @Param('actionId') actionId: string, @Body() body: any) {
    return this.mr.updateAction(req.user?.id, toId(id), toId(actionId), body);
  }

  @CanClose('management_review')
  @Post(':id/close')
  close(@Req() req: any, @Param('id') id: string) {
    return this.mr.closeReview(req.user?.id, toId(id));
  }
}
