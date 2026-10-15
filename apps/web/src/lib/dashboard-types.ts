// Dashboard API response types - Comprehensive Executive Dashboard

export interface PlanningYear {
  id: number;
  year: number;
  label: string;
  status: string;
}

export interface KpiTrendPoint {
  period: string;
  target: number;
  actual: number;
  achievement: number;
}

export interface BudgetQuarterly {
  quarter: string;
  planned: number;
  revised: number;
  actual: number;
  revenue: number;
  expenses: number;
}

export interface BudgetCategoryBreakdown {
  category: string;
  planned: number;
  revised: number;
  actual: number;
  utilization: number;
}

export interface ExecutiveAlert {
  type: string;
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  label: string;
  href: string;
}

export interface KpiItem {
  id: number;
  name: string;
  code: string;
  target: number;
  actual: number;
  unit: string;
  orgUnit: string;
  orgUnitId: number | null;
  achievement: number;
  status: string;
  category: string;
  direction: string;
}

export interface GoalItem {
  id: number;
  code: string;
  title: string;
  description: string;
  kpis: number;
  status: string;
  theme: string;
}

export interface ActivityItem {
  id: number;
  title: string;
  status: string;
  progress: number;
  orgUnit: string;
  deliverables: number;
  dueDate: string | null;
  assignedTo: string;
}

export interface ProjectItem {
  id: number;
  name: string;
  code: string;
  status: string;
  progress: number;
  budget: number;
  spend: number;
  manager: string;
  type: string;
  risks: number;
  startDate: string | null;
  endDate: string | null;
}

export interface RiskItem {
  id: number;
  title: string;
  severity: string;
  status: string;
  riskScore: number;
  category: string;
  probability: number;
  impact: number;
  owner: string;
  dueDate: string | null;
}

export interface ComplianceItem {
  id: number;
  title: string;
  status: string;
  dueDate: string | null;
  category: string;
  findings: number;
  lastAuditDate: string | null;
}

export interface ApprovalItem {
  id: number;
  title: string;
  type: string;
  orgUnit: string;
  submittedAt: string;
}

export interface OverdueActionItem {
  id: number;
  title: string;
  dueDate: string;
  type: string;
  orgUnit: string;
  assignee: string;
  risk?: string;
  finding?: string;
}

export interface TourismData {
  hasData: boolean;
  touristsServed: number;
  occupancyRate: number;
  avgStayDuration: number;
  customerSatisfaction: number;
  tourismRevenue: number;
}

export interface DashboardFilters {
  quarters: string[];
  months: string[];
  statuses: string[];
}

export interface RecentActivityItem {
  id: number;
  action: string;
  entity: string;
  recordId: string;
  createdAt: string;
  user: { username: string; fullName: string } | null;
}

export interface DashboardData {
  planningYears: PlanningYear[];
  currentYear: PlanningYear | null;
  filters: DashboardFilters;
  kpi: {
    total: number;
    achieved: number;
    onTrack: number;
    atRisk: number;
    offTrack: number;
    achievementRate: number;
    totalTarget: number;
    totalActual: number;
    trend: KpiTrendPoint[];
    kpis: KpiItem[];
  };
  goals: {
    total: number;
    achieved: number;
    inProgress: number;
    notStarted: number;
    byTheme: Array<{ theme: string; total: number; achieved: number; inProgress: number }>;
    goals: GoalItem[];
  };
  activities: {
    total: number;
    completed: number;
    inProgress: number;
    delayed: number;
    notStarted: number;
    avgProgress: number;
    completionRate: number;
    byStatus: Array<{ status: string; count: number; percentage: number }>;
    activities: ActivityItem[];
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
    delayed: number;
    avgCompletion: number;
    totalBudget: number;
    totalSpend: number;
    budgetUtilization: number;
    byType: Array<{ type: string; count: number; avgCompletion: number }>;
    projects: ProjectItem[];
  };
  budget: {
    totalPlanned: number;
    totalRevised: number;
    totalActual: number;
    variance: number;
    utilizationRate: number;
    revisionRate: number;
    revenue: number;
    expenses: number;
    netProfit: number;
    quarterly: BudgetQuarterly[];
    byCategory: BudgetCategoryBreakdown[];
  };
  risks: {
    total: number;
    open: number;
    mitigated: number;
    closed: number;
    bySeverity: Array<{ severity: string; count: number; color: string }>;
    highCount: number;
    criticalCount: number;
    overdueMitigations: number;
    risks: RiskItem[];
  };
  compliance: {
    total: number;
    compliant: number;
    nonCompliant: number;
    pending: number;
    expired: number;
    complianceRate: number;
    totalFindings: number;
    openFindings: number;
    byStatus: Array<{ status: string; count: number; percentage: number }>;
    requirements: ComplianceItem[];
  };
  pendingApprovals: {
    total: number;
    activities: ApprovalItem[];
    budgets: ApprovalItem[];
    projects: Array<{ id: number; title: string; type: string; submittedAt: string }>;
  };
  overdueActions: {
    total: number;
    activities: OverdueActionItem[];
    mitigations: OverdueActionItem[];
    correctiveActions: OverdueActionItem[];
  };
  executiveAlerts: ExecutiveAlert[];
  recentActivity: RecentActivityItem[];
  quickStats: {
    totalKpis: number;
    kpiAchievement: number;
    activeProjects: number;
    projectCompletion: number;
    budgetUtilization: number;
    highRisks: number;
    complianceRate: number;
    pendingApprovals: number;
    overdueActions: number;
    totalRevenue: number;
    netProfit: number;
    totalEmployees: number;
    strategicProgress: number;
  };
  tourism: TourismData;
  [key: string]: any;
}
