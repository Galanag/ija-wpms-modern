# IJA-WPMS Modern Architecture & Migration Blueprint
## Analysis of the Uploaded Current Project + Production-Ready Rebuild Plan

**Source inspected:** `ija-pme-system.zip`  
**Purpose:** redesign the current IJA-WPMS into a maintainable full-stack application while preserving the existing business model and making every business/master record manageable from the running application.

---

# 1. Executive assessment

The uploaded project is a useful **business prototype/reference implementation**, but it is not the architecture I recommend using as the long-term production foundation.

The current project contains:

- a PHP backend concentrated in `api.php`
- database access concentrated in `db.php`
- a browser frontend concentrated in `assets/app.ts` / `assets/app.js`
- a single `index.html` shell
- SQLite databases (`data.db`, `pme.db`)
- seed/test/debug/build scripts mixed into the project root
- a large number of session files under `storage/`
- browser/test artifacts and backup JavaScript files

The database already contains a strong business vocabulary. I found **54 application tables plus SQLite's internal sequence table**, including planning, organization, users, KPIs, budgets, finance, projects, HR, risk, compliance, procurement, tourism, legal, research, audit, attachments, settings, employee evaluations, criteria, and periods.

The important conclusion is:

> **Do not throw away the business concepts. Do not translate `api.php` line-by-line. Rebuild the architecture around the business model.**

---

# 2. Current business entities discovered

The current database contains the following major entities:

### Organization and security
- `org_units`
- `users`
- `roles`
- `role_permissions`
- `user_module_access`
- `manager_assignments`
- `employees`
- `audit_log`

### Planning
- `planning_years`
- `strategic_plans`
- `strategic_themes`
- `strategic_results`
- `goals`
- `objectives`
- `activities`
- `task_updates`
- `annual_plan_allocations`
- `annual_plan_revisions`

### KPI / performance
- `kpis`
- `kpi_plans`
- `kpi_actuals`
- `employee_evaluations`
- `evaluation_criteria`
- `period_definitions`
- `evaluations`
- `monitoring_visits`

### Finance / budget
- `finance_categories`
- `finance_entries`
- `budgets`
- `budget_requests`
- `budget_lines`

### Project / execution
- `projects`
- `project_milestones`
- `procurements`
- `hr_actions`
- `trainings`
- `tourism_records`
- `assets`
- `properties`

### Control / governance
- `risks`
- `risk_reviews`
- `compliance_requirements`
- `compliance_records`
- `audits`
- `audit_findings`
- `corrective_actions`
- `management_actions`

### Other business areas
- `legal_matters`
- `research_studies`
- `stakeholders`
- `reports`

### Cross-cutting
- `attachments`
- `settings`
- `approvals`

This is a strong starting business model.

---

# 3. Current data relationships

The uploaded schema already expresses important relationships.

## Organization

```text
Organization Unit
    └── parent Organization Unit
```

This should become a formal organization tree.

## Planning

```text
Planning Year
    └── Goal
          └── Objective
                 └── KPI Plan
                 └── Activity
```

## Strategy

```text
Strategic Plan
    └── Strategic Theme
          └── Strategic Result
                └── Goal
```

## Finance

```text
Annual Plan Allocation
    └── Budget
          └── Budget Line

Budget Request
    └── Budget

Finance Entry
    └── Finance Category
```

## Employees

```text
Employee
    └── Employee Evaluation

Employee
    └── Activities
```

## Projects

```text
Project
    └── Milestone
```

## Risk / compliance

```text
Risk
    └── Risk Review

Compliance Requirement
    └── Compliance Record

Audit
    └── Audit Finding

Finding / Risk / Compliance
    └── Corrective Action
          └── Management Action
```

The new architecture should preserve these concepts but strengthen their relationships.

---

# 4. Major technical debt in the current implementation

## 4.1 Single large backend

`api.php` contains:

- authentication
- authorization
- CRUD
- business rules
- approval logic
- export logic
- bootstrap
- cloning
- validation
- security
- database operations

This creates high coupling.

A change in one business function can break another.

### Replacement

Use NestJS:

```text
Controller
    ↓
Service
    ↓
Repository / Prisma
    ↓
PostgreSQL
```

---

## 4.2 Single frontend application file

The current frontend concentrates most UI behavior into `app.ts` / `app.js`.

This is the reason a relatively small quoting/event bug can stop the whole application.

### Replacement

Use feature-based React architecture.

```text
features/
├── organization/
├── users/
├── planning/
├── kpi/
├── budget/
├── finance/
├── projects/
├── employees/
├── evaluation/
├── tourism/
├── risk/
├── compliance/
└── reports/
```

---

## 4.3 SQLite as the main database

SQLite is excellent for a prototype or small single-user/local deployment.

For IJA-WPMS production usage with many related modules, concurrent users, reporting and organizational scope, PostgreSQL is a better foundation.

PostgreSQL 18 is the current major release and adds improvements useful to modern workloads. citeturn795642search8

---

## 4.4 Hardcoded business configuration

The current project still contains database-driven data mixed with frontend assumptions.

Business configuration should live in database master data.

Examples:

- statuses
- finance categories
- KPI frequencies
- periods
- evaluation criteria
- organizational unit types
- project statuses
- risk categories
- tourism categories

Default seed data is fine.

Permanent hardcoding is not.

---

## 4.5 Insufficiently normalized organization data

The current model stores one `org_unit_id` in many tables.

That is useful, but the new implementation needs a consistent organization-scope service so all records use the same hierarchy rules.

---

# 5. Critical requirement: every business record must be editable

This should become a formal product rule.

The administrator must be able to create and manage the business data through the running application.

Examples:

```text
Admin
→ Organization
→ Create Division
→ Create Department
→ Create Branch
→ Assign Manager
→ Create User
→ Create Employee
→ Create Planning Year
→ Create Goal
→ Create Objective
→ Create KPI
→ Create Budget
→ Create Finance Category
→ Create Transaction
→ Create Project
→ Create Risk
→ Create Compliance Requirement
→ Create Evaluation Criteria
```

The same UI must then allow:

```text
View
Edit
Update
Archive/Deactivate
```

where applicable.

### Important data-governance exception

The following should remain append-only or controlled:

- audit log
- finalized approval history
- immutable historical financial records where accounting policy requires it
- finalized employee evaluations
- security events

But they must still have **authorized business workflows** for correction/reversal/versioning.

Do not give ordinary users direct database mutation of these records.

---

# 6. Recommended technology stack

## Frontend

### Next.js 16.x
### React 19.2
### TypeScript
### Tailwind CSS 4.x
### shadcn/ui + Base UI

Next.js 16.3 was released in August 2026 with improvements including faster development behavior and instant navigation work. citeturn795642search9

React's current documented release is 19.2. citeturn414112search0turn414112search2

Tailwind 4.x is the appropriate modern Tailwind line; Tailwind 4.1 added broader utility coverage and compatibility improvements. citeturn414112search1

shadcn/ui changed its default component base to **Base UI** in July 2026, while continuing to support Radix. citeturn795642search0

### State / data

- TanStack Query
- TanStack Table
- React Hook Form
- Zod

---

# 7. Backend recommendation

## NestJS + Fastify + TypeScript

Use NestJS with Fastify for the API layer.

Nest supports modular architecture, guards, pipes, interceptors, file upload, sessions, caching, performance features, testing, and OpenAPI. citeturn414112search4turn414112search10

Suggested:

```text
NestJS
├── Auth
├── Users
├── Roles
├── Organization
├── Master Data
├── Planning
├── KPI
├── Budget
├── Finance
├── Projects
├── Employees
├── Evaluation
├── Monitoring
├── Procurement
├── HR
├── Tourism
├── Risk
├── Compliance
├── Audit
├── Assets
├── Property
├── Legal
├── Research
├── Reports
├── Attachments
└── Dashboard
```

---

# 8. Prisma recommendation

Use Prisma ORM.

Important current-version decision:

- **Prisma 7** is the safer production baseline right now.
- Prisma 8 is the newer/cutting-edge line, but its July 2026 documentation described it as Early Access. citeturn795642search2turn795642search7

Therefore:

