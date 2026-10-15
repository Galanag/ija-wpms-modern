import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async getOrgTree() {
    const units = await this.prisma.orgUnit.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: {
        OrgUnit: { include: { OrgUnit: true } },
      },
    });
    return this.buildTree(units);
  }

  private buildTree(units: any[], parentId: number | null = null): any[] {
    return units
      .filter(u => u.parentId === parentId)
      .map(u => ({
        id: u.id,
        name: u.name,
        code: u.code,
        unitType: u.unitType,
        description: u.description,
        children: this.buildTree(units, u.id),
      }));
  }

  async getOrgUnitById(id: number) {
    return this.prisma.orgUnit.findUnique({
      where: { id },
      include: {
        OrgUnit: true,
        Employee: true,
      },
    });
  }

  async getDescendants(id: number): Promise<number[]> {
    const descendants: number[] = [];
    const children = await this.prisma.orgUnit.findMany({ where: { parentId: id } });
    for (const child of children) {
      descendants.push(child.id);
      const childDescendants = await this.getDescendants(child.id);
      descendants.push(...childDescendants);
    }
    return descendants;
  }

  async getLineage(id: number): Promise<any[]> {
    const lineage: any[] = [];
    let current = await this.prisma.orgUnit.findUnique({ where: { id } });
    while (current) {
      lineage.unshift(current);
      if (current.parentId) {
        current = await this.prisma.orgUnit.findUnique({ where: { id: current.parentId } });
      } else {
        break;
      }
    }
    return lineage;
  }

  async createOrgUnit(data: { parentId?: number; unitType: string; name: string; code?: string; description?: string }, userId?: number) {
    if (!data.name) throw new BadRequestException('name is required');
    if (!data.unitType) throw new BadRequestException('unitType is required');
    const unit = await this.prisma.orgUnit.create({
      data: {
        parentId: data.parentId,
        unitType: data.unitType,
        name: data.name,
        code: data.code,
        description: data.description,
        active: true,
      },
    });
    await this.logOrgUnitAudit(userId, 'CREATE', unit.id, null, unit);
    return unit;
  }

  async updateOrgUnit(id: number, data: any, userId?: number) {
    const existing = await this.prisma.orgUnit.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Org unit ${id} not found`);
    const unit = await this.prisma.orgUnit.update({ where: { id }, data: { ...data } });
    await this.logOrgUnitAudit(userId, 'UPDATE', id, existing, unit);
    return unit;
  }

  async deleteOrgUnit(id: number, userId?: number) {
    const existing = await this.prisma.orgUnit.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Org unit ${id} not found`);
    try {
      const unit = await this.prisma.orgUnit.update({ where: { id }, data: { active: false } });
      await this.logOrgUnitAudit(userId, 'ARCHIVE', id, existing, unit);
      return unit;
    } catch (err: any) {
      if (err?.code === 'P2003') throw new ConflictException('Org unit is referenced by other records');
      throw err;
    }
  }

  private async logOrgUnitAudit(userId: number | undefined, action: string, recordId: number, oldValue: any, newValue: any) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: userId ?? null,
          action,
          entity: 'OrgUnit',
          recordId: String(recordId),
          oldValue: oldValue ? JSON.stringify(oldValue) : null,
          newValue: newValue ? JSON.stringify(newValue) : null,
        },
      });
    } catch {
      // audit logging must never block the mutation
    }
  }

  async getEmployeesByOrgUnit(orgUnitId: number) {
    return this.prisma.employee.findMany({
      where: { orgUnitId, active: true },
      include: { OrgUnit: true },
    });
  }


  async getStatistics() {
    const units = await this.prisma.orgUnit.findMany();
    const employees = await this.prisma.employee.findMany();
    
    const byType: Record<string, number> = {};
    units.forEach(u => {
      byType[u.unitType] = (byType[u.unitType] || 0) + 1;
    });
    
    return {
      organization: {
        totalUnits: units.length,
        byType,
      },
      employees: {
        total: employees.length,
        active: employees.filter(e => e.active).length,
        inactive: employees.filter(e => !e.active).length,
      },
    };
  }

  async getAllEmployees(includeInactive?: boolean) {
    return this.prisma.employee.findMany({
      where: includeInactive ? {} : { active: true },
      include: { OrgUnit: true },
      orderBy: { fullName: 'asc' },
    });
  }

  async getEmployeeById(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { OrgUnit: true },
    });
    if (!employee) throw new NotFoundException(`Employee ${id} not found`);
    return employee;
  }

  async createEmployee(data: any, userId?: number) {
    if (!data.fullName) throw new BadRequestException('fullName is required');
    const employee = await this.prisma.employee.create({
      data: {
        employeeNo: data.employeeNo || undefined,
        fullName: data.fullName,
        jobTitle: data.jobTitle,
        orgUnitId: data.orgUnitId || undefined,
        email: data.email,
        phone: data.phone,
        active: data.active ?? true,
      },
      include: { OrgUnit: true },
    });
    await this.logEmployeeAudit(userId, 'CREATE', employee.id, null, employee);
    return employee;
  }

  async updateEmployee(id: number, data: any, userId?: number) {
    const existing = await this.prisma.employee.findUnique({ where: { id }, include: { OrgUnit: true } });
    if (!existing) throw new NotFoundException(`Employee ${id} not found`);
    const employee = await this.prisma.employee.update({
      where: { id },
      data: {
        employeeNo: data.employeeNo,
        fullName: data.fullName,
        jobTitle: data.jobTitle,
        orgUnitId: data.orgUnitId,
        email: data.email,
        phone: data.phone,
        active: data.active,
      },
      include: { OrgUnit: true },
    });
    await this.logEmployeeAudit(userId, 'UPDATE', id, existing, employee);
    return employee;
  }

  async deleteEmployee(id: number, userId?: number) {
    const existing = await this.prisma.employee.findUnique({ where: { id }, include: { OrgUnit: true } });
    if (!existing) throw new NotFoundException(`Employee ${id} not found`);
    try {
      await this.prisma.employee.delete({ where: { id } });
    } catch (err: any) {
      // P2003: foreign key constraint — employee is referenced by planning data
      if (err?.code === 'P2003') {
        throw new ConflictException('Employee is referenced by planning/HR records; deactivate instead of deleting');
      }
      throw err;
    }
    await this.logEmployeeAudit(userId, 'DELETE', id, existing, null);
    return { ok: true, id };
  }

  private async logEmployeeAudit(userId: number | undefined, action: string, recordId: number, oldValue: any, newValue: any) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: userId ?? null,
          action,
          entity: 'Employee',
          recordId: String(recordId),
          oldValue: oldValue ? JSON.stringify(oldValue) : null,
          newValue: newValue ? JSON.stringify(newValue) : null,
        },
      });
    } catch {
      // audit logging must never block the mutation
    }
  }
}
