# Immediate Implementation Guide

## 1. Build the foundation

Run the bootstrap script. It installs dependencies, starts PostgreSQL, generates Prisma Client, creates migrations and seeds development data.

## 2. First vertical slice

Implement and validate Organization → User → Role → Year → Goal → Objective → KPI → Activity → Budget → Finance → Employee Plan → Evaluation.

Do not expand every screen before this slice passes browser UAT.

## 3. CRUD standard

Every resource uses list/detail/create/edit/archive actions, React Hook Form validation, TanStack Query invalidation and NestJS authorization.

## 4. Global filtering

Keep the canonical filter object in URL/application state. Send the same fields to the API. Backend authorization is applied after requested filters.

## 5. Admin configuration

Admin creates organization units, master-data records, roles and workflow definitions from UI. Seed values are defaults only.

## 6. Historical integrity

Avoid destructive updates to audit, finalized approvals and finalized evaluations. Use archive/revision/reversal flows.
