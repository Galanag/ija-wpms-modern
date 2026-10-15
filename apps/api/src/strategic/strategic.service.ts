import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GovernanceService } from '../governance/governance.service';

@Injectable()
export class StrategicService {
  constructor(private prisma: PrismaService, private governanceService: GovernanceService) {}

  async createStrategicPlan(userId: number, data: any) {
    const yearId = data.yearId ?? data.startYear;
    if (yearId) {
      await this.governanceService.assertYearWritable(userId, 'strategic_plan', yearId);
    }
    return this.prisma.strategicPlan.create({
      data: { name: data.name, description: data.description },
      include: { StrategicTheme: { include: { StrategicResult: { include: { Goal: true } } } } },
    });
  }

  async findAllStrategicPlans() {
    return this.prisma.strategicPlan.findMany({
      include: { StrategicTheme: { include: { StrategicResult: { include: { Goal: { include: { Objective: true } } } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findStrategicPlanById(id: number) {
    return this.prisma.strategicPlan.findUnique({
      where: { id },
      include: { StrategicTheme: { include: { StrategicResult: { include: { Goal: { include: { Objective: true } } } } } } },
    });
  }

  async updateStrategicPlan(userId: number, id: number, data: any) {
    const existing = await this.prisma.strategicPlan.findFirst({
      where: { id },
      select: { startYear: true },
    });
    let yearId = existing?.startYear;
    if (!yearId) {
      const goal = await this.prisma.goal.findFirst({
        where: {
          StrategicResult: {
            StrategicTheme: { planId: id }
          }
        },
        select: { yearId: true },
      });
      yearId = goal?.yearId;
    }
    if (yearId) {
      await this.governanceService.assertYearWritable(userId, 'strategic_plan', yearId);
    }
    return this.prisma.strategicPlan.update({ where: { id }, data: { ...data } });
  }

  async deleteStrategicPlan(userId: number, id: number) {
    const existing = await this.prisma.strategicPlan.findFirst({
      where: { id },
      select: { startYear: true },
    });
    let yearId = existing?.startYear;
    if (!yearId) {
      const goal = await this.prisma.goal.findFirst({
        where: {
          StrategicResult: {
            StrategicTheme: { planId: id }
          }
        },
        select: { yearId: true },
      });
      yearId = goal?.yearId;
    }
    if (yearId) {
      await this.governanceService.assertYearWritable(userId, 'strategic_plan', yearId);
    }
    return this.prisma.strategicPlan.update({ where: { id }, data: { status: 'archived' } });
  }

  async createTheme(userId: number, data: any) {
    let yearId = data.yearId;
    if (!yearId && data.planId) {
      const plan = await this.prisma.strategicPlan.findFirst({
        where: { id: data.planId },
        select: { startYear: true },
      });
      yearId = plan?.startYear;
      if (!yearId) {
        const goal = await this.prisma.goal.findFirst({
          where: {
            StrategicResult: {
              StrategicTheme: { planId: data.planId }
            }
          },
          select: { yearId: true },
        });
        yearId = goal?.yearId;
      }
    }
    if (yearId) {
      await this.governanceService.assertYearWritable(userId, 'theme', yearId);
    }
    return this.prisma.strategicTheme.create({ data: { planId: data.planId, code: data.code, name: data.name, description: data.description } });
  }

  async updateTheme(userId: number, id: number, data: any) {
    const theme = await this.prisma.strategicTheme.findFirst({
      where: { id },
      include: { StrategicPlan: { select: { startYear: true, id: true } } },
    });
    const plan = theme?.StrategicPlan;
    let yearId = plan?.startYear;
    if (!yearId && plan?.id) {
      const goal = await this.prisma.goal.findFirst({
        where: {
          StrategicResult: {
            StrategicTheme: { planId: plan.id }
          }
        },
        select: { yearId: true },
      });
      yearId = goal?.yearId;
    }
    if (yearId) {
      await this.governanceService.assertYearWritable(userId, 'theme', yearId);
    }
    return this.prisma.strategicTheme.update({ where: { id }, data });
  }

  async deleteTheme(userId: number, id: number) {
    const theme = await this.prisma.strategicTheme.findFirst({
      where: { id },
      include: { StrategicPlan: { select: { startYear: true, id: true } } },
    });
    const plan = theme?.StrategicPlan;
    let yearId = plan?.startYear;
    if (!yearId && plan?.id) {
      const goal = await this.prisma.goal.findFirst({
        where: {
          StrategicResult: {
            StrategicTheme: { planId: plan.id }
          }
        },
        select: { yearId: true },
      });
      yearId = goal?.yearId;
    }
    if (yearId) {
      await this.governanceService.assertYearWritable(userId, 'theme', yearId);
    }
    return this.prisma.strategicTheme.delete({ where: { id } });
  }

  async createResult(userId: number, data: any) {
    let yearId = data.yearId;
    if (!data.themeId && data.planId) {
      const theme = await this.prisma.strategicTheme.findFirst({
        where: { planId: data.planId },
        include: { StrategicPlan: { select: { startYear: true } } },
      });
      if (theme) {
        data.themeId = theme.id;
        yearId = theme.StrategicPlan?.startYear;
      } else {
        const plan = await this.prisma.strategicPlan.findUnique({
          where: { id: data.planId },
          select: { startYear: true },
        });
        yearId = plan?.startYear;
      }
    }
    if (!yearId && data.themeId) {
      const theme = await this.prisma.strategicTheme.findFirst({
        where: { id: data.themeId },
        include: { StrategicPlan: { select: { startYear: true } } },
      });
      yearId = theme?.StrategicPlan?.startYear;
    }
    if (yearId) {
      await this.governanceService.assertYearWritable(userId, 'result', yearId);
    }
    return this.prisma.strategicResult.create({ data: { themeId: data.themeId, code: data.code, name: data.name, description: data.description, yearId } });
  }

  async updateResult(userId: number, id: number, data: any) {
    const existing = await this.prisma.strategicResult.findFirst({
      where: { id },
      select: { yearId: true },
    });
    if (existing?.yearId) {
      await this.governanceService.assertYearWritable(userId, 'result', existing.yearId);
    }
    return this.prisma.strategicResult.update({ where: { id }, data });
  }

  async deleteResult(userId: number, id: number) {
    const existing = await this.prisma.strategicResult.findFirst({
      where: { id },
      select: { yearId: true },
    });
    if (existing?.yearId) {
      await this.governanceService.assertYearWritable(userId, 'result', existing.yearId);
    }
    return this.prisma.strategicResult.delete({ where: { id } });
  }

  async createGoal(userId: number, data: any) {
    let yearId = data.yearId;
    if (!yearId && data.resultId) {
      const result = await this.prisma.strategicResult.findUnique({
        where: { id: data.resultId },
        select: { yearId: true, StrategicTheme: { include: { StrategicPlan: { select: { startYear: true } } } } },
      });
      yearId = result?.yearId || result?.StrategicTheme?.StrategicPlan?.startYear;
    }
    if (yearId) {
      await this.governanceService.assertYearWritable(userId, 'goal', yearId);
    }
    if (!yearId) {
      throw new BadRequestException('yearId is required to create a goal');
    }
    return this.prisma.goal.create({
      data: { yearId, resultId: data.resultId, orgUnitId: data.orgUnitId, code: data.code, name: data.name, description: data.description, weight: data.weight ?? 1 },
      include: { PlanningYear: true, StrategicResult: true, OrgUnit: true, Objective: true },
    });
  }

  async findGoalsByYear(yearId: number) {
    return this.prisma.goal.findMany({
      where: { yearId, approvalStatus: { not: 'cancelled' } },
      include: { StrategicResult: true, OrgUnit: true, Objective: true },
    });
  }

  async updateGoal(userId: number, id: number, data: any) {
    const existing = await this.prisma.goal.findFirst({
      where: { id },
      select: { yearId: true },
    });
    if (existing?.yearId) {
      await this.governanceService.assertYearWritable(userId, 'goal', existing.yearId);
    }
    return this.prisma.goal.update({ where: { id }, data: { ...data }, include: { Objective: true } });
  }

  async deleteGoal(userId: number, id: number) {
    const existing = await this.prisma.goal.findFirst({
      where: { id },
      select: { yearId: true },
    });
    if (existing?.yearId) {
      await this.governanceService.assertYearWritable(userId, 'goal', existing.yearId);
    }
    return this.prisma.goal.delete({ where: { id } });
  }

  async createObjective(userId: number, data: any) {
    const yearId = data.yearId;
    if (yearId) {
      await this.governanceService.assertYearWritable(userId, 'objective', yearId);
    }
    return this.prisma.objective.create({
      data: { yearId: data.yearId, goalId: data.goalId, orgUnitId: data.orgUnitId, code: data.code, name: data.name, description: data.description, baselineValue: data.baselineValue, targetValue: data.targetValue, unit: data.unit, direction: data.direction ?? 'higher_is_better', weight: data.weight ?? 1 },
      include: { Goal: true, OrgUnit: true, PlanningYear: true },
    });
  }

  async updateObjective(userId: number, id: number, data: any) {
    const existing = await this.prisma.objective.findFirst({
      where: { id },
      select: { yearId: true },
    });
    if (existing?.yearId) {
      await this.governanceService.assertYearWritable(userId, 'objective', existing.yearId);
    }
    return this.prisma.objective.update({ where: { id }, data: { ...data } });
  }

  async deleteObjective(userId: number, id: number) {
    const existing = await this.prisma.objective.findFirst({
      where: { id },
      select: { yearId: true },
    });
    if (existing?.yearId) {
      await this.governanceService.assertYearWritable(userId, 'objective', existing.yearId);
    }
    return this.prisma.objective.delete({ where: { id } });
  }

  async copyStructureToYear(userId: number, dto: any) {
    if (dto.targetYearId) {
      await this.governanceService.assertYearWritable(userId, 'strategic_plan', dto.targetYearId);
    }
    return this.prisma.$transaction(async (tx) => {
      const results: any = { themes: [], results: [], goals: [], objectives: [] };
      const plan = await tx.strategicPlan.findFirst({
        where: { status: 'active' },
        include: { StrategicTheme: { include: { StrategicResult: { include: { Goal: { include: { Objective: true } } } } } } },
      });
      if (!plan) throw new Error('No active strategic plan');

      if (dto.copyThemes && plan.StrategicTheme) {
        for (const t of plan.StrategicTheme) {
          const nt = await tx.strategicTheme.create({ data: { planId: plan.id, code: t.code, name: t.name, description: t.description } });
          results.themes.push(nt);

          if (dto.copyResults && t.StrategicResult) {
            for (const r of t.StrategicResult) {
              const nr = await tx.strategicResult.create({ data: { themeId: nt.id, code: r.code, name: r.name, description: r.description } });
              results.results.push(nr);

              if (dto.copyGoals && r.Goal) {
                for (const g of r.Goal) {
                  const ng = await tx.goal.create({ data: { yearId: dto.targetYearId, resultId: nr.id, orgUnitId: dto.copyResponsibleUnits ? g.orgUnitId : null, code: g.code, name: g.name, description: g.description, weight: g.weight } });
                  results.goals.push(ng);

                  if (dto.copyObjectives && g.Objective) {
                    for (const o of g.Objective) {
                      const no = await tx.objective.create({ data: { yearId: dto.targetYearId, goalId: ng.id, orgUnitId: dto.copyResponsibleUnits ? o.orgUnitId : null, code: o.code, name: o.name, description: o.description, baselineValue: o.baselineValue, targetValue: o.targetValue, unit: o.unit, direction: o.direction, weight: o.weight } });
                      results.objectives.push(no);
                    }
                  }
                }
              }
            }
          }
        }
      }
      return results;
    });
  }

  async getHierarchyForYear(yearId: number) {
    const year = await this.prisma.planningYear.findUnique({ where: { id: yearId } });
    if (!year) throw new Error('Year not found');
    const plan = await this.prisma.strategicPlan.findFirst({
      where: { status: 'active' },
      include: {
        StrategicTheme: {
          include: {
            StrategicResult: {
              include: { Goal: { where: { yearId }, include: { Objective: { where: { yearId } } } } },
            },
          },
        },
      },
    });
    return { year, plan, hierarchy: plan?.StrategicTheme ?? [] };
  }

  async getStatistics(yearId?: number) {
    const w = yearId ? { yearId } : {};
    const [tg, ag, og, ta, ao, oo] = await Promise.all([
      this.prisma.goal.count({ where: w }),
      this.prisma.goal.count({ where: { ...w, approvalStatus: 'active' } }),
      this.prisma.goal.count({ where: { ...w, approvalStatus: 'achieved' } }),
      this.prisma.objective.count({ where: w }),
      this.prisma.objective.count({ where: { ...w, approvalStatus: 'active' } }),
      this.prisma.objective.count({ where: { ...w, approvalStatus: 'achieved' } }),
    ]);
    return { goals: { total: tg, active: ag, achieved: og }, objectives: { total: ta, active: ao, achieved: oo } };
  }
}
