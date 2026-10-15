import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfGuard } from '../common/csrf.guard';
import { PermissionsGuard } from './guards';
import { CanView, CanCreate, CanEdit, CanDelete, CanApprove, CanReject } from './decorators';

@UseGuards(AuthGuard, CsrfGuard, PermissionsGuard)
@Controller('governance')
export class GovernanceController {
  constructor(private governanceService: GovernanceService) {}

  // ==================== INITIALIZATION ====================

  @Post('initialize')
  async initialize() {
    return this.governanceService.initializeDefaultRoles();
  }

  // ==================== ROLES ====================

  @CanView('administration')
  @Get('roles')
  async getRoles() {
    return this.governanceService.getRoles();
  }

  @CanView('administration')
  @Get('roles/:id')
  async getRole(@Param('id') id: string) {
    return this.governanceService.getRole(parseInt(id, 10));
  }

  @CanCreate('administration')
  @Post('roles')
  async createRole(@Body() dto: {
    name: string;
    code: string;
    description?: string;
    permissions: { resource: string; actions: string[] }[];
  }) {
    return this.governanceService.createRole(dto);
  }

  @CanEdit('administration')
  @Put('roles/:id')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: {
      name?: string;
      description?: string;
      permissions?: { resource: string; actions: string[] }[];
    },
  ) {
    return this.governanceService.updateRole(parseInt(id, 10), dto);
  }

  @CanDelete('administration')
  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string) {
    return this.governanceService.deleteRole(parseInt(id, 10));
  }

  // ==================== USER PERMISSIONS ====================

  @CanView('administration')
  @Get('permissions')
  async getUserPermissions(@Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      return { error: 'User not authenticated' };
    }
    return this.governanceService.getUserPermissions(userId);
  }

  @CanView('administration')
  @Get('permissions/:userId')
  async getPermissionsForUser(@Param('userId') userId: string) {
    return this.governanceService.getUserPermissions(parseInt(userId, 10));
  }

  // ==================== APPROVAL ====================

  @CanApprove('budget')
  @Post('can-approve')
  async canApprove(
    @Body() body: { userId: number; entity: string; recordId: number },
  ) {
    return this.governanceService.canApprove(
      body.userId,
      body.entity,
      body.recordId,
    );
  }

  @CanApprove('budget')
  @Post('approve')
  async approve(
    @Body() body: { userId: number; entity: string; recordId: number; comments?: string },
  ) {
    return this.governanceService.processApproval(
      body.userId,
      body.entity,
      body.recordId,
      'approve',
      body.comments,
    );
  }

  @CanReject('budget')
  @Post('reject')
  async reject(
    @Body() body: { userId: number; entity: string; recordId: number; comments?: string },
  ) {
    return this.governanceService.processApproval(
      body.userId,
      body.entity,
      body.recordId,
      'reject',
      body.comments,
    );
  }

  // ==================== AUDIT LOG ====================

  @CanView('administration')
  @Get('audit')
  async getAuditLog(
    @Query('userId') userId?: string,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('recordId') recordId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.governanceService.getAuditLog({
      userId: userId ? parseInt(userId, 10) : undefined,
      entity,
      action,
      recordId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @CanView('administration')
  @Get('audit/:entity/:recordId')
  async getEntityHistory(
    @Param('entity') entity: string,
    @Param('recordId') recordId: string,
  ) {
    return this.governanceService.getEntityHistory(entity, parseInt(recordId, 10));
  }

  // ==================== YEAR PROTECTION ====================

  @CanView('planning')
  @Post('check-year-protection')
  async checkYearProtection(
    @Body() body: { userId: number; resource: string; yearId: number },
  ) {
    const canModify = await this.governanceService.checkYearProtection(
      body.userId,
      body.resource,
      body.yearId,
    );
    return { canModify };
  }
}
