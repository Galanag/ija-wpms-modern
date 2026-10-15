-- Stage 13: Future-Year Rollover and Plan Template Engine
-- Adds BudgetCategory, FundingSource, RolloverJob and RolloverItem models

-- 1. BudgetCategory (standalone structure/master-data table)
CREATE TABLE "BudgetCategory" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id")
);

-- 2. FundingSource (standalone structure/master-data table)
CREATE TABLE "FundingSource" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'government',
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "FundingSource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FundingSource_code_key" ON "FundingSource"("code");
CREATE INDEX "FundingSource_active_idx" ON "FundingSource"("active");

-- 3. RolloverJob (idempotent rollover ledger)
CREATE TABLE "RolloverJob" (
    "id" SERIAL NOT NULL,
    "sourceYearId" INTEGER NOT NULL,
    "targetYearId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'preview',
    "mode" TEXT NOT NULL DEFAULT 'all',
    "selection" JSONB,
    "preview" JSONB,
    "summary" JSONB,
    "createdBy" INTEGER,
    "createdByName" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RolloverJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RolloverJob_sourceYearId_targetYearId_mode_key" ON "RolloverJob"("sourceYearId", "targetYearId", "mode");
CREATE INDEX "RolloverJob_sourceYearId_idx" ON "RolloverJob"("sourceYearId");
CREATE INDEX "RolloverJob_targetYearId_idx" ON "RolloverJob"("targetYearId");
CREATE INDEX "RolloverJob_status_idx" ON "RolloverJob"("status");

-- 4. RolloverItem (per-item copy ledger)
CREATE TABLE "RolloverItem" (
    "id" SERIAL NOT NULL,
    "jobId" INTEGER NOT NULL,
    "itemKey" TEXT NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "targetId" INTEGER,
    "sourceYearId" INTEGER NOT NULL,
    "targetYearId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "copiedData" JSONB,
    "error" TEXT,
    "copiedAt" TIMESTAMP(3),
    CONSTRAINT "RolloverItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RolloverItem_jobId_itemKey_sourceId_key" ON "RolloverItem"("jobId", "itemKey", "sourceId");
CREATE UNIQUE INDEX "RolloverItem_sourceYearId_targetYearId_itemKey_sourceId_key" ON "RolloverItem"("sourceYearId", "targetYearId", "itemKey", "sourceId");
CREATE INDEX "RolloverItem_itemKey_idx" ON "RolloverItem"("itemKey");
CREATE INDEX "RolloverItem_sourceYearId_targetYearId_idx" ON "RolloverItem"("sourceYearId", "targetYearId");

-- 5. Foreign keys
ALTER TABLE "RolloverJob" ADD CONSTRAINT "RolloverJob_sourceYearId_fkey" FOREIGN KEY ("sourceYearId") REFERENCES "PlanningYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RolloverJob" ADD CONSTRAINT "RolloverJob_targetYearId_fkey" FOREIGN KEY ("targetYearId") REFERENCES "PlanningYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RolloverItem" ADD CONSTRAINT "RolloverItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "RolloverJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;