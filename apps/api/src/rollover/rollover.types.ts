// ==================== ROLLOVER ITEM CONSTANTS ====================

/**
 * Item keys for the guided rollover. Each maps to a set of source/target
 * models and defines whether it represents reusable STRUCTURE (copied)
 * or transient PERFORMANCE data (never copied).
 */
export const ROLLOVER_ITEMS = {
  // Structure — reusable definitions, copied into the target year.
  THEME: 'theme',
  GOAL: 'goal',
  OBJECTIVE: 'objective',
  KPI: 'kpi',
  ORG_UNIT: 'org_unit',
  ACTIVITY: 'activity',
  PROJECT_TEMPLATE: 'project_template',
  RISK_TEMPLATE: 'risk_template',
  COMPLIANCE_TEMPLATE: 'compliance_template',
  BUDGET_CATEGORY: 'budget_category',
  FUNDING_SOURCE: 'funding_source',
} as const;

export type RolloverItemKey = (typeof ROLLOVER_ITEMS)[keyof typeof ROLLOVER_ITEMS];

/**
 * The full ordered list of copyable structure items as presented in the wizard.
 */
export const STRUCTURE_ITEMS: { key: RolloverItemKey; label: string; description: string }[] = [
  { key: ROLLOVER_ITEMS.THEME, label: 'Strategic themes', description: 'Reusable strategic theme definitions' },
  { key: ROLLOVER_ITEMS.GOAL, label: 'Goals', description: 'Goal definitions (targets reset)' },
  { key: ROLLOVER_ITEMS.OBJECTIVE, label: 'Objectives', description: 'Objective definitions (targets reset)' },
  { key: ROLLOVER_ITEMS.KPI, label: 'KPI definitions', description: 'Reusable KPI definitions and plans (targets/baselines reset)' },
  { key: ROLLOVER_ITEMS.ORG_UNIT, label: 'Organization structure', description: 'Organization unit hierarchy' },
  { key: ROLLOVER_ITEMS.ACTIVITY, label: 'Activities', description: 'Activity templates (progress reset)' },
  { key: ROLLOVER_ITEMS.PROJECT_TEMPLATE, label: 'Project templates', description: 'Reusable project templates (progress reset)' },
  { key: ROLLOVER_ITEMS.RISK_TEMPLATE, label: 'Risk templates', description: 'Reusable risk registers (review state reset)' },
  { key: ROLLOVER_ITEMS.COMPLIANCE_TEMPLATE, label: 'Compliance templates', description: 'Reusable compliance requirement templates' },
  { key: ROLLOVER_ITEMS.BUDGET_CATEGORY, label: 'Budget categories', description: 'Reusable budget category definitions' },
  { key: ROLLOVER_ITEMS.FUNDING_SOURCE, label: 'Funding sources', description: 'Reusable funding source definitions' },
];

/**
 * PERFORMANCE / TRANSIENT data that is NEVER copied during rollover.
 * Kept separate to guarantee cross-year data isolation.
 */
export const NEVER_COPY = {
  KPI_ACTUALS: 'kpi_actuals',                    // KpiActual
  ACTIVITY_PROGRESS: 'activity_progress',         // Activity.progress / TaskUpdate
  REPORTING_RESULTS: 'reporting_results',         // Report / reporting data
  APPROVAL_STATE: 'approval_state',               // historical approval status
  AUDIT_RECORDS: 'audit_records',                 // AuditLog / Audit
  CLOSED_YEAR_FINANCIALS: 'closed_year_financials', // FinanceEntry actuals
} as const;

/**
 * Rollover selection modes.
 */
export const ROLLOVER_MODES = {
  ALL: 'all',                 // entire source year -> target year
  SELECTED: 'selected',       // explicitly chosen items only
  ORG_UNIT: 'org_unit',       // by organization unit
  GOAL: 'goal',               // by goal
  MODULE: 'module',           // by module
} as const;

export type RolloverMode = (typeof ROLLOVER_MODES)[keyof typeof ROLLOVER_MODES];

/**
 * Models that hold year-scoped STRUCTURE which gets copied.
 * Each entry defines how a copy is created.
 */
export const YEAR_STRUCTURE_MODELS: Record<RolloverItemKey, string> = {
  [ROLLOVER_ITEMS.THEME]: 'strategicTheme',
  [ROLLOVER_ITEMS.GOAL]: 'goal',
  [ROLLOVER_ITEMS.OBJECTIVE]: 'objective',
  [ROLLOVER_ITEMS.KPI]: 'kpiPlan',
  [ROLLOVER_ITEMS.ORG_UNIT]: 'orgUnit',
  [ROLLOVER_ITEMS.ACTIVITY]: 'activity',
  [ROLLOVER_ITEMS.PROJECT_TEMPLATE]: 'project',
  [ROLLOVER_ITEMS.RISK_TEMPLATE]: 'risk',
  [ROLLOVER_ITEMS.COMPLIANCE_TEMPLATE]: 'complianceRequirement',
  [ROLLOVER_ITEMS.BUDGET_CATEGORY]: 'budgetCategory',
  [ROLLOVER_ITEMS.FUNDING_SOURCE]: 'fundingSource',
};

// Statuses that get reset when copying structure into the target year.
export const RESET_STRUCTURE_STATUS = {
  approvalStatus: 'draft',
  implementationStatus: 'not_started',
  status: 'planned',
};