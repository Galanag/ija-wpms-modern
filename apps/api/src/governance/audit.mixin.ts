import { Injectable } from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { PermissionAction, ResourceType } from './permissions';

/**
 * Helper mixin to add audit and permission checking capabilities to any service
 * Use by extending this class or using its methods
 */
@Injectable()
export class AuditMixin {
  constructor(protected governanceService: GovernanceService) {}

  /**
   * Log an audit entry with automatic user extraction
   */
  async logAudit(
    userId: number,
    action: string,
    entity: string,
    recordId: number | string,
    oldValue?: any,
    newValue?: any,
    metadata?: Record<string, any>,
  ) {
    return this.governanceService.logAudit({
      userId,
      action,
      entity,
      recordId,
      oldValue,
      newValue,
      metadata,
    });
  }

  /**
   * Check if user can perform action on resource
   */
  async canDo(
    userId: number,
    resource: string,
    action: string,
    recordId?: number,
  ): Promise<boolean> {
    return this.governanceService.hasPermission(userId, resource, action, recordId);
  }

  /**
   * Check if user can approve a record
   */
  async canApprove(
    userId: number,
    entity: string,
    recordId: number,
  ): Promise<{ allowed: boolean; reason?: string }> {
    return this.governanceService.canApprove(userId, entity, recordId);
  }

  /**
   * Process approval with automatic audit logging
   */
  async processApproval(
    userId: number,
    entity: string,
    recordId: number,
    action: 'approve' | 'reject',
    comments?: string,
  ) {
    return this.governanceService.processApproval(
      userId,
      entity,
      recordId,
      action,
      comments,
    );
  }

  /**
   * Check if year is protected
   */
  async canModifyYear(
    userId: number,
    resource: string,
    yearId: number,
  ): Promise<boolean> {
    return this.governanceService.checkYearProtection(userId, resource, yearId);
  }

  /**
   * Common permission checks for activities
   */
  async checkActivityPermissions(userId: number, action: string, recordId?: number) {
    return this.governanceService.hasPermission(
      userId,
      ResourceType.ACTIVITY,
      action,
      recordId,
    );
  }

  /**
   * Common permission checks for projects
   */
  async checkProjectPermissions(userId: number, action: string, recordId?: number) {
    return this.governanceService.hasPermission(
      userId,
      ResourceType.PROJECT,
      action,
      recordId,
    );
  }

  /**
   * Common permission checks for budgets
   */
  async checkBudgetPermissions(userId: number, action: string, recordId?: number) {
    return this.governanceService.hasPermission(
      userId,
      ResourceType.BUDGET,
      action,
      recordId,
    );
  }

  /**
   * Common permission checks for KPIs
   */
  async checkKpiPermissions(userId: number, action: string, recordId?: number) {
    return this.governanceService.hasPermission(
      userId,
      ResourceType.KPI,
      action,
      recordId,
    );
  }
}
