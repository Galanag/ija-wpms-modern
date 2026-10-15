-- Stage 12: Governance, Approvals, Permissions and Audit
-- This migration updates the RolePermission and AuditLog models

-- 1. Update RolePermission table to use resource/actions structure
ALTER TABLE "RolePermission" RENAME COLUMN "module" TO "resource";

-- Add new column for actions array
ALTER TABLE "RolePermission" ADD COLUMN "actions" TEXT[];

-- Migrate existing data: copy action to actions as array
UPDATE "RolePermission" SET "actions" = ARRAY["action"];

-- Drop the old action column
ALTER TABLE "RolePermission" DROP COLUMN "action";

-- Update primary key to use new structure
ALTER TABLE "RolePermission" DROP CONSTRAINT IF EXISTS "RolePermission_pkey";
ALTER TABLE "RolePermission" ADD COLUMN "id" SERIAL;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id");
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_resource_key" UNIQUE ("roleId", "resource");

-- 2. Add isSystem to Role table
ALTER TABLE "Role" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- 3. Update AuditLog table structure
ALTER TABLE "AuditLog" RENAME COLUMN "entityType" TO "entity";
ALTER TABLE "AuditLog" RENAME COLUMN "entityId" TO "recordId";
ALTER TABLE "AuditLog" ALTER COLUMN "recordId" TYPE TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "oldValue" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "newValue" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "userAgent" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "metadata" TEXT;
ALTER TABLE "AuditLog" DROP COLUMN "details";

-- 4. Add indexes for AuditLog
CREATE INDEX IF NOT EXISTS "AuditLog_entity_recordId_idx" ON "AuditLog"("entity", "recordId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");

-- 5. Add createdBy to key models for separation of duties tracking
-- (These are optional additions - uncomment if needed)
-- ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "createdBy" INTEGER REFERENCES "User"(id);
-- ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "createdBy" INTEGER REFERENCES "User"(id);
-- ALTER TABLE "Budget" ADD COLUMN IF NOT EXISTS "createdBy" INTEGER REFERENCES "User"(id);