// ==================== PERMISSIONS CONSTANTS ====================
// All permissions are configurable through the database

// Permission Actions
export enum PermissionAction {
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  SUBMIT = 'submit',
  APPROVE = 'approve',
  REJECT = 'reject',
  CLOSE = 'close',
  ARCHIVE = 'archive',
  EXPORT = 'export',
  DELETE = 'delete',
  MANAGE = 'manage',
}

// Resource Types
export enum ResourceType {
  // Planning
  PLANNING_YEAR = 'planning_year',
  STRATEGIC_PLAN = 'strategic_plan',
  THEME = 'theme',
  GOAL = 'goal',
  OBJECTIVE = 'objective',
  
  // KPI Management
  KPI = 'kpi',
  KPI_PLAN = 'kpi_plan',
  KPI_ACTUAL = 'kpi_actual',
  KPI_CATEGORY = 'kpi_category',
  
  // Activities
  ACTIVITY = 'activity',
  DELIVERABLE = 'deliverable',
  SUB_TASK = 'sub_task',
  TASK_UPDATE = 'task_update',
  
  // Projects
  PROJECT = 'project',
  PROJECT_MILESTONE = 'project_milestone',
  PROJECT_PHASE = 'project_phase',
  PROJECT_RISK = 'project_risk',
  PROJECT_DOCUMENT = 'project_document',
  PROJECT_PROCUREMENT = 'project_procurement',
  
  // Budget & Finance
  BUDGET = 'budget',
  BUDGET_LINE = 'budget_line',
  BUDGET_REQUEST = 'budget_request',
  FINANCE_ENTRY = 'finance_entry',
  FINANCE_CATEGORY = 'finance_category',
  
   // Risk & Compliance
   RISK = 'risk',
   RISK_MITIGATION = 'risk_mitigation',
   COMPLIANCE_REQUIREMENT = 'compliance_requirement',
   COMPLIANCE_FINDING = 'compliance_finding',
   CORRECTIVE_ACTION = 'corrective_action',
   AUDIT = 'audit',
   AUDIT_FINDING = 'audit_finding',
   MANAGEMENT_REVIEW = 'management_review',
  
  // Organization
  ORG_UNIT = 'org_unit',
  EMPLOYEE = 'employee',
  ROLE = 'role',
  PERMISSION = 'permission',
  USER = 'user',
  
  // Reports
  REPORT = 'report',
  REPORTING_PERIOD = 'reporting_period',
  REPORT_CORRECTION = 'report_correction',
  
  // HR
  TRAINING = 'training',
  PROCUREMENT = 'procurement',
  ASSET = 'asset',
  
  // Dashboard
  DASHBOARD = 'dashboard',
  
  // Settings
  SETTING = 'setting',
}

