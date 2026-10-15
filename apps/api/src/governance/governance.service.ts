import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PermissionAction,
  ResourceType,
  DEFAULT_ROLE_TEMPLATES,
  SEPARATION_OF_DUTIES_RESOURCES,
  YEAR_PROTECTED_RESOURCES,
} from './permissions';

export interface AuditLogEntry {
  userId: number;
  action: string;
  entity: string;
  recordId: number | string;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
}

@Injectable()
export class GovernanceService {
  constructor(private prisma: PrismaService) {}

  // ==================== ROLE MANAGEMENT ====================

  async getRoles() {
    return this.prisma.role.findMany({
      include: {
        RolePermission: true,
        _count: { select: { User: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getRole(id: number) {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        RolePermission: true,
        User: { select: { id: true, username: true, fullName: true, active: true } },
      },
    });
  }

  async createRole(dto: {
    name: string;
    code: string;
    description?: string;
    permissions: { resource: string; actions: string[] }[];
  }) {
    const existing = await this.prisma.role.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new BadRequestException(`Role with code '${dto.code}' already exists`);
    }

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        RolePermission: {
          create: dto.permissions.map(p => ({
            resource: p.resource,
            actions: p.actions,
          })),
        },
      },
      include: { RolePermission: true },
    });

    await this.logAudit({
      userId: 0,
      action: 'CREATE_ROLE',
      entity: 'Role',
      recordId: role.id,
      newValue: { name: role.name, code: role.code },
    });

