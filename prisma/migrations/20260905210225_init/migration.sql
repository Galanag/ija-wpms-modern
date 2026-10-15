-- CreateTable
CREATE TABLE "PlanningYear" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanningYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgUnit" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER,
    "unitType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" INTEGER NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","module","action")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "roleId" INTEGER NOT NULL,
    "primaryOrgUnitId" INTEGER,
    "employeeId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserModuleAccess" (
    "userId" INTEGER NOT NULL,
    "module" TEXT NOT NULL,

    CONSTRAINT "UserModuleAccess_pkey" PRIMARY KEY ("userId","module")
);

-- CreateTable
CREATE TABLE "ManagerAssignment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "orgUnitId" INTEGER NOT NULL,
    "authority" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ManagerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "employeeNo" TEXT,
    "fullName" TEXT NOT NULL,
    "jobTitle" TEXT,
    "orgUnitId" INTEGER,
    "email" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "photoAttachmentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicPlan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvalStatus" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategicPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicTheme" (
    "id" SERIAL NOT NULL,
    "planId" INTEGER,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StrategicTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicResult" (
    "id" SERIAL NOT NULL,
    "themeId" INTEGER,
    "yearId" INTEGER,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "StrategicResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "resultId" INTEGER,
    "orgUnitId" INTEGER,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "approvalStatus" TEXT NOT NULL DEFAULT 'draft',

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Objective" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "goalId" INTEGER NOT NULL,
    "orgUnitId" INTEGER,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" DOUBLE PRECISION,
    "unit" TEXT,
    "baselineValue" DOUBLE PRECISION,
    "direction" TEXT NOT NULL DEFAULT 'higher_is_better',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "approvalStatus" TEXT NOT NULL DEFAULT 'draft',

    CONSTRAINT "Objective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kpi" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "area" TEXT,
    "definition" TEXT,
    "formula" TEXT,
    "unit" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'quarterly',
    "direction" TEXT NOT NULL DEFAULT 'higher_is_better',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" INTEGER,

    CONSTRAINT "Kpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "KpiCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiPlan" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "kpiId" INTEGER NOT NULL,
    "objectiveId" INTEGER,
    "orgUnitId" INTEGER,
    "ownerEmployeeId" INTEGER,
    "baselineValue" DOUBLE PRECISION,
    "annualTarget" DOUBLE PRECISION,
    "q1Target" DOUBLE PRECISION,
    "q2Target" DOUBLE PRECISION,
    "q3Target" DOUBLE PRECISION,
    "q4Target" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "approvalStatus" TEXT NOT NULL DEFAULT 'draft',

    CONSTRAINT "KpiPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiActual" (
    "id" SERIAL NOT NULL,
    "kpiPlanId" INTEGER NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "actualValue" DOUBLE PRECISION,
    "comment" TEXT,
    "evidence" TEXT,
    "submittedBy" INTEGER,
    "verifiedBy" INTEGER,
    "approvalStatus" TEXT NOT NULL DEFAULT 'draft',
    "submittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "KpiActual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "orgUnitId" INTEGER,
    "managerEmployeeId" INTEGER,
    "plannedBudget" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "actualSpend" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "physicalProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "financialProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'planned',
    "approvalStatus" TEXT NOT NULL DEFAULT 'draft',

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMilestone" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "plannedDate" TIMESTAMP(3),
    "actualDate" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "objectiveId" INTEGER,
    "projectId" INTEGER,
    "orgUnitId" INTEGER,
    "branchOrgUnitId" INTEGER,
    "employeeId" INTEGER,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quarter" TEXT,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "implementationStatus" TEXT NOT NULL DEFAULT 'not_started',
    "approvalStatus" TEXT NOT NULL DEFAULT 'draft',
    "budget" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskUpdate" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "updateDate" TIMESTAMP(3) NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "submittedBy" INTEGER,
    "evidence" TEXT,

    CONSTRAINT "TaskUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnualPlanAllocation" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "orgUnitId" INTEGER,
    "name" TEXT NOT NULL,
    "allocationAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "approvalStatus" TEXT NOT NULL DEFAULT 'draft',

    CONSTRAINT "AnnualPlanAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "planAllocationId" INTEGER,
    "orgUnitId" INTEGER,
    "category" TEXT NOT NULL,
    "plannedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "revisedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "approvalStatus" TEXT NOT NULL DEFAULT 'draft',

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetRequest" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "budgetId" INTEGER,
    "orgUnitId" INTEGER,
    "activityId" INTEGER,
    "requestDate" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT NOT NULL,
    "requestedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "approvedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvalStatus" TEXT NOT NULL DEFAULT 'draft',
    "requestedBy" INTEGER,

    CONSTRAINT "BudgetRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLine" (
    "id" SERIAL NOT NULL,
    "budgetId" INTEGER NOT NULL,
    "lineName" TEXT NOT NULL,
    "plannedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "revisedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "entryType" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FinanceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceEntry" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "orgUnitId" INTEGER,
    "branchOrgUnitId" INTEGER,
    "budgetId" INTEGER,
    "budgetLineId" INTEGER,
    "categoryId" INTEGER,
    "reference" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "entryType" TEXT NOT NULL,
    "categoryName" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "description" TEXT,
    "createdBy" INTEGER,

    CONSTRAINT "FinanceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeePlan" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "orgUnitId" INTEGER,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvalStatus" TEXT NOT NULL DEFAULT 'draft',

    CONSTRAINT "EmployeePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeePlanActivity" (
    "employeePlanId" INTEGER NOT NULL,
    "activityId" INTEGER NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "EmployeePlanActivity_pkey" PRIMARY KEY ("employeePlanId","activityId")
);

-- CreateTable
CREATE TABLE "EmployeePlanKpi" (
    "employeePlanId" INTEGER NOT NULL,
    "kpiPlanId" INTEGER NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "EmployeePlanKpi_pkey" PRIMARY KEY ("employeePlanId","kpiPlanId")
);

-- CreateTable
CREATE TABLE "EvaluationCriterion" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "category" TEXT NOT NULL DEFAULT 'general',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EvaluationCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "orgUnitId" INTEGER,
    "title" TEXT NOT NULL,
    "evaluationType" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "score" DOUBLE PRECISION,
    "findings" TEXT,
    "recommendations" TEXT,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeEvaluation" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "employeePlanId" INTEGER,
    "orgUnitId" INTEGER,
    "evaluatorId" INTEGER,
    "periodKey" TEXT,
    "planScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "executionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvalStatus" TEXT NOT NULL DEFAULT 'draft',
    "planNotes" TEXT,
    "executionNotes" TEXT,
    "strengths" TEXT,
    "areasForImprovement" TEXT,
    "targetsNextPeriod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationScore" (
    "id" SERIAL NOT NULL,
    "evaluationId" INTEGER NOT NULL,
    "criterionId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,

    CONSTRAINT "EvaluationScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoringVisit" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "orgUnitId" INTEGER,
    "branchId" INTEGER,
    "activityId" INTEGER,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "officer" TEXT,
    "findings" TEXT,
    "recommendations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',

    CONSTRAINT "MonitoringVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "orgUnitId" INTEGER,
    "categoryId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "probability" INTEGER NOT NULL DEFAULT 1,
    "impact" INTEGER NOT NULL DEFAULT 1,
    "score" INTEGER NOT NULL DEFAULT 1,
    "level" TEXT NOT NULL DEFAULT 'medium',
    "ownerEmployeeId" INTEGER,
    "mitigation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "reviewDate" TIMESTAMP(3),

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskReview" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "riskId" INTEGER NOT NULL,
    "orgUnitId" INTEGER,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "residualScore" INTEGER,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',

    CONSTRAINT "RiskReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRequirement" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "orgUnitId" INTEGER,
    "category" TEXT,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "authority" TEXT,
    "responsibleEmployeeId" INTEGER,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "evidence" TEXT,

    CONSTRAINT "ComplianceRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceFinding" (
    "id" SERIAL NOT NULL,
    "requirementId" INTEGER NOT NULL,
    "finding" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "recommendation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',

    CONSTRAINT "ComplianceFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectiveAction" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" INTEGER,
    "ownerOrgUnitId" INTEGER,
    "ownerEmployeeId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "completion" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "CorrectiveAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagementAction" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerOrgUnitId" INTEGER,
    "dueDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "completion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdBy" INTEGER,

    CONSTRAINT "ManagementAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "auditType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "orgUnitId" INTEGER,
    "plannedDate" TIMESTAMP(3),
    "actualDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'planned',

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditFinding" (
    "id" SERIAL NOT NULL,
    "auditId" INTEGER NOT NULL,
    "finding" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "recommendation" TEXT,
    "responsibleOrgUnitId" INTEGER,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',

    CONSTRAINT "AuditFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Procurement" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "orgUnitId" INTEGER,
    "requestNo" TEXT,
    "item" TEXT NOT NULL,
    "category" TEXT,
    "estimatedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "approvedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "supplier" TEXT,
    "requestDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvalStatus" TEXT NOT NULL DEFAULT 'draft',
    "requestedBy" INTEGER,

    CONSTRAINT "Procurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrAction" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "actionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "employeeId" INTEGER,
    "orgUnitId" INTEGER,
    "targetValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "notes" TEXT,

    CONSTRAINT "HrAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Training" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "orgUnitId" INTEGER,
    "title" TEXT NOT NULL,
    "provider" TEXT,
    "plannedDate" TIMESTAMP(3),
    "participantsTarget" INTEGER NOT NULL DEFAULT 0,
    "participantsActual" INTEGER NOT NULL DEFAULT 0,
    "budget" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'planned',

    CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingParticipant" (
    "trainingId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'registered',

    CONSTRAINT "TrainingParticipant_pkey" PRIMARY KEY ("trainingId","employeeId")
);

-- CreateTable
CREATE TABLE "RiskCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RiskCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AssetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" SERIAL NOT NULL,
    "assetNo" TEXT,
    "assetName" TEXT NOT NULL,
    "categoryId" INTEGER,
    "acquisitionDate" TIMESTAMP(3),
    "acquisitionCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "orgUnitId" INTEGER,
    "custodianEmployeeId" INTEGER,
    "location" TEXT,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PropertyType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" SERIAL NOT NULL,
    "propertyNo" TEXT,
    "name" TEXT NOT NULL,
    "propertyTypeId" INTEGER,
    "orgUnitId" INTEGER,
    "location" TEXT,
    "area" DOUBLE PRECISION,
    "ownershipStatus" TEXT,
    "utilizationStatus" TEXT,
    "annualIncome" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourismCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TourismCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourismRecord" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "branchOrgUnitId" INTEGER,
    "categoryId" INTEGER,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "domesticVisitors" INTEGER NOT NULL DEFAULT 0,
    "internationalVisitors" INTEGER NOT NULL DEFAULT 0,
    "roomNightsAvailable" INTEGER NOT NULL DEFAULT 0,
    "roomNightsOccupied" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "satisfaction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stayHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "TourismRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalMatter" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "matterType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "counterparty" TEXT,
    "value" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "responsibleEmployeeId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'open',
    "nextAction" TEXT,
    "dueDate" TIMESTAMP(3),

    CONSTRAINT "LegalMatter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchStudy" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT,
    "responsibleOrgUnitId" INTEGER,
    "budget" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "findings" TEXT,
    "recommendations" TEXT,

    CONSTRAINT "ResearchStudy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stakeholder" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "influence" TEXT,
    "interest" TEXT,
    "contact" TEXT,
    "relationshipStatus" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,

    CONSTRAINT "Stakeholder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "reportType" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "submittedBy" INTEGER,
    "approvedBy" INTEGER,
    "orgUnitId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "stepNo" INTEGER NOT NULL,
    "stepName" TEXT NOT NULL,
    "requiredRole" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedBy" INTEGER,
    "decidedBy" INTEGER,
    "decision" TEXT,
    "comment" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" INTEGER,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "purpose" TEXT,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "note" TEXT,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnualPlanRevision" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "reason" TEXT,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'draft',

    CONSTRAINT "AnnualPlanRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "valueType" TEXT NOT NULL DEFAULT 'text',
    "label" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodDefinition" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "label" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PeriodDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanningYear_year_key" ON "PlanningYear"("year");

-- CreateIndex
CREATE INDEX "OrgUnit_parentId_idx" ON "OrgUnit"("parentId");

-- CreateIndex
CREATE INDEX "OrgUnit_unitType_active_idx" ON "OrgUnit"("unitType", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE INDEX "ManagerAssignment_orgUnitId_authority_idx" ON "ManagerAssignment"("orgUnitId", "authority");

-- CreateIndex
CREATE UNIQUE INDEX "ManagerAssignment_userId_orgUnitId_authority_key" ON "ManagerAssignment"("userId", "orgUnitId", "authority");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeNo_key" ON "Employee"("employeeNo");

-- CreateIndex
CREATE UNIQUE INDEX "Kpi_code_key" ON "Kpi"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KpiCategory_name_key" ON "KpiCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "KpiPlan_yearId_kpiId_orgUnitId_key" ON "KpiPlan"("yearId", "kpiId", "orgUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "KpiActual_kpiPlanId_periodType_periodKey_key" ON "KpiActual"("kpiPlanId", "periodType", "periodKey");

-- CreateIndex
CREATE INDEX "Activity_yearId_orgUnitId_branchOrgUnitId_idx" ON "Activity"("yearId", "orgUnitId", "branchOrgUnitId");

-- CreateIndex
CREATE INDEX "Budget_yearId_orgUnitId_idx" ON "Budget"("yearId", "orgUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceCategory_name_key" ON "FinanceCategory"("name");

-- CreateIndex
CREATE INDEX "FinanceEntry_transactionDate_yearId_orgUnitId_branchOrgUnit_idx" ON "FinanceEntry"("transactionDate", "yearId", "orgUnitId", "branchOrgUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeePlan_yearId_employeeId_key" ON "EmployeePlan"("yearId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationCriterion_name_category_key" ON "EvaluationCriterion"("name", "category");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeEvaluation_yearId_employeeId_periodKey_key" ON "EmployeeEvaluation"("yearId", "employeeId", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationScore_evaluationId_criterionId_key" ON "EvaluationScore"("evaluationId", "criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskCategory_name_key" ON "RiskCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AssetCategory_name_key" ON "AssetCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_assetNo_key" ON "Asset"("assetNo");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyType_name_key" ON "PropertyType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Property_propertyNo_key" ON "Property"("propertyNo");

-- CreateIndex
CREATE UNIQUE INDEX "TourismCategory_name_key" ON "TourismCategory"("name");

-- CreateIndex
CREATE INDEX "TourismRecord_recordDate_branchOrgUnitId_idx" ON "TourismRecord"("recordDate", "branchOrgUnitId");

-- CreateIndex
CREATE INDEX "Approval_entityType_entityId_status_idx" ON "Approval"("entityType", "entityId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_storageKey_key" ON "Attachment"("storageKey");

-- CreateIndex
CREATE INDEX "Attachment_entityType_entityId_idx" ON "Attachment"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnualPlanRevision_yearId_versionNo_key" ON "AnnualPlanRevision"("yearId", "versionNo");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_category_key_key" ON "Setting"("category", "key");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodDefinition_yearId_periodType_periodKey_key" ON "PeriodDefinition"("yearId", "periodType", "periodKey");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- AddForeignKey
ALTER TABLE "OrgUnit" ADD CONSTRAINT "OrgUnit_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_primaryOrgUnitId_fkey" FOREIGN KEY ("primaryOrgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserModuleAccess" ADD CONSTRAINT "UserModuleAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerAssignment" ADD CONSTRAINT "ManagerAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerAssignment" ADD CONSTRAINT "ManagerAssignment_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategicTheme" ADD CONSTRAINT "StrategicTheme_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StrategicPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategicResult" ADD CONSTRAINT "StrategicResult_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "StrategicTheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategicResult" ADD CONSTRAINT "StrategicResult_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "StrategicResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kpi" ADD CONSTRAINT "Kpi_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "KpiCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiPlan" ADD CONSTRAINT "KpiPlan_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiPlan" ADD CONSTRAINT "KpiPlan_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "Kpi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiPlan" ADD CONSTRAINT "KpiPlan_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiPlan" ADD CONSTRAINT "KpiPlan_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiPlan" ADD CONSTRAINT "KpiPlan_ownerEmployeeId_fkey" FOREIGN KEY ("ownerEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiActual" ADD CONSTRAINT "KpiActual_kpiPlanId_fkey" FOREIGN KEY ("kpiPlanId") REFERENCES "KpiPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiActual" ADD CONSTRAINT "KpiActual_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiActual" ADD CONSTRAINT "KpiActual_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_managerEmployeeId_fkey" FOREIGN KEY ("managerEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_branchOrgUnitId_fkey" FOREIGN KEY ("branchOrgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskUpdate" ADD CONSTRAINT "TaskUpdate_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskUpdate" ADD CONSTRAINT "TaskUpdate_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualPlanAllocation" ADD CONSTRAINT "AnnualPlanAllocation_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualPlanAllocation" ADD CONSTRAINT "AnnualPlanAllocation_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_planAllocationId_fkey" FOREIGN KEY ("planAllocationId") REFERENCES "AnnualPlanAllocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetRequest" ADD CONSTRAINT "BudgetRequest_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetRequest" ADD CONSTRAINT "BudgetRequest_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetRequest" ADD CONSTRAINT "BudgetRequest_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetRequest" ADD CONSTRAINT "BudgetRequest_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetRequest" ADD CONSTRAINT "BudgetRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_branchOrgUnitId_fkey" FOREIGN KEY ("branchOrgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FinanceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePlan" ADD CONSTRAINT "EmployeePlan_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePlan" ADD CONSTRAINT "EmployeePlan_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePlan" ADD CONSTRAINT "EmployeePlan_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePlanActivity" ADD CONSTRAINT "EmployeePlanActivity_employeePlanId_fkey" FOREIGN KEY ("employeePlanId") REFERENCES "EmployeePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePlanActivity" ADD CONSTRAINT "EmployeePlanActivity_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePlanKpi" ADD CONSTRAINT "EmployeePlanKpi_employeePlanId_fkey" FOREIGN KEY ("employeePlanId") REFERENCES "EmployeePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeePlanKpi" ADD CONSTRAINT "EmployeePlanKpi_kpiPlanId_fkey" FOREIGN KEY ("kpiPlanId") REFERENCES "KpiPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeEvaluation" ADD CONSTRAINT "EmployeeEvaluation_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeEvaluation" ADD CONSTRAINT "EmployeeEvaluation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeEvaluation" ADD CONSTRAINT "EmployeeEvaluation_employeePlanId_fkey" FOREIGN KEY ("employeePlanId") REFERENCES "EmployeePlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeEvaluation" ADD CONSTRAINT "EmployeeEvaluation_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeEvaluation" ADD CONSTRAINT "EmployeeEvaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationScore" ADD CONSTRAINT "EvaluationScore_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "EmployeeEvaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationScore" ADD CONSTRAINT "EvaluationScore_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "EvaluationCriterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringVisit" ADD CONSTRAINT "MonitoringVisit_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringVisit" ADD CONSTRAINT "MonitoringVisit_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoringVisit" ADD CONSTRAINT "MonitoringVisit_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RiskCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_ownerEmployeeId_fkey" FOREIGN KEY ("ownerEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskReview" ADD CONSTRAINT "RiskReview_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskReview" ADD CONSTRAINT "RiskReview_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskReview" ADD CONSTRAINT "RiskReview_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRequirement" ADD CONSTRAINT "ComplianceRequirement_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRequirement" ADD CONSTRAINT "ComplianceRequirement_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRequirement" ADD CONSTRAINT "ComplianceRequirement_responsibleEmployeeId_fkey" FOREIGN KEY ("responsibleEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceFinding" ADD CONSTRAINT "ComplianceFinding_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "ComplianceRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_ownerOrgUnitId_fkey" FOREIGN KEY ("ownerOrgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_ownerEmployeeId_fkey" FOREIGN KEY ("ownerEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagementAction" ADD CONSTRAINT "ManagementAction_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagementAction" ADD CONSTRAINT "ManagementAction_ownerOrgUnitId_fkey" FOREIGN KEY ("ownerOrgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagementAction" ADD CONSTRAINT "ManagementAction_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_responsibleOrgUnitId_fkey" FOREIGN KEY ("responsibleOrgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procurement" ADD CONSTRAINT "Procurement_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procurement" ADD CONSTRAINT "Procurement_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procurement" ADD CONSTRAINT "Procurement_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrAction" ADD CONSTRAINT "HrAction_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrAction" ADD CONSTRAINT "HrAction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrAction" ADD CONSTRAINT "HrAction_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingParticipant" ADD CONSTRAINT "TrainingParticipant_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingParticipant" ADD CONSTRAINT "TrainingParticipant_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssetCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_custodianEmployeeId_fkey" FOREIGN KEY ("custodianEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_propertyTypeId_fkey" FOREIGN KEY ("propertyTypeId") REFERENCES "PropertyType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourismRecord" ADD CONSTRAINT "TourismRecord_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourismRecord" ADD CONSTRAINT "TourismRecord_branchOrgUnitId_fkey" FOREIGN KEY ("branchOrgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourismRecord" ADD CONSTRAINT "TourismRecord_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TourismCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalMatter" ADD CONSTRAINT "LegalMatter_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalMatter" ADD CONSTRAINT "LegalMatter_responsibleEmployeeId_fkey" FOREIGN KEY ("responsibleEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchStudy" ADD CONSTRAINT "ResearchStudy_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchStudy" ADD CONSTRAINT "ResearchStudy_responsibleOrgUnitId_fkey" FOREIGN KEY ("responsibleOrgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_decidedBy_fkey" FOREIGN KEY ("decidedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualPlanRevision" ADD CONSTRAINT "AnnualPlanRevision_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnualPlanRevision" ADD CONSTRAINT "AnnualPlanRevision_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodDefinition" ADD CONSTRAINT "PeriodDefinition_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
