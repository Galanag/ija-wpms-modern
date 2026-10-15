import {Controller, UseGuards, Get, Post, Put, Delete, Body, Param, Query, Req} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfGuard } from '../common/csrf.guard';
import { PermissionsGuard } from '../governance/guards';
import { CanView, CanCreate, CanEdit, CanDelete, CanSubmit, CanApprove, CanClose } from '../governance/decorators';
import { RiskComplianceService} from './risk-compliance.service';

@Controller('risk-compliance')
@UseGuards(AuthGuard, CsrfGuard, PermissionsGuard)
export class RiskComplianceController {
  constructor(private readonly rc: RiskComplianceService) {}

  // Risks
  @CanCreate('risk')
  @Post('risks')
  createRisk(@Body() body: any) { return this.rc.createRisk(body); }

  @CanView('risk')
  @Get('risks')
  findAllRisks(@Query() q: { yearId?: string; categoryId?: string; status?: string; orgUnitId?: string; skip?: string; take?: string }) {
    const params = {
      ...q,
      yearId: q.yearId ? +q.yearId : undefined,
      categoryId: q.categoryId ? +q.categoryId : undefined,
      orgUnitId: q.orgUnitId ? +q.orgUnitId : undefined,
      skip: q.skip ? +q.skip : undefined,
      take: q.take ? +q.take : undefined,
    };
    return this.rc.findAllRisks(params);
  }

  @CanView('risk')
  @Get('risks/:id')
  findRiskById(@Param('id') id: string) { return this.rc.findRiskById(+id); }

  @CanEdit('risk')
  @Put('risks/:id')
  updateRisk(@Param('id') id: string, @Body() body: any) { return this.rc.updateRisk(+id, body); }

  @CanDelete('risk')
  @Delete('risks/:id')
  deleteRisk(@Param('id') id: string) { return this.rc.deleteRisk(+id); }

  // Risk Categories
  @CanView('risk')
  @Get('categories')
  findRiskCategories() { return this.rc.findRiskCategories(); }

  @CanCreate('risk')
  @Post('categories')
  createRiskCategory(@Body() body: any) { return this.rc.createRiskCategory(body); }

  @CanEdit('risk')
  @Put('categories/:id')
  updateRiskCategory(@Param('id') id: string, @Body() body: any) { return this.rc.updateRiskCategory(+id, body); }

  // Risk Reviews
  @CanCreate('risk')
  @Post('reviews')
  createRiskReview(@Body() body: any) { return this.rc.createRiskReview(body); }

  @CanView('risk')
  @Get('reviews/:riskId')
  findRiskReviews(@Param('riskId') riskId: string) { return this.rc.findRiskReviews(+riskId); }

  // Compliance Requirements
  @CanCreate('compliance')
  @Post('requirements')
  createComplianceRequirement(@Body() body: any) { return this.rc.createComplianceRequirement(body); }

  @CanView('compliance')
  @Get('requirements')
  findAllComplianceRequirements(@Query() q: { yearId?: string; status?: string; orgUnitId?: string; search?: string; upcoming?: string; skip?: string; take?: string }) {
    const params = {
      ...q,
      yearId: q.yearId ? +q.yearId : undefined,
      orgUnitId: q.orgUnitId ? +q.orgUnitId : undefined,
      skip: q.skip ? +q.skip : undefined,
      take: q.take ? +q.take : undefined,
    };
    return this.rc.findAllComplianceRequirements(params);
  }

  @CanView('compliance')
  @Get('requirements/:id')
  findOneComplianceRequirement(@Param('id') id: string) { return this.rc.findOneComplianceRequirement(+id); }

  @CanEdit('compliance')
  @Put('requirements/:id')
  updateComplianceRequirement(@Param('id') id: string, @Body() body: any) { return this.rc.updateComplianceRequirement(+id, body); }

  @CanDelete('compliance')
  @Delete('requirements/:id')
  deleteComplianceRequirement(@Param('id') id: string) { return this.rc.deleteComplianceRequirement(+id); }

  @CanSubmit('compliance')
  @Post('requirements/:id/evidence')
  uploadComplianceEvidence(@Param('id') id: string, @Body() body: { evidence: string }) { return this.rc.uploadComplianceEvidence(+id, body.evidence); }

  @CanEdit('compliance')
  @Post('requirements/copy')
  copyRequirements(@Req() req: any, @Body() body: { sourceYearId: number; targetYearId: number }) {
    return this.rc.copyRequirementsToYear(+body.sourceYearId, +body.targetYearId, req.user?.id);
  }

  // Compliance Findings
  @CanCreate('compliance')
  @Post('findings')
  createComplianceFinding(@Body() body: any) { return this.rc.createComplianceFinding(body); }

  @CanView('compliance')
  @Get('findings')
  findComplianceFindings(@Query() q: { requirementId?: string; status?: string; severity?: string; skip?: string; take?: string }) {
    const params = {
      ...q,
      requirementId: q.requirementId ? +q.requirementId : undefined,
      skip: q.skip ? +q.skip : undefined,
      take: q.take ? +q.take : undefined,
    };
    return this.rc.findComplianceFindings(params);
  }

  @CanEdit('compliance')
  @Put('findings/:id')
  updateComplianceFinding(@Param('id') id: string, @Body() body: any) { return this.rc.updateComplianceFinding(+id, body); }

  @CanClose('compliance')
  @Post('findings/:id/close')
  closeComplianceFinding(@Param('id') id: string) { return this.rc.closeComplianceFinding(+id); }

  // Corrective Actions
  @CanCreate('compliance')
  @Post('corrective-actions')
  createCorrectiveAction(@Body() body: any) { return this.rc.createCorrectiveAction(body); }

  @CanView('compliance')
  @Get('corrective-actions')
  findCorrectiveActions(@Query() q: { yearId?: string; status?: string; ownerEmployeeId?: string; skip?: string; take?: string }) {
    const params = {
      ...q,
      yearId: q.yearId ? +q.yearId : undefined,
      ownerEmployeeId: q.ownerEmployeeId ? +q.ownerEmployeeId : undefined,
      skip: q.skip ? +q.skip : undefined,
      take: q.take ? +q.take : undefined,
    };
    return this.rc.findCorrectiveActions(params);
  }

  @CanEdit('compliance')
  @Put('corrective-actions/:id')
  updateCorrectiveAction(@Param('id') id: string, @Body() body: any) { return this.rc.updateCorrectiveAction(+id, body); }

  @CanDelete('compliance')
  @Delete('corrective-actions/:id')
  deleteCorrectiveAction(@Param('id') id: string) { return this.rc.deleteCorrectiveAction(+id); }

  // Dashboard
  @CanView('dashboard')
  @Get('dashboard/risks')
  getRiskDashboard(@Query('yearId') yearId?: string) { return this.rc.getRiskDashboard(yearId ? +yearId : undefined); }

  @CanView('dashboard')
  @Get('dashboard/compliance')
  getComplianceDashboard(@Query('yearId') yearId?: string) { return this.rc.getComplianceDashboard(yearId ? +yearId : undefined); }
}