> Use Prisma 7 for the production rebuild unless the team deliberately accepts Prisma 8 Early Access.

Prisma's PostgreSQL workflow is well supported. citeturn795642search2

Use Node.js 24 LTS for the rebuild to align with current Prisma requirements; Prisma's current quickstart explicitly calls for Node 24 or newer. citeturn795642search2

---

# 9. Database recommendation

## PostgreSQL 18

Use PostgreSQL 18 for production.

The database should be the source of truth for:

- organizations
- users
- roles
- planning
- finance
- budgets
- KPIs
- employees
- evaluations
- reports
- attachments
- audit

---

# 10. Recommended high-level architecture

```text
                    ┌──────────────────────────────┐
                    │          Next.js 16          │
                    │ React 19.2 + TypeScript     │
                    │ Tailwind + shadcn/Base UI   │
                    └──────────────┬───────────────┘
                                   │
                          HTTPS / REST API
                                   │
                    ┌──────────────▼───────────────┐
                    │       NestJS + Fastify       │
                    │                              │
                    │ Auth / RBAC / Scope / CRUD  │
                    │ Business Services / Reports  │
                    └──────────────┬───────────────┘
                                   │
                             Prisma ORM
                                   │
                    ┌──────────────▼───────────────┐
                    │        PostgreSQL 18         │
                    └──────────────┬───────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
          Attachments           Audit               Reports
```

---

# 11. Complete proposed Prisma schema

Below is the recommended normalized foundation. It deliberately avoids hard-coding business statuses/categories as PostgreSQL enums because administrators need to manage those values.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserStatus {
  ACTIVE
  INACTIVE
}

enum ApprovalDecision {
  APPROVED
  REJECTED
  RETURNED
}

enum ApprovalState {
  PENDING
  DECIDED
}

enum AttachmentKind {
  IMAGE
  DOCUMENT
  EVIDENCE
  OTHER
}

model PlanningYear {
  id        Int       @id @default(autoincrement())
  year      Int       @unique
  label     String
  status    String
  startDate DateTime
  endDate   DateTime
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  goals               Goal[]
  objectives          Objective[]
  kpiPlans            KpiPlan[]
  activities          Activity[]
  projects            Project[]
  annualAllocations   AnnualPlanAllocation[]
  annualRevisions     AnnualPlanRevision[]
  budgets             Budget[]
  budgetRequests      BudgetRequest[]
  financeEntries      FinanceEntry[]
  procurements        Procurement[]
  risks               Risk[]
  complianceRequirements ComplianceRequirement[]
  monitoringVisits    MonitoringVisit[]
  evaluations         Evaluation[]
  correctiveActions   CorrectiveAction[]
  managementActions  ManagementAction[]
  audits              Audit[]
  trainings           Training[]
  legalMatters        LegalMatter[]
  researchStudies     ResearchStudy[]
  reports             Report[]
  kpiActuals           KpiActual[]
  employeeEvaluations EmployeeEvaluation[]
  tourismRecords      TourismRecord[]
}

model OrganizationType {
  id          Int      @id @default(autoincrement())
  code        String   @unique
  name        String
  level       Int
  active      Boolean  @default(true)
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  units OrganizationUnit[]
}

model OrganizationUnit {
  id          Int       @id @default(autoincrement())
  typeId      Int
  parentId    Int?
  code        String
  name        String
  description String?
  active      Boolean   @default(true)
  managerUserId Int?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  type        OrganizationType @relation(fields: [typeId], references: [id])
  parent      OrganizationUnit? @relation("OrgTree", fields: [parentId], references: [id], onDelete: Restrict)
  children     OrganizationUnit[] @relation("OrgTree")

  manager     User? @relation("UnitManager", fields: [managerUserId], references: [id], onDelete: SetNull)

  users       User[]
  employees   Employee[]
  managerAssignments ManagerAssignment[]

  goals       Goal[]
  objectives  Objective[]
  activities  Activity[]
  kpiPlans    KpiPlan[]
  projects    Project[]
  annualAllocations AnnualPlanAllocation[]
  budgets     Budget[]
  budgetRequests BudgetRequest[]
  financeEntries FinanceEntry[]
  procurements Procurement[]
  risks       Risk[]
  complianceRequirements ComplianceRequirement[]
  monitoringVisits MonitoringVisit[]
  correctiveActions CorrectiveAction[]
  managementActions ManagementAction[]
  audits      Audit[]
  trainings   Training[]
  researchStudies ResearchStudy[]
  employeeEvaluations EmployeeEvaluation[]
  tourismRecords TourismRecord[]
  assets      Asset[]
  properties  Property[]
}

model Role {
  id          Int      @id @default(autoincrement())
  code        String   @unique
  name        String
  description String?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users       User[]
  permissions RolePermission[]
}

model Permission {
  id          Int      @id @default(autoincrement())
  module      String
  action      String
  description String?
  active      Boolean  @default(true)

  roles RolePermission[]

  @@unique([module, action])
}

model RolePermission {
  roleId       Int
  permissionId Int

  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
}

model User {
  id              Int        @id @default(autoincrement())
  username        String     @unique
  passwordHash    String
  fullName        String
  email           String?    @unique
  phone           String?
  roleId          Int
  primaryOrgUnitId Int?
  employeeId      Int?
  status          UserStatus @default(ACTIVE)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  role            Role       @relation(fields: [roleId], references: [id], onDelete: Restrict)
  primaryOrgUnit  OrganizationUnit? @relation(fields: [primaryOrgUnitId], references: [id], onDelete: SetNull)
  employee        Employee?  @relation("UserEmployee", fields: [employeeId], references: [id], onDelete: SetNull)

  managedUnits    OrganizationUnit[] @relation("UnitManager")
  moduleAccess    UserModuleAccess[]
  managerAssignments ManagerAssignment[]

  approvalsRequested Approval[] @relation("ApprovalRequester")
  approvalsDecided  Approval[] @relation("ApprovalDecider")

  enteredFinance   FinanceEntry[]
  requestedBudget  BudgetRequest[]
  submittedProcurements Procurement[]
  submittedKpiActuals KpiActual[] @relation("KpiActualSubmitter")
  verifiedKpiActuals  KpiActual[] @relation("KpiActualVerifier")
  evaluators         EmployeeEvaluation[]
  systemEvaluations  Evaluation[] @relation("EvaluationEvaluator")
  auditLogs          AuditLog[]
  attachments        Attachment[]
  settingsUpdated    Setting[]
  createdActions     ManagementAction[]
  annualRevisionCreator AnnualPlanRevision[]
  reportSubmitter    Report[] @relation("ReportSubmitter")
  reportApprover     Report[] @relation("ReportApprover")
}

model UserModuleAccess {
  userId Int
  module String
  active Boolean @default(true)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, module])
}

model ManagerAssignment {
  id        Int      @id @default(autoincrement())
  userId    Int
  orgUnitId Int
  authority String
  active    Boolean @default(true)
  startDate DateTime?
  endDate   DateTime?
  createdAt DateTime @default(now())

  user    User @relation(fields: [userId], references: [id], onDelete: Cascade)
  orgUnit OrganizationUnit @relation(fields: [orgUnitId], references: [id], onDelete: Cascade)

  @@unique([userId, orgUnitId, authority])
}

model Employee {
  id           Int      @id @default(autoincrement())
  employeeNo   String   @unique
  fullName     String
  jobTitle     String?
  orgUnitId    Int?
  email        String?
  phone        String?
  photoFileId  Int?
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  orgUnit      OrganizationUnit? @relation(fields: [orgUnitId], references: [id], onDelete: SetNull)
  user         User? @relation("UserEmployee")
  photo        Attachment? @relation("EmployeePhoto", fields: [photoFileId], references: [id], onDelete: SetNull)

  activities   Activity[]
  ownedKpiPlans KpiPlan[]
  managedProjects Project[]
  legalMatters LegalMatter[] @relation("LegalResponsibleEmployee")
  employeeEvaluations EmployeeEvaluation[]
  hrActions    HrAction[]
  trainingParticipants TrainingParticipant[]
}

model StrategicPlan {
  id           Int      @id @default(autoincrement())
  name         String
  description  String?
  startYear    Int
  endYear      Int
  status       String
  approvalStatus String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  themes StrategicTheme[]
}

