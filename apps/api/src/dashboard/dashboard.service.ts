import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GovernanceService } from '../governance/governance.service';

const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService, private governanceService: GovernanceService) {}

  async getExecutiveDashboard(filters: { yearId?: number; orgUnitId?: number; quarter?: string }) {
    const { yearId, orgUnitId, quarter } = filters;

    // Get planning years
    const planningYears = await this.prisma.planningYear.findMany({
      orderBy: { year: 'desc' },
      select: { id: true, year: true, label: true, status: true },
    });

    // Determine target year
    let targetYearId = yearId;
    if (!targetYearId) {
      const currentYear = planningYears.find((y: any) => y.status === 'active') || planningYears[0];
      targetYearId = currentYear?.id;
    }
    const currentYear = planningYears.find((y: any) => y.id === targetYearId) || null;

    // Filters
    const yearWhere: any = targetYearId ? { yearId: targetYearId } : {};
    const orgWhere = orgUnitId ? { orgUnitId } : {};
    const quarterFilter = quarter ? this.getQuarterFilter(quarter) : {};

    // ============ KPI DATA ============
    const kpiPlans = await this.prisma.kpiPlan.findMany({
      where: { ...yearWhere, ...orgWhere },
      include: { Kpi: { include: { KpiCategory: true } }, KpiActual: true, OrgUnit: true },
    });

    let kpiTotalTarget = 0, kpiTotalActual = 0, kpiAchieved = 0, kpiOnTrack = 0, kpiAtRisk = 0, kpiOffTrack = 0;
    
    const kpis = kpiPlans.map((plan: any) => {
      const target = Number(plan.annualTarget) || 0;
      const actuals = plan.KpiActual?.filter((a: any) => a.approvalStatus === 'verified' || a.approvalStatus === 'submitted') || [];
      const actual = actuals.reduce((s: number, a: any) => s + Number(a.actualValue), 0);
      const achievement = target > 0 ? (actual / target) * 100 : 0;
      kpiTotalTarget += target;
      kpiTotalActual += actual;
      if (achievement >= 100) { kpiAchieved++; kpiOnTrack++; }
      else if (achievement >= 80) kpiOnTrack++;
      else if (achievement >= 50) kpiAtRisk++;
      else kpiOffTrack++;

      return {
        id: plan.id, name: plan.Kpi?.name || 'Unnamed KPI', code: plan.Kpi?.code || '',
        target, actual, unit: plan.Kpi?.unit || '', orgUnit: plan.OrgUnit?.name || 'N/A',
        orgUnitId: plan.orgUnitId, achievement,
        status: achievement >= 100 ? 'achieved' : achievement >= 80 ? 'on_track' : achievement >= 50 ? 'at_risk' : 'off_track',
        category: plan.Kpi?.KpiCategory?.name || 'General', direction: plan.Kpi?.direction || 'higher_is_better',
      };
    });

    const kpiTrend = this.getKpiTrend(kpiPlans);

    // ============ GOAL DATA ============
    const goals = await this.prisma.goal.findMany({
      where: { ...yearWhere, ...orgWhere },
      include: { StrategicResult: { include: { StrategicTheme: true } } },
    });

    let goalAchieved = 0, goalInProgress = 0, goalNotStarted = 0;
    const goalsByTheme: Record<string, { total: number; achieved: number; inProgress: number }> = {};

    const goalsData = goals.map((g: any) => {
      const theme = g.StrategicResult?.StrategicTheme?.name || 'General';
      if (!goalsByTheme[theme]) goalsByTheme[theme] = { total: 0, achieved: 0, inProgress: 0 };
      goalsByTheme[theme].total++;
      const progress = g.weight * 100;
      if (progress >= 100) { goalAchieved++; goalsByTheme[theme].achieved++; }
      else if (progress >= 50) { goalInProgress++; goalsByTheme[theme].inProgress++; }
      else goalNotStarted++;
      return { id: g.id, code: g.code || '', title: g.name || '', description: g.description || '', kpis: 0, status: progress >= 100 ? 'achieved' : progress >= 50 ? 'in_progress' : 'not_started', theme };
    });

    // ============ ACTIVITY DATA ============
    const activities = await this.prisma.activity.findMany({
      where: { ...yearWhere, ...orgWhere, ...quarterFilter },
      include: { OrgUnit_Activity_orgUnitIdToOrgUnit: true, Deliverable: true, Employee: true },
    });

    const completed = activities.filter(a => a.implementationStatus === 'completed').length;
    const inProgress = activities.filter(a => a.implementationStatus === 'in_progress').length;
    const delayed = activities.filter(a => a.implementationStatus === 'delayed').length;
    const notStarted = activities.filter(a => a.implementationStatus === 'not_started').length;
    const avgProgress = activities.length > 0 ? activities.reduce((s, a) => s + (a.progress || 0), 0) / activities.length : 0;

    const activitiesByStatus = [
      { status: 'completed', count: completed, percentage: activities.length > 0 ? (completed / activities.length) * 100 : 0 },
      { status: 'in_progress', count: inProgress, percentage: activities.length > 0 ? (inProgress / activities.length) * 100 : 0 },
      { status: 'delayed', count: delayed, percentage: activities.length > 0 ? (delayed / activities.length) * 100 : 0 },
      { status: 'not_started', count: notStarted, percentage: activities.length > 0 ? (notStarted / activities.length) * 100 : 0 },
    ];

    const activitiesData = activities.slice(0, 10).map((a: any) => ({
      id: a.id, title: a.title, status: a.implementationStatus, progress: a.progress || 0,
      orgUnit: a.OrgUnit_Activity_orgUnitIdToOrgUnit?.name || '', deliverables: a.Deliverable?.length || 0,
      dueDate: a.dueDate?.toISOString() || null, assignedTo: a.Employee?.fullName || 'Unassigned',
    }));

    // ============ PROJECT DATA ============
    const projects = await this.prisma.project.findMany({ 
      where: { ...yearWhere, ...orgWhere },
      include: { Employee: true }
    });

    const projectsActive = projects.filter(p => p.status === 'active').length;
    const projectsCompleted = projects.filter(p => p.status === 'completed').length;
    const projectsOnHold = projects.filter(p => p.status === 'on_hold').length;
    const avgProjectCompletion = projects.length > 0 ? projects.reduce((s, p) => s + (p.physicalProgress || 0), 0) / projects.length : 0;
    const totalBudget = projects.reduce((s, p) => s + Number(p.plannedBudget || 0), 0);
    const totalSpend = projects.reduce((s, p) => s + Number(p.actualSpend || 0), 0);

    const projectsData = projects.slice(0, 10).map((p: any) => ({
      id: p.id, name: p.name, code: p.code || '', status: p.status, 
      progress: p.physicalProgress || 0,
      budget: Number(p.plannedBudget || 0), spend: Number(p.actualSpend || 0), 
      manager: p.Employee?.fullName || 'Unassigned',
      type: 'Project', risks: 0, 
      startDate: p.startDate?.toISOString() || null,
      endDate: p.endDate?.toISOString() || null,
    }));

    // ============ BUDGET DATA ============
    const budgetPlans = await this.prisma.budget.findMany({ where: { ...yearWhere } });
    
    const totalPlanned = budgetPlans.reduce((s, b) => s + Number(b.plannedAmount || 0), 0);
    const totalRevised = budgetPlans.reduce((s, b) => s + Number(b.revisedAmount || b.plannedAmount || 0), 0);
    
    // Calculate actual from FinanceEntry
    const budgetIds = budgetPlans.map(b => b.id);
    const financeEntries = await this.prisma.financeEntry.findMany({
      where: { budgetId: { in: budgetIds }, status: 'posted' }
    });
    const totalActual = financeEntries.filter(e => e.entryType === 'expense').reduce((s, e) => s + Number(e.amount || 0), 0);
    const revenue = financeEntries.filter(e => e.entryType === 'revenue').reduce((s, e) => s + Number(e.amount || 0), 0);
    
    const utilizationRate = totalRevised > 0 ? (totalActual / totalRevised) * 100 : 0;

    const budgetByCategory = budgetPlans.reduce((acc, b) => {
      const cat = b.category || 'General';
      if (!acc[cat]) acc[cat] = { planned: 0, revised: 0, actual: 0 };
      acc[cat].planned += Number(b.plannedAmount || 0);
      acc[cat].revised += Number(b.revisedAmount || b.plannedAmount || 0);
      return acc;
    }, {} as Record<string, { planned: number; revised: number; actual: number }>);

    // Add actual amounts to categories
    financeEntries.forEach(entry => {
      const budget = budgetPlans.find(b => b.id === entry.budgetId);
      if (budget) {
        const cat = budget.category || 'General';
        if (budgetByCategory[cat]) {
          budgetByCategory[cat].actual += Number(entry.amount || 0);
        }
      }
    });

    const budgetByCategoryData = Object.entries(budgetByCategory).map(([category, data]) => ({
      category, planned: data.planned, revised: data.revised, actual: data.actual,
      utilization: data.revised > 0 ? (data.actual / data.revised) * 100 : 0,
    }));

    const quarterlyBudget = this.getQuarterlyBudget(budgetPlans, financeEntries, quarter);

    // ============ RISK DATA ============
    const risks = await this.prisma.risk.findMany({ where: { ...yearWhere, ...orgWhere } });

    const risksOpen = risks.filter(r => r.status === 'open').length;
    const risksMitigated = risks.filter(r => r.status === 'mitigated').length;
    const risksClosed = risks.filter(r => r.status === 'closed').length;
    const risksHigh = risks.filter(r => r.level === 'high').length;
    const risksCritical = risks.filter(r => r.level === 'critical').length;

    const risksBySeverity = [
      { severity: 'critical', count: risksCritical, color: '#dc2626' },
      { severity: 'high', count: risksHigh, color: '#f97316' },
      { severity: 'medium', count: risks.filter(r => r.level === 'medium').length, color: '#eab308' },
      { severity: 'low', count: risks.filter(r => r.level === 'low').length, color: '#22c55e' },
    ];

    const risksData = risks.slice(0, 10).map((r: any) => ({
      id: r.id, title: r.title, severity: r.level, status: r.status, riskScore: r.score,
      category: 'General', probability: r.probability, impact: r.impact, owner: 'Unassigned',
      dueDate: r.reviewDate?.toISOString() || null,
    }));

    // ============ COMPLIANCE DATA ============
    const requirements = await this.prisma.complianceRequirement.findMany({
      where: { ...yearWhere, ...orgWhere }, include: { ComplianceFinding: true },
    });

    const compliantCount = requirements.filter(r => r.status === 'compliant').length;
    const nonCompliantCount = requirements.filter(r => r.status === 'non_compliant').length;
    const pendingCount = requirements.filter(r => r.status === 'pending').length;
    const expiredCount = requirements.filter(r => r.status === 'expired').length;
    const complianceRate = requirements.length > 0 ? (compliantCount / requirements.length) * 100 : 0;
    const findings = requirements.flatMap(r => r.ComplianceFinding || []);
    const openFindings = findings.filter(f => f.status === 'open').length;

    const complianceByStatus = [
      { status: 'compliant', count: compliantCount, percentage: requirements.length > 0 ? (compliantCount / requirements.length) * 100 : 0 },
      { status: 'non_compliant', count: nonCompliantCount, percentage: requirements.length > 0 ? (nonCompliantCount / requirements.length) * 100 : 0 },
      { status: 'pending', count: pendingCount, percentage: requirements.length > 0 ? (pendingCount / requirements.length) * 100 : 0 },
      { status: 'expired', count: expiredCount, percentage: requirements.length > 0 ? (expiredCount / requirements.length) * 100 : 0 },
    ];

    const complianceData = requirements.slice(0, 10).map((r: any) => ({
      id: r.id, title: r.title, status: r.status, dueDate: r.dueDate?.toISOString() || null,
      category: r.category || 'General', findings: r.ComplianceFinding?.length || 0, lastAuditDate: null,
    }));

    // ============ PENDING APPROVALS ============
    const pendingActivities = await this.prisma.activity.findMany({
      where: { approvalStatus: 'submitted', ...yearWhere },
      include: { OrgUnit_Activity_orgUnitIdToOrgUnit: true },
    });

    const pendingBudgets = await this.prisma.budget.findMany({
      where: { approvalStatus: 'submitted', ...yearWhere }, include: { OrgUnit: true },
    });

    const pendingProjects = await this.prisma.project.findMany({ where: { approvalStatus: 'submitted', ...yearWhere } });

    const pendingApprovalsData = {
      total: pendingActivities.length + pendingBudgets.length + pendingProjects.length,
      activities: pendingActivities.slice(0, 5).map((a: any) => ({
        id: a.id, title: a.title, type: 'Activity',
        orgUnit: a.OrgUnit_Activity_orgUnitIdToOrgUnit?.name || 'N/A',
        submittedAt: a.updatedAt?.toISOString() || '',
      })),
      budgets: pendingBudgets.slice(0, 5).map((b: any) => ({
        id: b.id, title: b.category || 'Budget Request', type: 'Budget',
        orgUnit: b.OrgUnit?.name || 'N/A', submittedAt: b.createdAt?.toISOString() || '',
      })),
      projects: pendingProjects.slice(0, 5).map((p: any) => ({
        id: p.id, title: p.name, type: 'Project', submittedAt: p.createdAt?.toISOString() || '',
      })),
    };

    // ============ OVERDUE ACTIONS ============
    const now = new Date();
    const overdueActivities = await this.prisma.activity.findMany({
      where: { ...yearWhere, dueDate: { lt: now }, implementationStatus: { not: 'completed' } },
      include: { OrgUnit_Activity_orgUnitIdToOrgUnit: true, Employee: true },
    });

    const overdueCorrectiveActions = await this.prisma.correctiveAction.findMany({
      where: { ...yearWhere, dueDate: { lt: now }, status: { not: 'completed' } }, include: { Employee: true },
    });

    const overdueActionsData = {
      total: overdueActivities.length + overdueCorrectiveActions.length,
      activities: overdueActivities.slice(0, 5).map((a: any) => ({
        id: a.id, title: a.title, dueDate: a.dueDate?.toISOString() || '',
        type: 'Activity', orgUnit: a.OrgUnit_Activity_orgUnitIdToOrgUnit?.name || '',
        assignee: a.Employee?.fullName || 'Unassigned',
      })),
      mitigations: [] as any[],
      correctiveActions: overdueCorrectiveActions.slice(0, 5).map((c: any) => ({
        id: c.id, title: c.title, dueDate: c.dueDate?.toISOString() || '',
        type: 'Corrective Action', finding: '', assignee: c.Employee?.fullName || 'Unassigned',
      })),
    };

    // ============ EXECUTIVE ALERTS ============
    const executiveAlerts: Array<{ type: string; count: number; severity: 'critical' | 'high' | 'medium' | 'low'; label: string; href: string }> = [];

    if (risksCritical > 0) executiveAlerts.push({ type: 'critical_risks', count: risksCritical, severity: 'critical', label: 'Critical Risks', href: '/risk-compliance?tab=risks&severity=critical' });
    if (risksHigh > 0) executiveAlerts.push({ type: 'high_risks', count: risksHigh, severity: 'high', label: 'High Risks', href: '/risk-compliance?tab=risks&severity=high' });
    if (nonCompliantCount > 0) executiveAlerts.push({ type: 'non_compliance', count: nonCompliantCount, severity: 'high', label: 'Non-Compliant Items', href: '/risk-compliance?tab=compliance&status=non_compliant' });
    if (overdueActionsData.total > 0) executiveAlerts.push({ type: 'overdue_actions', count: overdueActionsData.total, severity: 'medium', label: 'Overdue Actions', href: '/governance?filter=overdue' });
    if (pendingApprovalsData.total > 0) executiveAlerts.push({ type: 'pending_approvals', count: pendingApprovalsData.total, severity: 'low', label: 'Pending Approvals', href: '/governance' });
    if (kpiOffTrack > 0) executiveAlerts.push({ type: 'off_track_kpis', count: kpiOffTrack, severity: 'medium', label: 'Off-Track KPIs', href: '/kpi?status=off_track' });

    executiveAlerts.sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4));

    // ============ TOURISM DATA ============
    const tourismRecords = await this.prisma.tourismRecord.findMany({ where: { ...yearWhere } });

    const totalVisitors = tourismRecords.reduce((s, r) => s + (r.domesticVisitors || 0) + (r.internationalVisitors || 0), 0);
    const totalRooms = tourismRecords.reduce((s, r) => s + (r.roomNightsAvailable || 0), 0);
    const occupiedRooms = tourismRecords.reduce((s, r) => s + (r.roomNightsOccupied || 0), 0);
    const avgSatisfaction = tourismRecords.length > 0 ? tourismRecords.reduce((s, r) => s + (r.satisfaction || 0), 0) / tourismRecords.length : 0;
    const avgStayHours = tourismRecords.length > 0 ? tourismRecords.reduce((s, r) => s + (r.stayHours || 0), 0) / tourismRecords.length : 0;

    const tourism = {
      hasData: tourismRecords.length > 0,
      touristsServed: totalVisitors,
      occupancyRate: totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0,
      avgStayDuration: avgStayHours / 24, // Convert hours to days
      customerSatisfaction: avgSatisfaction,
      tourismRevenue: tourismRecords.reduce((s, r) => s + Number(r.revenue || 0), 0),
    };

    // ============ BUILD RESPONSE ============
    return {
      planningYears, currentYear,
      filters: { quarters: ['Q1', 'Q2', 'Q3', 'Q4'], months: [], statuses: [] },
      kpi: {
        total: kpiPlans.length, achieved: kpiAchieved, onTrack: kpiOnTrack, atRisk: kpiAtRisk, offTrack: kpiOffTrack,
        achievementRate: kpiTotalTarget > 0 ? (kpiTotalActual / kpiTotalTarget) * 100 : 0,
        totalTarget: kpiTotalTarget, totalActual: kpiTotalActual, trend: kpiTrend, kpis,
      },
      goals: {
        total: goals.length, achieved: goalAchieved, inProgress: goalInProgress, notStarted: goalNotStarted,
        byTheme: Object.entries(goalsByTheme).map(([theme, data]) => ({ theme, ...data })), goals: goalsData,
      },
      activities: {
        total: activities.length, completed, inProgress, delayed, notStarted,
        avgProgress, completionRate: activities.length > 0 ? (completed / activities.length) * 100 : 0,
        byStatus: activitiesByStatus, activities: activitiesData,
      },
      projects: {
        total: projects.length, active: projectsActive, completed: projectsCompleted, onHold: projectsOnHold, delayed: 0,
        avgCompletion: avgProjectCompletion, totalBudget, totalSpend, budgetUtilization: totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0,
        byType: [], projects: projectsData,
      },
      budget: {
        totalPlanned, totalRevised, totalActual, variance: totalRevised - totalActual,
        utilizationRate, revisionRate: totalPlanned > 0 ? ((totalRevised - totalPlanned) / totalPlanned) * 100 : 0,
        revenue, expenses: totalActual, netProfit: revenue - totalActual,
        quarterly: quarterlyBudget, byCategory: budgetByCategoryData,
      },
      risks: {
        total: risks.length, open: risksOpen, mitigated: risksMitigated, closed: risksClosed,
        bySeverity: risksBySeverity, highCount: risksHigh, criticalCount: risksCritical, overdueMitigations: 0, risks: risksData,
      },
      compliance: {
        total: requirements.length, compliant: compliantCount, nonCompliant: nonCompliantCount,
        pending: pendingCount, expired: expiredCount, complianceRate,
        totalFindings: findings.length, openFindings, byStatus: complianceByStatus, requirements: complianceData,
      },
      pendingApprovals: pendingApprovalsData, overdueActions: overdueActionsData,
      executiveAlerts,
      recentActivity: (await this.governanceService.getAuditLog({ limit: 10 })).data.map((a: any) => ({
        id: a.id, action: a.action, entity: a.entity, recordId: a.recordId, createdAt: a.createdAt,
        user: a.user ? { username: a.user.username, fullName: a.user.fullName } : null,
      })),
      quickStats: {
        totalKpis: kpiPlans.length,
        kpiAchievement: kpiTotalTarget > 0 ? (kpiTotalActual / kpiTotalTarget) * 100 : 0,
        activeProjects: projectsActive, projectCompletion: avgProjectCompletion,
        budgetUtilization: utilizationRate, highRisks: risksHigh + risksCritical,
        complianceRate, pendingApprovals: pendingApprovalsData.total,
        overdueActions: overdueActionsData.total, totalRevenue: revenue, netProfit: revenue - totalActual,
        totalEmployees: await this.prisma.employee.count({ where: { active: true } }),
        strategicProgress: goals.length > 0 ? (goalAchieved / goals.length) * 100 : 0,
      },
      tourism,
    };
  }

  private getKpiTrend(kpiPlans: any[]): Array<{ period: string; target: number; actual: number; achievement: number }> {
    return ['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
      const totalTarget = kpiPlans.reduce((s, p) => s + Number(p.annualTarget) || 0, 0) / 4;
      const actuals = kpiPlans.flatMap((p: any) => p.KpiActual?.filter((a: any) => a.quarter === q) || []);
      const totalActual = actuals.reduce((s: number, a: any) => s + Number(a.actualValue), 0);
      return {
        period: q, target: totalTarget, actual: totalActual,
        achievement: totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0,
      };
    });
  }

  private getQuarterlyBudget(budgetPlans: any[], financeEntries: any[], quarter?: string): Array<{ quarter: string; planned: number; revised: number; actual: number; revenue: number; expenses: number }> {
    const quarters = quarter ? [quarter] : ['Q1', 'Q2', 'Q3', 'Q4'];
    return quarters.map(q => ({
      quarter: q,
      planned: budgetPlans.reduce((s, b) => s + Number(b.plannedAmount || 0), 0) / 4,
      revised: budgetPlans.reduce((s, b) => s + Number(b.revisedAmount || b.plannedAmount || 0), 0) / 4,
      actual: 0, // Simplified - would need quarterly breakdown from finance entries
      revenue: 0,
      expenses: 0,
    }));
  }

  private getQuarterFilter(quarter: string): any {
    const qNum = parseInt(quarter.replace('Q', ''));
    const startMonth = (qNum - 1) * 3;
    const endMonth = startMonth + 2;
    const startDate = new Date(new Date().getFullYear(), startMonth, 1);
    const endDate = new Date(new Date().getFullYear(), endMonth + 1, 0);
    return { dueDate: { gte: startDate, lte: endDate } };
  }

  async getKpiTrends(yearId: number) {
    const plans = await this.prisma.kpiPlan.findMany({
      where: { yearId }, include: { Kpi: true, KpiActual: { orderBy: { id: 'asc' }, take: 12 } },
    });
    return plans.map(plan => ({
      id: plan.id, name: plan.Kpi?.name,
      data: plan.KpiActual.map(m => ({ value: Number(m.actualValue), target: Number(plan.annualTarget) })),
    }));
  }

  async getBudgetTrends(yearId: number) {
    const budgets = await this.prisma.budget.findMany({ where: { yearId } });
    const planned = budgets.reduce((s, b) => s + Number(b.plannedAmount), 0);
    const revised = budgets.reduce((s, b) => s + Number(b.revisedAmount), 0);
    return { planned, revised, actual: 0 };
  }
}
