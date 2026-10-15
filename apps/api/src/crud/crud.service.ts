import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RESOURCE, ResourceConfig } from './resource-registry';
import { FilterService } from '../filters/filter.service';

@Injectable()
export class CrudService {
  constructor(private db: PrismaService, private filters: FilterService) {}

  cfg(resource: string) {
    const c = RESOURCE[resource];
    if (!c) throw new NotFoundException('Unknown resource');
    return c;
  }

  private delegate(cfg: ResourceConfig) {
    return (this.db as any)[cfg.model] as any;
  }

  private async allowedOrgs(f: any, user: any) {
    return this.filters.orgIds(f, user);
  }

  private async assertPermission(user: any, cfg: ResourceConfig, action: string) {
    if (user.roleCode === 'super_admin') return;
    const role = await this.db.user.findUnique({ where: { id: user.id } });
    if (!role) throw new ForbiddenException('User not found');
    const ok = await this.db.rolePermission.findFirst({
      where: { roleId: role.roleId, resource: cfg.model, actions: { has: action } }
    });
    if (!ok) throw new ForbiddenException('Permission denied');
  }

  private castValue(key: string, v: any) {
    if (v === undefined) return v;
    if (['yearId', 'orgUnitId', 'employeeId', 'projectId', 'kpiId', 'categoryId', 'budgetId', 'managerEmployeeId', 'ownerEmployeeId', 'submittedBy', 'verifiedBy', 'requestedBy', 'parentId', 'objectiveId'].includes(key))
      return v === '' || v === null ? null : Number(v);
    if (['plannedAmount', 'revisedAmount', 'amount', 'targetValue', 'actualValue', 'baselineValue', 'annualTarget', 'plannedBudget', 'actualSpend', 'weight', 'score', 'probability', 'impact'].includes(key)) {
      const n = Number(v); return Number.isFinite(n) ? n : v;
    }
    if (['startDate', 'endDate', 'transactionDate', 'dueDate', 'plannedDate', 'actualDate', 'requestDate'].includes(key) && v) return new Date(v);
    return v;
  }

  private dataFromBody(body: any, cfg: ResourceConfig) {
    const data: any = {};
    for (const k of cfg.fields) if (Object.prototype.hasOwnProperty.call(body, k)) data[k] = this.castValue(k, body[k]);
    return data;
  }

  async list(resource: string, raw: any, user: any) {
    const cfg = this.cfg(resource);
    await this.assertPermission(user, cfg, 'view');
    const f = this.filters.parse(raw);
    this.filters.ensureDates(f);
    const ors = await this.allowedOrgs(f, user);
    const where: any = {};
    if (f.yearId && cfg.fields.includes('yearId')) where.yearId = f.yearId;
    if (f.status && cfg.fields.includes('status')) where.status = f.status;
    if (f.employeeId && cfg.fields.includes('employeeId')) where.employeeId = f.employeeId;
    if (f.projectId && cfg.fields.includes('projectId')) where.projectId = f.projectId;
    if (f.search) {
      const sf = ['name', 'title', 'fullName', 'code', 'description'].filter(k => cfg.fields.includes(k));
      if (sf.length) where.AND = [{ OR: sf.map(k => ({ [k]: { contains: f.search, mode: 'insensitive' } })) }];
    }
    const take = f.pageSize || 25;
    const skip = ((f.page || 1) - 1) * take;
    if (ors && cfg.fields.includes('orgUnitId')) where.AND = [...(where.AND || []), { OR: [{ orgUnitId: { in: ors } }, { branchOrgUnitId: { in: ors } }] }];
    const [items, total] = await Promise.all([
      this.delegate(cfg).findMany({ where, take, skip, orderBy: { id: 'desc' } }),
      this.delegate(cfg).count({ where }),
    ]);
    return { items, total, page: f.page || 1, pageSize: take };
  }

  async get(resource: string, id: number, user: any) {
    const cfg = this.cfg(resource);
    await this.assertPermission(user, cfg, 'view');
    const item = await this.delegate(cfg).findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Record not found');
    await this.authorizeStored(item, cfg, user);
    return item;
  }

  async create(resource: string, body: any, user: any) {
    const cfg = this.cfg(resource);
    await this.assertPermission(user, cfg, 'create');
    const data = this.dataFromBody(body, cfg);
    const created = await this.delegate(cfg).create({ data });
    await this.audit(user.id, 'CREATE', cfg.model, String(created.id), { fields: Object.keys(data) });
    return created;
  }

  async update(resource: string, id: number, body: any, user: any) {
    const cfg = this.cfg(resource);
    await this.assertPermission(user, cfg, 'update');
    const existing = await this.delegate(cfg).findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Record not found');
    await this.authorizeStored(existing, cfg, user);
    const data = this.dataFromBody(body, cfg);
    const protectedFields = ['id', 'createdAt', 'updatedAt', 'passwordHash', 'approvalStatus'];
    for (const k of protectedFields) delete data[k];
    const updated = await this.delegate(cfg).update({ where: { id }, data });
    await this.audit(user.id, 'UPDATE', cfg.model, String(id), { fields: Object.keys(data) });
    return updated;
  }

  async archive(resource: string, id: number, user: any) {
    const cfg = this.cfg(resource);
    await this.assertPermission(user, cfg, 'archive');
    const existing = await this.delegate(cfg).findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Record not found');
    await this.authorizeStored(existing, cfg, user);
    const field = cfg.fields.includes('active') ? 'active' : cfg.fields.includes('status') ? 'status' : null;
    if (field) {
      const out = await this.delegate(cfg).update({ where: { id }, data: { [field]: field === 'active' ? false : 'archived' } });
      await this.audit(user.id, 'ARCHIVE', cfg.model, String(id), {});
      return out;
    }
    return existing;
  }

  private async authorizeStored(item: any, cfg: ResourceConfig, user: any) {
    if (user.roleCode === 'super_admin') return;
    const ids = await this.filters.orgIds({}, user);
    if (!ids) return;
    const orgVal = item.orgUnitId ?? item.branchOrgUnitId;
    if (orgVal != null && !ids.includes(orgVal)) throw new ForbiddenException('Outside organization scope');
  }

  private async audit(userId: number, action: string, entity: string, recordId: string, details: any) {
    await this.db.auditLog.create({ data: { userId, action, entity, recordId, metadata: JSON.stringify(details) } });
  }
}