model StrategicTheme {
  id          Int      @id @default(autoincrement())
  planId      Int
  code        String
  name        String
  description String?
  active      Boolean  @default(true)

  plan    StrategicPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  results StrategicResult[]
}

model StrategicResult {
  id          Int      @id @default(autoincrement())
  themeId     Int
  code        String
  name        String
  description String?

  theme StrategicTheme @relation(fields: [themeId], references: [id], onDelete: Cascade)
  goals Goal[]
}

model Goal {
  id             Int      @id @default(autoincrement())
  yearId         Int
  resultId       Int?
  orgUnitId      Int?
  code           String
  name           String
  description    String?
  weight         Decimal? @db.Decimal(8,2)
  approvalStatus String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  year   PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  result StrategicResult? @relation(fields: [resultId], references: [id], onDelete: SetNull)
  orgUnit OrganizationUnit? @relation(fields: [orgUnitId], references: [id], onDelete: SetNull)

  objectives Objective[]
}

model Objective {
  id             Int      @id @default(autoincrement())
  yearId         Int
  goalId         Int
  orgUnitId      Int?
  code           String
  name           String
  description    String?
  targetValue    Decimal? @db.Decimal(18,4)
  unit           String?
  baselineValue  Decimal? @db.Decimal(18,4)
  direction      String?
  weight         Decimal? @db.Decimal(8,2)
  approvalStatus String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  goal Goal @relation(fields: [goalId], references: [id], onDelete: Cascade)
  orgUnit OrganizationUnit? @relation(fields: [orgUnitId], references: [id], onDelete: SetNull)

  kpiPlans KpiPlan[]
  activities Activity[]
}

model Kpi {
  id          Int      @id @default(autoincrement())
  code        String   @unique
  name        String
  area        String?
  definition  String?
  formula     String?
  unit        String?
  frequency   String?
  direction   String?
  categoryId  Int?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  category KpiCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  plans    KpiPlan[]
}

model KpiCategory {
  id          Int      @id @default(autoincrement())
  code        String   @unique
  name        String
  description String?
  active      Boolean  @default(true)
  sortOrder   Int      @default(0)

  kpis Kpi[]
}

model KpiPlan {
  id              Int      @id @default(autoincrement())
  yearId          Int
  kpiId           Int
  objectiveId     Int?
  orgUnitId       Int?
  ownerEmployeeId Int?
  baselineValue   Decimal? @db.Decimal(18,4)
  annualTarget    Decimal? @db.Decimal(18,4)
  q1Target        Decimal? @db.Decimal(18,4)
  q2Target        Decimal? @db.Decimal(18,4)
  q3Target        Decimal? @db.Decimal(18,4)
  q4Target        Decimal? @db.Decimal(18,4)
  weight          Decimal? @db.Decimal(8,2)
  approvalStatus  String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  kpi Kpi @relation(fields: [kpiId], references: [id], onDelete: Cascade)
  objective Objective? @relation(fields: [objectiveId], references: [id], onDelete: SetNull)
  orgUnit OrganizationUnit? @relation(fields: [orgUnitId], references: [id], onDelete: SetNull)
  ownerEmployee Employee? @relation(fields: [ownerEmployeeId], references: [id], onDelete: SetNull)

  actuals KpiActual[]
}

model KpiActual {
  id           Int      @id @default(autoincrement())
  kpiPlanId    Int
  periodType   String
  periodKey    String
  actualValue  Decimal  @db.Decimal(18,4)
  comment      String?
  evidence     String?
  submittedBy  Int?
  verifiedBy   Int?
  approvalStatus String
  submittedAt  DateTime?
  verifiedAt   DateTime?

  plan      KpiPlan @relation(fields: [kpiPlanId], references: [id], onDelete: Cascade)
  submitter User? @relation("KpiActualSubmitter", fields: [submittedBy], references: [id], onDelete: SetNull)
  verifier  User? @relation("KpiActualVerifier", fields: [verifiedBy], references: [id], onDelete: SetNull)

  @@unique([kpiPlanId, periodType, periodKey])
}

model Activity {
  id                Int      @id @default(autoincrement())
  yearId            Int
  objectiveId       Int?
  projectId         Int?
  orgUnitId         Int?
  branchOrgUnitId   Int?
  employeeId        Int?
  code              String?
  title             String
  description       String?
  quarter           String?
  startDate         DateTime?
  dueDate           DateTime?
  progress          Decimal  @default(0) @db.Decimal(8,2)
  implementationStatus String
  approvalStatus    String
  budget            Decimal? @db.Decimal(18,2)
  weight            Decimal? @db.Decimal(8,2)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  objective Objective? @relation(fields: [objectiveId], references: [id], onDelete: SetNull)
  project Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)
  orgUnit OrganizationUnit? @relation("ActivityOrg", fields: [orgUnitId], references: [id], onDelete: SetNull)
  branchOrgUnit OrganizationUnit? @relation("ActivityBranch", fields: [branchOrgUnitId], references: [id], onDelete: SetNull)
  employee Employee? @relation(fields: [employeeId], references: [id], onDelete: SetNull)

  updates TaskUpdate[]
  budgetRequests BudgetRequest[]
}

model TaskUpdate {
  id           Int      @id @default(autoincrement())
  activityId   Int
  updateDate   DateTime
  progress     Decimal  @db.Decimal(8,2)
  note         String?
  submittedBy  Int?
  evidence     String?

  activity Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  submitter User? @relation(fields: [submittedBy], references: [id], onDelete: SetNull)
}

model Project {
  id               Int      @id @default(autoincrement())
  yearId           Int
  code             String?
  name             String
  location         String?
  description      String?
  orgUnitId        Int?
  managerEmployeeId Int?
  imageFileId      Int?
  plannedBudget    Decimal? @db.Decimal(18,2)
  actualSpend      Decimal? @db.Decimal(18,2)
  physicalProgress Decimal? @db.Decimal(8,2)
  financialProgress Decimal? @db.Decimal(8,2)
  startDate        DateTime?
  endDate          DateTime?
  status            String
  approvalStatus    String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  orgUnit OrganizationUnit? @relation(fields: [orgUnitId], references: [id], onDelete: SetNull)
  manager Employee? @relation(fields: [managerEmployeeId], references: [id], onDelete: SetNull)
  image Attachment? @relation("ProjectImage", fields: [imageFileId], references: [id], onDelete: SetNull)

  activities Activity[]
  milestones ProjectMilestone[]
  evaluations Evaluation[] 
}

