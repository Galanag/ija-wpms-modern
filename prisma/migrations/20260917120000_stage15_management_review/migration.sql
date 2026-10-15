-- Stage 15: Management Review Module Tables
-- Creates ManagementReview, ReviewFinding, ReviewDecision, ReviewAction
-- matching Prisma schema.prisma exactly.

CREATE TABLE "ManagementReview" (
    "id" SERIAL NOT NULL,
    "yearId" INTEGER NOT NULL,
    "reviewPeriod" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "participants" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagementReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewFinding" (
    "id" SERIAL NOT NULL,
    "reviewId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT NOT NULL DEFAULT 'kpi',
    "sourceInfo" TEXT,
    "yearId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewFinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewDecision" (
    "id" SERIAL NOT NULL,
    "reviewId" INTEGER NOT NULL,
    "description" TEXT,
    "decision" TEXT NOT NULL DEFAULT 'approved',
    "dueDate" TIMESTAMP(3),
    "assignedTo" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewDecision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewAction" (
    "id" SERIAL NOT NULL,
    "reviewId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "responsiblePersonId" INTEGER,
    "responsibleOrgUnitId" INTEGER,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "followUpStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ManagementReview_yearId_status_idx" ON "ManagementReview"("yearId", "status");
CREATE INDEX "ManagementReview_yearId_idx" ON "ManagementReview"("yearId");
CREATE INDEX "ManagementReview_status_idx" ON "ManagementReview"("status");

CREATE INDEX "ReviewFinding_reviewId_idx" ON "ReviewFinding"("reviewId");
CREATE INDEX "ReviewFinding_yearId_idx" ON "ReviewFinding"("yearId");
CREATE INDEX "ReviewFinding_severity_idx" ON "ReviewFinding"("severity");
CREATE INDEX "ReviewFinding_category_idx" ON "ReviewFinding"("category");

CREATE INDEX "ReviewDecision_reviewId_idx" ON "ReviewDecision"("reviewId");
CREATE INDEX "ReviewDecision_assignedTo_idx" ON "ReviewDecision"("assignedTo");
CREATE INDEX "ReviewDecision_status_idx" ON "ReviewDecision"("status");

CREATE INDEX "ReviewAction_reviewId_idx" ON "ReviewAction"("reviewId");
CREATE INDEX "ReviewAction_responsiblePersonId_idx" ON "ReviewAction"("responsiblePersonId");
CREATE INDEX "ReviewAction_responsibleOrgUnitId_idx" ON "ReviewAction"("responsibleOrgUnitId");
CREATE INDEX "ReviewAction_status_idx" ON "ReviewAction"("status");

ALTER TABLE "ManagementReview" ADD CONSTRAINT "ManagementReview_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ManagementReview" ADD CONSTRAINT "ManagementReview_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReviewFinding" ADD CONSTRAINT "ReviewFinding_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "ManagementReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewFinding" ADD CONSTRAINT "ReviewFinding_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "PlanningYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewDecision" ADD CONSTRAINT "ReviewDecision_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "ManagementReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewDecision" ADD CONSTRAINT "ReviewDecision_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReviewAction" ADD CONSTRAINT "ReviewAction_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "ManagementReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewAction" ADD CONSTRAINT "ReviewAction_responsiblePersonId_fkey" FOREIGN KEY ("responsiblePersonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReviewAction" ADD CONSTRAINT "ReviewAction_responsibleOrgUnitId_fkey" FOREIGN KEY ("responsibleOrgUnitId") REFERENCES "OrgUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
