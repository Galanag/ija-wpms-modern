import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

const SOURCE_DOC = 'Ija Developer Enterprise Annual Plan for the Year 2019';

async function main() {
  await prisma.$transaction(async (tx) => {
    // ============================================================
    // PHASE A: PLANNING YEAR
    // ============================================================
    const year2019 = await tx.planningYear.upsert({
      where: { year: 2019 },
      update: {
        label: '2019 E.C. Annual Plan',
        status: 'active',
        startDate: new Date('2026-06-08'),
        endDate: new Date('2027-06-07'),
      },
      create: {
        year: 2019,
        label: '2019 E.C. Annual Plan',
        status: 'active',
        startDate: new Date('2026-06-08'),
        endDate: new Date('2027-06-07'),
      },
    });

    // Create PlanningYearConfig
    await tx.planningYearConfig.upsert({
      where: { yearId: year2019.id },
      update: {
        planningStartDate: new Date('2026-06-08'),
        planningEndDate: new Date('2027-06-07'),
        updatedAt: new Date(),
      },
      create: {
        yearId: year2019.id,
        planningStartDate: new Date('2026-06-08'),
        planningEndDate: new Date('2027-06-07'),
        updatedAt: new Date(),
      },
    });

    // Create period definitions (quarters)
    const quarters = [
      ['Q1', '2026-06-08', '2026-09-07'],
      ['Q2', '2026-09-08', '2026-12-07'],
      ['Q3', '2026-12-08', '2027-03-07'],
      ['Q4', '2027-03-08', '2027-06-07'],
    ];
    for (const [periodKey, start, end] of quarters) {
      await tx.periodDefinition.upsert({
        where: { yearId_periodType_periodKey: { yearId: year2019.id, periodType: 'quarter', periodKey } },
        update: { startDate: new Date(start), endDate: new Date(end), label: periodKey },
        create: { yearId: year2019.id, periodType: 'quarter', periodKey, startDate: new Date(start), endDate: new Date(end), label: periodKey },
      });
    }

    // ============================================================
    // PHASE B: MASTER DATA - ORGANIZATION
    // ============================================================

    // Head Office
    const headOffice = await tx.orgUnit.upsert({
      where: { id: 1 },
      update: { name: 'Head Office', unitType: 'company', code: 'IJA', description: 'IJA Developer Enterprise Head Office' },
      create: { id: 1, name: 'Head Office', unitType: 'company', code: 'IJA', description: 'IJA Developer Enterprise Head Office' },
    });

    // Divisions
    const tourismDivision = await tx.orgUnit.upsert({
      where: { code: 'DIV-TOUR' },
      update: { name: 'Tourism and Hospitality Division', unitType: 'division', code: 'DIV-TOUR', parentId: headOffice.id, description: 'Tourism and Hospitality Division' },
      create: { name: 'Tourism and Hospitality Division', unitType: 'division', code: 'DIV-TOUR', parentId: headOffice.id, description: 'Tourism and Hospitality Division' },
    });

    const constructionDivision = await tx.orgUnit.upsert({
      where: { code: 'DIV-ENG' },
      update: { name: 'Construction and Engineering Division', unitType: 'division', code: 'DIV-ENG', parentId: headOffice.id, description: 'Construction and Engineering Division' },
      create: { name: 'Construction and Engineering Division', unitType: 'division', code: 'DIV-ENG', parentId: headOffice.id, description: 'Construction and Engineering Division' },
    });

    const corporateDivision = await tx.orgUnit.upsert({
      where: { code: 'DIV-CORP' },
      update: { name: 'Corporate Administration and Finance Division', unitType: 'division', code: 'DIV-CORP', parentId: headOffice.id, description: 'Corporate Administration and Finance Division' },
      create: { name: 'Corporate Administration and Finance Division', unitType: 'division', code: 'DIV-CORP', parentId: headOffice.id, description: 'Corporate Administration and Finance Division' },
    });

    // Branches
    const branches: Record<string, any> = {};
    const branchData = [
      { code: 'BR-HO', name: 'Head Office Branch', parentId: headOffice.id },
      { code: 'BR-WD', name: 'Wanchi Dandi', parentId: tourismDivision.id },
      { code: 'BR-BK', name: 'Boku', parentId: tourismDivision.id },
      { code: 'BR-LG', name: 'Langano', parentId: tourismDivision.id },
      { code: 'BR-SL', name: 'Shabale', parentId: tourismDivision.id },
    ];
    for (const b of branchData) {
      const org = await tx.orgUnit.upsert({
        where: { code: b.code },
        update: { name: b.name, unitType: 'branch', code: b.code, parentId: b.parentId },
        create: { name: b.name, unitType: 'branch', code: b.code, parentId: b.parentId },
      });
      branches[b.code] = org;
    }

    // Focus Areas
    const focusAreaData = [
      { code: 'FOC-HOSP', name: 'Hospitality' },
      { code: 'FOC-REST', name: 'Real Estate' },
      { code: 'FOC-CORP', name: 'Corporate' },
    ];
    const focusAreas: Record<string, any> = {};
    for (const f of focusAreaData) {
      const fa = await tx.focusArea.upsert({
        where: { code: f.code },
        update: { name: f.name, description: f.name + ' focus area' },
        create: { code: f.code, name: f.name, description: f.name + ' focus area' },
      });
      focusAreas[f.code] = fa;
    }

    // Branch-FocusArea associations (all branches can have all focus areas)
    for (const b of branchData) {
      for (const f of focusAreaData) {
        await tx.branchFocusArea.upsert({
          where: { orgUnitId_focusAreaId: { orgUnitId: branches[b.code].id, focusAreaId: focusAreas[f.code].id } },
          update: { active: true },
          create: { orgUnitId: branches[b.code].id, focusAreaId: focusAreas[f.code].id, active: true },
        });
      }
    }

    // Departments/Functions
    const deptData = [
      { code: 'DEPT-TOUR', name: 'Tourism & Hospitality', unitType: 'department', parentId: tourismDivision.id },
      { code: 'DEPT-MKT', name: 'Marketing & Promotion', unitType: 'department', parentId: headOffice.id },
      { code: 'DEPT-CENG', name: 'Construction & Engineering', unitType: 'department', parentId: constructionDivision.id },
      { code: 'DEPT-CORP', name: 'Corporate Administration & Finance', unitType: 'department', parentId: corporateDivision.id },
      { code: 'DEPT-RDB', name: 'Research & Business Development', unitType: 'department', parentId: headOffice.id },
      { code: 'DEPT-ICT', name: 'ICT', unitType: 'department', parentId: headOffice.id },
      { code: 'DEPT-IA', name: 'Internal Audit & Inspection', unitType: 'department', parentId: headOffice.id },
      { code: 'DEPT-LEGAL', name: 'Legal Service', unitType: 'department', parentId: headOffice.id },
      { code: 'DEPT-PLAN', name: 'Planning & Monitoring', unitType: 'department', parentId: headOffice.id },
    ];
    const departments: Record<string, any> = {};
    for (const d of deptData) {
      const org = await tx.orgUnit.upsert({
        where: { code: d.code },
        update: { name: d.name, unitType: d.unitType, parentId: d.parentId },
        create: { name: d.name, unitType: d.unitType, code: d.code, parentId: d.parentId },
      });
      departments[d.code] = org;
    }

    // ============================================================
    // PHASE C: STRATEGIC HIERARCHY
    // ============================================================

    // Strategic Plan (master, not year-specific)
    const strategicPlan = await tx.strategicPlan.upsert({
      where: { id: 1 },
      update: {
        name: SOURCE_DOC,
        description: 'IJA Developer Enterprise Annual Plan for the Year 2019 E.C.',
        startYear: 2019,
        endYear: 2019,
        status: 'active',
        approvalStatus: 'approved',
      },
      create: {
        id: 1,
        name: SOURCE_DOC,
        description: 'IJA Developer Enterprise Annual Plan for the Year 2019 E.C.',
        startYear: 2019,
        endYear: 2019,
        status: 'active',
        approvalStatus: 'approved',
      },
    });

    // Strategic Themes
    const theme1 = await tx.strategicTheme.upsert({
      where: { id: 1 },
      update: { planId: strategicPlan.id, code: 'THEME-01', name: 'Tourism and Hospitality Development and Management', description: 'Expanded and well-managed tourism and hospitality infrastructure', active: true },
      create: { id: 1, planId: strategicPlan.id, code: 'THEME-01', name: 'Tourism and Hospitality Development and Management', description: 'Expanded and well-managed tourism and hospitality infrastructure', active: true },
    });

    const theme2 = await tx.strategicTheme.upsert({
      where: { id: 2 },
      update: { planId: strategicPlan.id, code: 'THEME-02', name: 'Real Estate Construction and Development', description: 'Real estate construction started and other construction works executed', active: true },
      create: { id: 2, planId: strategicPlan.id, code: 'THEME-02', name: 'Real Estate Construction and Development', description: 'Real estate construction started and other construction works executed', active: true },
    });

    // Theme 3 result text was not fully exposed in the source - preserve the gap
    const theme3 = await tx.strategicTheme.upsert({
      where: { id: 3 },
      update: { planId: strategicPlan.id, code: 'THEME-03', name: 'Corporate Service Delivery', description: '[Source text not fully exposed in extraction - needs review]', active: true },
      create: { id: 3, planId: strategicPlan.id, code: 'THEME-03', name: 'Corporate Service Delivery', description: '[Source text not fully exposed in extraction - needs review]', active: true },
    });

    // Strategic Results (linked to themes and year)
    const result1 = await tx.strategicResult.upsert({
      where: { id: 1 },
      update: { themeId: theme1.id, yearId: year2019.id, code: 'RESULT-01', name: 'Expanded and well-managed tourism and hospitality infrastructure' },
      create: { id: 1, themeId: theme1.id, yearId: year2019.id, code: 'RESULT-01', name: 'Expanded and well-managed tourism and hospitality infrastructure' },
    });

    const result2 = await tx.strategicResult.upsert({
      where: { id: 2 },
      update: { themeId: theme2.id, yearId: year2019.id, code: 'RESULT-02', name: 'Real estate construction started and other construction works executed' },
      create: { id: 2, themeId: theme2.id, yearId: year2019.id, code: 'RESULT-02', name: 'Real estate construction started and other construction works executed' },
    });

    // Theme 3 result - mark as unknown per source
    const result3 = await tx.strategicResult.upsert({
      where: { id: 3 },
      update: { themeId: theme3.id, yearId: year2019.id, code: 'RESULT-03', name: '[Source text not fully exposed - needs review]' },
      create: { id: 3, themeId: theme3.id, yearId: year2019.id, code: 'RESULT-03', name: '[Source text not fully exposed - needs review]' },
    });

    // Goals (6 goals from source section 3.4.1)
    const goalDefs = [
      { id: 1, code: 'G-01', name: 'Increase enterprise revenue and profit', description: 'Increase revenue, gross profit and net profit.', resultId: result1.id },
      { id: 2, code: 'G-02', name: 'Conduct investment activities', description: 'Construction, renovation, real estate, research and consulting objectives.', resultId: result2.id },
      { id: 3, code: 'G-03', name: 'Increase hospitality service delivery', description: 'Increase tourists, stay duration, satisfaction and occupancy.', resultId: result1.id },
      { id: 4, code: 'G-04', name: 'Strengthen enterprise implementation capacity', description: 'Human capital, procurement, organization, quality and research.', resultId: result3.id },
      { id: 5, code: 'G-05', name: 'Increase innovation and technology utilization', description: 'Web-based KPI, ERP modules and QR-enabled customer feedback.', resultId: result3.id },
      { id: 6, code: 'G-06', name: 'Risk management and compliance', description: 'Identify and manage risks and ensure legal implementation.', resultId: result3.id },
    ];

    const goals: Record<number, any> = {};
    for (const g of goalDefs) {
      const goal = await tx.goal.upsert({
        where: { id: g.id },
        update: {
          yearId: year2019.id,
          resultId: g.resultId,
          code: g.code,
          name: g.name,
          description: g.description,
          weight: 1,
          approvalStatus: 'approved',
        },
        create: {
          id: g.id,
          yearId: year2019.id,
          resultId: g.resultId,
          code: g.code,
          name: g.name,
          description: g.description,
          weight: 1,
          approvalStatus: 'approved',
        },
      });
      goals[g.id] = goal;

      await tx.sourceReference.upsert({
        where: { entityType_entityId_sourceSection: { entityType: 'Goal', entityId: goal.id, sourceSection: '3.4.1' } },
        update: { sourceDocument: SOURCE_DOC, sourcePage: '3.4.1', sourceNote: 'Goals section' },
        create: { entityType: 'Goal', entityId: goal.id, sourceDocument: SOURCE_DOC, sourceSection: '3.4.1', sourceNote: 'Goals section' },
      });
    }

    // ============================================================
    // PHASE D: OBJECTIVES (all 30 from source)
    // ============================================================
    const objectiveData = [
      // Goal 1: Increase enterprise revenue and profit
      { id: 1, goalId: goals[1].id, code: 'O-01', name: 'Increase total revenue by 98.82% to reach ETB 825,131,426.96', targetValue: 825131426.96, unit: 'ETB', sourceSection: '3.4.2 Goal #1 Objective 1' },
      { id: 2, goalId: goals[1].id, code: 'O-02', name: 'Increase gross profit by 43.77% to reach ETB 355,410,210.97', targetValue: 355410210.97, unit: 'ETB', sourceSection: '3.4.2 Goal #1 Objective 2' },
      { id: 3, goalId: goals[1].id, code: 'O-03', name: 'Achieve Net Profit Margin (NPM) of 22.02%, generating ETB 181,692,797.75', targetValue: 181692797.75, unit: 'ETB', sourceSection: '3.4.2 Goal #1 Objective 3' },
      { id: 4, goalId: goals[1].id, code: 'O-04', name: 'Increase foreign currency (USD) revenue by 120.23% to reach 104,500', targetValue: 104500, unit: 'USD', sourceSection: '3.4.2 Goal #1 Objective 4' },
      { id: 5, goalId: goals[1].id, code: 'O-05', name: 'Establish business relationships (B2B) with 12 various organizations', targetValue: 12, unit: 'No.', sourceSection: '3.4.2 Goal #1 Objective 5' },

      // Goal 2: Conduct investment activities
      { id: 6, goalId: goals[2].id, code: 'O-06', name: 'Construct 1 new tourism destination', targetValue: 1, unit: 'No.', sourceSection: '3.4.2 Goal #2 Objective 1' },
      { id: 7, goalId: goals[2].id, code: 'O-07', name: 'Complete 100% of new project construction (Langano, Shabalee, Bokku, and Wanchi)', targetValue: 100, unit: '%', sourceSection: '3.4.2 Goal #2 Objective 2' },
      { id: 8, goalId: goals[2].id, code: 'O-08', name: 'Complete 100% of project renovation (Langano, Shabalee, Bokku, and Wanchi)', targetValue: 100, unit: '%', sourceSection: '3.4.2 Goal #2 Objective 3' },
      { id: 9, goalId: goals[2].id, code: 'O-09', name: 'Achieve 20% of real estate construction', targetValue: 20, unit: '%', sourceSection: '3.4.2 Goal #2 Objective 4' },
      { id: 10, goalId: goals[2].id, code: 'O-10', name: 'Conduct design research for 5 projects', targetValue: 5, unit: 'No.', sourceSection: '3.4.2 Goal #2 Objective 5' },
      { id: 11, goalId: goals[2].id, code: 'O-11', name: 'Provide consulting and supervision services for 3 projects', targetValue: 3, unit: 'No.', sourceSection: '3.4.2 Goal #2 Objective 6' },
      { id: 12, goalId: goals[2].id, code: 'O-12', name: 'Conduct 1 real estate market research', targetValue: 1, unit: 'No.', sourceSection: '3.4.2 Goal #2 Objective 7' },

      // Goal 3: Increase hospitality service delivery
      { id: 13, goalId: goals[3].id, code: 'O-13', name: 'Increase domestic and international tourists by 34.95% to serve 174,599 tourists', targetValue: 174599, unit: 'No.', sourceSection: '3.4.2 Goal #3 Objective 1' },
      { id: 14, goalId: goals[3].id, code: 'O-14', name: 'Increase average tourist stay from 7 hours to 11:45 hours', targetValue: 11.75, unit: 'Hours', sourceSection: '3.4.2 Goal #3 Objective 2' },
      { id: 15, goalId: goals[3].id, code: 'O-15', name: 'Increase customer satisfaction from 73% to 83.5%', targetValue: 83.5, unit: '%', sourceSection: '3.4.2 Goal #3 Objective 3' },
      { id: 16, goalId: goals[3].id, code: 'O-16', name: 'Increase occupancy rate from 24.91% to 47.12%', targetValue: 47.12, unit: '%', sourceSection: '3.4.2 Goal #3 Objective 4' },
      { id: 17, goalId: goals[3].id, code: 'O-17', name: 'Launch 1 new tourism destination', targetValue: 1, unit: 'No.', sourceSection: '3.4.2 Goal #3 Objective 5' },
      { id: 18, goalId: goals[3].id, code: 'O-18', name: 'Operationalize 2 restaurants at Wanchi Destination', targetValue: 2, unit: 'No.', sourceSection: '3.4.2 Goal #3 Objective 6' },
      { id: 19, goalId: goals[3].id, code: 'O-19', name: 'Operationalize 10 tents at Wanchi Destination', targetValue: 10, unit: 'No.', sourceSection: '3.4.2 Goal #3 Objective 7' },
      { id: 20, goalId: goals[3].id, code: 'O-20', name: 'Complete 100% of project maintenance', targetValue: 100, unit: '%', sourceSection: '3.4.2 Goal #3 Objective 8' },

      // Goal 4: Strengthen enterprise implementation capacity
      { id: 21, goalId: goals[4].id, code: 'O-21', name: 'Provide various training to 3,677 employees, community members, and MSME members', targetValue: 3677, unit: 'People', sourceSection: '3.4.2 Goal #4 Objective 1' },
      { id: 22, goalId: goals[4].id, code: 'O-22', name: 'Recruit 97 human resources', targetValue: 97, unit: 'People', sourceSection: '3.4.2 Goal #4 Objective 2' },
      { id: 23, goalId: goals[4].id, code: 'O-23', name: 'Execute capital procurement of ETB 77,012,065.06', targetValue: 77012065.06, unit: 'ETB', sourceSection: '3.4.2 Goal #4 Objective 3' },
      { id: 24, goalId: goals[4].id, code: 'O-24', name: 'Implement 100% of the new studied structure', targetValue: 100, unit: '%', sourceSection: '3.4.2 Goal #4 Objective 4' },
      { id: 25, goalId: goals[4].id, code: 'O-25', name: 'Implement Quality Management System and obtain 1 ISO certification', targetValue: 1, unit: 'Certification', sourceSection: '3.4.2 Goal #4 Objective 5' },
      { id: 26, goalId: goals[4].id, code: 'O-26', name: 'Conduct 4 various research studies', targetValue: 4, unit: 'No.', sourceSection: '3.4.2 Goal #4 Objective 6' },

      // Goal 5: Increase innovation and technology utilization
      { id: 27, goalId: goals[5].id, code: 'O-27', name: 'Develop and implement 1 Web-based KPI system', targetValue: 1, unit: 'System', sourceSection: '3.4.2 Goal #5 Objective 1' },
      { id: 28, goalId: goals[5].id, code: 'O-28', name: 'Develop and implement 2 ERP modules', targetValue: 2, unit: 'Modules', sourceSection: '3.4.2 Goal #5 Objective 2' },
      { id: 29, goalId: goals[5].id, code: 'O-29', name: 'Prepare QR Code for customer feedback and satisfaction collection for 4 branches', targetValue: 4, unit: 'Branches', sourceSection: '3.4.2 Goal #5 Objective 3' },
      { id: 30, goalId: goals[5].id, code: 'O-30', name: 'Prepare QR Code online food menu for 2 branches', targetValue: 2, unit: 'Branches', sourceSection: '3.4.2 Goal #5 Objective 4' },

      // Goal 6: Risk management and compliance
      { id: 31, goalId: goals[6].id, code: 'O-31', name: 'Identify 7 risks and work on their management', targetValue: 7, unit: 'No.', sourceSection: '3.4.2 Goal #6 Objective 1' },
      { id: 32, goalId: goals[6].id, code: 'O-32', name: 'Ensure 100% implementation of laws related to enterprise operations', targetValue: 100, unit: '%', sourceSection: '3.4.2 Goal #6 Objective 2' },
    ];

    const objectives: Record<number, any> = {};
    for (const o of objectiveData) {
      const obj = await tx.objective.upsert({
        where: { id: o.id },
        update: {
          yearId: year2019.id,
          goalId: o.goalId,
          code: o.code,
          name: o.name,
          targetValue: o.targetValue,
          unit: o.unit,
          direction: 'higher_is_better',
          weight: 1,
          approvalStatus: 'approved',
        },
        create: {
          id: o.id,
          yearId: year2019.id,
          goalId: o.goalId,
          code: o.code,
          name: o.name,
          targetValue: o.targetValue,
          unit: o.unit,
          direction: 'higher_is_better',
          weight: 1,
          approvalStatus: 'approved',
        },
      });
      objectives[o.id] = obj;

      const objSourceSection = o.sourceSection ?? '';
      await tx.sourceReference.upsert({
        where: { entityType_entityId_sourceSection: { entityType: 'Objective', entityId: obj.id, sourceSection: objSourceSection } },
        update: { sourceDocument: SOURCE_DOC, sourcePage: o.sourceSection },
        create: { entityType: 'Objective', entityId: obj.id, sourceDocument: SOURCE_DOC, sourceSection: o.sourceSection ?? null, sourceNote: o.name },
      });
    }

    // ============================================================
    // PHASE E: KPI DEFINITIONS AND PLANS
    // ============================================================

    // KPI Definitions (master data - reusable)
    const kpiDefs = [
      { code: 'REV', name: 'Tourism Revenue', unit: 'ETB', frequency: 'annual', direction: 'higher_is_better', definition: 'Total revenue from tourism and hospitality services', area: 'Finance' },
      { code: 'VIS', name: 'Tourist Arrivals', unit: 'count', frequency: 'quarterly', direction: 'higher_is_better', definition: 'Number of domestic and international tourists served', area: 'Tourism' },
      { code: 'SAT', name: 'Customer Satisfaction', unit: '%', frequency: 'quarterly', direction: 'higher_is_better', definition: 'Customer satisfaction score', area: 'Tourism' },
      { code: 'OCC', name: 'Occupancy Rate', unit: '%', frequency: 'monthly', direction: 'higher_is_better', definition: 'Room occupancy rate across all accommodations', area: 'Tourism' },
      { code: 'STAY', name: 'Average Tourist Stay', unit: 'hours', frequency: 'monthly', direction: 'higher_is_better', definition: 'Average duration of tourist visits', area: 'Tourism' },
      { code: 'GP', name: 'Gross Profit', unit: 'ETB', frequency: 'annual', direction: 'higher_is_better', definition: 'Gross profit from operations', area: 'Finance' },
      { code: 'NP', name: 'Net Profit', unit: 'ETB', frequency: 'annual', direction: 'higher_is_better', definition: 'Net profit after all expenses', area: 'Finance' },
      { code: 'FOREIGN-REV', name: 'Foreign Currency Revenue', unit: 'USD', frequency: 'annual', direction: 'higher_is_better', definition: 'Revenue from international tourists in USD', area: 'Finance' },
      { code: 'B2B', name: 'B2B Business Relationships', unit: 'No.', frequency: 'annual', direction: 'higher_is_better', definition: 'Number of B2B partnerships established', area: 'Marketing' },
      { code: 'DOM-Tourists', name: 'Domestic Tourist Arrivals', unit: 'count', frequency: 'annual', direction: 'higher_is_better', definition: 'Number of domestic tourists', area: 'Tourism' },
      { code: 'INTL-Tourists', name: 'International Tourist Arrivals', unit: 'count', frequency: 'annual', direction: 'higher_is_better', definition: 'Number of international tourists', area: 'Tourism' },
      { code: 'CONS-PROC', name: 'New Tourism Destination Construction', unit: 'No.', frequency: 'annual', direction: 'higher_is_better', definition: 'Number of new tourism destinations constructed', area: 'Construction' },
      { code: 'RENO-PCT', name: 'Project Renovation Completion', unit: '%', frequency: 'annual', direction: 'higher_is_better', definition: 'Percentage of project renovation completed', area: 'Construction' },
      { code: 'NEW-PRP', name: 'New Project Construction Completion', unit: '%', frequency: 'annual', direction: 'higher_is_better', definition: 'Percentage of new project construction completed', area: 'Construction' },
      { code: 'RE-PCT', name: 'Real Estate Construction', unit: '%', frequency: 'annual', direction: 'higher_is_better', definition: 'Percentage of real estate construction achieved', area: 'Real Estate' },
      { code: 'DESIGN-RS', name: 'Design Research Projects', unit: 'No.', frequency: 'annual', direction: 'higher_is_better', definition: 'Number of projects with design research completed', area: 'Construction' },
      { code: 'CONSULT-P', name: 'Consulting Services Provided', unit: 'No.', frequency: 'annual', direction: 'higher_is_better', definition: 'Number of consulting/supervision projects', area: 'Construction' },
      { code: 'REAL-EST-MR', name: 'Real Estate Market Research', unit: 'No.', frequency: 'annual', direction: 'higher_is_better', definition: 'Number of real estate market research studies', area: 'Research' },
      { code: 'MAINT-PCT', name: 'Project Maintenance Completion', unit: '%', frequency: 'annual', direction: 'higher_is_better', definition: 'Percentage of project maintenance completed', area: 'Construction' },
      { code: 'TRAINING', name: 'People Trained', unit: 'People', frequency: 'annual', direction: 'higher_is_better', definition: 'Number of people trained', area: 'HR' },
      { code: 'RECRUIT', name: 'Employees Recruited', unit: 'No.', frequency: 'annual', direction: 'higher_is_better', definition: 'Number of new employees recruited', area: 'HR' },
      { code: 'CAP-PROC', name: 'Capital Procurement', unit: 'ETB', frequency: 'annual', direction: 'higher_is_better', definition: 'Total capital procurement executed', area: 'Finance' },
      { code: 'STRUCT-PCT', name: 'New Structure Implementation', unit: '%', frequency: 'annual', direction: 'higher_is_better', definition: 'Percentage of new organizational structure implemented', area: 'Management' },
      { code: 'ISO-CERT', name: 'ISO Certification Obtained', unit: 'No.', frequency: 'annual', direction: 'higher_is_better', definition: 'Number of ISO certifications obtained', area: 'Quality' },
      { code: 'RESEARCH', name: 'Research Studies Conducted', unit: 'No.', frequency: 'annual', direction: 'higher_is_better', definition: 'Number of research studies completed', area: 'Research' },
      { code: 'KPI-SYS', name: 'Web-based KPI System', unit: 'No.', frequency: 'annual', direction: 'higher_is_better', definition: 'Number of web-based KPI systems implemented', area: 'Technology' },
      { code: 'ERP-MOD', name: 'ERP Modules Implemented', unit: 'No.', frequency: 'annual', direction: 'higher_is_better', definition: 'Number of ERP modules implemented', area: 'Technology' },
      { code: 'QR-FEEDBACK', name: 'QR Code Feedback Branches', unit: 'No.', frequency: 'annual', direction: 'higher_is_better', definition: 'Number of branches with QR feedback', area: 'Technology' },
      { code: 'QR-MENU', name: 'QR Code Food Menu Branches', unit: 'No.', frequency: 'annual', direction: 'higher_is_better', definition: 'Number of branches with QR food menu', area: 'Technology' },
      { code: 'RISK-ID', name: 'Risks Identified', unit: 'No.', frequency: 'annual', direction: 'higher_is_better', definition: 'Number of risks identified', area: 'Risk' },
      { code: 'LAW-PCT', name: 'Legal Implementation', unit: '%', frequency: 'annual', direction: 'higher_is_better', definition: 'Percentage of law implementation compliance', area: 'Compliance' },
      { code: 'ROA', name: 'Return on Assets', unit: '%', frequency: 'annual', direction: 'higher_is_better', definition: 'Return on Assets ratio', area: 'Finance' },
      { code: 'ROE', name: 'Return on Equity', unit: '%', frequency: 'annual', direction: 'higher_is_better', definition: 'Return on Equity ratio', area: 'Finance' },
      { code: 'MARKET-SHARE', name: 'Market Share', unit: '%', frequency: 'annual', direction: 'higher_is_better', definition: 'Market share percentage', area: 'Marketing' },
    ];

    const kpiMap: Record<string, any> = {};
    for (const k of kpiDefs) {
      const existing = await tx.kpi.findUnique({ where: { code: k.code } });
      let kpi;
      if (existing) {
        kpi = await tx.kpi.update({
          where: { code: k.code },
          data: { name: k.name, unit: k.unit, frequency: k.frequency, direction: k.direction, definition: k.definition, area: k.area, active: true },
        });
      } else {
        kpi = await tx.kpi.create({
          data: { code: k.code, name: k.name, unit: k.unit, frequency: k.frequency, direction: k.direction, definition: k.definition, area: k.area, active: true },
        });
      }
      kpiMap[k.code] = kpi;
    }

    // KPI Plans (year-specific with source targets from Table 11)
    const kpiPlanData = [
      // 1.1 Revenue Growth - from objective O-01, baseline 2018 actual, target 2019 plan
      { kpiCode: 'REV', objectiveId: objectives[1].id, baselineValue: 415007747.64, annualTarget: 825131426.96, q1Target: 186777345.22, q2Target: 223007672.04, q3Target: 212234526.63, q4Target: 203111883.07, unit: 'ETB' },
      { kpiCode: 'GP', objectiveId: objectives[2].id, baselineValue: 232882087.84, annualTarget: 355410210.97 },
      { kpiCode: 'NP', objectiveId: objectives[3].id, baselineValue: 80349148.42, annualTarget: 181692797.75 },
      { kpiCode: 'FOREIGN-REV', objectiveId: objectives[4].id, baselineValue: 48127.52, annualTarget: 104500, unit: 'USD' },
      { kpiCode: 'B2B', objectiveId: objectives[5].id, baselineValue: 0, annualTarget: 12 },
      { kpiCode: 'VIS', objectiveId: objectives[13].id, baselineValue: 117594, annualTarget: 174599 },
      { kpiCode: 'SAT', objectiveId: objectives[15].id, baselineValue: 73, annualTarget: 83.5 },
      { kpiCode: 'OCC', objectiveId: objectives[16].id, baselineValue: 24.91, annualTarget: 47.12 },
      { kpiCode: 'STAY', objectiveId: objectives[14].id, baselineValue: 7, annualTarget: 11.75 },
      { kpiCode: 'CONS-PROC', objectiveId: objectives[6].id, baselineValue: 0, annualTarget: 1 },
      { kpiCode: 'NEW-PRP', objectiveId: objectives[7].id, baselineValue: 0, annualTarget: 100 },
      { kpiCode: 'RENO-PCT', objectiveId: objectives[8].id, baselineValue: 0, annualTarget: 100 },
      { kpiCode: 'RE-PCT', objectiveId: objectives[9].id, baselineValue: 0, annualTarget: 20 },
      { kpiCode: 'DESIGN-RS', objectiveId: objectives[10].id, baselineValue: 0, annualTarget: 5 },
      { kpiCode: 'CONSULT-P', objectiveId: objectives[11].id, baselineValue: 0, annualTarget: 3 },
      { kpiCode: 'REAL-EST-MR', objectiveId: objectives[12].id, baselineValue: 0, annualTarget: 1 },
      { kpiCode: 'MAINT-PCT', objectiveId: objectives[20].id, baselineValue: 0, annualTarget: 100 },
      { kpiCode: 'TRAINING', objectiveId: objectives[21].id, baselineValue: 0, annualTarget: 3677 },
      { kpiCode: 'RECRUIT', objectiveId: objectives[22].id, baselineValue: 0, annualTarget: 97 },
      { kpiCode: 'CAP-PROC', objectiveId: objectives[23].id, baselineValue: 0, annualTarget: 77012065.06 },
      { kpiCode: 'STRUCT-PCT', objectiveId: objectives[24].id, baselineValue: 0, annualTarget: 100 },
      { kpiCode: 'ISO-CERT', objectiveId: objectives[25].id, baselineValue: 0, annualTarget: 1 },
      { kpiCode: 'RESEARCH', objectiveId: objectives[26].id, baselineValue: 0, annualTarget: 4 },
      { kpiCode: 'KPI-SYS', objectiveId: objectives[27].id, baselineValue: 0, annualTarget: 1 },
      { kpiCode: 'ERP-MOD', objectiveId: objectives[28].id, baselineValue: 0, annualTarget: 2 },
      { kpiCode: 'QR-FEEDBACK', objectiveId: objectives[29].id, baselineValue: 0, annualTarget: 4 },
      { kpiCode: 'QR-MENU', objectiveId: objectives[30].id, baselineValue: 0, annualTarget: 2 },
      { kpiCode: 'RISK-ID', objectiveId: objectives[31].id, baselineValue: 0, annualTarget: 7 },
      { kpiCode: 'LAW-PCT', objectiveId: objectives[32].id, baselineValue: 0, annualTarget: 100 },
      // Table 11 additional KPIs
      { kpiCode: 'ROA', objectiveId: objectives[3].id, baselineValue: 0.86, annualTarget: 1.70 },
      { kpiCode: 'ROE', objectiveId: objectives[3].id, baselineValue: 1.17, annualTarget: 2.56 },
      { kpiCode: 'MARKET-SHARE', objectiveId: objectives[1].id, baselineValue: 0.13, annualTarget: 0.15 },
    ];

    for (const kpd of kpiPlanData) {
      const kpiDef = kpiMap[kpd.kpiCode];
      if (!kpiDef) continue;
      // Use findFirst + create/update since compound unique with nullable orgUnitId doesn't work in upsert
      const existing = await tx.kpiPlan.findFirst({
        where: { yearId: year2019.id, kpiId: kpiDef.id, orgUnitId: null },
      });
      if (existing) {
        await tx.kpiPlan.update({
          where: { id: existing.id },
          data: {
            objectiveId: kpd.objectiveId,
            baselineValue: kpd.baselineValue,
            annualTarget: kpd.annualTarget,
            q1Target: kpd.q1Target ?? null,
            q2Target: kpd.q2Target ?? null,
            q3Target: kpd.q3Target ?? null,
            q4Target: kpd.q4Target ?? null,
            weight: 1,
            approvalStatus: 'approved',
          },
        });
      } else {
        await tx.kpiPlan.create({
          data: {
            yearId: year2019.id,
            kpiId: kpiDef.id,
            orgUnitId: null,
            objectiveId: kpd.objectiveId,
            baselineValue: kpd.baselineValue,
            annualTarget: kpd.annualTarget,
            q1Target: kpd.q1Target ?? null,
            q2Target: kpd.q2Target ?? null,
            q3Target: kpd.q3Target ?? null,
            q4Target: kpd.q4Target ?? null,
            weight: 1,
            approvalStatus: 'approved',
          },
        });
      }
    }

    // ============================================================
    // PHASE F: WORK PLAN ACTIVITIES
    // ============================================================
    const activityData = [
      // 3.6.1 Tourism and Hospitality Division
      { title: 'Establish Tour Guide Cooperative for Dandi Lake Lodge', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[17].id, source: '3.6.1' },
      { title: 'Establish Wanchi-Dandi Management Council', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[19].id, source: '3.6.1' },
      { title: 'Establish Horse Riding Cooperative for Dandi Lake Tourism Destination', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[19].id, source: '3.6.1' },
      { title: 'Establish Boat Cooperative for Dandi Lake Tourism Destination', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[19].id, source: '3.6.1' },
      { title: 'Establish Cultural Village Guides Cooperative for Wanchi', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[19].id, source: '3.6.1' },
      { title: 'Prepare Service Quality Standards for Cooperatives', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[18].id, source: '3.6.1' },
      { title: 'Create Awareness Forums for Service-Providing Cooperatives', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[18].id, source: '3.6.1' },
      { title: 'Operationalize Dandi Lodge', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[19].id, source: '3.6.1' },
      { title: 'Create Awareness (Visitors, Community, Cooperatives) - 10,000 people', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[19].id, source: '3.6.1' },
      { title: 'Plant Fruit Trees (Apple and Prima) - 10,000 trees', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[19].id, source: '3.6.1' },
      { title: 'Plant Indigenous Plants - 10,000 plants', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[19].id, source: '3.6.1' },
      { title: 'Care for Planted Plants', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[19].id, source: '3.6.1' },
      { title: 'Ensure Cleanliness and Beauty of Surroundings', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[19].id, source: '3.6.1' },
      { title: 'Wanchi-Dandi Grand Run (10km)', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[17].id, source: '3.6.1' },
      { title: 'Motorcycle Competition', dept: 'DEPT-TOUR', branch: 'BR-SL', objectiveId: objectives[17].id, source: '3.6.1' },
      { title: 'Wanchi-Dandi Cycling Competition', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[17].id, source: '3.6.1' },
      { title: 'Cultural Food and Song Festival at Shabalee-Langano', dept: 'DEPT-TOUR', branch: 'BR-LG', objectiveId: objectives[17].id, source: '3.6.1' },
      { title: 'Coordinating Irreechaa Festival at Langano and Wanchi', dept: 'DEPT-TOUR', branch: 'BR-LG', objectiveId: objectives[17].id, source: '3.6.1' },
      { title: 'Hosting Government, NGO, Embassy, and Development Enterprise Meetings', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[17].id, source: '3.6.1' },

      // Tourist Arrivals
      { title: 'Tourist Arrivals: Domestic tourists 100,175 -> 153,554', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[13].id, source: '3.6.1' },
      { title: 'Tourist Arrivals: International tourists 17,419 -> 21,045 (total 174,599)', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[13].id, source: '3.6.1' },
      { title: 'Tourism Revenue: ETB 651,952,774.91 + USD 104,500', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[1].id, source: '3.6.1' },
      { title: 'Increase tourist stay from 7:00 to 11:45 hours', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[14].id, source: '3.6.1' },
      { title: 'Increase customer satisfaction from 73% to 83.5%', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[15].id, source: '3.6.1' },
      { title: 'Increase occupancy from 24.91% to 47.12%', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[16].id, source: '3.6.1' },

      // Market Linkages
      { title: 'Establish Vegetable and Fruit Supply Cooperatives (2)', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[17].id, source: '3.6.1' },
      { title: 'Establish Livestock Product Supply Cooperatives (2)', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[17].id, source: '3.6.1' },

      // Tour and Travel Service
      { title: 'Purchase Tour Vehicles (Electric & Hybrid) - 1 Coaster Bus', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[17].id, source: '3.6.1' },
      { title: 'Obtain Federal Competency Certificate', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[17].id, source: '3.6.1' },
      { title: 'Recruit Qualified Tour and Travel Personnel', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[22].id, source: '3.6.1' },
      { title: 'Establish Agreements with Major Tour and Travel Companies (3)', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[17].id, source: '3.6.1' },
      { title: 'Take Famous Tour Operators to IJA Destinations', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[17].id, source: '3.6.1' },
      { title: 'Prepare Tour Package Itineraries', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[17].id, source: '3.6.1' },
      { title: 'Transport Domestic Tourists to IJA Destinations', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[17].id, source: '3.6.1' },
      { title: 'Transport International Tourists to IJA Destinations', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[17].id, source: '3.6.1' },
      { title: 'Partner with Ethiopian Airlines', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[17].id, source: '3.6.1' },
      { title: 'Register Tour and Travel Cooperatives at Federal Level', dept: 'DEPT-TOUR', branch: 'BR-WD', objectiveId: objectives[17].id, source: '3.6.1' },

      // 3.6.2 Marketing and Promotion
      { title: 'Establishing B2B relationships with 12 organizations', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[5].id, source: '3.6.2' },
      { title: 'Preparing Sales and Strategy document', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: 'Conducting real estate market research', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[12].id, source: '3.6.2' },
      { title: 'TV and Radio advertisements', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: 'Festival sponsorship', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: 'Newspaper advertising', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: 'Digital TV utilization', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: 'LED Screen maintenance and use', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: '2,000 brochures distribution', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: '2 billboards', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: '4 tapers, 20 table signages, 25 tapers', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: 'QR code online food menu for 2 branches', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[30].id, source: '3.6.2' },
      { title: 'Website content for Shabalee Resort, Bokku Natural Spring, and Dandi Lodge', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: 'Increasing social media followers by 30,000', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: '12 website content updates', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: '216 social media content pieces', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: '4 social media competitions', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: '5 giveaway materials', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: 'Brand Strategy document', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: 'Enterprise rebranding', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: 'Marketing staff training (4 times)', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: 'QR Code for customer feedback (4 branches)', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[29].id, source: '3.6.2' },
      { title: '2 Fam trips', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: '4 influencer events', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: '2 exhibition participations', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },
      { title: '2 tour and travel company awards/launch', dept: 'DEPT-MKT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.2' },

      // 3.6.3 Construction and Engineering
      { title: 'Bole 24: 3B+G+M+19 building construction', dept: 'DEPT-CENG', branch: 'BR-HO', objectiveId: objectives[9].id, source: '3.6.3' },
      { title: 'Wanchi Destination: Existing facility maintenance (tents, restaurants, hiking walkway)', dept: 'DEPT-CENG', branch: 'BR-WD', objectiveId: objectives[20].id, source: '3.6.3' },
      { title: 'Wanchi Destination: Restaurant #1, #2 & #3', dept: 'DEPT-CENG', branch: 'BR-WD', objectiveId: objectives[7].id, source: '3.6.3' },
      { title: 'Wanchi Destination: Cable Bridge, Handrail, Vista Points', dept: 'DEPT-CENG', branch: 'BR-WD', objectiveId: objectives[7].id, source: '3.6.3' },
      { title: 'Wanchi Destination: Fence Work, Furniture, Bamboo Covering, Pavement, Landscaping', dept: 'DEPT-CENG', branch: 'BR-WD', objectiveId: objectives[7].id, source: '3.6.3' },
      { title: 'Wenchi Dendi Crater Lake River Training Works', dept: 'DEPT-CENG', branch: 'BR-WD', objectiveId: objectives[7].id, source: '3.6.3' },
      { title: 'Furniture for Tent Facilities', dept: 'DEPT-CENG', branch: 'BR-WD', objectiveId: objectives[7].id, source: '3.6.3' },
      { title: 'Langano/Simbo Resort: Presidential/VIP suites and Rooms', dept: 'DEPT-CENG', branch: 'BR-LG', objectiveId: objectives[7].id, source: '3.6.3' },
      { title: 'Langano/Simbo Resort: Pavilion (Sports, Exhibitions, Medical, Wedding, Fairs)', dept: 'DEPT-CENG', branch: 'BR-LG', objectiveId: objectives[7].id, source: '3.6.3' },
      { title: 'Langano/Simbo Resort: Amenities (Leisure, Sports, Entertainment, Wellness, Fitness)', dept: 'DEPT-CENG', branch: 'BR-LG', objectiveId: objectives[7].id, source: '3.6.3' },
      { title: 'Langano/Simbo Resort: Recreation Facilities (Lake side activities)', dept: 'DEPT-CENG', branch: 'BR-LG', objectiveId: objectives[7].id, source: '3.6.3' },
      { title: 'Langano/Simbo Resort: Furnish Work, Walkway, Electrical/Water/Sanitary, Playground, Landscape, Swimming Pool', dept: 'DEPT-CENG', branch: 'BR-LG', objectiveId: objectives[7].id, source: '3.6.3' },
      { title: 'Shabale Resort: Rooms and Presidential suite', dept: 'DEPT-CENG', branch: 'BR-SL', objectiveId: objectives[7].id, source: '3.6.3' },
      { title: 'Shabale Resort: Pavilion, Amenities, Recreation Facilities', dept: 'DEPT-CENG', branch: 'BR-SL', objectiveId: objectives[7].id, source: '3.6.3' },
      { title: 'Shabale Resort: Furnish Work, Landscape, Walkway, Playground', dept: 'DEPT-CENG', branch: 'BR-SL', objectiveId: objectives[8].id, source: '3.6.3' },
      { title: 'Shabale Resort: Electrical, Water Source & Sanitary Work', dept: 'DEPT-CENG', branch: 'BR-SL', objectiveId: objectives[7].id, source: '3.6.3' },
      { title: 'Shabale Resort: Reception interior work', dept: 'DEPT-CENG', branch: 'BR-SL', objectiveId: objectives[7].id, source: '3.6.3' },
      { title: 'Bokku Natural Steam: New steam room expansion, Admin Office, Workers Room', dept: 'DEPT-CENG', branch: 'BR-BK', objectiveId: objectives[7].id, source: '3.6.3' },
      { title: 'Bokku Natural Steam: Internal Road, Site electric/sanitary, Main gate, Fence', dept: 'DEPT-CENG', branch: 'BR-BK', objectiveId: objectives[7].id, source: '3.6.3' },
      { title: 'Bokku Natural Steam: Children Playground, Wellness/health/beauty', dept: 'DEPT-CENG', branch: 'BR-BK', objectiveId: objectives[7].id, source: '3.6.3' },
      { title: 'Bokku Natural Steam: Reception, Guard house, Landscape, Parking', dept: 'DEPT-CENG', branch: 'BR-BK', objectiveId: objectives[7].id, source: '3.6.3' },
      { title: 'Bishan Guracha Resort Construction', dept: 'DEPT-CENG', branch: 'BR-HO', objectiveId: objectives[6].id, source: '3.6.3' },

      // 3.6.4 Corporate Administration and Finance
      { title: 'Recruitment: 97 employees', dept: 'DEPT-CORP', branch: 'BR-HO', objectiveId: objectives[22].id, source: '3.6.4' },
      { title: 'Training: 3,677 people with budget ETB 2,472,000', dept: 'DEPT-CORP', branch: 'BR-HO', objectiveId: objectives[21].id, source: '3.6.4' },
      { title: 'Reform Works: 8 new directives', dept: 'DEPT-CORP', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.4' },
      { title: 'Reform Works: 4 existing directives improvement', dept: 'DEPT-CORP', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.4' },
      { title: 'Reform Works: 6 Kaizen initiatives', dept: 'DEPT-CORP', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.4' },
      { title: 'Reform Works: 1 ISO certification', dept: 'DEPT-CORP', branch: 'BR-HO', objectiveId: objectives[25].id, source: '3.6.4' },
      { title: 'Reform Works: 1 new structure implementation', dept: 'DEPT-CORP', branch: 'BR-HO', objectiveId: objectives[24].id, source: '3.6.4' },
      { title: 'Reform Works: GPS for 5 vehicles', dept: 'DEPT-CORP', branch: 'BR-HO', objectiveId: objectives[23].id, source: '3.6.4' },
      { title: 'CSR: Notebooks for 100 disadvantaged students (ETB 50,000)', dept: 'DEPT-CORP', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.4' },
      { title: 'CSR: Free entry for 600 people (ETB 240,000)', dept: 'DEPT-CORP', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.4' },
      { title: 'CSR: Support for 50 people with special needs (ETB 120,000)', dept: 'DEPT-CORP', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.4' },
      { title: 'CSR: Support for 50 disadvantaged near Shabale Resort (ETB 200,000)', dept: 'DEPT-CORP', branch: 'BR-SL', objectiveId: objectives[26].id, source: '3.6.4' },
      { title: 'CSR: Community Health Insurance for 50 near Langano Resort (ETB 100,000)', dept: 'DEPT-CORP', branch: 'BR-LG', objectiveId: objectives[26].id, source: '3.6.4' },
      { title: 'CSR: Build 1 house for disadvantaged (ETB 1,000,000)', dept: 'DEPT-CORP', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.4' },
      { title: 'CSR: Plant and maintain 4,500 seedlings (ETB 3,290,000)', dept: 'DEPT-CORP', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.4' },
      { title: 'Job Creation: 806 jobs (62 permanent, 34 contract, 710 temporary)', dept: 'DEPT-CORP', branch: 'BR-HO', objectiveId: objectives[22].id, source: '3.6.4' },

      // 3.6.5 Research and Business Development
      { title: 'Research on profitability improvement', dept: 'DEPT-RDB', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.5' },
      { title: 'Research on opportunities and threats', dept: 'DEPT-RDB', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.5' },
      { title: 'Research on employee motivation and discipline', dept: 'DEPT-RDB', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.5' },
      { title: 'Implementing Quality Management System for ISO certification', dept: 'DEPT-RDB', branch: 'BR-HO', objectiveId: objectives[25].id, source: '3.6.5' },
      { title: 'Investment Land Acquisition: Shallo Hot Springs (20,000 m²)', dept: 'DEPT-RDB', branch: 'BR-HO', objectiveId: objectives[6].id, source: '3.6.5' },
      { title: 'Investment Land Acquisition: Abiyata Shalla (100,000 m²)', dept: 'DEPT-RDB', branch: 'BR-HO', objectiveId: objectives[6].id, source: '3.6.5' },
      { title: 'Investment Land Acquisition: IJA Grand Hotel (5,000 m²)', dept: 'DEPT-RDB', branch: 'BR-HO', objectiveId: objectives[6].id, source: '3.6.5' },
      { title: 'Investment Land Acquisition: Machinery Area (20,000 m²)', dept: 'DEPT-RDB', branch: 'BR-HO', objectiveId: objectives[6].id, source: '3.6.5' },

      // 3.6.6 ICT
      { title: 'ERP System Support and training for head office and branch staff', dept: 'DEPT-ICT', branch: 'BR-HO', objectiveId: objectives[28].id, source: '3.6.6' },
      { title: 'Develop Planning and Tour & Travel ERP modules', dept: 'DEPT-ICT', branch: 'BR-HO', objectiveId: objectives[28].id, source: '3.6.6' },
      { title: 'AI Based Dashboard for marketing and social media', dept: 'DEPT-ICT', branch: 'BR-HO', objectiveId: objectives[27].id, source: '3.6.6' },
      { title: 'Web-based KPI: Daily KPI measurement system', dept: 'DEPT-ICT', branch: 'BR-HO', objectiveId: objectives[27].id, source: '3.6.6' },
      { title: 'Tele Birr sub-app development', dept: 'DEPT-ICT', branch: 'BR-HO', objectiveId: objectives[27].id, source: '3.6.6' },
      { title: 'Social Media Management: Regular updates and security', dept: 'DEPT-ICT', branch: 'BR-HO', objectiveId: objectives[17].id, source: '3.6.6' },
      { title: 'Computer installation and repairs', dept: 'DEPT-ICT', branch: 'BR-HO', objectiveId: objectives[23].id, source: '3.6.6' },

      // 3.6.7 Internal Audit and Inspection
      { title: 'Respond to 2018 internal audit findings (ETB 209,091.79)', dept: 'DEPT-IA', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.7' },
      { title: 'Conduct 24 audits across Head Office and all branches', dept: 'DEPT-IA', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.7' },
      { title: 'Financial Audit', dept: 'DEPT-IA', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.7' },
      { title: 'Asset Audit', dept: 'DEPT-IA', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.7' },
      { title: 'Human Resources Audit', dept: 'DEPT-IA', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.7' },
      { title: 'Procurement Audit', dept: 'DEPT-IA', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.7' },
      { title: 'Follow up on audit findings (6 follow-ups)', dept: 'DEPT-IA', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.7' },

      // 3.6.8 Legal Service
      { title: 'Court Cases: 3 cases (valued at ETB 42,090,000)', dept: 'DEPT-LEGAL', branch: 'BR-HO', objectiveId: objectives[32].id, source: '3.6.8' },
      { title: 'Review and confirm 24 agreements', dept: 'DEPT-LEGAL', branch: 'BR-HO', objectiveId: objectives[32].id, source: '3.6.8' },
      { title: 'Monitor implementation of existing directives', dept: 'DEPT-LEGAL', branch: 'BR-HO', objectiveId: objectives[32].id, source: '3.6.8' },
      { title: 'Reconcile existing directives with enterprise establishment', dept: 'DEPT-LEGAL', branch: 'BR-HO', objectiveId: objectives[32].id, source: '3.6.8' },
      { title: 'Prepare various enterprise agreements', dept: 'DEPT-LEGAL', branch: 'BR-HO', objectiveId: objectives[32].id, source: '3.6.8' },
      { title: 'Identify potential disputes', dept: 'DEPT-LEGAL', branch: 'BR-HO', objectiveId: objectives[32].id, source: '3.6.8' },
      { title: 'Ensure good governance and reduce customer complaints', dept: 'DEPT-LEGAL', branch: 'BR-HO', objectiveId: objectives[32].id, source: '3.6.8' },
      { title: 'Provide legal advice to management and staff', dept: 'DEPT-LEGAL', branch: 'BR-HO', objectiveId: objectives[32].id, source: '3.6.8' },
      { title: 'Labor law awareness training', dept: 'DEPT-LEGAL', branch: 'BR-HO', objectiveId: objectives[32].id, source: '3.6.8' },
      { title: 'Follow up on audit findings for response', dept: 'DEPT-LEGAL', branch: 'BR-HO', objectiveId: objectives[32].id, source: '3.6.8' },
      { title: 'Prepare minutes for various meetings', dept: 'DEPT-LEGAL', branch: 'BR-HO', objectiveId: objectives[32].id, source: '3.6.8' },

      // 3.6.9 Planning and Monitoring
      { title: 'Distribute 2019 plan checklists to relevant work units', dept: 'DEPT-PLAN', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.9' },
      { title: 'Prepare and distribute monthly reports', dept: 'DEPT-PLAN', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.9' },
      { title: 'Prepare and distribute quarterly reports', dept: 'DEPT-PLAN', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.9' },
      { title: 'Present quarterly reports to enterprise management', dept: 'DEPT-PLAN', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.9' },
      { title: 'Present quarterly reports to employees for discussion', dept: 'DEPT-PLAN', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.9' },
      { title: 'Conduct regular monitoring and evaluation with support', dept: 'DEPT-PLAN', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.9' },
      { title: 'Provide written feedback to branches', dept: 'DEPT-PLAN', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.9' },
      { title: 'Prepare and distribute annual report', dept: 'DEPT-PLAN', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.9' },
      { title: 'Prepare and distribute KPI reports', dept: 'DEPT-PLAN', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.9' },
      { title: 'Revise 2019 work plan based on first six months performance', dept: 'DEPT-PLAN', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.9' },
      { title: 'Complete prerequisites for 2020 work plan preparation', dept: 'DEPT-PLAN', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.9' },
      { title: 'Collect all data needed for 2020 work plan', dept: 'DEPT-PLAN', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.9' },
      { title: 'Prepare draft 2020 work plan for relevant bodies', dept: 'DEPT-PLAN', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.9' },
      { title: 'Prepare final 2020 work plan based on feedback', dept: 'DEPT-PLAN', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.9' },
      { title: 'Prepare and distribute 2020 KPI plan', dept: 'DEPT-PLAN', branch: 'BR-HO', objectiveId: objectives[26].id, source: '3.6.9' },
    ];

    const activityMap: Record<string, any> = {};
    for (let i = 0; i < activityData.length; i++) {
      const a = activityData[i];
      const activityCode = `ACT-${String(i + 1).padStart(3, '0')}`;
      const existingActivity = await tx.activity.findFirst({
        where: { yearId: year2019.id, code: activityCode },
      });
      let activity;
      if (existingActivity) {
        activity = await tx.activity.update({
          where: { id: existingActivity.id },
          data: {
            yearId: year2019.id,
            orgUnitId: departments[a.dept]?.id,
            branchOrgUnitId: branches[a.branch]?.id,
            objectiveId: a.objectiveId,
            code: activityCode,
            title: a.title,
            description: `${a.title} - from ${SOURCE_DOC}`,
            implementationStatus: 'planned',
            approvalStatus: 'approved',
            priority: 'medium',
            progress: 0,
            weight: 1,
          },
        });
      } else {
        activity = await tx.activity.create({
          data: {
            yearId: year2019.id,
            orgUnitId: departments[a.dept]?.id,
            branchOrgUnitId: branches[a.branch]?.id,
            objectiveId: a.objectiveId,
            code: activityCode,
            title: a.title,
            description: `${a.title} - from ${SOURCE_DOC}`,
            implementationStatus: 'planned',
            approvalStatus: 'approved',
            priority: 'medium',
            progress: 0,
            weight: 1,
          },
        });
      }
      activityMap[a.title] = activity;

      const activitySourceSection = a.source ?? '';
      await tx.sourceReference.upsert({
        where: { entityType_entityId_sourceSection: { entityType: 'Activity', entityId: activity.id, sourceSection: activitySourceSection } },
        update: { sourceDocument: SOURCE_DOC, sourcePage: a.source, sourceNote: a.title },
        create: { entityType: 'Activity', entityId: activity.id, sourceDocument: SOURCE_DOC, sourceSection: a.source ?? null, sourceNote: a.title },
      });
    }

    // ============================================================
    // PHASE G: PROJECTS
    // ============================================================
    const projectData = [
      { code: 'PROJ-LANG', name: 'IJA Langano/Simbo Resort Expansion', location: 'Langano', objectiveId: objectives[7].id, budget: 32036817.09, branch: 'BR-LG' },
      { code: 'PROJ-SL', name: 'Ija Wabe Shabale Resort Expansion', location: 'Shabale/Wabe Shabale', objectiveId: objectives[7].id, budget: 30448721.72, branch: 'BR-SL' },
      { code: 'PROJ-BOKKU', name: 'Bokku Natural Steam Construction and Renovation', location: 'Bokku', objectiveId: objectives[7].id, budget: 32036817.09, branch: 'BR-BK' },
      { code: 'PROJ-BISHAN', name: 'Bishan Guracha Resort Construction', location: 'Bishan Guracha', objectiveId: objectives[6].id, budget: 0, branch: 'BR-HO' },
      { code: 'PROJ-BOLE', name: 'Bole 24 Building Construction', location: 'Bole 24, Addis Ababa', objectiveId: objectives[9].id, budget: 564480000, branch: 'BR-HO' },
    ];

    const projectMap: Record<string, any> = {};
    for (const p of projectData) {
      // Use findFirst + create/update since project codes don't parse to valid IDs
      const existing = await tx.project.findFirst({
        where: { name: p.name, yearId: year2019.id },
      });
      let project;
      if (existing) {
        project = await tx.project.update({
          where: { id: existing.id },
          data: {
            yearId: year2019.id,
            name: p.name,
            location: p.location,
            orgUnitId: branches[p.branch]?.id,
            managerEmployeeId: null,
            plannedBudget: p.budget,
            actualSpend: 0,
            physicalProgress: 0,
            financialProgress: 0,
            startDate: new Date('2026-06-08'),
            endDate: new Date('2027-06-07'),
            status: 'planned',
            approvalStatus: 'approved',
          },
        });
      } else {
        project = await tx.project.create({
          data: {
            yearId: year2019.id,
            name: p.name,
            location: p.location,
            orgUnitId: branches[p.branch]?.id,
            plannedBudget: p.budget,
            actualSpend: 0,
            physicalProgress: 0,
            financialProgress: 0,
            startDate: new Date('2026-06-08'),
            endDate: new Date('2027-06-07'),
            status: 'planned',
            approvalStatus: 'approved',
          },
        });
      }
      projectMap[p.code] = project;

      await tx.sourceReference.upsert({
        where: { entityType_entityId_sourceSection: { entityType: 'Project', entityId: project.id, sourceSection: '3.6.3' } },
        update: { sourceDocument: SOURCE_DOC, sourcePage: '3.6.3', sourceNote: p.name },
        create: { entityType: 'Project', entityId: project.id, sourceDocument: SOURCE_DOC, sourceSection: '3.6.3', sourceNote: p.name },
      });
    }

    // ============================================================
    // PHASE H: BUDGETS AND BUDGET LINES
    // ============================================================

    // Finance categories for 2019 budget
    const financeCategoryData = [
      { name: 'Construction/Capital', entryType: 'expense', code: 'CAPEX' },
      { name: 'Operational Costs', entryType: 'expense', code: 'OPEX' },
      { name: 'Consulting & Design', entryType: 'expense', code: 'CONS' },
      { name: 'Tourism Revenue', entryType: 'income', code: 'INC-TOUR' },
      { name: 'Real Estate Revenue', entryType: 'income', code: 'INC-REST' },
      { name: 'Other Revenue', entryType: 'income', code: 'INC-OTHER' },
    ];
    const financeCats: Record<string, any> = {};
    for (const fc of financeCategoryData) {
      const cat = await tx.financeCategory.upsert({
        where: { name: fc.name },
        update: { entryType: fc.entryType, code: fc.code },
        create: fc,
      });
      financeCats[fc.code] = cat;
    }

    // Budget: CAPEX (ETB 1,541,189,040.07)
    const capexBudget = await tx.budget.upsert({
      where: { id: 1001 },
      update: {
        yearId: year2019.id,
        orgUnitId: corporateDivision.id,
        category: 'construction',
        plannedAmount: 1541189040.07,
        currencyId: 1,
      },
      create: {
        id: 1001,
        yearId: year2019.id,
        orgUnitId: corporateDivision.id,
        category: 'construction',
        plannedAmount: 1541189040.07,
        currencyId: 1,
      },
    });

    // Budget Lines for CAPEX
    const capexLines = [
      { name: 'Bole 24 Real Estate', amount: 564480000, cat: 'CAPEX' },
      { name: 'Branch Constructions', amount: 848570358.11, cat: 'CAPEX' },
      { name: 'Maintenance', amount: 20243916.90, cat: 'CAPEX' },
      { name: 'Consulting/Supervision', amount: 14912000, cat: 'CAPEX' },
      { name: 'Design Works', amount: 15970700, cat: 'CAPEX' },
    ];
    for (const bl of capexLines) {
      await tx.budgetLine.upsert({
        where: { id: capexBudget.id * 100 + capexLines.indexOf(bl) + 1 },
        update: { budgetId: capexBudget.id, lineName: bl.name, plannedAmount: bl.amount, currencyId: 1 },
        create: { id: capexBudget.id * 100 + capexLines.indexOf(bl) + 1, budgetId: capexBudget.id, lineName: bl.name, plannedAmount: bl.amount, currencyId: 1 },
      });
    }

    // Budget: OPEX (ETB 428,232,951.59)
    const opexBudget = await tx.budget.upsert({
      where: { id: 1002 },
      update: { yearId: year2019.id, orgUnitId: corporateDivision.id, category: 'operational', plannedAmount: 428232951.59, currencyId: 1 },
      create: { id: 1002, yearId: year2019.id, orgUnitId: corporateDivision.id, category: 'operational', plannedAmount: 428232951.59, currencyId: 1 },
    });

    // Budget Lines for OPEX
    const opexLines = [
      { name: 'Operational Cost', amount: 465200538.39, cat: 'OPEX' },
      { name: 'Administrative Cost', amount: 100369748.93, cat: 'OPEX' },
    ];
    for (const bl of opexLines) {
      await tx.budgetLine.upsert({
        where: { id: opexBudget.id * 100 + opexLines.indexOf(bl) + 1 },
        update: { budgetId: opexBudget.id, lineName: bl.name, plannedAmount: bl.amount, currencyId: 1 },
        create: { id: opexBudget.id * 100 + opexLines.indexOf(bl) + 1, budgetId: opexBudget.id, lineName: bl.name, plannedAmount: bl.amount, currencyId: 1 },
      });
    }

    // Budget: Revenue Plan
    const revenueBudget = await tx.budget.upsert({
      where: { id: 1003 },
      update: { yearId: year2019.id, orgUnitId: corporateDivision.id, category: 'revenue', plannedAmount: 825131426.96, currencyId: 1 },
      create: { id: 1003, yearId: year2019.id, orgUnitId: corporateDivision.id, category: 'revenue', plannedAmount: 825131426.96, currencyId: 1 },
    });

    const revenueLines = [
      { name: 'Tourism/Hospitality Revenue', amount: 651952774.91, cat: 'INC-TOUR' },
      { name: 'Building Rental Income', amount: 168657974.45, cat: 'INC-REST' },
      { name: 'Other Revenue', amount: 4520677.60, cat: 'INC-OTHER' },
    ];
    for (const bl of revenueLines) {
      await tx.budgetLine.upsert({
        where: { id: revenueBudget.id * 100 + revenueLines.indexOf(bl) + 1 },
        update: { budgetId: revenueBudget.id, lineName: bl.name, plannedAmount: bl.amount, currencyId: 1 },
        create: { id: revenueBudget.id * 100 + revenueLines.indexOf(bl) + 1, budgetId: revenueBudget.id, lineName: bl.name, plannedAmount: bl.amount, currencyId: 1 },
      });
    }

    // Budget: Funding Sources
    const fundingBudget = await tx.budget.upsert({
      where: { id: 1004 },
      update: { yearId: year2019.id, orgUnitId: corporateDivision.id, category: 'funding', plannedAmount: 1969421991.66, currencyId: 1 },
      create: { id: 1004, yearId: year2019.id, orgUnitId: corporateDivision.id, category: 'funding', plannedAmount: 1969421991.66, currencyId: 1 },
    });

    const fundingLines = [
      { name: 'Bank Loan', amount: 596445858.03, cat: 'CAPEX' },
      { name: 'Skylight Hotel Loan', amount: 17912231.64, cat: 'CAPEX' },
      { name: 'Third Party Support', amount: 85928521.08, cat: 'CAPEX' },
      { name: 'Regular and Non-regular Revenue', amount: 825131426.96, cat: 'INC-TOUR' },
      { name: 'Other Sources', amount: 444003953.95, cat: 'INC-OTHER' },
    ];
    for (const bl of fundingLines) {
      await tx.budgetLine.upsert({
        where: { id: fundingBudget.id * 100 + fundingLines.indexOf(bl) + 1 },
        update: { budgetId: fundingBudget.id, lineName: bl.name, plannedAmount: bl.amount, currencyId: 1 },
        create: { id: fundingBudget.id * 100 + fundingLines.indexOf(bl) + 1, budgetId: fundingBudget.id, lineName: bl.name, plannedAmount: bl.amount, currencyId: 1 },
      });
    }

    // Budget: Procurement Plan
    const procurementBudget = await tx.budget.upsert({
      where: { id: 1005 },
      update: { yearId: year2019.id, orgUnitId: corporateDivision.id, category: 'procurement', plannedAmount: 1926106436.07, currencyId: 1 },
      create: { id: 1005, yearId: year2019.id, orgUnitId: corporateDivision.id, category: 'procurement', plannedAmount: 1926106436.07, currencyId: 1 },
    });

    // Budget: Capital Procurement (Objective 4-3)
    const capProcBudget = await tx.budget.upsert({
      where: { id: 1006 },
      update: { yearId: year2019.id, orgUnitId: corporateDivision.id, category: 'procurement', plannedAmount: 77012065.06, currencyId: 1 },
      create: { id: 1006, yearId: year2019.id, orgUnitId: corporateDivision.id, category: 'procurement', plannedAmount: 77012065.06, currencyId: 1 },
    });

    // Budget: Training (Objective 4-1)
    const trainingBudget = await tx.budget.upsert({
      where: { id: 1007 },
      update: { yearId: year2019.id, orgUnitId: departments['DEPT-CORP']?.id, category: 'training', plannedAmount: 2472000, currencyId: 1 },
      create: { id: 1007, yearId: year2019.id, orgUnitId: departments['DEPT-CORP']?.id, category: 'training', plannedAmount: 2472000, currencyId: 1 },
    });

    // Budget: CSR (ETB 5,000,000)
    const csrBudget = await tx.budget.upsert({
      where: { id: 1008 },
      update: { yearId: year2019.id, orgUnitId: corporateDivision.id, category: 'csr', plannedAmount: 5000000, currencyId: 1 },
      create: { id: 1008, yearId: year2019.id, orgUnitId: corporateDivision.id, category: 'csr', plannedAmount: 5000000, currencyId: 1 },
    });

    // ============================================================
    // PHASE I: HISTORICAL PERFORMANCE (2014-2018)
    // ============================================================
    const financeCategoryIncome = await tx.financeCategory.upsert({
      where: { name: 'Revenue' },
      update: { entryType: 'income', code: 'INC-REV' },
      create: { name: 'Revenue', entryType: 'income', code: 'INC-REV' },
    });
    const financeCategoryCost = await tx.financeCategory.upsert({
      where: { name: 'Cost' },
      update: { entryType: 'expense', code: 'EXP-COST' },
      create: { name: 'Cost', entryType: 'expense', code: 'EXP-COST' },
    });
    const financeCategoryProfit = await tx.financeCategory.upsert({
      where: { name: 'Net Profit' },
      update: { entryType: 'income', code: 'INC-PFT' },
      create: { name: 'Net Profit', entryType: 'income', code: 'INC-PFT' },
    });

    // Historical financial data from Table 8 (2014-2018)
    const historicalData = [
      { year: 2014, revenue: 7922982.0, cost: 14339613.0, profit: -6416631.0 },
      { year: 2015, revenue: 14227457.0, cost: 29888771.0, profit: -15661314.0 },
      { year: 2016, revenue: 69900563.0, cost: 76527262.0, profit: -6626699.0 },
      { year: 2017, revenue: 217212931.0, cost: 156018235.0, profit: 56962535.0 },
      { year: 2018, revenue: 415007747.64, cost: 300223249.90, profit: 80349148.42 },
    ];

    const historicalYear = await tx.planningYear.upsert({
      where: { year: 2018 },
      update: { label: '2018 E.C. (Historical)', status: 'closed', startDate: new Date('2025-06-08'), endDate: new Date('2026-06-07') },
      create: { year: 2018, label: '2018 E.C. (Historical)', status: 'closed', startDate: new Date('2025-06-08'), endDate: new Date('2026-06-07') },
    });

    for (const h of historicalData) {
      const financeYear = await tx.planningYear.upsert({
        where: { year: h.year },
        update: { label: `${h.year} (Actual)`, status: 'closed' },
        create: { year: h.year, label: `${h.year} (Actual)`, status: 'closed' },
      });

      await tx.financeEntry.create({
        data: {
          yearId: financeYear.id,
          orgUnitId: headOffice.id,
          transactionDate: new Date(`${h.year}-12-31`),
          entryType: 'income',
          categoryId: financeCategoryIncome.id,
          categoryName: 'Revenue',
          amount: h.revenue,
          status: 'posted',
          description: 'Historical operational revenue',
          currencyId: 1,
        },
      });

      await tx.financeEntry.create({
        data: {
          yearId: financeYear.id,
          orgUnitId: headOffice.id,
          transactionDate: new Date(`${h.year}-12-31`),
          entryType: 'expense',
          categoryId: financeCategoryCost.id,
          categoryName: 'Total Cost',
          amount: h.cost,
          status: 'posted',
          description: 'Historical total cost',
          currencyId: 1,
        },
      });

      await tx.financeEntry.create({
        data: {
          yearId: financeYear.id,
          orgUnitId: headOffice.id,
          transactionDate: new Date(`${h.year}-12-31`),
          entryType: 'income',
          categoryId: financeCategoryProfit.id,
          categoryName: 'Net Profit',
          amount: h.profit,
          status: 'posted',
          description: 'Historical net profit',
          currencyId: 1,
        },
      });
    }

    // Tourism record historical data (Table 7)
    const tourismCat = await tx.tourismCategory.upsert({
      where: { name: 'Tourists' },
      update: { active: true },
      create: { name: 'Tourists', active: true },
    });

    const tourismHist = [
      { year: 2017, domestic: 106098, international: 3061, total: 109159 },
      { year: 2018, domestic: 100175, international: 17419, total: 117594 },
    ];

    for (const t of tourismHist) {
      const tourYear = await tx.planningYear.upsert({
        where: { year: t.year + 1 }, // Shift to Ethiopian year
        update: { label: `${t.year} Actual`, status: 'closed' },
        create: { year: t.year + 1, label: `${t.year} Actual`, status: 'closed' },
      });

      await tx.tourismRecord.upsert({
        where: { id: t.year * 100 },
        update: {
          yearId: tourYear.id,
          categoryId: tourismCat.id,
          recordDate: new Date(`${t.year}-12-31`),
          domesticVisitors: t.domestic,
          internationalVisitors: t.international,
          revenue: 0,
        },
        create: {
          id: t.year * 100,
          yearId: tourYear.id,
          categoryId: tourismCat.id,
          recordDate: new Date(`${t.year}-12-31`),
          domesticVisitors: t.domestic,
          internationalVisitors: t.international,
          revenue: 0,
        },
      });
    }

    // ============================================================
    // PHASE J: ASSETS AND PROPERTIES
    // ============================================================

    // Asset Categories
    const assetCatLand = await tx.assetCategory.upsert({ where: { name: 'Land' }, update: { active: true }, create: { name: 'Land', active: true } });
    const assetCatBuilding = await tx.assetCategory.upsert({ where: { name: 'Building' }, update: { active: true }, create: { name: 'Building', active: true } });
    const assetCatResort = await tx.assetCategory.upsert({ where: { name: 'Resort' }, update: { active: true }, create: { name: 'Resort', active: true } });
    const assetCatLodge = await tx.assetCategory.upsert({ where: { name: 'Lodge' }, update: { active: true }, create: { name: 'Lodge', active: true } });
    const assetCatVehicle = await tx.assetCategory.upsert({ where: { name: 'Vehicle' }, update: { active: true }, create: { name: 'Vehicle', active: true } });

    // Historical investment data (from Section 2 and 3.6.3 financial summary)
    const historicalInvestments = [
      { name: 'Land Bole 24', code: 'LAND-BOLE24', category: 'Land', status: 'owned', amount: 0, branch: 'BR-HO', source: '2.1' },
      { name: 'Land Saris', code: 'LAND-SARIS', category: 'Land', status: 'owned', amount: 0, branch: 'BR-HO', source: '2.1' },
      { name: 'Land Yeka', code: 'LAND-YEKA', category: 'Land', status: 'owned', amount: 0, branch: 'BR-HO', source: '2.1' },
      { name: 'Land Bishan Guracha', code: 'LAND-BISHAN', category: 'Land', status: 'owned', amount: 0, branch: 'BR-HO', source: '2.1' },
      { name: 'Bole Bulbula Building', code: 'BLD-BOLEBUL', category: 'Building', status: 'owned', amount: 48390543.77, branch: 'BR-HO', source: '2.2' },
      { name: 'Tullu Ejersa Building', code: 'BLD-TULLU', category: 'Building', status: 'owned', amount: 3320187.00, branch: 'BR-HO', source: '2.2' },
      { name: 'Caffe Annani Building', code: 'BLD-CAFFE', category: 'Building', status: 'owned', amount: 12982536.21, branch: 'BR-HO', source: '2.2' },
      { name: 'IJA Langano Resort', code: 'RESORT-LANG', category: 'Resort', status: 'operational', amount: 27861561.23, branch: 'BR-LG', source: '2.3' },
      { name: 'Wanchi Eco-Tourism', code: 'RESORT-WANCHI', category: 'Resort', status: 'operational', amount: 748364971.14, branch: 'BR-WD', source: '2.3' },
      { name: 'Wanchi Tents', code: 'RESORT-TENTS', category: 'Lodge', status: 'operational', amount: 0, branch: 'BR-WD', source: '2.3' },
      { name: 'Bole 24 Building', code: 'BLD-BOLE24', category: 'Building', status: 'owned', amount: 48390543.77, branch: 'BR-HO', source: '2.2' },
      { name: 'Dandi Lake Lodge', code: 'LODGE-DANDI', category: 'Lodge', status: 'operational', amount: 0, branch: 'BR-WD', source: '2.3' },
      { name: 'Wabe Shabale Summer Houses', code: 'PROP-SHABALE', category: 'Resort', status: 'operational', amount: 30448721.72, branch: 'BR-SL', source: '2.3' },
      { name: 'Land fences', code: 'LAND-FENCE', category: 'Land', status: 'owned', amount: 8158681.99, branch: 'BR-HO', source: '2.4' },
    ];

    const assets: Record<string, any> = {};
    for (const a of historicalInvestments) {
      const catId = a.category === 'Land' ? assetCatLand.id : a.category === 'Building' ? assetCatBuilding.id : a.category === 'Resort' ? assetCatResort.id : a.category === 'Lodge' ? assetCatLodge.id : assetCatLand.id;
      const asset = await tx.asset.upsert({
        where: { assetNo: a.code },
        update: {
          assetName: a.name,
          categoryId: catId,
          acquisitionCost: a.amount,
          status: a.status,
          orgUnitId: branches[a.branch]?.id,
          location: a.branch.replace('BR-', ''),
        },
        create: {
          assetNo: a.code,
          assetName: a.name,
          categoryId: catId,
          acquisitionCost: a.amount,
          status: a.status,
          orgUnitId: branches[a.branch]?.id,
          location: a.branch.replace('BR-', ''),
        },
      });
      assets[a.code] = asset;

      const assetSourceSection = a.source ?? '';
      await tx.sourceReference.upsert({
        where: { entityType_entityId_sourceSection: { entityType: 'Asset', entityId: asset.id, sourceSection: assetSourceSection } },
        update: { sourceDocument: SOURCE_DOC, sourcePage: a.source },
        create: { entityType: 'Asset', entityId: asset.id, sourceDocument: SOURCE_DOC, sourceSection: a.source ?? null, sourceNote: a.name },
      });
    }

    // ============================================================
    // PHASE K: RISKS AND COMPLIANCE
    // ============================================================

    // Risk Categories
    const riskCatReg = await tx.riskCategory.upsert({ where: { name: 'Regulatory & Compliance' }, update: { active: true }, create: { name: 'Regulatory & Compliance', active: true } });
    const riskCatFin = await tx.riskCategory.upsert({ where: { name: 'Financial' }, update: { active: true }, create: { name: 'Financial', active: true } });
    const riskCatOp = await tx.riskCategory.upsert({ where: { name: 'Operational' }, update: { active: true }, create: { name: 'Operational', active: true } });
    const riskCatRep = await tx.riskCategory.upsert({ where: { name: 'Reputational' }, update: { active: true }, create: { name: 'Reputational', active: true } });
    const riskCatExt = await tx.riskCategory.upsert({ where: { name: 'External' }, update: { active: true }, create: { name: 'External', active: true } });
    const riskCatTech = await tx.riskCategory.upsert({ where: { name: 'Technology (Digital Use, Cybersecurity)' }, update: { active: true }, create: { name: 'Technology (Digital Use, Cybersecurity)', active: true } });
    const riskCatHR = await tx.riskCategory.upsert({ where: { name: 'Human Capital' }, update: { active: true }, create: { name: 'Human Capital', active: true } });

    // Risks from Table 9 (all 7)
    const riskData = [
      { code: 'RISK-01', title: 'Regulatory & Compliance Risk', category: 'regulatory', catId: riskCatReg.id, probability: 3, impact: 2, score: 6, level: 'medium', mitigation: 'Regular audits, legal reviews, employee training', source: '3.7.1 Table 9' },
      { code: 'RISK-02', title: 'Financial Risk', category: 'financial', catId: riskCatFin.id, probability: 4, impact: 3, score: 12, level: 'high', mitigation: 'Diversify revenue streams', source: '3.7.1 Table 9' },
      { code: 'RISK-03', title: 'Operational Risk', category: 'operational', catId: riskCatOp.id, probability: 3, impact: 2, score: 6, level: 'medium', mitigation: 'Standardize processes, improve competence, fill skill gaps through training', source: '3.7.1 Table 9' },
      { code: 'RISK-04', title: 'Reputational Risk', category: 'reputational', catId: riskCatRep.id, probability: 4, impact: 3, score: 12, level: 'high', mitigation: 'Create transparency, customer feedback system, service quality audits', source: '3.7.1 Table 9' },
      { code: 'RISK-05', title: 'External Risk', category: 'external', catId: riskCatExt.id, probability: 4, impact: 3, score: 12, level: 'high', mitigation: 'Insurance coverage, emergency response, adaptive business models', source: '3.7.1 Table 9' },
      { code: 'RISK-06', title: 'Technology (Digital Use, Cybersecurity) Risk', category: 'technology', catId: riskCatTech.id, probability: 4, impact: 3, score: 12, level: 'high', mitigation: 'Invest in secure IT infrastructure and digital training', source: '3.7.1 Table 9' },
      { code: 'RISK-07', title: 'Human Capital Risk', category: 'human_capital', catId: riskCatHR.id, probability: 3, impact: 2, score: 6, level: 'medium', mitigation: 'Continuous training, performance management, good work culture', source: '3.7.1 Table 9' },
    ];

    const risks: Record<string, any> = {};
    for (const r of riskData) {
      const risk = await tx.risk.upsert({
        where: { id: parseInt(r.code.replace('RISK-', '')) },
        update: {
          yearId: year2019.id,
          title: r.title,
          categoryId: r.catId,
          probability: r.probability,
          impact: r.impact,
          score: r.score,
          level: r.level,
          mitigation: r.mitigation,
          status: 'open',
        },
        create: {
          id: parseInt(r.code.replace('RISK-', '')),
          yearId: year2019.id,
          title: r.title,
          categoryId: r.catId,
          probability: r.probability,
          impact: r.impact,
          score: r.score,
          level: r.level,
          mitigation: r.mitigation,
          status: 'open',
        },
      });
      risks[r.code] = risk;

      const riskSourceSection = r.source ?? '';
      await tx.sourceReference.upsert({
        where: { entityType_entityId_sourceSection: { entityType: 'Risk', entityId: risk.id, sourceSection: riskSourceSection } },
        update: { sourceDocument: SOURCE_DOC, sourcePage: r.source },
        create: { entityType: 'Risk', entityId: risk.id, sourceDocument: SOURCE_DOC, sourceSection: r.source ?? null, sourceNote: r.title },
      });
    }

    // Compliance Categories
    const compCat1 = await tx.complianceRequirement.upsert({
      where: { title_yearId: { title: 'Business Licenses renewal', yearId: year2019.id } },
      update: { category: 'licensing', status: 'open', evidence: '5 licenses to be renewed annually', orgUnitId: headOffice.id },
      create: { yearId: year2019.id, title: 'Business Licenses renewal', category: 'licensing', status: 'open', evidence: '5 licenses to be renewed annually', orgUnitId: headOffice.id },
    });
    // ... more compliance records from Table 10
    // Table 10 has 5.2 compliance categories with various sub-items
    const compReqs = [
      { title: 'Business Licenses renewal', category: 'licensing', status: 'open', evidence: '5 licenses to be renewed', orgUnitId: headOffice.id },
      { title: 'Accommodation Registrations', category: 'licensing', status: 'open', evidence: '12 monthly registrations', orgUnitId: headOffice.id },
      { title: 'Title & Encumbrance Verification', category: 'licensing', status: 'open', evidence: '2 verifications needed', orgUnitId: headOffice.id },
      { title: 'Building Permits', category: 'licensing', status: 'open', evidence: '2 permits needed', orgUnitId: headOffice.id },
      { title: 'Fire & Life Safety', category: 'health_safety', status: 'open', evidence: '1 certificate needed', orgUnitId: headOffice.id },
      { title: 'Food Safety & Hygiene', category: 'health_safety', status: 'open', evidence: '1 certificate needed', orgUnitId: headOffice.id },
      { title: 'Sustainability & Eco-Certifications', category: 'health_safety', status: 'open', evidence: '1 certification needed', orgUnitId: headOffice.id },
      { title: 'Guest Data Protection', category: 'privacy', status: 'open', evidence: '1 policy needed', orgUnitId: headOffice.id },
      { title: 'Transparent Advertising', category: 'privacy', status: 'open', evidence: '5 advertisements reviewed', orgUnitId: headOffice.id },
      { title: 'Workplace Safety', category: 'labor', status: 'open', evidence: '1 policy needed', orgUnitId: headOffice.id },
      { title: 'Wage and Hour Laws', category: 'labor', status: 'open', evidence: '1 compliance review needed', orgUnitId: headOffice.id },
      { title: 'Audit Finding Severity', category: 'financial', status: 'open', evidence: '1 audit review needed', orgUnitId: headOffice.id },
      { title: 'IFRS implementation', category: 'financial', status: 'open', evidence: '1 implementation needed', orgUnitId: headOffice.id },
    ];

    for (const comp of compReqs) {
      await tx.complianceRequirement.upsert({
        where: { title_yearId: { title: comp.title, yearId: year2019.id } },
        update: { category: comp.category, status: 'open', evidence: comp.evidence, orgUnitId: comp.orgUnitId },
        create: { yearId: year2019.id, title: comp.title, category: comp.category, status: 'open', evidence: comp.evidence, orgUnitId: comp.orgUnitId },
      });
    }

    // ============================================================
    // PHASE L: STAKEHOLDERS (from Table 6)
    // ============================================================
    const stakeholderData = [
      { name: "Oromia Regional State President's Office", category: 'government', influence: 'high', interest: 'high', contact: 'Regional Government', notes: 'Providing development support through existing hierarchical structure' },
      { name: 'Oromia Sovereign Fund (OSF)', category: 'government', influence: 'high', interest: 'high', contact: 'OSF', notes: 'Providing support and monitoring to ensure government ownership rights' },
      { name: 'Oro Construction Group (OCG)', category: 'government', influence: 'high', interest: 'high', contact: 'OCG', notes: 'Providing support and monitoring, ensuring profitability and competitiveness' },
      { name: 'Oromia Tourism Commission (OTC)', category: 'government', influence: 'medium', interest: 'high', contact: 'OTC', notes: 'Developing and promoting tourism destinations' },
      { name: 'Oromia Security Bureau', category: 'government', influence: 'medium', interest: 'medium', contact: 'Security Bureau', notes: 'Ensuring regional peace and stability' },
      { name: 'Oromia Investment Bureau', category: 'government', influence: 'medium', interest: 'medium', contact: 'Investment Bureau', notes: 'Issuing investment permits' },
      { name: 'Oromia Land Bureau', category: 'government', influence: 'high', interest: 'medium', contact: 'Land Bureau', notes: 'Providing land for investment' },
      { name: 'Oromia Job Creation and Skills Bureau', category: 'government', influence: 'low', interest: 'medium', contact: 'Skills Bureau', notes: 'Issuing and implementing MSME regulations' },
      { name: 'Oromia Environmental Protection Authority', category: 'government', influence: 'low', interest: 'medium', contact: 'EPA', notes: 'Issuing and implementing environmental protection laws' },
      { name: 'Oromia Culture and Tourism Bureau', category: 'government', influence: 'low', interest: 'medium', contact: 'Culture Bureau', notes: 'Developing the region\'s culture and tourism' },
      { name: 'Various Universities', category: 'education', influence: 'low', interest: 'low', contact: 'Academic institutions', notes: 'Providing education, training, and tourism research' },
      { name: 'Oromia Trade Bureau', category: 'government', influence: 'low', interest: 'medium', contact: 'Trade Bureau', notes: 'Issuing and implementing fair trade laws' },
      { name: 'Ethiopian Electric Utility', category: 'utility', influence: 'low', interest: 'low', contact: 'Utility', notes: 'Supplying electrical energy' },
      { name: 'Ethio Telecom', category: 'utility', influence: 'low', interest: 'low', contact: 'Utility', notes: 'Providing telecommunications infrastructure' },
      { name: 'Oromia Revenue Bureau', category: 'government', influence: 'medium', interest: 'low', contact: 'Revenue Bureau', notes: 'Establishing fair revenue laws and procedures' },
      // Tourism and hospitality businesses
      { name: 'Hotels and Lodges in the area', category: 'private', influence: 'medium', interest: 'medium', contact: 'Local hospitality businesses', notes: 'Providing reception and hospitality services' },
      { name: 'Tour Operators', category: 'private', influence: 'medium', interest: 'medium', contact: 'Tour operators', notes: 'Providing tour and travel services' },
      // Community
      { name: 'Local Community', category: 'community', influence: 'high', interest: 'medium', contact: 'Community representatives', notes: 'Participating in tourism development and security' },
      { name: 'Local Farmers', category: 'community', influence: 'high', interest: 'medium', contact: 'Farmers associations', notes: 'Supplying agricultural products' },
      // Investors
      { name: 'Banks', category: 'financial', influence: 'low', interest: 'medium', contact: 'Banking sector', notes: 'Providing loan services' },
      { name: 'Private Investors', category: 'financial', influence: 'low', interest: 'medium', contact: 'Private investors', notes: 'Making investments' },
      // Media and technology
      { name: 'Electronic Media', category: 'media', influence: 'low', interest: 'medium', contact: 'Media outlets', notes: 'Providing promotional services' },
      { name: 'Social Media', category: 'technology', influence: 'low', interest: 'medium', contact: 'Digital platforms', notes: 'Conducting digital advertising services' },
    ];

    for (const s of stakeholderData) {
      await tx.stakeholder.upsert({
        where: { name: s.name },
        update: { category: s.category, influence: s.influence, interest: s.interest, contact: s.contact, relationshipStatus: 'active', notes: s.notes },
        create: { name: s.name, category: s.category, influence: s.influence, interest: s.interest, contact: s.contact, relationshipStatus: 'active', notes: s.notes },
      });
    }

    // ============================================================
    // PHASE M: ASSUMPTIONS, IMPLEMENTATION STRATEGY, MONITORING
    // ============================================================

    // Assumptions (Section 3.5)
    const assumptionData = [
      { key: 'assump_gov_support', label: 'Government Support', value: 'Government will provide support for paid capital and operational needs' },
      { key: 'assump_peace_stability', label: 'Global, National, and Regional Peace and Stability', value: 'Government ensures rule of law; regional and national security stabilize' },
      { key: 'assump_economic_growth', label: 'Economic Growth', value: 'GDP growth of 10.2% (Government) and 9.2% (IMF) supports planned activities' },
      { key: 'assump_housing_demand', label: 'Increasing Housing Demand Nationally', value: 'Continuous housing demand creates market for real estate construction' },
      { key: 'assump_tourist_growth', label: 'Increasing Tourist Movement', value: 'Tourist arrivals increased 7.73% (2017-2018), international +469.06%; expected to continue' },
    ];
    for (const a of assumptionData) {
      await tx.setting.upsert({
        where: { category_key: { category: 'assumption_2019', key: a.key } },
        update: { value: a.value, label: a.label, valueType: 'text', updatedBy: 1, updatedAt: new Date() },
        create: { category: 'assumption_2019', key: a.key, value: a.value, label: a.label, valueType: 'text', updatedBy: 1, updatedAt: new Date() },
      });
    }

    // Implementation Strategy items (Section 3.9)
    const strategyData = [
      { key: 'strategy_human_capital', label: 'Human Capital Development', value: 'Continuously develop competent human capital and address skill gaps through training' },
      { key: 'strategy_org_structure', label: 'Organizational Structure', value: 'Fully implement organizational structure from Head Office to all branches' },
      { key: 'strategy_employee_packages', label: 'Employee Packages', value: 'Implement employee packages, benefits, incentives, and good governance' },
      { key: 'strategy_work_env', label: 'Work Environment', value: 'Create good work environment and provide necessary work tools' },
      { key: 'strategy_critical_positions', label: 'Critical Positions', value: 'Identify critical job positions and address human resource gaps' },
      { key: 'strategy_reforms', label: 'Reforms', value: 'Regularly research and implement necessary reforms' },
      { key: 'strategy_erp', label: 'ERP System', value: 'Implement ERP system to digitize all operations' },
      { key: 'strategy_community', label: 'Community Coordination', value: 'Work closely with community groups at tourism destinations' },
      { key: 'strategy_complaints', label: 'Complaints Handling', value: 'Respond promptly to internal and external complaints and inquiries' },
      { key: 'strategy_profitability', label: 'Profitability Research', value: 'Research profitability of unoperationalized business portfolios and start operations' },
      { key: 'strategy_revenue_exploration', label: 'Revenue Source Exploration', value: 'Explore revenue sources and reduce unnecessary expenses to increase profitability' },
      { key: 'strategy_promotion', label: 'Promotion and Marketing', value: 'Conduct extensive promotion and marketing to publicize the enterprise and increase tourist arrivals' },
      { key: 'strategy_facilities', label: 'Hospitality Facilities', value: 'Complete hospitality facilities to increase customer satisfaction and stay duration' },
      { key: 'strategy_procurement', label: 'Procurement Acceleration', value: 'Use shortened and legal procurement processes to accelerate procurement' },
      { key: 'strategy_major_procurement', label: 'Major Procurement Planning', value: 'Identify and execute major procurements in advance' },
      { key: 'strategy_financial_partnership', label: 'Financial Institution Partnerships', value: 'Partner with financial institutions to address cash flow challenges' },
      { key: 'strategy_government_support', label: 'Government Support', value: 'Request government support or initiatives for major investments beyond capacity' },
      { key: 'strategy_ppp', label: 'Public-Private Partnerships', value: 'Create Public-Private Partnerships' },
      { key: 'strategy_sister_coordination', label: 'Sister Company Coordination', value: 'Coordinate with sister construction companies for construction support' },
      { key: 'strategy_branch_collaboration', label: 'Branch Collaboration', value: 'Ensure all branches and work units collaborate' },
      { key: 'strategy_ownership', label: 'Ownership Certificates', value: 'Secure ownership certificates for all enterprise assets' },
      { key: 'strategy_internal_control', label: 'Internal Control', value: 'Establish strong internal control systems to prevent asset loss and waste' },
    ];
    for (const s of strategyData) {
      await tx.setting.upsert({
        where: { category_key: { category: 'strategy_2019', key: s.key } },
        update: { value: s.value, label: s.label, valueType: 'text', updatedBy: 1, updatedAt: new Date() },
        create: { category: 'strategy_2019', key: s.key, value: s.value, label: s.label, valueType: 'text', updatedBy: 1, updatedAt: new Date() },
      });
    }

    // Monitoring and Support (Section 3.10)
    const monitoringData = [
      { key: 'monitor_weekly', label: 'Weekly Management Review', value: 'Enterprise management reviews performance weekly' },
      { key: 'monitor_monthly_branch', label: 'Monthly Branch Visits', value: 'Divisions/Directorates/Head Office teams visit branches monthly' },
      { key: 'monitor_quarterly_branch', label: 'Quarterly Branch Visits', value: 'Divisions/Directorates/Head Office teams visit branches quarterly for monitoring and support' },
      { key: 'monitor_branch_reports', label: 'Branch Reports', value: 'Branches compile and submit weekly, monthly, and quarterly performance reports to Head Office' },
      { key: 'monitor_feedback', label: 'Written Feedback', value: 'Written feedback is provided to branches based on submitted performance reports' },
      { key: 'monitor_monthly_report', label: 'Monthly Reports', value: 'Prepare and distribute monthly reports' },
      { key: 'monitor_quarterly_report', label: 'Quarterly Reports', value: 'Prepare and distribute quarterly reports; Present to management and employees for discussion' },
      { key: 'monitor_annual_report', label: 'Annual Report', value: 'Prepare and distribute annual report' },
      { key: 'monitor_kpi_report', label: 'KPI Reports', value: 'Prepare and distribute KPI reports' },
      { key: 'monitor_workplan_revision', label: 'Work Plan Revision', value: 'Revise 2019 work plan based on first six months performance' },
      { key: 'monitor_2020_prep', label: '2020 Work Plan Preparation', value: 'Complete prerequisites, collect data, prepare draft and final 2020 work plan and KPI plan' },
    ];
    for (const m of monitoringData) {
      await tx.setting.upsert({
        where: { category_key: { category: 'monitoring_2019', key: m.key } },
        update: { value: m.value, label: m.label, valueType: 'text', updatedBy: 1, updatedAt: new Date() },
        create: { category: 'monitoring_2019', key: m.key, value: m.value, label: m.label, valueType: 'text', updatedBy: 1, updatedAt: new Date() },
      });
    }

    // ============================================================
    // PHASE N: 30 SAMPLE EMPLOYEES
    // ============================================================
    const employeeData = [
      { no: 'EMP-001', name: 'Alemu Bekele', title: 'General Manager', branch: 'BR-HO', dept: 'DEPT-CORP', focus: 'FOC-CORP' },
      { no: 'EMP-002', name: 'Meron Tadesse', title: 'Tourism Director', branch: 'BR-HO', dept: 'DEPT-TOUR', focus: 'FOC-HOSP' },
      { no: 'EMP-003', name: 'Girma Kassa', title: 'Construction Manager', branch: 'BR-HO', dept: 'DEPT-CENG', focus: 'FOC-REST' },
      { no: 'EMP-004', name: 'Sara Mohammed', title: 'Finance Manager', branch: 'BR-HO', dept: 'DEPT-CORP', focus: 'FOC-CORP' },
      { no: 'EMP-005', name: 'Dawit Alem', title: 'Marketing Manager', branch: 'BR-HO', dept: 'DEPT-MKT', focus: 'FOC-HOSP' },
      { no: 'EMP-006', name: 'Fikiru Haji', title: 'ICT Manager', branch: 'BR-HO', dept: 'DEPT-ICT', focus: 'FOC-CORP' },
      { no: 'EMP-007', name: 'Beti Worku', title: 'HR Manager', branch: 'BR-HO', dept: 'DEPT-CORP', focus: 'FOC-CORP' },
      { no: 'EMP-008', name: 'Kebede Amare', title: 'Legal Affairs Officer', branch: 'BR-HO', dept: 'DEPT-LEGAL', focus: 'FOC-CORP' },
      { no: 'EMP-009', name: 'Hiwot Daniel', title: 'Internal Auditor', branch: 'BR-HO', dept: 'DEPT-IA', focus: 'FOC-CORP' },
      { no: 'EMP-010', name: 'Tadesse Roba', title: 'Planning Officer', branch: 'BR-HO', dept: 'DEPT-PLAN', focus: 'FOC-CORP' },
      // Langano branch
      { no: 'EMP-011', name: 'Abebu Nuru', title: 'Branch Manager', branch: 'BR-LG', dept: 'DEPT-TOUR', focus: 'FOC-HOSP' },
      { no: 'EMP-012', name: 'Sintayehu Mekonnen', title: 'Front Office Supervisor', branch: 'BR-LG', dept: 'DEPT-TOUR', focus: 'FOC-HOSP' },
      { no: 'EMP-013', name: 'Biniam Tsegaye', title: 'Housekeeping Supervisor', branch: 'BR-LG', dept: 'DEPT-TOUR', focus: 'FOC-HOSP' },
      { no: 'EMP-014', name: 'Worku Girma', title: 'Construction Supervisor', branch: 'BR-LG', dept: 'DEPT-CENG', focus: 'FOC-REST' },
      { no: 'EMP-015', name: 'Genet Alem', title: 'Restaurant Manager', branch: 'BR-LG', dept: 'DEPT-TOUR', focus: 'FOC-HOSP' },
      { no: 'EMP-016', name: 'Solomon Kebede', title: 'Maintenance Technician', branch: 'BR-LG', dept: 'DEPT-TOUR', focus: 'FOC-HOSP' },
      // Wanchi Dandi branch
      { no: 'EMP-017', name: 'Desta Bekele', title: 'Branch Manager', branch: 'BR-WD', dept: 'DEPT-TOUR', focus: 'FOC-HOSP' },
      { no: 'EMP-018', name: 'Mahmut Abdi', title: 'Tour Guide', branch: 'BR-WD', dept: 'DEPT-TOUR', focus: 'FOC-HOSP' },
      { no: 'EMP-019', name: 'Fatuma Nuru', title: 'Front Office', branch: 'BR-WD', dept: 'DEPT-TOUR', focus: 'FOC-HOSP' },
      { no: 'EMP-020', name: 'Ismail Haji', title: 'Kitchen Manager', branch: 'BR-WD', dept: 'DEPT-TOUR', focus: 'FOC-HOSP' },
      { no: 'EMP-021', name: 'Aisha Ibrahim', title: 'Housekeeping', branch: 'BR-WD', dept: 'DEPT-TOUR', focus: 'FOC-HOSP' },
      { no: 'EMP-022', name: 'Omar Faruk', title: 'Security Supervisor', branch: 'BR-WD', dept: 'DEPT-TOUR', focus: 'FOC-CORP' },
      // Boku branch
      { no: 'EMP-023', name: 'Tsegaye Lema', title: 'Branch Manager', branch: 'BR-BK', dept: 'DEPT-TOUR', focus: 'FOC-HOSP' },
      { no: 'EMP-024', name: 'Biniam Kebede', title: 'Steam Room Attendant', branch: 'BR-BK', dept: 'DEPT-TOUR', focus: 'FOC-HOSP' },
      { no: 'EMP-025', name: 'Mulu Wolde', title: 'Front Office Clerk', branch: 'BR-BK', dept: 'DEPT-TOUR', focus: 'FOC-HOSP' },
      { no: 'EMP-026', name: 'Girma Beshah', title: 'Maintenance Worker', branch: 'BR-BK', dept: 'DEPT-TOUR', focus: 'FOC-HOSP' },
      // Shabale branch
      { no: 'EMP-027', name: 'Frewokel Befekadu', title: 'Branch Manager', branch: 'BR-SL', dept: 'DEPT-TOUR', focus: 'FOC-HOSP' },
      { no: 'EMP-028', name: 'Tilahun Wolde', title: 'Front Office Manager', branch: 'BR-SL', dept: 'DEPT-TOUR', focus: 'FOC-HOSP' },
      { no: 'EMP-029', name: 'Sara Nuru', title: 'Housekeeping Supervisor', branch: 'BR-SL', dept: 'DEPT-TOUR', focus: 'FOC-HOSP' },
      { no: 'EMP-030', name: 'Dawit Alemayehu', title: 'Maintenance Supervisor', branch: 'BR-SL', dept: 'DEPT-TOUR', focus: 'FOC-HOSP' },
    ];

    for (const e of employeeData) {
      await tx.employee.upsert({
        where: { employeeNo: e.no },
        update: {
          fullName: e.name,
          jobTitle: e.title,
          orgUnitId: departments[e.dept]?.id ?? branches[e.branch]?.id,
          email: `${e.name.split(' ')[0].toLowerCase()}@ija.com`,
          phone: `+251-9${Math.floor(1000000 + Math.random() * 9000000)}`,
          active: true,
        },
        create: {
          employeeNo: e.no,
          fullName: e.name,
          jobTitle: e.title,
          orgUnitId: departments[e.dept]?.id ?? branches[e.branch]?.id,
          email: `${e.name.split(' ')[0].toLowerCase()}@ija.com`,
          phone: `+251-9${Math.floor(1000000 + Math.random() * 9000000)}`,
          active: true,
        },
      });
    }

    // ============================================================
    // PHASE O: SOURCE DOCUMENT ATTACHMENT
    // ============================================================
    // Store source document reference as an attachment for traceability
    console.log('Seeding complete. Imported 2019 E.C. source plan data.');
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
