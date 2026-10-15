import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TEMPLATE_TYPES, TemplateType } from './templates.constants';

@Injectable()
export class TemplatesService {
  constructor(private db: PrismaService) {}

  /**
   * Map a template type to the Prisma model accessor.
   * Each template model has a standard shape: { code (unique), name, active, ... }.
   */
  private modelFor(type: string) {
    const map: Record<string, any> = {
      [TEMPLATE_TYPES.KPI]: this.db.kpiTemplate,
      [TEMPLATE_TYPES.ACTIVITY]: this.db.activityTemplate,
      [TEMPLATE_TYPES.PROJECT]: this.db.projectTemplate,
      [TEMPLATE_TYPES.RISK]: this.db.riskTemplate,
      [TEMPLATE_TYPES.COMPLIANCE]: this.db.complianceTemplate,
      [TEMPLATE_TYPES.REPORT]: this.db.reportTemplate,
      [TEMPLATE_TYPES.WORKPLAN]: this.db.workPlanTemplate,
      [TEMPLATE_TYPES.ORG_STRUCTURE]: this.db.orgStructureTemplate,
    };
    return map[type] || null;
  }

  async listTemplates(type: string, includeInactive = false) {
    const model = this.modelFor(type as TemplateType);
    if (!model) throw new BadRequestException(`Unknown template type: ${type}`);
    return model.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { code: 'asc' },
    });
  }

  async getTemplate(type: string, id: number) {
    const model = this.modelFor(type as TemplateType);
    if (!model) throw new BadRequestException(`Unknown template type: ${type}`);
    const row = await model.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`${type} #${id} not found`);
    return row;
  }

  /**
   * Enforce master-code uniqueness: the DB already has @unique on code,
   * but we give a clear 409 instead of a raw Prisma error.
   */
  async createTemplate(type: string, data: any) {
    const model = this.modelFor(type as TemplateType);
    if (!model) throw new BadRequestException(`Unknown template type: ${type}`);
    if (!data.code || !data.code.trim()) {
      throw new BadRequestException('Master code is required');
    }
    const existing = await model.findUnique({ where: { code: data.code } });
    if (existing) {
      throw new BadRequestException(`Master code '${data.code}' already exists for ${type}`);
    }
    return model.create({ data });
  }

  async updateTemplate(type: string, id: number, data: any) {
    const model = this.modelFor(type as TemplateType);
    if (!model) throw new BadRequestException(`Unknown template type: ${type}`);
    const current = await model.findUnique({ where: { id } });
    if (!current) throw new NotFoundException(`${type} #${id} not found`);

    // Uniqueness: if code changed, verify no collision.
    if (data.code && data.code !== current.code) {
      const clash = await model.findUnique({ where: { code: data.code } });
      if (clash) {
        throw new BadRequestException(`Master code '${data.code}' already exists for ${type}`);
      }
    }
    return model.update({ where: { id }, data });
  }

  async softDeleteTemplate(type: string, id: number) {
    const model = this.modelFor(type as TemplateType);
    if (!model) throw new BadRequestException(`Unknown template type: ${type}`);
    const current = await model.findUnique({ where: { id } });
    if (!current) throw new NotFoundException(`${type} #${id} not found`);
    return model.update({ where: { id }, data: { active: false } });
  }

  /**
   * Instantiate a year-specific record from a template.
   * Only copies master fields — never actuals or year-specific state.
   */
  async instantiateFromTemplate(type: string, templateId: number, yearId: number, overrides: any = {}) {
    const template = await this.getTemplate(type, templateId);
    const data: any = { yearId, active: true, ...overrides };

    switch (type) {
      case TEMPLATE_TYPES.KPI:
        data.kpiTemplateId = template.id;
        const kpiId = overrides.kpiId != null ? Number(overrides.kpiId) : undefined;
        if (kpiId == null) {
          throw new BadRequestException('kpiId is required to instantiate a KPI template');
        }
        data.kpiId = kpiId;
        data.approvalStatus = 'draft';
        delete data.active;
        return this.db.kpiPlan.create({ data });
      case TEMPLATE_TYPES.ACTIVITY:
        data.activityTemplateId = template.id;
        data.title = template.name;
        data.implementationStatus = 'not_started';
        data.approvalStatus = 'draft';
        data.progress = 0;
        return this.db.activity.create({ data });
      case TEMPLATE_TYPES.PROJECT:
        data.projectTemplateId = template.id;
        data.name = template.name;
        data.status = 'planned';
        data.approvalStatus = 'draft';
        data.physicalProgress = 0;
        data.financialProgress = 0;
        return this.db.project.create({ data });
      case TEMPLATE_TYPES.RISK:
        data.riskTemplateId = template.id;
        data.title = template.name;
        data.status = 'open';
        return this.db.risk.create({ data });
      case TEMPLATE_TYPES.COMPLIANCE:
        data.complianceTemplateId = template.id;
        data.title = template.title;
        data.status = 'open';
        return this.db.complianceRequirement.create({ data });
      default:
        throw new BadRequestException(`Cannot instantiate ${type}`);
    }
  }
}
