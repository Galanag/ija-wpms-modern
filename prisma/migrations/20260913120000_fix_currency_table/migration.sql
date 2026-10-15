-- Fix: Currency table missing from migration history.
-- Creates Currency table required by schema.prisma.
-- Seed data (ETB) should be added via db:seed.

CREATE TABLE "Currency" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "symbol" VARCHAR(10) NOT NULL DEFAULT '',
    "decimalplaces" INTEGER NOT NULL DEFAULT 2,
    "locale" VARCHAR(20) NOT NULL DEFAULT 'en-US',
    "isactive" BOOLEAN NOT NULL DEFAULT true,
    "isdefault" BOOLEAN NOT NULL DEFAULT false,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Currency_code_key" ON "Currency"("code");
CREATE INDEX "Currency_isactive_idx" ON "Currency"("isactive");
CREATE INDEX "Currency_isdefault_idx" ON "Currency"("isdefault");
