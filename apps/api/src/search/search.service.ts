import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SearchResult {
  type: string;
  label: string;
  id: number;
  title: string;
  subtitle?: string | null;
  href: string;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(query: string, limit = 10): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim();
    const results: SearchResult[] = [];

    const [employees, users, projects, kpis, risks, activities, budgets] = await Promise.all([
      this.searchEmployees(q, limit),
      this.searchUsers(q, limit),
      this.searchProjects(q, limit),
      this.searchKpis(q, limit),
      this.searchRisks(q, limit),
      this.searchActivities(q, limit),
      this.searchBudgets(q, limit),
    ]);

    results.push(...employees, ...users, ...projects, ...kpis, ...risks, ...activities, ...budgets);
    return results.slice(0, limit * 3);
  }

  private async searchEmployees(query: string, limit: number) {
    const employees = await this.prisma.employee.findMany({
      where: { active: true, fullName: { contains: query, mode: 'insensitive' } },
      take: limit,
      select: { id: true, fullName: true, jobTitle: true, email: true },
    });
    return employees.map((e) => ({
      type: 'Employee',
      label: 'Employees',
      id: e.id,
      title: e.fullName,
      subtitle: e.jobTitle || e.email,
      href: `/employees/${e.id}`,
    }));
  }

  private async searchUsers(query: string, limit: number) {
    const users = await this.prisma.user.findMany({
      where: { active: true, OR: [{ username: { contains: query, mode: 'insensitive' } }, { fullName: { contains: query, mode: 'insensitive' } }] },
      take: limit,
      select: { id: true, username: true, fullName: true },
    });
    return users.map((u) => ({
      type: 'User',
      label: 'Users',
      id: u.id,
      title: u.fullName || u.username,
      subtitle: u.username,
      href: `/users`,
    }));
  }

  private async searchProjects(query: string, limit: number) {
    const projects = await this.prisma.project.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      take: limit,
      select: { id: true, name: true, code: true, status: true },
    });
    return projects.map((p) => ({
      type: 'Project',
      label: 'Projects',
      id: p.id,
      title: p.name,
      subtitle: `${p.code} • ${p.status}`,
      href: `/projects/${p.id}`,
    }));
  }

  private async searchKpis(query: string, limit: number) {
    const kpis = await this.prisma.kpi.findMany({
      where: { OR: [{ name: { contains: query, mode: 'insensitive' } }, { code: { contains: query, mode: 'insensitive' } }] },
      take: limit,
      select: { id: true, name: true, code: true },
    });
    return kpis.map((k) => ({
      type: 'KPI',
      label: 'KPIs',
      id: k.id,
      title: k.name,
      subtitle: k.code,
      href: `/kpi/${k.id}`,
    }));
  }

  private async searchRisks(query: string, limit: number) {
    const risks = await this.prisma.risk.findMany({
      where: { title: { contains: query, mode: 'insensitive' } },
      take: limit,
      select: { id: true, title: true, status: true, score: true },
    });
    return risks.map((r) => ({
      type: 'Risk',
      label: 'Risks',
      id: r.id,
      title: r.title,
      subtitle: `${r.status} • Score: ${r.score}`,
      href: `/risks/${r.id}`,
    }));
  }

  private async searchActivities(query: string, limit: number) {
    const activities = await this.prisma.activity.findMany({
      where: { title: { contains: query, mode: 'insensitive' } },
      take: limit,
      select: { id: true, title: true, implementationStatus: true },
    });
    return activities.map((a) => ({
      type: 'Activity',
      label: 'Activities',
      id: a.id,
      title: a.title,
      subtitle: a.implementationStatus,
      href: `/workplan?activityId=${a.id}`,
    }));
  }

  private async searchBudgets(query: string, limit: number) {
    const budgets = await this.prisma.budget.findMany({
      where: { category: { contains: query, mode: 'insensitive' } },
      take: limit,
      select: { id: true, category: true, plannedAmount: true, approvalStatus: true },
    });
    return budgets.map((b) => ({
      type: 'Budget',
      label: 'Budgets',
      id: b.id,
      title: b.category,
      subtitle: `${b.approvalStatus} • ${b.plannedAmount}`,
      href: `/budget/${b.id}`,
    }));
  }
}