    return role;
  }

  async updateRole(id: number, dto: {
    name?: string;
    description?: string;
    permissions?: { resource: string; actions: string[] }[];
  }) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new BadRequestException('Role not found');
    }

    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be modified');
    }

    if (dto.permissions) {
      await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
      await this.prisma.rolePermission.createMany({
        data: dto.permissions.map(p => ({
          roleId: id,
          resource: p.resource,
          actions: p.actions,
        })),
      });
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
      include: { RolePermission: true },
    });

    await this.logAudit({
      userId: 0,
      action: 'UPDATE_ROLE',
      entity: 'Role',
      recordId: id,
      oldValue: { name: role.name },
      newValue: { name: updated.name },
    });

    return updated;
  }

  async deleteRole(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { User: true } } },
    });

    if (!role) {
      throw new BadRequestException('Role not found');
    }

    if (role.isSystem) {
      throw new BadRequestException('System roles cannot be deleted');
    }

    if ((role._count as any)?.User > 0) {
      throw new BadRequestException('Cannot delete role with assigned users');
    }

    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await this.prisma.role.delete({ where: { id } });

    await this.logAudit({
      userId: 0,
      action: 'DELETE_ROLE',
      entity: 'Role',
      recordId: id,
      oldValue: { name: role.name },
    });

    return { success: true };
  }

  async initializeDefaultRoles() {
    const existingRoles = await this.prisma.role.findMany({ where: { isSystem: true } });
    if (existingRoles.length > 0) {
      return { message: 'Default roles already initialized' };
    }

    for (const [, template] of Object.entries(DEFAULT_ROLE_TEMPLATES)) {
      const permissions = [];
      for (const resource of template.resources as string[]) {
        permissions.push({ resource, actions: template.permissions });
      }

      await this.prisma.role.create({
        data: {
          name: template.name,
          code: template.code,
          description: template.description,
          isSystem: true,
          RolePermission: {
            create: permissions,
          },
        },
      });
    }

    return { message: 'Default roles initialized successfully' };
  }

  // ==================== PERMISSION CHECKING ====================

  async hasPermission(
    userId: number,
    resource: string,
    action: string,
    recordId?: number,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { Role: { include: { RolePermission: true } } },
    });

    if (!user || !user.Role) {
      return false;
    }

    if (!user.active) {
      return false;
    }

    if (user.Role.code === 'SYS_ADMIN' || user.Role.code === 'super_admin') {
      return true;
    }

    const permission = user.Role.RolePermission.find(
      (p: any) => p.resource === resource,
    );

    if (!permission) {
      return false;
    }

    const hasPermission = permission.actions.includes(action);
    
    if (hasPermission && ['approve', 'reject', 'close'].includes(action)) {
      const canApprove = await this.checkSeparationOfDuties(
        userId,
        resource,
        recordId,
      );
      if (!canApprove) {
        return false;
      }
    }

    return hasPermission;
  }

  async checkSeparationOfDuties(
    userId: number,
    resource: string,
    recordId?: number,
  ): Promise<boolean> {
    if (!recordId) {
      return true;
    }

    if (!SEPARATION_OF_DUTIES_RESOURCES.includes(resource as any)) {
      return true;
    }

    const record = await this.getRecordCreator(resource, recordId);
    if (!record) {
      return true;
    }

    const creatorId = record.createdBy || record.employeeId || record.userId;
    if (creatorId === userId) {
      return false;
    }

    return true;
  }

  private async getRecordCreator(resource: string, recordId: number): Promise<any> {
    const modelMap: Record<string, string> = {
      [ResourceType.ACTIVITY]: 'activity',
      [ResourceType.PROJECT]: 'project',
      [ResourceType.BUDGET]: 'budget',
      [ResourceType.KPI_PLAN]: 'kpiPlan',
      [ResourceType.REPORT]: 'report',
    };

    const model = modelMap[resource];
    if (!model) {
      return null;
    }

    try {
      return await (this.prisma as any)[model].findUnique({
        where: { id: recordId },
        select: { createdBy: true, employeeId: true, userId: true },
      });
    } catch {
      return null;
    }
  }

  async checkYearProtection(
    userId: number,
    resource: string,
    yearId: number,
  ): Promise<boolean> {
    if (!YEAR_PROTECTED_RESOURCES.includes(resource as any)) {
      return true;
    }

    const year = await this.prisma.planningYear.findUnique({
      where: { id: yearId },
    });

    if (!year) {
      return true;
    }

    if (year.status === 'closed' || year.status === 'archived') {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { Role: true },
      });

      if (!user) {
        return false;
      }

      if (user.Role.code === 'SYS_ADMIN' || user.Role.code === 'super_admin') {
        return true;
      }

      const permission = await this.prisma.rolePermission.findFirst({
        where: {
          roleId: user.roleId,
          resource: 'year_override',
          actions: { has: 'modify_closed' },
        },
      });

      if (!permission) {
        return false;
      }
    }

    return true;
  }

  async assertYearWritable(userId: number, resource: string, yearId?: number) {
    if (yearId == null) {
      return;
    }
    const allowed = await this.checkYearProtection(userId, resource, yearId);
    if (!allowed) {
      throw new ForbiddenException('Cannot modify records in closed fiscal years');
    }
  }

  // ==================== USER PERMISSIONS ====================

  async getUserPermissions(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        Role: {
          include: { RolePermission: true },
        },
        OrgUnit: true,
        Employee: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const permissions: Record<string, string[]> = {};
    user.Role.RolePermission.forEach((p: any) => {
      permissions[p.resource] = p.actions;
    });

    return {
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      role: {
        id: user.Role.id,
        name: user.Role.name,
        code: user.Role.code,
      },
      organization: user.OrgUnit ? {
        id: user.OrgUnit.id,
        name: user.OrgUnit.name,
      } : null,
      employee: user.Employee ? {
        id: user.Employee.id,
        fullName: user.Employee.fullName,
        
      } : null,
      permissions,
      isAdmin: user.Role.code === 'SYS_ADMIN' || user.Role.code === 'super_admin',
    };
  }

  // ==================== APPROVAL WORKFLOW ====================

  async canApprove(
    userId: number,
    entity: string,
    recordId: number,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const hasPermission = await this.hasPermission(
      userId,
      entity,
      PermissionAction.APPROVE,
      recordId,
    );

    if (!hasPermission) {
      return { allowed: false, reason: 'User does not have approval permission' };
    }

    const canApprove = await this.checkSeparationOfDuties(userId, entity, recordId);
    if (!canApprove) {
      return { allowed: false, reason: 'Users cannot approve their own submissions (separation of duties)' };
    }

    return { allowed: true };
  }

  async processApproval(
    userId: number,
    entity: string,
    recordId: number,
    action: 'approve' | 'reject',
    comments?: string,
  ) {
    const check = await this.canApprove(userId, entity, recordId);
    if (!check.allowed) {
      throw new ForbiddenException(check.reason);
    }

    const record = await this.getRecordForApproval(entity, recordId);
    if (!record) {
      throw new BadRequestException('Record not found');
    }

    const oldStatus = record.approvalStatus || record.status;
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const updated = await this.updateRecordForApproval(entity, recordId, {
      approvalStatus: newStatus,
      approvedBy: userId,
      approvedAt: new Date(),
      approvalComments: comments,
    });

    await this.logAudit({
      userId,
      action: action === 'approve' ? 'APPROVE' : 'REJECT',
      entity,
      recordId,
      oldValue: { approvalStatus: oldStatus },
      newValue: { approvalStatus: newStatus, comments },
    });

    return updated;
  }

  private async getRecordForApproval(entity: string, recordId: number): Promise<any> {
    const modelMap: Record<string, string> = {
      activity: 'activity',
      project: 'project',
      budget: 'budget',
      kpi_plan: 'kpiPlan',
      kpiPlan: 'kpiPlan',
    };

    const model = modelMap[entity];
    if (!model) {
      return null;
    }

    try {
      return await (this.prisma as any)[model].findUnique({
        where: { id: recordId },
      });
    } catch {
      return null;
    }
  }

  private async updateRecordForApproval(
    entity: string,
    recordId: number,
    data: any,
  ): Promise<any> {
    const modelMap: Record<string, string> = {
      activity: 'activity',
      project: 'project',
      budget: 'budget',
      kpi_plan: 'kpiPlan',
      kpiPlan: 'kpiPlan',
    };

    const model = modelMap[entity];
    if (!model) {
      throw new BadRequestException('Unknown entity type');
    }

    return (this.prisma as any)[model].update({
      where: { id: recordId },
      data,
    });
  }

  // ==================== AUDIT LOGGING ====================

  async logAudit(entry: AuditLogEntry) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          entity: entry.entity,
          recordId: String(entry.recordId),
          oldValue: entry.oldValue ? JSON.stringify(entry.oldValue) : null,
          newValue: entry.newValue ? JSON.stringify(entry.newValue) : null,
          ipAddress: entry.metadata?.ipAddress,
          userAgent: entry.metadata?.userAgent,
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        },
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  }

  async getAuditLog(filters: {
    userId?: number;
    entity?: string;
    action?: string;
    recordId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.entity) where.entity = filters.entity;
    if (filters.action) where.action = filters.action;
    if (filters.recordId) where.recordId = filters.recordId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [records, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          User: { select: { id: true, username: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: records.map(r => ({
        ...r,
        oldValue: r.oldValue ? JSON.parse(r.oldValue) : null,
        newValue: r.newValue ? JSON.parse(r.newValue) : null,
        metadata: r.metadata ? JSON.parse(r.metadata) : null,
        user: (r as any).User,
      })),
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  }

  async getEntityHistory(entity: string, recordId: number) {
    const records = await this.prisma.auditLog.findMany({
      where: {
        entity,
        recordId: String(recordId),
      },
      include: {
        User: { select: { id: true, username: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(r => ({
      ...r,
      oldValue: r.oldValue ? JSON.parse(r.oldValue) : null,
      newValue: r.newValue ? JSON.parse(r.newValue) : null,
      metadata: r.metadata ? JSON.parse(r.metadata) : null,
      user: (r as any).User,
    }));
  }
}
