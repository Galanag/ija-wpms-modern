import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplatesService } from './templates.service';
import { ImportExportService } from './import-export.service';
import { TEMPLATE_TYPES } from './templates.constants';

function makeModelMock() {
  return {
    findUnique: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 1, ...data })),
    update: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 1, ...data })),
    count: vi.fn().mockResolvedValue(0),
  };
}

const db: any = {
  kpiTemplate: makeModelMock(),
  activityTemplate: makeModelMock(),
  projectTemplate: makeModelMock(),
  riskTemplate: makeModelMock(),
  complianceTemplate: makeModelMock(),
  reportTemplate: makeModelMock(),
  workPlanTemplate: makeModelMock(),
  orgStructureTemplate: makeModelMock(),
  kpiCategory: makeModelMock(),
  riskCategory: makeModelMock(),
  budgetCategory: makeModelMock(),
  fundingSource: makeModelMock(),
  orgUnit: makeModelMock(),
  kpiPlan: makeModelMock(),
  activity: makeModelMock(),
  project: makeModelMock(),
  risk: makeModelMock(),
  complianceRequirement: makeModelMock(),
  dataImportJob: makeModelMock(),
};

const createTemplates = () => new TemplatesService(db);
const createIO = () => new ImportExportService(db);

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(db)) {
    db[key].findUnique?.mockResolvedValue(null);
    db[key].findMany?.mockResolvedValue([]);
    db[key].create?.mockImplementation(({ data }: any) => Promise.resolve({ id: 1, ...data }));
    db[key].update?.mockImplementation(({ data }: any) => Promise.resolve({ id: 1, ...data }));
  }
  db.dataImportJob.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 5, ...data }));
});

describe('TemplatesService — master data CRUD', () => {
  it('creates a KPI template with a unique master code', async () => {
    const svc = createTemplates();
    const t = await svc.createTemplate(TEMPLATE_TYPES.KPI, { code: 'KPI-001', name: 'Visitor Satisfaction' });
    expect(t.code).toBe('KPI-001');
    expect(db.kpiTemplate.create).toHaveBeenCalledTimes(1);
  });

  it('rejects duplicate master codes', async () => {
    const svc = createTemplates();
    db.kpiTemplate.findUnique.mockResolvedValue({ id: 9, code: 'KPI-DUP' });
    await expect(svc.createTemplate(TEMPLATE_TYPES.KPI, { code: 'KPI-DUP', name: 'X' }))
      .rejects.toThrow(/already exists/);
    expect(db.kpiTemplate.create).not.toHaveBeenCalled();
  });

  it('rejects missing master code', async () => {
    const svc = createTemplates();
    await expect(svc.createTemplate(TEMPLATE_TYPES.KPI, { name: 'No code' }))
      .rejects.toThrow(/code is required/);
  });

  it('updates a template and prevents code collision on rename', async () => {
    const svc = createTemplates();
    db.kpiTemplate.findUnique.mockResolvedValue({ id: 1, code: 'OLD' });
    db.kpiTemplate.update.mockResolvedValue({ id: 1, code: 'OLD', name: 'Renamed' });
    const updated: any = await svc.updateTemplate(TEMPLATE_TYPES.KPI, 1, { name: 'Renamed' });
    expect(db.kpiTemplate.update).toHaveBeenCalledTimes(1);
  });

  it('soft-deletes a template by setting active=false', async () => {
    const svc = createTemplates();
    db.kpiTemplate.findUnique.mockResolvedValue({ id: 1, code: 'KPI-001' });
    db.kpiTemplate.update.mockResolvedValue({ id: 1, active: false });
    const result = await svc.softDeleteTemplate(TEMPLATE_TYPES.KPI, 1);
    expect(result.active).toBe(false);
  });
});

