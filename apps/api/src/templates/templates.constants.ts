/**
 * Template entity keys — drives routing, permissions, and import/export.
 */
export const TEMPLATE_TYPES = {
  KPI: 'kpi_template',
  ACTIVITY: 'activity_template',
  PROJECT: 'project_template',
  RISK: 'risk_template',
  COMPLIANCE: 'compliance_template',
  REPORT: 'report_template',
  WORKPLAN: 'workplan_template',
  ORG_STRUCTURE: 'org_structure_template',
} as const;

export type TemplateType = (typeof TEMPLATE_TYPES)[keyof typeof TEMPLATE_TYPES];

export const TEMPLATE_LABELS: Record<TemplateType, string> = {
  [TEMPLATE_TYPES.KPI]: 'KPI Definitions',
  [TEMPLATE_TYPES.ACTIVITY]: 'Activities',
  [TEMPLATE_TYPES.PROJECT]: 'Projects',
  [TEMPLATE_TYPES.RISK]: 'Risks',
  [TEMPLATE_TYPES.COMPLIANCE]: 'Compliance Requirements',
  [TEMPLATE_TYPES.REPORT]: 'Reporting Formats',
  [TEMPLATE_TYPES.WORKPLAN]: 'Work-Plan Structures',
  [TEMPLATE_TYPES.ORG_STRUCTURE]: 'Organizational Structures',
};

/**
 * Master-data entities that support CSV/Excel import/export.
 */
export const IMPORTABLE_ENTITIES = {
  ...TEMPLATE_TYPES,
  BUDGET_CATEGORY: 'budget_category',
  FUNDING_SOURCE: 'funding_source',
  KPI_CATEGORY: 'kpi_category',
  RISK_CATEGORY: 'risk_category',
  ORG_UNIT: 'org_unit',
} as const;

export type ImportableEntity = (typeof IMPORTABLE_ENTITIES)[keyof typeof IMPORTABLE_ENTITIES];

/**
 * Three data tiers — documented for the UI and validation rules.
 */
export const DATA_TIERS = {
  MASTER: 'master',
  YEAR_SPECIFIC: 'year',
  PERFORMANCE: 'actual',
} as const;

export type DataTier = (typeof DATA_TIERS)[keyof typeof DATA_TIERS];

export const ENTITY_TIER: Record<string, DataTier> = {
  kpi_template: DATA_TIERS.MASTER,
  activity_template: DATA_TIERS.MASTER,
  project_template: DATA_TIERS.MASTER,
  risk_template: DATA_TIERS.MASTER,
  compliance_template: DATA_TIERS.MASTER,
  report_template: DATA_TIERS.MASTER,
  workplan_template: DATA_TIERS.MASTER,
  org_structure_template: DATA_TIERS.MASTER,
  budget_category: DATA_TIERS.MASTER,
  funding_source: DATA_TIERS.MASTER,
  kpi_category: DATA_TIERS.MASTER,
  risk_category: DATA_TIERS.MASTER,
  org_unit: DATA_TIERS.MASTER,
  kpi_plan: DATA_TIERS.YEAR_SPECIFIC,
  activity: DATA_TIERS.YEAR_SPECIFIC,
  project: DATA_TIERS.YEAR_SPECIFIC,
  risk: DATA_TIERS.YEAR_SPECIFIC,
  compliance_requirement: DATA_TIERS.YEAR_SPECIFIC,
  kpi_actual: DATA_TIERS.PERFORMANCE,
  task_update: DATA_TIERS.PERFORMANCE,
  finance_entry: DATA_TIERS.PERFORMANCE,
};
