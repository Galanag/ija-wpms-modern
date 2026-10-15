-- Add missing objects required by schema.prisma but not present in any previous migration.
-- Created to ensure clean-database reproducibility without db push.

-- ============================================
-- SubTask table
-- ============================================
CREATE TABLE "SubTask" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "employeeId" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),

    CONSTRAINT "SubTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SubTask_activityId_idx" ON "SubTask"("activityId");
CREATE INDEX "SubTask_employeeId_idx" ON "SubTask"("employeeId");

ALTER TABLE "SubTask" ADD CONSTRAINT "SubTask_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "SubTask" ADD CONSTRAINT "SubTask_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON UPDATE CASCADE ON DELETE SET NULL;

-- ============================================
-- KpiTemplate table
-- ============================================
CREATE TABLE "KpiTemplate" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area" TEXT,
    "definition" TEXT,
    "formula" TEXT,
    "unit" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'quarterly',
    "direction" TEXT NOT NULL DEFAULT 'higher_is_better',
    "categoryId" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KpiTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KpiTemplate_code_key" ON "KpiTemplate"("code");
CREATE INDEX "KpiTemplate_active_idx" ON "KpiTemplate"("active");
CREATE INDEX "KpiTemplate_categoryId_idx" ON "KpiTemplate"("categoryId");

ALTER TABLE "KpiTemplate" ADD CONSTRAINT "KpiTemplate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "KpiCategory"("id") ON UPDATE CASCADE ON DELETE SET NULL;

-- ============================================
-- KpiPlan.kpiTemplateId column
-- ============================================
ALTER TABLE "KpiPlan" ADD COLUMN "kpiTemplateId" INTEGER;
CREATE INDEX "KpiPlan_kpiTemplateId_idx" ON "KpiPlan"("kpiTemplateId");
ALTER TABLE "KpiPlan" ADD CONSTRAINT "KpiPlan_kpiTemplateId_fkey" FOREIGN KEY ("kpiTemplateId") REFERENCES "KpiTemplate"("id") ON UPDATE CASCADE ON DELETE SET NULL;