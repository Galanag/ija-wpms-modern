-- Fix schema/DB drift for the currency feature.
--
-- The `currencyId` fields were added to the Prisma schema
-- (Budget, BudgetLine, BudgetRequest, FinanceEntry, PlanningYear) as
-- non-nullable Int with a default of 1 (ETB), but no migration ever created
-- the matching columns. The columns exist in the database only because a
-- `prisma db push`/manual step added them as nullable-without-default.
--
-- Legacy rows with NULL currencyid make every Prisma query that touches these
-- models fail with P2032 ("expected non-nullable type Int, found null") — this
-- is what returned HTTP 500 for GET /budget and /budget/budgets.
--
-- This migration backfills NULL -> 1 (Ethiopian Birr, seeded as default) and
-- enforces the NOT NULL + DEFAULT 1 constraints the schema declares.

-- Add column where missing (using IF NOT EXISTS for idempotency).
ALTER TABLE "Budget" ADD COLUMN IF NOT EXISTS "currencyid" integer;
ALTER TABLE "BudgetLine" ADD COLUMN IF NOT EXISTS "currencyid" integer;
ALTER TABLE "BudgetRequest" ADD COLUMN IF NOT EXISTS "currencyid" integer;
ALTER TABLE "FinanceEntry" ADD COLUMN IF NOT EXISTS "currencyid" integer;
ALTER TABLE "PlanningYear" ADD COLUMN IF NOT EXISTS "currencyid" integer;

-- Backfill any legacy NULL currency references to the default (ETB, id 1).
UPDATE "Budget" SET "currencyid" = 1 WHERE "currencyid" IS NULL;
UPDATE "BudgetLine" SET "currencyid" = 1 WHERE "currencyid" IS NULL;
UPDATE "BudgetRequest" SET "currencyid" = 1 WHERE "currencyid" IS NULL;
UPDATE "FinanceEntry" SET "currencyid" = 1 WHERE "currencyid" IS NULL;
UPDATE "PlanningYear" SET "currencyid" = 1 WHERE "currencyid" IS NULL;

-- Enforce the schema's non-nullability and default.
ALTER TABLE "Budget" ALTER COLUMN "currencyid" SET DEFAULT 1, ALTER COLUMN "currencyid" SET NOT NULL;
ALTER TABLE "BudgetLine" ALTER COLUMN "currencyid" SET DEFAULT 1, ALTER COLUMN "currencyid" SET NOT NULL;
ALTER TABLE "BudgetRequest" ALTER COLUMN "currencyid" SET DEFAULT 1, ALTER COLUMN "currencyid" SET NOT NULL;
ALTER TABLE "FinanceEntry" ALTER COLUMN "currencyid" SET DEFAULT 1, ALTER COLUMN "currencyid" SET NOT NULL;
ALTER TABLE "PlanningYear" ALTER COLUMN "currencyid" SET DEFAULT 1, ALTER COLUMN "currencyid" SET NOT NULL;

-- BudgetRequest also needs the FK relation the schema declares.
ALTER TABLE "BudgetRequest"
  ADD CONSTRAINT "BudgetRequest_currencyid_fkey"
  FOREIGN KEY ("currencyid") REFERENCES "Currency"(id);