// Default Role Templates (can be customized)
export const DEFAULT_ROLE_TEMPLATES = {
  SYSTEM_ADMIN: {
    name: 'System Administrator',
    code: 'SYS_ADMIN',
    description: 'Full system access with all permissions',
    isSystem: true,
    permissions: Object.values(PermissionAction),
    resources: Object.values(ResourceType),
  },
  EXECUTIVE: {
    name: 'Executive',
    code: 'EXECUTIVE',
    description: 'Strategic oversight and approval authority',
    permissions: [PermissionAction.VIEW, PermissionAction.APPROVE, PermissionAction.EXPORT],
    resources: [
      ResourceType.PLANNING_YEAR, ResourceType.STRATEGIC_PLAN, ResourceType.THEME,
      ResourceType.GOAL, ResourceType.OBJECTIVE, ResourceType.KPI, ResourceType.ACTIVITY,
      ResourceType.PROJECT, ResourceType.BUDGET, ResourceType.RISK,
      ResourceType.COMPLIANCE_REQUIREMENT, ResourceType.REPORT, ResourceType.DASHBOARD,
      ResourceType.MANAGEMENT_REVIEW,
    ],
  },
  PLAN_MANAGER: {
    name: 'Plan Manager',
    code: 'PLAN_MANAGER',
    description: 'Manages planning process and strategic alignment',
    permissions: [PermissionAction.VIEW, PermissionAction.CREATE, PermissionAction.EDIT,
      PermissionAction.SUBMIT, PermissionAction.APPROVE, PermissionAction.EXPORT],
    resources: [
      ResourceType.PLANNING_YEAR, ResourceType.STRATEGIC_PLAN, ResourceType.THEME,
      ResourceType.GOAL, ResourceType.OBJECTIVE, ResourceType.REPORT,
    ],
  },
  DIRECTORATE_MANAGER: {
    name: 'Directorate Manager',
    code: 'DIR_MANAGER',
    description: 'Oversees directorate-level planning and execution',
    permissions: [PermissionAction.VIEW, PermissionAction.CREATE, PermissionAction.EDIT,
      PermissionAction.SUBMIT, PermissionAction.APPROVE, PermissionAction.EXPORT],
    resources: [
      ResourceType.GOAL, ResourceType.OBJECTIVE, ResourceType.KPI, ResourceType.ACTIVITY,
      ResourceType.PROJECT, ResourceType.BUDGET, ResourceType.REPORT,
    ],
  },
  UNIT_MANAGER: {
    name: 'Unit Manager',
    code: 'UNIT_MANAGER',
    description: 'Manages unit-level activities and KPIs',
    permissions: [PermissionAction.VIEW, PermissionAction.CREATE, PermissionAction.EDIT,
      PermissionAction.SUBMIT, PermissionAction.EXPORT],
    resources: [
      ResourceType.KPI, ResourceType.ACTIVITY, ResourceType.DELIVERABLE,
      ResourceType.SUB_TASK, ResourceType.REPORT,
    ],
  },
  FINANCE: {
    name: 'Finance',
    code: 'FINANCE',
    description: 'Budget and financial management',
    permissions: [PermissionAction.VIEW, PermissionAction.CREATE, PermissionAction.EDIT,
      PermissionAction.SUBMIT, PermissionAction.APPROVE, PermissionAction.EXPORT],
    resources: [
      ResourceType.BUDGET, ResourceType.BUDGET_LINE, ResourceType.BUDGET_REQUEST,
      ResourceType.FINANCE_ENTRY, ResourceType.FINANCE_CATEGORY,
    ],
  },
  HR: {
    name: 'HR',
    code: 'HR',
    description: 'Human resources management',
    permissions: [PermissionAction.VIEW, PermissionAction.CREATE, PermissionAction.EDIT,
      PermissionAction.SUBMIT, PermissionAction.APPROVE, PermissionAction.EXPORT],
    resources: [
      ResourceType.EMPLOYEE, ResourceType.TRAINING, ResourceType.ORG_UNIT,
    ],
  },
  PROJECT_MANAGER: {
    name: 'Project Manager',
    code: 'PROJECT_MANAGER',
    description: 'Manages projects and related activities',
    permissions: [PermissionAction.VIEW, PermissionAction.CREATE, PermissionAction.EDIT,
      PermissionAction.SUBMIT, PermissionAction.CLOSE, PermissionAction.EXPORT],
    resources: [
      ResourceType.PROJECT, ResourceType.PROJECT_MILESTONE, ResourceType.PROJECT_PHASE,
      ResourceType.PROJECT_RISK, ResourceType.PROJECT_DOCUMENT, ResourceType.PROJECT_PROCUREMENT,
      ResourceType.ACTIVITY, ResourceType.BUDGET,
    ],
  },
  KPI_OFFICER: {
    name: 'KPI/Data Officer',
    code: 'KPI_OFFICER',
    description: 'Manages KPIs and data collection',
    permissions: [PermissionAction.VIEW, PermissionAction.CREATE, PermissionAction.EDIT,
      PermissionAction.SUBMIT, PermissionAction.EXPORT],
    resources: [
      ResourceType.KPI, ResourceType.KPI_PLAN, ResourceType.KPI_ACTUAL,
      ResourceType.KPI_CATEGORY,
    ],
  },
  REVIEWER: {
    name: 'Reviewer',
    code: 'REVIEWER',
    description: 'Reviews and provides feedback',
    permissions: [PermissionAction.VIEW, PermissionAction.SUBMIT],
    resources: [
      ResourceType.ACTIVITY, ResourceType.PROJECT, ResourceType.REPORT,
    ],
  },
  AUDITOR: {
    name: 'Auditor',
    code: 'AUDITOR',
    description: 'Audit and compliance review',
    permissions: [PermissionAction.VIEW, PermissionAction.EXPORT],
    resources: [
      ResourceType.AUDIT, ResourceType.AUDIT_FINDING, ResourceType.RISK,
      ResourceType.COMPLIANCE_REQUIREMENT, ResourceType.COMPLIANCE_FINDING,
      ResourceType.REPORT,
    ],
  },
  READ_ONLY: {
    name: 'Read Only',
    code: 'READ_ONLY',
    description: 'View-only access',
    permissions: [PermissionAction.VIEW],
    resources: Object.values(ResourceType),
  },
};

// Workflow Actions that require separation of duties
export const APPROVAL_ACTIONS = [
  PermissionAction.APPROVE,
  PermissionAction.REJECT,
  PermissionAction.CLOSE,
];

// Resources that require separation of duties
export const SEPARATION_OF_DUTIES_RESOURCES = [
  ResourceType.BUDGET,
  ResourceType.PROJECT,
  ResourceType.ACTIVITY,
  ResourceType.KPI_PLAN,
  ResourceType.REPORT,
];

// Resources that should be protected when year is closed
export const YEAR_PROTECTED_RESOURCES = [
  ResourceType.GOAL,
  ResourceType.OBJECTIVE,
  ResourceType.KPI,
  ResourceType.KPI_PLAN,
  ResourceType.ACTIVITY,
  ResourceType.PROJECT,
  ResourceType.BUDGET,
  ResourceType.BUDGET_LINE,
  ResourceType.FINANCE_ENTRY,
  ResourceType.REPORT,
  ResourceType.MANAGEMENT_REVIEW,
];
