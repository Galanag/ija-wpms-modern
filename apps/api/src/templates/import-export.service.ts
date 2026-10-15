import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { z } from 'zod';

/* A single row-level error reported back to the caller. */
interface RowError {
  row: number;     // 1-based, excluding header
  field?: string;
  message: string;
  value?: string;
}

interface ImportResult {
  jobId: number;
  entityType: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  status: string;
  errors: RowError[];
}

@Injectable()
export class ImportExportService {
  constructor(private db: PrismaService) {}

  /**
   * Return the Zod validation schema for a given importable entity.
   * Each schema enforces required fields, types, and master-code uniqueness.
   */
  private schemaFor(entityType: string): z.ZodObject<any> | null {
    const base = {
      kpi_category: z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
      }),
      risk_category: z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }),
      budget_category: z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
      }),
      funding_source: z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        type: z.enum(['government','donor','internal','other']).optional(),
        description: z.string().optional(),
      }),
      kpi_template: z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        area: z.string().optional(),
        unit: z.string().optional(),
        frequency: z.enum(['monthly','quarterly','semi_annual','annual']).optional(),
        direction: z.enum(['higher_is_better','lower_is_better']).optional(),
        formula: z.string().optional(),
        definition: z.string().optional(),
      }),
      activity_template: z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        unit: z.string().optional(),
        priority: z.enum(['low','medium','high']).optional(),
      }),
      project_template: z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        priority: z.enum(['low','medium','high']).optional(),
      }),
      risk_template: z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        likelihood: z.enum(['low','medium','high']).optional(),
        impact: z.enum(['low','medium','high']).optional(),
        mitigationPlan: z.string().optional(),
      }),
      compliance_template: z.object({
        code: z.string().min(1),
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        authority: z.string().optional(),
        priority: z.enum(['low','medium','high']).optional(),
      }),
      report_template: z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        reportType: z.string().min(1),
        frequency: z.enum(['monthly','quarterly','semi_annual','annual']).optional(),
        description: z.string().optional(),
      }),
      workplan_template: z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
      }),
      org_unit: z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        unitType: z.string().min(1),
        description: z.string().optional(),
      }),
    };
    return (base as any)[entityType] || null;
  }

  /**
   * Map entity type to the Prisma model used for creation.
   */
  private modelFor(entityType: string): any {
    const map: Record<string, any> = {
      kpi_category: this.db.kpiCategory,
      risk_category: this.db.riskCategory,
      budget_category: this.db.budgetCategory,
      funding_source: this.db.fundingSource,
      kpi_template: this.db.kpiTemplate,
      activity_template: this.db.activityTemplate,
      project_template: this.db.projectTemplate,
      risk_template: this.db.riskTemplate,
      compliance_template: this.db.complianceTemplate,
      report_template: this.db.reportTemplate,
      workplan_template: this.db.workPlanTemplate,
      org_unit: this.db.orgUnit,
    };
    return map[entityType] || null;
  }

  /**
   * Parse a CSV string into rows of objects.
   * Expects the first line to be the header.
   */
  private parseCsv(csv: string): { headers: string[]; rows: Record<string, string>[] } {
    const lines = csv.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = (lines[0] || '').split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i] || '';
      const raw = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => { obj[h] = raw[idx] || ''; });
      rows.push(obj);
    }
    return { headers, rows };
  }

  /**
   * Validate and import CSV rows for an entity.
   * All rows are validated first; only valid rows are committed.
   * Returns detailed per-row error reporting.
   */
  async importCsv(entityType: string, csvContent: string, fileName: string, userId?: number): Promise<ImportResult> {
    const schema = this.schemaFor(entityType);
    const model = this.modelFor(entityType);
    if (!schema || !model) {
      throw new BadRequestException(`Cannot import entity type: ${entityType}`);
    }

    const { rows } = this.parseCsv(csvContent);
    const errors: RowError[] = [];
    const valid: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 1;
      // Strip empty-string values so Zod's .optional() works as expected.
      const cleaned: Record<string, any> = {};
      const currentRow = rows[i];
      if (currentRow) {
        for (const [k, v] of Object.entries(currentRow)) {
          if (v !== '' && v != null) cleaned[k] = v;
        }
      }
      const result = schema.safeParse(cleaned);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            row: rowNum,
            field: issue.path.join('.'),
            message: issue.message,
            value: issue.code,
          });
        }
        continue;
      }
      // Master-code uniqueness check (DB has @unique but we fail cleanly).
      const data = result.data as any;
      if (data.code) {
        const clash = await model.findUnique({ where: { code: data.code } }).catch(() => null);
        if (clash) {
          errors.push({ row: rowNum, field: 'code', message: `Code '${data.code}' already exists`, value: data.code });
          continue;
        }
      }
      valid.push(data);
    }

    // Commit valid rows.
    let successRows = 0;
    try {
      for (const item of valid) {
        await model.create({ data: item });
        successRows++;
      }
    } catch (e: any) {
      errors.push({ row: 0, message: `Commit failed after ${successRows} rows: ${e.message}` });
    }

    const job = await this.db.dataImportJob.create({
      data: {
        entityType,
        fileName,
        totalRows: rows.length,
        successRows,
        failedRows: rows.length - successRows,
        status: errors.length === 0 ? 'completed' : (successRows > 0 ? 'completed_with_errors' : 'failed'),
        errors: errors.length ? (errors as any) : undefined,
        createdBy: userId,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });

    return {
      jobId: job.id,
      entityType,
      totalRows: rows.length,
      successRows,
      failedRows: rows.length - successRows,
      status: job.status,
      errors,
    };
  }

  /**
   * Export an entity collection as CSV.
   */
  async exportCsv(entityType: string): Promise<string> {
    const model = this.modelFor(entityType);
    if (!model) throw new BadRequestException(`Cannot export entity type: ${entityType}`);
    const rows = await model.findMany({ orderBy: { id: 'asc' } });
    if (rows.length === 0) return '';
    const first = rows[0];
    if (!first) return '';
    const headers = Object.keys(first).filter(k => k !== 'structure');
    const escape = (v: any) => {
      if (v == null) return '';
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(',')];
    for (const row of rows) {
      lines.push(headers.map(h => escape((row as any)[h])).join(','));
    }
    return lines.join('\n');
  }

  async listImportJobs(entityType?: string) {
    return this.db.dataImportJob.findMany({
      where: entityType ? { entityType } : {},
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getImportJob(id: number) {
    return this.db.dataImportJob.findUnique({ where: { id } });
  }
}