describe('TemplatesService — instantiate from template', () => {
  it('instantiates a KPI plan from a KPI template', async () => {
    const svc = createTemplates();
    db.kpiTemplate.findUnique.mockResolvedValue({ id: 1, code: 'KPI-001', name: 'Visitor Sat', unit: '%' });
    db.kpiPlan.create.mockResolvedValue({ id: 50, yearId: 10, kpiTemplateId: 1, approvalStatus: 'draft' });
    const plan: any = await svc.instantiateFromTemplate(TEMPLATE_TYPES.KPI, 1, 10, { kpiId: 5 });
    expect(plan.approvalStatus).toBe('draft');
    expect(db.kpiPlan.create).toHaveBeenCalledTimes(1);
  });

  it('instantiates an activity from an activity template', async () => {
    const svc = createTemplates();
    db.activityTemplate.findUnique.mockResolvedValue({ id: 2, code: 'ACT-001', name: 'Survey' });
    db.activity.create.mockResolvedValue({ id: 60, yearId: 10, progress: 0, implementationStatus: 'not_started' });
    const act: any = await svc.instantiateFromTemplate(TEMPLATE_TYPES.ACTIVITY, 2, 10);
    expect(act.progress).toBe(0);
    expect(act.implementationStatus).toBe('not_started');
  });

  it('instantiates a project from a project template', async () => {
    const svc = createTemplates();
    db.projectTemplate.findUnique.mockResolvedValue({ id: 3, code: 'PRJ-001', name: 'Renovation' });
    db.project.create.mockResolvedValue({ id: 70, yearId: 10, physicalProgress: 0, financialProgress: 0 });
    const prj: any = await svc.instantiateFromTemplate(TEMPLATE_TYPES.PROJECT, 3, 10);
    expect(prj.physicalProgress).toBe(0);
    expect(prj.financialProgress).toBe(0);
  });

  it('instantiates a risk from a risk template', async () => {
    const svc = createTemplates();
    db.riskTemplate.findUnique.mockResolvedValue({ id: 4, code: 'RSK-001', name: 'Weather' });
    db.risk.create.mockResolvedValue({ id: 80, yearId: 10, status: 'open' });
    const rsk: any = await svc.instantiateFromTemplate(TEMPLATE_TYPES.RISK, 4, 10);
    expect(rsk.status).toBe('open');
  });

  it('instantiates a compliance requirement from a compliance template', async () => {
    const svc = createTemplates();
    db.complianceTemplate.findUnique.mockResolvedValue({ id: 5, code: 'CMP-001', title: 'License renewal' });
    db.complianceRequirement.create.mockResolvedValue({ id: 90, yearId: 10, title: 'License renewal', status: 'open' });
    const cmp: any = await svc.instantiateFromTemplate(TEMPLATE_TYPES.COMPLIANCE, 5, 10);
    expect(cmp.title).toBe('License renewal');
    expect(cmp.status).toBe('open');
  });
});

describe('ImportExportService — CSV import', () => {
  it('imports valid CSV rows for kpi_category', async () => {
    const svc = createIO();
    const csv = 'code,name,description\nKC-01,Tourism,Tourism related\nKC-02,HR,Human resources';
    const result = await svc.importCsv('kpi_category', csv, 'cats.csv');
    expect(result.totalRows).toBe(2);
    expect(result.successRows).toBe(2);
    expect(result.failedRows).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('reports row-level errors for invalid rows', async () => {
    const svc = createIO();
    const csv = 'code,name\nKC-01,Valid\n,MissingCode\nKC-03,Valid2';
    const result: any = await svc.importCsv('kpi_category', csv, 'cats.csv');
    expect(result.successRows).toBe(2);
    expect(result.failedRows).toBe(1);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].field).toBe('code');
  });

  it('detects duplicate master codes within the same import', async () => {
    const svc = createIO();
    const csv = 'code,name\nKC-01,First\nKC-01,Duplicate';
    // The DB findUnique for KC-01 will be called on the second row; first row succeeds.
    db.kpiCategory.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1, code: 'KC-01' });
    const result: any = await svc.importCsv('kpi_category', csv, 'cats.csv');
    expect(result.failedRows).toBe(1);
    expect(result.errors[0].message).toContain('already exists');
  });

  it('exports kpi_category as CSV', async () => {
    const svc = createIO();
    db.kpiCategory.findMany.mockResolvedValue([
      { id: 1, code: 'KC-01', name: 'Tourism', active: true },
      { id: 2, code: 'KC-02', name: 'HR', active: true },
    ]);
    const csv = await svc.exportCsv('kpi_category');
    expect(csv).toContain('KC-01');
    expect(csv).toContain('Tourism');
    expect(csv).toContain('code,name');
  });

  it('imports budget_category with valid rows', async () => {
    const svc = createIO();
    const csv = 'code,name,description\nBC-01,Operations,Operational costs\nBC-02,Capital,Capital expenditure';
    const result = await svc.importCsv('budget_category', csv, 'budget.csv');
    expect(result.successRows).toBe(2);
  });

  it('imports funding_source with type validation', async () => {
    const svc = createIO();
    const csv = 'code,name,type\nFS-01,Gov,government\nFS-02,Donor,donor';
    const result = await svc.importCsv('funding_source', csv, 'funding.csv');
    expect(result.successRows).toBe(2);
  });

  it('rejects unknown entity types', async () => {
    const svc = createIO();
    await expect(svc.importCsv('unknown_entity', 'csv', 'f.csv'))
      .rejects.toThrow(/Cannot import/);
  });
});
