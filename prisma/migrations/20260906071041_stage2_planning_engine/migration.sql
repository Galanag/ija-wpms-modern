-- CreateTable
CREATE TABLE "PlanWorkflowState" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approverRole" TEXT,
    "editable" BOOLEAN NOT NULL DEFAULT true,
    "allowCopy" BOOLEAN NOT NULL DEFAULT false,
    "isInitial" BOOLEAN NOT NULL DEFAULT false,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanWorkflowState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanWorkflowTransition" (
    "id" SERIAL NOT NULL,
    "fromStateId" INTEGER NOT NULL,
    "toStateId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "actionLabel" TEXT NOT NULL,
    "requiresRole" TEXT,
    "requiresComment" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanWorkflowTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "orgUnitId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workflowStateId" INTEGER NOT NULL DEFAULT 1,
    "ownerId" INTEGER,
    "ownerRoleId" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "parentPlanId" INTEGER,
    "copiedFromPlanId" INTEGER,
    "previousYearPlanId" INTEGER,
    "fiscalYearStart" INTEGER,
    "planningType" TEXT NOT NULL DEFAULT 'annual',
    "notes" TEXT,
    "submittedBy" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "closedBy" INTEGER,
    "closedAt" TIMESTAMP(3),
    "archivedBy" INTEGER,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanVersion" (
    "id" SERIAL NOT NULL,
    "planId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "changeType" TEXT NOT NULL,
    "changeNote" TEXT,
    "changedBy" INTEGER,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stateSnapshot" JSONB,
    "contentSnapshot" JSONB,

    CONSTRAINT "PlanVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanCopyConfig" (
    "id" SERIAL NOT NULL,
    "sourcePlanId" INTEGER NOT NULL,
    "targetPlanId" INTEGER NOT NULL,
    "copyStrategicStructure" BOOLEAN NOT NULL DEFAULT false,
    "copyGoals" BOOLEAN NOT NULL DEFAULT true,
    "copyObjectives" BOOLEAN NOT NULL DEFAULT true,
    "copyActivities" BOOLEAN NOT NULL DEFAULT true,
    "copyProjects" BOOLEAN NOT NULL DEFAULT true,
    "copyKpis" BOOLEAN NOT NULL DEFAULT true,
    "copyBudgets" BOOLEAN NOT NULL DEFAULT false,
    "copyRisks" BOOLEAN NOT NULL DEFAULT false,
    "resetTargets" BOOLEAN NOT NULL DEFAULT true,
    "resetProgress" BOOLEAN NOT NULL DEFAULT true,
    "copyResponsibleUnits" BOOLEAN NOT NULL DEFAULT false,
    "copyResponsibleEmployees" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanCopyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningYearConfig" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "allowPlanning" BOOLEAN NOT NULL DEFAULT true,
    "planningStartDate" TIMESTAMP(3),
    "planningEndDate" TIMESTAMP(3),
    "reviewStartDate" TIMESTAMP(3),
    "reviewEndDate" TIMESTAMP(3),
    "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
    "approverRoleId" INTEGER,
    "executionStartDate" TIMESTAMP(3),
    "executionEndDate" TIMESTAMP(3),
    "closureStartDate" TIMESTAMP(3),
    "closureEndDate" TIMESTAMP(3),
    "activePlanId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningYearConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanWorkflowState_code_key" ON "PlanWorkflowState"("code");

-- CreateIndex
CREATE INDEX "PlanWorkflowState_category_order_idx" ON "PlanWorkflowState"("category", "order");

-- CreateIndex
CREATE INDEX "PlanWorkflowTransition_fromStateId_idx" ON "PlanWorkflowTransition"("fromStateId");

-- CreateIndex
CREATE INDEX "PlanWorkflowTransition_toStateId_idx" ON "PlanWorkflowTransition"("toStateId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanWorkflowTransition_fromStateId_toStateId_action_key" ON "PlanWorkflowTransition"("fromStateId", "toStateId", "action");

-- CreateIndex
CREATE INDEX "Plan_yearId_idx" ON "Plan"("yearId");

-- CreateIndex
CREATE INDEX "Plan_workflowStateId_idx" ON "Plan"("workflowStateId");

-- CreateIndex
CREATE INDEX "Plan_ownerId_idx" ON "Plan"("ownerId");

-- CreateIndex
CREATE INDEX "Plan_isCurrent_idx" ON "Plan"("isCurrent");

-- CreateIndex
CREATE INDEX "Plan_orgUnitId_idx" ON "Plan"("orgUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_yearId_version_key" ON "Plan"("yearId", "version");

-- CreateIndex
CREATE INDEX "PlanVersion_planId_idx" ON "PlanVersion"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanVersion_planId_version_key" ON "PlanVersion"("planId", "version");

-- CreateIndex
CREATE INDEX "PlanCopyConfig_sourcePlanId_idx" ON "PlanCopyConfig"("sourcePlanId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanCopyConfig_sourcePlanId_targetPlanId_key" ON "PlanCopyConfig"("sourcePlanId", "targetPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanningYearConfig_yearId_key" ON "PlanningYearConfig"("yearId");

-- CreateIndex
CREATE INDEX "PlanningYearConfig_yearId_idx" ON "PlanningYearConfig"("yearId");

-- AddForeignKey
ALTER TABLE "PlanWorkflowTransition" ADD CONSTRAINT "PlanWorkflowTransition_fromStateId_fkey" FOREIGN KEY ("fromStateId") REFERENCES "PlanWorkflowState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanWorkflowTransition" ADD CONSTRAINT "PlanWorkflowTransition_toStateId_fkey" FOREIGN KEY ("toStateId") REFERENCES "PlanWorkflowState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_workflowStateId_fkey" FOREIGN KEY ("workflowStateId") REFERENCES "PlanWorkflowState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_archivedBy_fkey" FOREIGN KEY ("archivedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_parentPlanId_fkey" FOREIGN KEY ("parentPlanId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_copiedFromPlanId_fkey" FOREIGN KEY ("copiedFromPlanId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_previousYearPlanId_fkey" FOREIGN KEY ("previousYearPlanId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanVersion" ADD CONSTRAINT "PlanVersion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanVersion" ADD CONSTRAINT "PlanVersion_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanCopyConfig" ADD CONSTRAINT "PlanCopyConfig_sourcePlanId_fkey" FOREIGN KEY ("sourcePlanId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningYearConfig" ADD CONSTRAINT "PlanningYearConfig_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