model ProjectMilestone {
  id          Int      @id @default(autoincrement())
  projectId   Int
  name        String
  plannedDate DateTime?
  actualDate  DateTime?
  progress    Decimal  @default(0) @db.Decimal(8,2)
  status      String

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model AnnualPlanAllocation {
  id              Int      @id @default(autoincrement())
  yearId          Int
  orgUnitId       Int?
  name            String
  allocationAmount Decimal @db.Decimal(18,2)
  notes           String?
  approvalStatus  String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  orgUnit OrganizationUnit? @relation(fields: [orgUnitId], references: [id], onDelete: SetNull)
  budgets Budget[]
  revisions AnnualPlanRevision[]
}

model AnnualPlanRevision {
  id          Int      @id @default(autoincrement())
  yearId      Int
  allocationId Int?
  versionNo   Int
  reason      String
  createdBy   Int?
  createdAt   DateTime @default(now())
  status      String

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  allocation AnnualPlanAllocation? @relation(fields: [allocationId], references: [id], onDelete: SetNull)
  creator User? @relation(fields: [createdBy], references: [id], onDelete: SetNull)

  @@unique([yearId, versionNo])
}

model Budget {
  id              Int      @id @default(autoincrement())
  yearId          Int
  planAllocationId Int?
  orgUnitId       Int?
  category        String?
  plannedAmount   Decimal  @db.Decimal(18,2)
  revisedAmount   Decimal  @db.Decimal(18,2)
  approvalStatus  String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  allocation AnnualPlanAllocation? @relation(fields: [planAllocationId], references: [id], onDelete: SetNull)
  orgUnit OrganizationUnit? @relation(fields: [orgUnitId], references: [id], onDelete: SetNull)

  lines BudgetLine[]
  requests BudgetRequest[]
}

model BudgetLine {
  id            Int      @id @default(autoincrement())
  budgetId       Int
  lineName      String
  plannedAmount Decimal  @db.Decimal(18,2)
  revisedAmount Decimal  @db.Decimal(18,2)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  budget Budget @relation(fields: [budgetId], references: [id], onDelete: Cascade)
}

model BudgetRequest {
  id             Int      @id @default(autoincrement())
  yearId         Int
  budgetId       Int?
  orgUnitId      Int?
  activityId     Int?
  requestDate    DateTime
  purpose        String
  requestedAmount Decimal @db.Decimal(18,2)
  approvedAmount Decimal? @db.Decimal(18,2)
  status         String
  approvalStatus String
  requestedBy    Int?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  budget Budget? @relation(fields: [budgetId], references: [id], onDelete: SetNull)
  orgUnit OrganizationUnit? @relation(fields: [orgUnitId], references: [id], onDelete: SetNull)
  activity Activity? @relation(fields: [activityId], references: [id], onDelete: SetNull)
  requester User? @relation(fields: [requestedBy], references: [id], onDelete: SetNull)
}

model FinanceCategory {
  id          Int      @id @default(autoincrement())
  code        String   @unique
  name        String
  entryType   String
  parentId    Int?
  description String?
  active      Boolean  @default(true)
  sortOrder   Int      @default(0)

  parent FinanceCategory? @relation("FinanceCategoryTree", fields: [parentId], references: [id], onDelete: SetNull)
  children FinanceCategory[] @relation("FinanceCategoryTree")
  entries FinanceEntry[]
}

model FinanceEntry {
  id            Int      @id @default(autoincrement())
  yearId        Int
  entryDate     DateTime
  categoryId    Int
  entryType     String
  amount        Decimal  @db.Decimal(18,2)
  currency      String
  description   String?
  referenceNo   String?
  orgUnitId     Int?
  budgetId      Int?
  budgetLineId  Int?
  approvalStatus String
  enteredBy     Int?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  category FinanceCategory @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  orgUnit OrganizationUnit? @relation(fields: [orgUnitId], references: [id], onDelete: SetNull)
  entered User? @relation(fields: [enteredBy], references: [id], onDelete: SetNull)
  budget Budget? @relation(fields: [budgetId], references: [id], onDelete: SetNull)
  attachments AttachmentLink[]
}

model RiskCategory {
  id Int @id @default(autoincrement())
  code String @unique
  name String
  description String?
  active Boolean @default(true)

  risks Risk[]
}

model Risk {
  id              Int      @id @default(autoincrement())
  yearId          Int
  categoryId      Int?
  title           String
  description     String?
  probability     Int
  impact          Int
  level           String
  ownerOrgUnitId  Int?
  mitigation      String?
  contingency     String?
  action          String?
  dueDate         DateTime?
  status          String
  residualScore   Int?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  category RiskCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  ownerOrgUnit OrganizationUnit? @relation(fields: [ownerOrgUnitId], references: [id], onDelete: SetNull)
  reviews RiskReview[]
}

model RiskReview {
  id            Int      @id @default(autoincrement())
  riskId         Int
  reviewDate    DateTime
  residualScore Int?
  note          String?
  reviewedBy    Int?

  risk Risk @relation(fields: [riskId], references: [id], onDelete: Cascade)
  reviewer User? @relation(fields: [reviewedBy], references: [id], onDelete: SetNull)
}

model ComplianceCategory {
  id Int @id @default(autoincrement())
  code String @unique
  name String
  description String?
  active Boolean @default(true)

  requirements ComplianceRequirement[]
}

model ComplianceRequirement {
  id             Int      @id @default(autoincrement())
  yearId         Int
  categoryId     Int?
  groupName      String?
  item           String
  unit           String?
  annualTarget   Decimal? @db.Decimal(18,4)
  ownerOrgUnitId Int?
  dueDate        DateTime?
  requiredEvidence String?
  status         String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  category ComplianceCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  ownerOrgUnit OrganizationUnit? @relation(fields: [ownerOrgUnitId], references: [id], onDelete: SetNull)
  records ComplianceRecord[]
}

model ComplianceRecord {
  id            Int      @id @default(autoincrement())
  requirementId Int
  periodKey     String
  actualValue   Decimal? @db.Decimal(18,4)
  evidence      String?
  verifiedBy    Int?
  approvalStatus String
  verifiedAt    DateTime?

  requirement ComplianceRequirement @relation(fields: [requirementId], references: [id], onDelete: Cascade)
  verifier User? @relation(fields: [verifiedBy], references: [id], onDelete: SetNull)
}

model MonitoringVisit {
  id             Int      @id @default(autoincrement())
  yearId         Int
  orgUnitId      Int?
  visitDate      DateTime
  team           String?
  objective      String?
  summary        String?
  findings       String?
  recommendations String?
  status         String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  orgUnit OrganizationUnit? @relation(fields: [orgUnitId], references: [id], onDelete: SetNull)
}

model EvaluationCriteria {
  id          Int      @id @default(autoincrement())
  code        String   @unique
  name        String
  description String?
  category    String?
  weight      Decimal  @db.Decimal(8,2)
  active      Boolean  @default(true)
  sortOrder   Int      @default(0)

  scores EvaluationCriterionScore[]
}

model EvaluationCriterionScore {
  id           Int      @id @default(autoincrement())
  evaluationId Int
  criterionId  Int
  score        Decimal  @db.Decimal(8,2)
  comment      String?

  evaluation EmployeeEvaluation @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  criterion EvaluationCriteria @relation(fields: [criterionId], references: [id], onDelete: Restrict)

  @@unique([evaluationId, criterionId])
}

model EmployeeEvaluation {
  id                Int      @id @default(autoincrement())
  yearId            Int
  employeeId        Int
  orgUnitId         Int?
  evaluatorId       Int?
  periodKey         String?
  planScore         Decimal? @db.Decimal(8,2)
  executionScore    Decimal? @db.Decimal(8,2)
  overallScore      Decimal? @db.Decimal(8,2)
  planNotes         String?
  executionNotes    String?
  strengths         String?
  areasForImprovement String?
  targetsNextPeriod String?
  status            String
  approvalStatus    String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  orgUnit OrganizationUnit? @relation(fields: [orgUnitId], references: [id], onDelete: SetNull)
  evaluator User? @relation(fields: [evaluatorId], references: [id], onDelete: SetNull)

  criteriaScores EvaluationCriterionScore[]
}

model PeriodDefinition {
  id         Int      @id @default(autoincrement())
  yearId      Int?
  periodType String
  periodKey  String
  startDate  DateTime
  endDate    DateTime
  label      String
  active     Boolean  @default(true)

  year PlanningYear? @relation(fields: [yearId], references: [id], onDelete: Cascade)

  @@unique([yearId, periodType, periodKey])
}

model Evaluation {
  id             Int      @id @default(autoincrement())
  yearId         Int
  scopeType      String
  scopeId        Int?
  relevance      Decimal? @db.Decimal(8,2)
  effectiveness  Decimal? @db.Decimal(8,2)
  efficiency     Decimal? @db.Decimal(8,2)
  impact         Decimal? @db.Decimal(8,2)
  sustainability Decimal? @db.Decimal(8,2)
  overallScore   Decimal? @db.Decimal(8,2)
  lessons        String?
  recommendations String?
  evaluatorId    Int?
  status         String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  evaluator User? @relation("EvaluationEvaluator", fields: [evaluatorId], references: [id], onDelete: SetNull)
}

model CorrectiveAction {
  id            Int      @id @default(autoincrement())
  yearId         Int
  sourceType    String
  sourceId      Int
  title         String
  description   String?
  ownerOrgUnitId Int?
  dueDate       DateTime?
  priority      String
  status        String
  completion    Decimal  @default(0) @db.Decimal(8,2)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  ownerOrgUnit OrganizationUnit? @relation(fields: [ownerOrgUnitId], references: [id], onDelete: SetNull)
}

model ManagementAction {
  id            Int      @id @default(autoincrement())
  yearId         Int
  title         String
  description   String?
  ownerOrgUnitId Int?
  dueDate       DateTime?
  priority      String
  status        String
  completion    Decimal  @default(0) @db.Decimal(8,2)
  createdBy     Int?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  ownerOrgUnit OrganizationUnit? @relation(fields: [ownerOrgUnitId], references: [id], onDelete: SetNull)
  creator User? @relation(fields: [createdBy], references: [id], onDelete: SetNull)
}

model Audit {
  id          Int      @id @default(autoincrement())
  yearId       Int
  auditType   String
  title       String
  orgUnitId   Int?
  plannedDate DateTime?
  actualDate  DateTime?
  status      String

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  orgUnit OrganizationUnit? @relation(fields: [orgUnitId], references: [id], onDelete: SetNull)
  findings AuditFinding[]
}

model AuditFinding {
  id                  Int      @id @default(autoincrement())
  auditId              Int
  finding              String
  severity             String
  recommendation      String?
  responsibleOrgUnitId Int?
  dueDate             DateTime?
  status               String

  audit Audit @relation(fields: [auditId], references: [id], onDelete: Cascade)
  responsibleOrgUnit OrganizationUnit? @relation(fields: [responsibleOrgUnitId], references: [id], onDelete: SetNull)
}

model Procurement {
  id              Int      @id @default(autoincrement())
  yearId          Int
  orgUnitId       Int?
  requestNo       String?
  item            String
  category        String?
  estimatedAmount Decimal? @db.Decimal(18,2)
  approvedAmount  Decimal? @db.Decimal(18,2)
  supplier        String?
  requestDate     DateTime?
  dueDate         DateTime?
  status          String
  approvalStatus  String
  requestedBy     Int?

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  orgUnit OrganizationUnit? @relation(fields: [orgUnitId], references: [id], onDelete: SetNull)
  requester User? @relation(fields: [requestedBy], references: [id], onDelete: SetNull)
}

model HrAction {
  id          Int      @id @default(autoincrement())
  yearId       Int
  actionType  String
  title       String
  employeeId  Int?
  orgUnitId   Int?
  targetValue Decimal? @db.Decimal(18,4)
  actualValue Decimal? @db.Decimal(18,4)
  status      String
  notes       String?

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  employee Employee? @relation(fields: [employeeId], references: [id], onDelete: SetNull)
  orgUnit OrganizationUnit? @relation(fields: [orgUnitId], references: [id], onDelete: SetNull)
}

model Training {
  id                 Int      @id @default(autoincrement())
  yearId              Int
  title              String
  provider            String?
  plannedDate         DateTime?
  participantsTarget  Int?
  participantsActual  Int?
  budget              Decimal? @db.Decimal(18,2)
  status              String
  orgUnitId           Int?

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  orgUnit OrganizationUnit? @relation(fields: [orgUnitId], references: [id], onDelete: SetNull)
  participants TrainingParticipant[]
}

model TrainingParticipant {
  id Int @id @default(autoincrement())
  trainingId Int
  employeeId Int
  status String?

  training Training @relation(fields: [trainingId], references: [id], onDelete: Cascade)
  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@unique([trainingId, employeeId])
}

model AssetCategory {
  id Int @id @default(autoincrement())
  code String @unique
  name String
  description String?
  active Boolean @default(true)

  assets Asset[]
}

model Asset {
  id                  Int      @id @default(autoincrement())
  assetNo             String   @unique
  assetName           String
  categoryId          Int?
  acquisitionDate     DateTime?
  acquisitionCost     Decimal? @db.Decimal(18,2)
  status              String
  orgUnitId           Int?
  custodianEmployeeId Int?
  location            String?
  imageFileId         Int?

  category AssetCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  orgUnit OrganizationUnit? @relation(fields: [orgUnitId], references: [id], onDelete: SetNull)
  custodian Employee? @relation(fields: [custodianEmployeeId], references: [id], onDelete: SetNull)
  image Attachment? @relation("AssetImage", fields: [imageFileId], references: [id], onDelete: SetNull)
}

model PropertyType {
  id Int @id @default(autoincrement())
  code String @unique
  name String
  active Boolean @default(true)

  properties Property[]
}

model Property {
  id               Int      @id @default(autoincrement())
  propertyNo       String   @unique
  name             String
  propertyTypeId   Int?
  location         String?
  area             Decimal? @db.Decimal(18,2)
  ownershipStatus  String?
  utilizationStatus String?
  annualIncome     Decimal? @db.Decimal(18,2)
  notes            String?
  orgUnitId        Int?
  imageFileId      Int?

  propertyType PropertyType? @relation(fields: [propertyTypeId], references: [id], onDelete: SetNull)
  orgUnit OrganizationUnit? @relation(fields: [orgUnitId], references: [id], onDelete: SetNull)
  image Attachment? @relation("PropertyImage", fields: [imageFileId], references: [id], onDelete: SetNull)
}

model TourismCategory {
  id Int @id @default(autoincrement())
  code String @unique
  name String
  description String?
  active Boolean @default(true)
}

model TourismRecord {
  id                   Int      @id @default(autoincrement())
  yearId                Int
  categoryId            Int?
  branchOrgUnitId       Int?
  recordDate            DateTime
  domesticVisitors      Int?
  internationalVisitors Int?
  roomNightsAvailable   Int?
  roomNightsOccupied    Int?
  revenue               Decimal? @db.Decimal(18,2)
  satisfaction          Decimal? @db.Decimal(8,2)
  stayHours             Decimal? @db.Decimal(10,2)
  notes                 String?
  imageFileId           Int?

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  branch OrganizationUnit? @relation(fields: [branchOrgUnitId], references: [id], onDelete: SetNull)
  image Attachment? @relation("TourismImage", fields: [imageFileId], references: [id], onDelete: SetNull)
}

model LegalMatter {
  id                    Int      @id @default(autoincrement())
  yearId                 Int
  matterType            String
  title                 String
  counterparty          String?
  value                 Decimal? @db.Decimal(18,2)
  responsibleEmployeeId Int?
  status                String
  nextAction            String?
  dueDate               DateTime?

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  responsibleEmployee Employee? @relation("LegalResponsibleEmployee", fields: [responsibleEmployeeId], references: [id], onDelete: SetNull)
}

model ResearchCategory {
  id Int @id @default(autoincrement())
  code String @unique
  name String
  description String?
  active Boolean @default(true)
}

model ResearchStudy {
  id                   Int      @id @default(autoincrement())
  yearId                Int
  categoryId           Int?
  title                String
  objective            String?
  responsibleOrgUnitId Int?
  budget               Decimal? @db.Decimal(18,2)
  status               String
  findings             String?
  recommendations      String?

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  orgUnit OrganizationUnit? @relation(fields: [responsibleOrgUnitId], references: [id], onDelete: SetNull)
}

model StakeholderCategory {
  id Int @id @default(autoincrement())
  code String @unique
  name String
  description String?
  active Boolean @default(true)
}

model Stakeholder {
  id               Int      @id @default(autoincrement())
  categoryId       Int?
  name             String
  influence        String?
  interest         String?
  contact          String?
  relationshipStatus String?
  notes            String?

  category StakeholderCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
}

model Report {
  id          Int      @id @default(autoincrement())
  yearId       Int
  reportType  String
  periodKey   String?
  title       String
  summary     String?
  status      String
  submittedBy Int?
  approvedBy  Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  year PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  submitter User? @relation("ReportSubmitter", fields: [submittedBy], references: [id], onDelete: SetNull)
  approver User? @relation("ReportApprover", fields: [approvedBy], references: [id], onDelete: SetNull)
}

model Approval {
  id          Int            @id @default(autoincrement())
  yearId      Int?
  entityType  String
  entityId    Int
  stepNo      Int
  stepName    String
  requiredRole String?
  state       ApprovalState @default(PENDING)
  requestedBy Int
  decidedBy   Int?
  decision    ApprovalDecision?
  comment     String?
  requestedAt DateTime       @default(now())
  decidedAt   DateTime?

  year PlanningYear? @relation(fields: [yearId], references: [id], onDelete: SetNull)
  requester User @relation("ApprovalRequester", fields: [requestedBy], references: [id], onDelete: Restrict)
  decider User? @relation("ApprovalDecider", fields: [decidedBy], references: [id], onDelete: SetNull)

  @@index([entityType, entityId])
  @@index([state, requiredRole])
}

model Attachment {
  id            Int            @id @default(autoincrement())
  kind          AttachmentKind
  filename      String
  originalName  String
  mimeType      String
  sizeBytes     BigInt
  storageKey    String         @unique
  note          String?
  uploadedById  Int
  createdAt     DateTime       @default(now())

  uploadedBy User @relation(fields: [uploadedById], references: [id], onDelete: Restrict)

  employeePhoto Employee? @relation("EmployeePhoto")
  projectImage Project? @relation("ProjectImage")
  assetImage Asset? @relation("AssetImage")
  propertyImage Property? @relation("PropertyImage")
  tourismImage TourismRecord? @relation("TourismImage")

  links AttachmentLink[]
}

model AttachmentLink {
  id           Int @id @default(autoincrement())
  attachmentId Int
  entityType   String
  entityId     Int
  purpose      String?

  attachment Attachment @relation(fields: [attachmentId], references: [id], onDelete: Cascade)

  @@index([entityType, entityId])
}

model Setting {
  id          Int      @id @default(autoincrement())
  category    String
  key         String   @unique
  value       String
  valueType   String
  label       String
  description String?
  active      Boolean  @default(true)
  updatedById Int?
  updatedAt   DateTime @updatedAt

  updatedBy User? @relation(fields: [updatedById], references: [id], onDelete: SetNull)
}

model AuditLog {
  id         BigInt   @id @default(autoincrement())
  userId     Int?
  action     String
  entityType String?
  entityId   Int?
  beforeJson Json?
  afterJson  Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([entityType, entityId])
  @@index([userId, createdAt])
}
```

### Important schema notes

1. Do not represent configurable business statuses/categories exclusively as Prisma enums.
2. Use master-data tables for values administrators are allowed to change.
3. Keep approval/audit history strongly controlled.
4. Add indexes for organization, year, dates, status, foreign keys, and common report filters.
5. Add explicit employee plans/work assignments in the next schema revision rather than deriving performance only from `Activity.employeeId`.

---

# 12. Missing model that should be added for employee planning

The current database does not sufficiently model an explicit employee plan.

Add:

```prisma
model EmployeePlan {
  id          Int      @id @default(autoincrement())
  yearId      Int
  employeeId  Int
  orgUnitId   Int?
  title       String
  description String?
  status      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  year     PlanningYear @relation(fields: [yearId], references: [id], onDelete: Cascade)
  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  orgUnit  OrganizationUnit? @relation(fields: [orgUnitId], references: [id], onDelete: SetNull)

  items EmployeePlanItem[]
}

model EmployeePlanItem {
  id          Int      @id @default(autoincrement())
  planId      Int
  activityId  Int?
  kpiPlanId   Int?
  objective   String
  targetValue Decimal? @db.Decimal(18,4)
  unit        String?
  weight      Decimal? @db.Decimal(8,2)
  dueDate     DateTime?
  status      String

  plan     EmployeePlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  activity Activity? @relation(fields: [activityId], references: [id], onDelete: SetNull)
  kpiPlan  KpiPlan? @relation(fields: [kpiPlanId], references: [id], onDelete: SetNull)

  @@index([planId])
}
```

This is critical for the requirement:

```text
Employee
→ Plan
→ Target
→ Execution
→ Evaluation
```

---

# 13. Master-data architecture

Create one generic master-data pattern.

Recommended:

```text
MasterDataGroup
    └── MasterDataItem
```

But use dedicated tables when relationships matter.

For example:

Dedicated:
- FinanceCategory
- KpiCategory
- EvaluationCriteria
- OrganizationType

Generic:
- simple statuses
- labels
- configurable report types
- other small code lists

Do not over-generalize everything into one "settings" table.

---

# 14. Backend folder architecture

```text
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── filters/
│   │   ├── pipes/
│   │   ├── dto/
│   │   ├── errors/
│   │   ├── pagination/
│   │   ├── filtering/
│   │   └── authorization/
│   │
│   ├── auth/
│   ├── users/
│   ├── roles/
│   ├── organization/
│   ├── master-data/
│   ├── planning/
│   ├── kpi/
│   ├── budget/
│   ├── finance/
│   ├── projects/
│   ├── employees/
│   ├── evaluation/
│   ├── monitoring/
│   ├── procurement/
│   ├── hr/
│   ├── training/
│   ├── tourism/
│   ├── risk/
│   ├── compliance/
│   ├── audit/
│   ├── assets/
│   ├── property/
│   ├── legal/
│   ├── research/
│   ├── stakeholders/
│   ├── reports/
│   ├── dashboard/
│   └── attachments/
│
└── test/
```

---

# 15. Frontend architecture

```text
apps/web/
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   └── login/
    │   ├── (workspace)/
    │   │   ├── dashboard/
    │   │   ├── strategy/
    │   │   ├── planning/
    │   │   ├── kpi/
    │   │   ├── budget/
    │   │   ├── finance/
    │   │   ├── projects/
    │   │   ├── employees/
    │   │   ├── evaluation/
    │   │   ├── tourism/
    │   │   ├── risk/
    │   │   ├── compliance/
    │   │   ├── procurement/
    │   │   ├── hr/
    │   │   ├── assets/
    │   │   ├── property/
    │   │   ├── legal/
    │   │   ├── research/
    │   │   ├── reports/
    │   │   ├── approvals/
    │   │   ├── organization/
    │   │   └── admin/
    │   └── api/
    │
    ├── components/
    │   ├── ui/
    │   ├── layout/
    │   ├── data-table/
    │   ├── forms/
    │   ├── filters/
    │   ├── cards/
    │   ├── dialogs/
    │   ├── charts/
    │   ├── organization-tree/
    │   └── attachments/
    │
    ├── features/
    │   ├── organization/
    │   ├── planning/
    │   ├── finance/
    │   ├── budget/
    │   ├── kpi/
    │   ├── employees/
    │   └── ...
    │
    ├── hooks/
    ├── lib/
    ├── services/
    ├── types/
    ├── schemas/
    └── config/
```

---

# 16. Standard feature pattern

Every major feature should use:

```text
feature/
├── api.ts
├── types.ts
├── schemas.ts
├── hooks.ts
├── permissions.ts
├── components/
│   ├── list.tsx
│   ├── detail.tsx
│   ├── form.tsx
│   └── filters.tsx
└── pages/
```

This makes CRUD consistent.

---

# 17. CRUD pattern

Example Finance:

```text
useFinanceEntries()
useFinanceEntry(id)
useCreateFinanceEntry()
useUpdateFinanceEntry()
useArchiveFinanceEntry()
```

After mutation:

```ts
queryClient.invalidateQueries({
  queryKey: ["finance", filters]
});

queryClient.invalidateQueries({
  queryKey: ["dashboard", filters]
});
```

This prevents the stale UI problems seen in the current application.

---

# 18. Global filter architecture

Create a shared filter object:

```ts
export type GlobalFilters = {
  yearId?: number;
  divisionId?: number;
  sectorId?: number;
  directorateId?: number;
  departmentId?: number;
  branchId?: number;
  quarter?: string;
  month?: number;
  week?: number;
  fromDate?: string;
  toDate?: string;
  status?: string;
  categoryId?: number;
  employeeId?: number;
  projectId?: number;
  kpiId?: number;
};
```

The frontend stores it centrally.

The backend receives it through validated query DTOs.

---

# 19. Backend filter pattern

Use:

```text
GlobalFilterDto
+
OrganizationScopeService
+
FeatureQueryService
```

Example:

```ts
async findFinance(filters: GlobalFilterDto, user: AuthUser) {
  const allowedOrgIds =
    await this.organizationScope.getAllowedOrganizationIds(user);

  return this.prisma.financeEntry.findMany({
    where: {
      yearId: filters.yearId,
      orgUnitId: {
        in: allowedOrgIds,
      },
      entryDate: {
        gte: filters.fromDate,
        lte: filters.toDate,
      },
      entryType: filters.entryType,
      categoryId: filters.categoryId,
    },
  });
}
```

Important:

> **Authorization scope must be applied before business filters.**

A filter must never expand a user's access.

---

# 20. Organization backbone service

Create one service:

```text
OrganizationScopeService
```

Responsibilities:

- resolve ancestors
- resolve descendants
- resolve user's primary unit
- resolve manager assignments
- calculate effective scope
- validate organization relationships
- validate parent/child changes
- enforce scope on reads
- enforce scope on writes

Every module should use this service.

Do not implement organization filtering separately in every module.

---

# 21. Permission model

Use four separate checks:

```text
Role
Module Permission
Organization Scope
Approval Authority
```

Example request:

```text
Can user edit transaction?
```

Answer:

```text
Authenticated?
        ↓
Role permits finance:update?
        ↓
Finance module enabled?
        ↓
Transaction organization inside user scope?
        ↓
Record state allows edit?
        ↓
Business validation passes?
        ↓
UPDATE
```

---

# 22. Admin authority

Super Admin can manage:

- users
- roles
- permissions
- organization
- managers
- master data
- years
- workflows
- system settings
- attachments
- audit visibility

Business managers manage business data inside their scope.

---

# 23. Data editability principle

Your requirement says:

> All data needs to be editable.

Implement this as:

### Business/master records
Fully editable through UI.

### Historical controlled records
Editable through authorized revision/correction workflow.

### Audit/security records
Append-only.

This is safer than allowing arbitrary mutation of audit history.

---

# 24. Attachment architecture

Do NOT create seven independent upload systems.

Use:

```text
Attachment
    ↓
AttachmentLink
    ↓
Entity
```

For images:

```text
Organization
User
Employee
Project
Tourism
Asset
Property
```

For documents:

```text
Plan
KPI
Finance
Budget
Project
Risk
Compliance
Audit
Evaluation
Legal
Research
Procurement
```

Parent-level authorization must protect the attachment.

---

# 25. Authentication

Use secure HttpOnly cookie sessions.

Flow:

```text
POST /auth/login
     ↓
verify credentials
     ↓
regenerate session
     ↓
create secure session
     ↓
set HttpOnly cookie
     ↓
/auth/me
```

Do not put access tokens into localStorage.

Use CSRF protection appropriate to the cookie-based architecture.

---

# 26. API structure

Example:

```text
GET    /api/v1/finance/entries
POST   /api/v1/finance/entries
GET    /api/v1/finance/entries/:id
PATCH  /api/v1/finance/entries/:id
DELETE /api/v1/finance/entries/:id
POST   /api/v1/finance/entries/:id/archive
```

Similarly:

```text
/api/v1/organization
/api/v1/users
/api/v1/planning
/api/v1/kpi
/api/v1/budgets
/api/v1/projects
/api/v1/employees
/api/v1/evaluations
...
```

---

# 27. OpenAPI

Expose:

```text
/api/docs
```

with:

- request DTOs
- response DTOs
- authentication
- validation
- error responses
- pagination
- filtering

This gives developers a reliable contract.

---

# 28. Frontend page pattern

Each management page should use:

```text
Page Header
    ↓
Global Filters
    ↓
Summary Cards
    ↓
Data Table
    ↓
Row Actions
        ├── View
        ├── Edit
        └── Archive/Delete
    ↓
Pagination
```

Create/Edit uses the same validated form component where possible.

---

# 29. Table requirements

Use TanStack Table for:

- sorting
- filtering
- column visibility
- pagination
- row actions
- selection

For large datasets, filtering and pagination should be server-side.

---

# 30. Form requirements

Use React Hook Form + Zod.

Every form:

- schema validation
- field errors
- loading
- dirty state
- confirmation when leaving unsaved work
- optimistic behavior only where safe
- server errors mapped to fields
- successful invalidation/refetch

---

# 31. Dashboard

Dashboard must not become the database.

Use the same APIs as the reports/source modules.

Each card:

```text
Metric
→ source route
→ current global filters
→ relevant source filter
```

Example:

```text
Revenue
→ /finance
?yearId=...
&branchId=...
&fromDate=...
&toDate=...
&entryType=income
```

---

# 32. Employee evaluation design

The final data flow should be:

```text
Employee
   ↓
Employee Plan
   ↓
Plan Items
   ├── Objectives
   ├── KPIs
   └── Activities
          ↓
       Execution
          ↓
       Evidence
          ↓
     Evaluation Criteria
          ↓
      Weighted Score
          ↓
     Supervisor Review
          ↓
        Finalize
```

This is much stronger than calculating employee performance from a simple average of activities.

---

# 33. Planning-year strategy

Every year is independent.

Example:

```text
2026
2027
2028
2029
2030
2031
...
```

Definitions can remain reusable.

Year-specific plans contain the targets.

Cloning:

```text
Source Year
    ↓
Clone planning structure
    ↓
New Year
```

Reset:

- actuals
- approvals
- execution
- financial actuals
- evaluation results where applicable

---

# 34. Migration from SQLite

Do NOT manually copy SQLite files into PostgreSQL.

Use a migration pipeline.

## Step 1
Back up SQLite.

## Step 2
Inventory existing records.

## Step 3
Normalize organization IDs.

## Step 4
Normalize categories.

## Step 5
Normalize dates/numbers.

## Step 6
Import master data.

## Step 7
Import organization.

## Step 8
Import users/roles.

## Step 9
Import planning.

## Step 10
Import KPI.

## Step 11
Import budget/finance.

## Step 12
Import projects/execution.

## Step 13
Import employees/evaluations.

## Step 14
Import risk/compliance/audit.

## Step 15
Import attachments.

## Step 16
Reconcile counts and totals.

---

# 35. Migration validation

Before migration:

```text
SQLite counts
```

After migration:

```text
PostgreSQL counts
```

Compare.

For financial information:

```text
SQLite total income
=
PostgreSQL total income
```

Likewise:

- expense
- budget
- budget lines
- KPI targets
- KPI actuals
- employee records
- projects

---

# 36. Data from the existing IJA planning document

The planning information in the current system must become **actual editable database records**.

Do NOT embed those values in React.

Do NOT keep them only in seed scripts.

Import them into:

```text
Strategic Plan
Strategic Themes
Strategic Results
Goals
Objectives
KPIs
Annual Plans
Activities
Targets
Budget Allocations
```

Then users/admin can edit them through the application.

Historical source values should remain traceable with a source/reference field where needed.

---

# 37. Seed strategy

Use:

```text
prisma/seed.ts
```

only to create:

- default roles
- default permissions
- default master data
- initial admin
- demo organization
- optional demo records

The seed must be idempotent.

Do not require seed execution to use the system after installation.

---

# 38. Production project structure

```text
ija-wpms/
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   ├── ui/
│   ├── types/
│   ├── validation/
│   └── config/
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── security/
│   └── uat/
│
├── docs/
├── docker/
├── .env.example
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
```

---

# 39. Recommended implementation order

## Phase 0 — Foundation

- repository structure
- pnpm
- TypeScript
- linting
- formatting
- CI
- environment configuration

## Phase 1 — Database

- PostgreSQL
- Prisma
- complete schema
- migrations
- seed
- migration/import tooling

## Phase 2 — Security

- auth
- session
- RBAC
- module permissions
- organization scope
- approval authority
- audit

## Phase 3 — Organization/Admin

- organization types
- hierarchy
- users
- roles
- managers
- master data
- settings

## Phase 4 — CRUD framework

Build reusable:

- tables
- forms
- dialogs
- validation
- pagination
- filters
- permissions
- mutation handling

## Phase 5 — Core business

1. Strategy
2. Goals
3. Objectives
4. Plans
5. Activities
6. KPI
7. Budget
8. Finance

## Phase 6 — Employee performance

- employees
- employee plans
- execution
- evaluations
- criteria
- scoring

## Phase 7 — Other modules

- projects
- procurement
- HR
- training
- tourism
- risk
- compliance
- audit
- assets
- property
- legal
- research
- stakeholders

## Phase 8 — Attachments

- images
- documents
- evidence
- secure download

## Phase 9 — Dashboard/Reports

- metrics
- global filters
- source drilldowns
- exports

## Phase 10 — Testing

- unit
- integration
- security
- Playwright
- UAT

## Phase 11 — Deployment

- Docker
- reverse proxy
- HTTPS
- backup
- logging
- monitoring

---

# 40. Testing strategy

## Unit tests

Test:

- score calculations
- budget calculations
- filter parsing
- organization traversal
- authorization
- approval transitions

## Integration tests

Test:

- controller → service → database
- transaction integrity
- permission enforcement
- organization scope

## Playwright

Test actual browser behavior:

```text
Login
→ Admin
→ Create Division
→ Create Department
→ Create Branch
→ Create User
→ Create Employee
→ Create Plan
→ Create KPI
→ Create Budget
→ Create Transaction
→ Edit
→ Update
→ Filter
→ Dashboard
→ Drilldown
```

## Security tests

Test:

- IDOR
- role escalation
- cross-org access
- forged organization ID
- approval bypass
- CSRF
- attachment access
- export access

---

# 41. Definition of CRUD complete

A module is only CRUD-complete when:

```text
Create
✓ DB persisted

Read
✓ correct data returned

Edit
✓ existing record loads into form

Update
✓ database changed

Delete/Archive
✓ final state persisted

Refresh
✓ state remains correct

Authorization
✓ enforced server-side

Audit
✓ important action recorded
```

---

# 42. Definition of filter complete

A filter is only complete when:

```text
UI selection
→ validated query
→ server-side permission scope
→ database query
→ filtered response
→ correct UI
```

Not merely:

```text
UI dropdown
→ hide JavaScript rows
```

---

# 43. Definition of dashboard complete

A dashboard metric is only complete when:

```text
Metric
→ source query
→ source records
→ active global filters
→ authorization scope
```

and the card is drillable.

---

# 44. Effort estimate

Assuming one experienced full-stack developer:

| Phase | Estimated effort |
|---|---:|
| Foundation | 2–4 days |
| Database/Prisma | 5–8 days |
| Auth/security | 4–6 days |
| Organization/Admin | 5–8 days |
| CRUD framework | 5–8 days |
| Planning/KPI | 6–10 days |
| Budget/Finance | 5–8 days |
| Employee/Evaluation | 5–8 days |
| Secondary modules | 10–16 days |
| Attachments | 3–5 days |
| Dashboard/Reports | 5–8 days |
| Testing/UAT | 6–10 days |
| Migration/deployment | 4–7 days |

### Realistic total

Approximately:

**65–100 developer-days**

depending on the amount of existing business behavior that must be preserved and the depth of reports/workflows required.

For a small team of 2–3 experienced developers, the calendar time can be substantially shorter.

---

# 45. Performance targets

Design for:

- fast initial page rendering
- server-side pagination
- server-side filtering
- indexed PostgreSQL queries
- cached dashboard aggregates where appropriate
- lazy-loaded feature pages
- optimized images
- compressed HTTP responses
- connection pooling

Do not preload every business record into the browser.

---

# 46. Deployment

Use:

```text
Docker
├── web
├── api
├── postgres
└── reverse proxy
```

Reverse proxy:

- Nginx or Caddy
- HTTPS
- compression
- security headers
- upload limits

Persistent volumes:

```text
PostgreSQL
Attachments
Backups
```

---

# 47. Backup and recovery

Implement:

- scheduled PostgreSQL backup
- backup retention
- restore procedure
- attachment backup
- environment configuration backup strategy

Test restoration.

A backup that cannot be restored is not a verified backup.

---

# 48. Security-sensitive files in the current ZIP

The uploaded ZIP contains development/runtime artifacts such as:

- SQLite database files
- cookies
- many PHP session files
- backup JavaScript files
- debugging scripts

These should NOT be carried into the production repository.

Before creating the new repository:

```text
Remove:
data.db
pme.db
cookies.txt
storage/sess_*
*.bak
test/debug artifacts
temporary fix scripts
generated local artifacts
```

Keep only intentional test fixtures in a dedicated test area.

---

# 49. What should be preserved from the current project

Preserve as business references:

- schema concepts
- seed/business data
- business formulas
- planning terminology
- approval concepts
- current modules
- current role concepts
- current organization data
- dashboard metrics
- UAT scenarios
- financial integrity rules

Do NOT preserve as architecture:

- giant `api.php`
- giant `app.ts`
- PHP-session file storage
- SQLite as production database
- frontend hardcoded business lists
- duplicated query/filter logic

---

# 50. First implementation milestone

Do NOT attempt all 40+ modules simultaneously.

Build and prove:

```text
Organization
→ Users
→ Permissions
→ Planning Year
→ Goal
→ Objective
→ KPI
→ Budget
→ Finance
→ Employee
→ Employee Plan
→ Employee Evaluation
→ Dashboard
```

Once this vertical slice works completely, add the secondary modules.

This gives a stable foundation instead of repeating the problems of the current prototype.

---

# 51. Recommended first vertical slice

### Admin

Create:

```text
Company
Division
Sector
Department
Branch
```

### User

Create user.

Assign:

```text
Role
Division
Department
Branch
```

### Planning

Create:

```text
Year
Goal
Objective
KPI
Activity
```

### Finance

Create:

```text
Finance Category
Budget
Budget Line
Transaction
```

### Employee

Create:

```text
Employee
Employee Plan
Execution
Evaluation
```

### Dashboard

Show:

```text
Plan
Target
Actual
Budget
Expense
KPI
Employee Performance
```

Everything should respect organization scope and global filters.

---

# 52. Recommended project decision

I recommend:

> **Create a fresh `ija-wpms` monorepo and migrate the current application's business/data concepts into it.**

Do not attempt to convert the current root into Next.js/NestJS by repeatedly replacing files.

The existing application should remain available as:

```text
legacy-reference/
```

until the new system passes migration and UAT.

---

# 53. Suggested migration stages

```text
Current PHP/SQLite
       ↓
Business/Data inventory
       ↓
PostgreSQL schema
       ↓
Migration importer
       ↓
NestJS API
       ↓
Security/organization foundation
       ↓
Next.js UI
       ↓
CRUD
       ↓
Filters
       ↓
Business workflows
       ↓
Reports/dashboard
       ↓
Playwright UAT
       ↓
Production
```

---

# 54. Recommended success criteria

The rebuild is complete only when an administrator can start with an empty production database and, from the UI:

1. Create the organization hierarchy.
2. Create users.
3. Assign roles.
4. Assign module permissions.
5. Assign managers.
6. Create planning years.
7. Create master data.
8. Create plans/goals/objectives.
9. Create KPIs and targets.
10. Create activities.
11. Create budgets.
12. Create finance categories.
13. Create transactions.
14. Create employees.
15. Create employee plans.
16. Record execution.
17. Evaluate employees.
18. Create projects.
19. Manage risks/compliance.
20. Upload files/images.
21. Filter all relevant modules.
22. Click dashboard cards to source data.
23. Edit existing business data.
24. Archive records safely.
25. Produce reports.
26. Export authorized data.

No database editing should be required for normal administration.

---

# 55. Final recommendation

Use the uploaded current project as the **business/data migration reference**, not as the final technical foundation.

Recommended production baseline:

```text
Next.js 16.x
React 19.2
TypeScript
Tailwind CSS 4.x
shadcn/ui + Base UI
TanStack Query
TanStack Table
React Hook Form
Zod
NestJS
Fastify
Prisma 7
PostgreSQL 18
Node.js 24 LTS
pnpm
Vitest
Playwright
Docker
Nginx/Caddy
```

This gives IJA-WPMS a much stronger basis for long-term use, especially for the requirements that have repeatedly caused trouble in the current application: **complete UI CRUD, editable master/business data, organization hierarchy, secure scope, universal filtering, employee plan-based evaluation, file/image management, dashboard drilldowns, and future-year reuse.**

---

# 56. Immediate next development task

The next implementation step should be:

### BUILD PHASE 0 + PHASE 1

Create the new repository structure, configure pnpm, Next.js, NestJS/Fastify, PostgreSQL, Prisma, Docker, shared types/validation, and then implement the complete organization/security/database foundation.

Do not implement the entire UI before the data/security foundation is stable.

The uploaded ZIP should remain as the reference source during the migration.
