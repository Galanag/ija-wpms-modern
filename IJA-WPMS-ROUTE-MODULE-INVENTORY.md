# IJA-WPMS ROUTE AND MODULE INVENTORY

## Frontend Routes (Next.js App Router)

### Public Routes
- `/` - Landing page with login form
- `/not-found` - 404 page

### Authenticated Routes (Requires Authentication)
- `/dashboard` - Executive dashboard with overview metrics
- `/organization` - Organization management (units, employees)
- `/planning` - Planning module (years, plans)
- `/strategic` - Strategic planning (themes, results, goals, objectives)
- `/kpi` - KPI management (definitions, plans, actuals)
- `/budget` - Budget management (plans, entries, calculations)
- `/project` - Project management
- `/risk-compliance` - Risk and compliance management
- `/monitoring` - Monitoring visits and reports
- `/governance` - Governance (roles, permissions, audit log)
- `/workplan` - Work planning
- `/templates` - Template management
- `/currency` - Currency management
- `/search` - Global search
- `/settings` - System settings
- `/attachments` - File attachments
- `/import-export` - Data import/export
- `/admin` - Administration (user management)

## Backend API Endpoints (NestJS)

### Authentication (`/api/v1/auth`)
- POST `/login` - Authenticate user
- POST `/logout` - End session
- GET `/me` - Get current user info
- POST `/csrf` - Get CSRF token

### Organization (`/api/v1/organization`)
- GET `/units` - List organizational units
- GET `/units/:id` - Get unit details
- POST `/units` - Create unit
- PUT `/units/:id` - Update unit
- DELETE `/units/:id` - Delete unit
- GET `/employees` - List employees
- GET `/employees/unit/:orgUnitId` - Get employees by unit
- GET `/employees/employee/:id` - Get employee details
- POST `/employees` - Create employee
- PUT `/employees/employee/:id` - Update employee
- DELETE `/employees/employee/:id` - Delete employee

### Planning (`/api/v1/planning`)
- GET `/years` - List planning years
- GET `/years/:id` - Get year details
- POST `/years` - Create planning year
- PUT `/years/:id` - Update planning year
- DELETE `/years/:id` - Delete planning year
- GET `/summary/:yearId` - Get year summary
- GET `/calendar/:yearId` - Get planning calendar
- POST `/years/:id/close` - Close planning year
- POST `/years/:id/reopen` - Reopen planning year
- GET `/plans` - List plans
- GET `/plans/:id` - Get plan details
- POST `/plans` - Create plan
- PUT `/plans/:id` - Update plan
- DELETE `/plans/:id` - Delete plan
- POST `/plans/:id/transition` - Transition plan workflow
- GET `/plans/:id/transitions` - Get plan transitions
- POST `/plans/copy` - Copy plan to another year

### Strategic (`/api/v1/strategic`)
- GET `/plans` - List strategic plans
- GET `/plans/:id` - Get strategic plan details
- POST `/plans` - Create strategic plan
- PUT `/plans/:id` - Update strategic plan
- DELETE `/plans/:id` - Delete strategic plan
- GET `/themes` - List strategic themes
- GET `/themes/:id` - Get theme details
- POST `/themes` - Create theme
- PUT `/themes/:id` - Update theme
- DELETE `/themes/:id` - Delete theme
- GET `/results` - List strategic results
- GET `/results/:id` - Get result details
- POST `/results` - Create result
- PUT `/results/:id` - Update result
- DELETE `/results/:id` - Delete result
- GET `/goals` - List goals
- GET `/goals/:id` - Get goal details
- POST `/goals` - Create goal
- PUT `/goals/:id` - Update goal
- DELETE `/goals/:id` - Delete goal
- GET `/objectives` - List objectives
- GET `/objectives/:id` - Get objective details
- POST `/objectives` - Create objective
- PUT `/objectives/:id` - Update objective
- DELETE `/objectives/:id` - Delete objective
- POST `/copy-to-year` - Copy strategic structure to year
- GET `/hierarchy/:yearId` - Get strategic hierarchy for year
- GET `/statistics` - Get strategic statistics

### KPI (`/api/v1/kpi`)
- GET `/definitions` - List KPI definitions
- GET `/definitions/:id` - Get KPI definition details
- POST `/definitions` - Create KPI definition
- PUT `/definitions/:id` - Update KPI definition
- DELETE `/definitions/:id` - Delete KPI definition
- GET `/categories` - List KPI categories
- GET `/plans` - List KPI plans
- GET `/plans/:id` - Get KPI plan details
- POST `/plans` - Create KPI plan
- PUT `/plans/:id` - Update KPI plan
- DELETE `/plans/:id` - Delete KPI plan
- POST `/plans/:id/submit` - Submit KPI plan
- POST `/plans/:id/approve` - Approve KPI plan
- GET `/actuals` - List KPI actuals
- GET `/actuals/:kpiPlanId` - Get actuals for KPI plan
- PUT `/actuals/:id` - Update KPI actual
- POST `/actuals/:id/verify` - Verify Kpi actual
- DELETE `/actuals/:id` - Delete Kpi actual
- GET `/dashboard/metrics` - Get KPI dashboard metrics
- GET `/dashboard/status` - Get KPI status dashboard
- GET `/metrics/:planId` - Get KPI metrics for plan
- GET `/trend/:planId` - Get KPI trend for plan
- GET `/compare-years/:kpiId` - Compare KPI across years
- POST `/copy-to-year` - Copy KPI plan to year

### Budget (`/api/v1/budget`)
- GET `/` - List budgets
- GET `/:id` - Get budget details
- POST `/` - Create budget
- PUT `/:id` - Update budget
- DELETE `/:id` - Delete budget
- POST `/:id/submit` - Submit budget
- POST `/:id/approve` - Approve budget
- GET `/lines` - List budget lines
- GET `/lines/:budgetId` - Get budget lines for budget
- PUT `/lines/:id` - Update budget line
- DELETE `/lines/:id` - Delete budget line
- POST `/entries` - Create budget entry
- GET `/entries` - List budget entries
- PUT `/entries/:id` - Update budget entry
- DELETE `/entries/:id` - Delete budget entry
- POST `/entries/:id/post` - Post budget entry
- GET `/calculations/budget-vs-actual/:yearId` - Get budget vs actual
- GET `/calculations/quarterly/:yearId` - Get quarterly budget
- GET `/calculations/expense-breakdown/:yearId` - Get expense breakdown
- GET `/calculations/summary/:yearId` - Get budget summary

### Project (`/api/v1/project`)
- GET `/projects` - List projects
- GET `/projects/:id` - Get project details
- POST `/projects` - Create project
- PUT `/projects/:id` - Update project
- DELETE `/projects/:id` - Delete project
- GET `/projects/summary` - Get project summary
- GET `/milestones` - List project milestones
- GET `/milestones/:projectId` - Get milestones for project
- PUT `/milestones/:id` - Update milestone
- DELETE `/milestones/:id` - Delete milestone
- POST `/milestones` - Create milestone

### Risk-Compliance (`/api/v1/risk-compliance`)
- GET `/risks` - List risks
- GET `/risks/:id` - Get risk details
- POST `/risks` - Create risk
- PUT `/risks/:id` - Update risk
- DELETE `/risks/:id` - Delete risk
- GET `/categories` - List risk categories
- POST `/categories` - Create risk category
- PUT `/categories/:id` - Update risk category
- DELETE `/categories/:id` - Delete risk category
- GET `/reviews` - List risk reviews
- GET `/reviews/:riskId` - Get reviews for risk
- GET `/requirements` - List compliance requirements
- GET `/requirements/:id` - Get requirement details
- POST `/requirements` - Create requirement
- PUT `/requirements/:id` - Update requirement
- DELETE `/requirements/:id` - Delete requirement
- POST `/requirements/:id/evidence` - Add evidence to requirement
- PUT `/requirements/:id` - Update requirement
- DELETE `/requirements/:id` - Delete requirement
- GET `/findings` - List compliance findings
- GET `/findings/:id` - Get finding details
- PUT `/findings/:id` - Update finding
- POST `/findings/:id/close` - Close finding
- GET `/corrective-actions` - List corrective actions
- GET `/corrective-actions/:id` - Get corrective action details
- PUT `/corrective-actions/:id` - Update corrective action
- DELETE `/corrective-actions/:id` - Delete corrective action
- GET `/dashboard/risks` - Get risk dashboard
- GET `/dashboard/compliance` - Get compliance dashboard
- POST `/requirements/copy` - Copy requirements

### Monitoring (`/api/v1/monitoring`)
- GET `/periods` - List monitoring periods
- GET `/periods/:id` - Get period details
- POST `/periods` - Create monitoring period
- PUT `/periods/:id` - Update period
- DELETE `/periods/:id` - Delete period
- POST `/periods/generate-monthly` - Generate monthly periods
- GET `/reports` - List monitoring reports
- GET `/reports/:id` - Get report details
- POST `/reports` - Create monitoring report
- PUT `/reports/:id` - Update report
- DELETE `/reports/:id` - Delete report
- POST `/reports/:id/submit` - Submit report
- POST `/reports/:id/approve` - Approve report
- GET `/visits` - List monitoring visits
- GET `/visits/:id` - Get visit details
- POST `/visits` - Create monitoring visit
- PUT `/visits/:id` - Update visit
- DELETE `/visits/:id` - Delete visit
- GET `/dashboard` - Get monitoring dashboard

### Governance (`/api/v1/governance`)
- POST `/initialize` - Initialize governance data
- GET `/roles` - List roles
- GET `/roles/:id` - Get role details
- POST `/roles` - Create role
- PUT `/roles/:id` - Update role
- DELETE `/roles/:id` - Delete role
- GET `/permissions` - List permissions
- GET `/permissions/:userId` - Get permissions for user
- POST `/can-approve` - Check approval capability
- POST `/approve` - Approve item
- POST `/reject` - Reject item
- GET `/audit` - Get audit log
- GET `/audit/:entity/:recordId` - Get audit log for entity/record
- POST `/check-year-protection` - Check year protection status

### Rollover (`/api/v1/rollover`)
- POST `/preview` - Preview rollover operation
- POST `/execute` - Execute rollover operation
- GET `/items` - List rollover items
- GET `/jobs` - List rollover jobs
- GET `/jobs/:id` - Get rollover job details
- POST `/jobs/:id/cancel` - Cancel rollover job

### Templates (`/api/v1/templates`)
- GET `/types` - List template types
- GET `/types/:id` - Get template type details
- POST `/types/:id` - Create template of type
- PATCH `/types/:id/:id` - Update template
- DELETE `/types/:id/:id` - Delete template
- POST `/types/:id/instantiate` - Instantiate template

### Currency (`/api/v1/currency`)
- GET `/` - List currencies
- GET `/active` - Get active currencies
- GET `/default` - Get default currency
- GET `/:id` - Get currency details
- POST `/` - Create currency
- PUT `/:id` - Update currency
- PUT `/:id/default` - Set as default currency
- DELETE `/:id` - Delete currency
- PATCH `/:id/reactivate` - Reactivate currency

### Search (`/api/v1/search`)
- GET `/` - Global search endpoint

### Settings (`/api/v1/settings`)
- GET `/default-planning-year` - Get default planning year ID
- PATCH `/default-planning-year` - Set default planning year ID
- GET `/planning-years` - List planning years

### Attachments (`/api/v1/attachments`)
- POST `/:entityType/:entityId` - Upload attachment
- GET `/:id` - Get attachment details
- DELETE `/:id` - Delete attachment

### Admin (`/api/v1/admin`)
- GET `/users` - List users
- POST `/users` - Create user
- GET `/users/:id` - Get user details
- PUT `/users/:id` - Update user
- DELETE `/users/:id` - Delete user
- POST `/users/:id/password` - Change user password
- POST `/users/:id/modules` - Update user module access
- POST `/users/:id/modules/list` - Get user module access list
- POST `/users/:id/reactivate` - Reactivate user

### Import-Export (`/api/v1/import-export`)
- GET `/entities` - List exportable entities
- POST `/:entityType/import` - Import data
- GET `/:entityType/export` - Export data
- GET `/jobs` - List import/export jobs
- GET `/jobs/:id` - Get job details

### WorkPlan (`/api/v1/workplan`)
- GET `/plans` - List work plans
- GET `/plans/:id` - Get work plan details
- POST `/plans` - Create work plan
- PUT `/plans/:id` - Update work plan
- DELETE `/plans/:id` - Delete work plan
- POST `/plans/:id/submit` - Submit work plan
- POST `/plans/:id/approve` - Approve work plan
- GET `/activities` - List work plan activities
- GET `/activities/:id` - Get activity details
- PUT `/activities/:id` - Update activity
- DELETE `/activities/:id` - Delete activity
- POST `/activities/:id/submit` - Submit activity
- POST `/activities/:id/approve` - Approve activity
- POST `/activities/:id/reject` - Reject activity
- POST `/activities/:id/resubmit` - Resubmit activity
- POST `/activities/:id/progress` - Update activity progress
- POST `/activities/bulk-update` - Bulk update activities
- GET `/subtasks` - List subtasks
- GET `/subtasks/activity/:activityId` - Get subtasks for activity
- PUT `/subtasks/:id` - Update subtask
- DELETE `/subtasks/:id` - Delete subtask
- POST `/subtasks/:id/progress` - Update subtask progress
- GET `/deliverables` - List deliverables
- GET `/deliverables/activity/:activityId` - Get deliverables for activity
- PUT `/deliverables/:id` - Update deliverable
- DELETE `/deliverables/:id` - Delete deliverable
- POST `/deliverables/:id/complete` - Mark deliverable complete
- GET `/schedule/:yearId` - Get work plan schedule
- GET `/overdue/:yearId` - Get overdue work plan items
- GET `/statistics/:yearId` - Get work plan statistics
- POST `/copy-to-year` - Copy work plan to year

### CRUD (`/api/v1/crud`)
- GET `/meta/all` - Get metadata for all resources
- GET `/:resource` - List resources
- GET `/:resource/:id` - Get resource details
- POST `/:resource` - Create resource
- PATCH `/:resource/:id` - Update resource
- DELETE `/:resource/:id` - Delete resource

### Health (`/`)
- GET `/` - Health check endpoint

### Documentation (`/docs`)
- GET `/` - Swagger UI
- GET `/json` - OpenAPI specification

## Core Modules Inventory

### Backend Modules
1. **AuthModule** - Authentication and session management
2. **OrganizationModule** - Org units, employees, hierarchy
3. **PlanningModule** - Planning years, plans, workflow
4. **StrategicModule** - Strategic planning hierarchy
5. **KpiModule** - KPI definitions, plans, actuals
6. **BudgetModule** - Budget planning and tracking
7. **ProjectModule** - Project management
8. **RiskComplianceModule** - Risk and compliance management
9. **MonitoringModule** - Monitoring visits and reports
10. **GovernanceModule** - Roles, permissions, audit
11. **RolloverModule** - Year-to-year data rollover
12. **TemplatesModule** - Template management
13. **CurrencyModule** - Currency management
14. **DashboardModule** - Executive dashboard and metrics
15. **AttachmentsModule** - File attachment handling
16. **AdminModule** - User and system administration
17. **SearchModule** - Global search functionality
18. **SettingsModule** - System configuration
19. **WorkPlanModule** - Work planning and activities
20. **CrudModule** - Generic CRUD operations
21. **ManagementReviewModule** - Management review process
22. **PrismaModule** - Database access layer (global)
23. **HealthController** - Health check endpoint

### Frontend Modules (Inferred from route structure)
1. **Layout** - Application layout components
2. **Auth** - Login/logout functionality
3. **Dashboard** - Executive dashboard views
4. **Organization** - Org unit and employee management
5. **Planning** - Planning year and plan management
6. **Strategic** - Strategic planning hierarchy
7. **KPI** - KPI definitions and tracking
8. **Budget** - Budget planning and expense tracking
9. **Project** - Project management
10. **RiskCompliance** - Risk and compliance tracking
11. **Monitoring** - Monitoring visits and reports
12. **Governance** - Roles, permissions, audit trail
13. **WorkPlan** - Work planning and activities
14. **Templates** - Template management
15. **Currency** - Currency management
16. **Search** - Global search
17. **Settings** - System configuration
18. **Attachments** - File handling
19. **ImportExport** - Data import/export
20. **Admin** - User administration

## Database Tables Inventory (Key Business Entities)

### Core Planning Entities
- **PlanningYear** - Fiscal years with status (draft, active, closed)
- **Plan** - Strategic, annual, or work plans with workflow states
- **Goal** - Hierarchical goals under strategic results
- **Objective** - Measurable objectives under goals
- **Kpi** - Key performance indicators with definitions
- **KpiPlan** - Planned KPI targets for a year/org unit
- **KpiActual** - Actual KPI measurements submitted/verified
- **Activity** - Work activities linked to objectives/KPIs
- **WorkPlan** - Container for activities with timeline
- **Deliverable** - Tangible outputs from activities
- **SubTask** - Granular tasks under activities

### Financial Management
- **Budget** - Financial plans for organizational units
- **BudgetLine** - Detailed budget line items
- **FinanceEntry** - Actual financial transactions (revenue/expense)
- **FinanceCategory** - Transaction categorization
- **Project** - Financial and physical projects
- **ProjectMilestone** - Key dates in project timeline
- **Procurement** - Purchasing requests and tracking

### Human Resources
- **Employee** - Staff members with organizational links
- **HrAction** - HR initiatives and tracking
- **EmployeeEvaluation** - Performance evaluations
- **Training** - Training programs and participation
- **ManagerAssignment** - Delegation of authority

### Risk and Compliance
- **Risk** - Identified risks with probability/impact scoring
- **RiskCategory** - Classification of risks
- **RiskReview** - Periodic risk assessments
- **ComplianceRequirement** - Regulatory or internal requirements
- **ComplianceFinding** - Violations or non-compliances
- **CorrectiveAction** - Actions to address findings
- **Audit** - Audit records and findings
- **AuditFinding** - Specific audit discoveries

### Governance and Operations
- **Role** - Permission groupings for users
- **RolePermission** - Specific access rights
- **User** - System users with authentication
- **Approval** - Multi-step approval workflow
- **ManagementAction** - Tracked management initiatives
- **ManagementReview** - Periodic management evaluations
- **MonitoringVisit** - Scheduled compliance checks
- **ReviewAction/Decision/Finding** - Structured review process
- **Setting** - System configuration (including default_planning_year_id)
- **Session** - Active user sessions
- **AuditLog** - System activity tracking

### Reference Data
- **OrgUnit** - Organizational hierarchy (units, departments)
- **FocusArea** - Strategic focus areas
- **BranchFocusArea** - Unit-specific focus areas
- **StrategicTheme/Result** - Strategic planning hierarchy
- **KpiCategory** - Grouping of related KPIs
- **Currency** - Supported currencies with exchange rates
- **PeriodDefinition** - Fiscal periods (months, quarters, etc.)
- **OrgStructureTemplate** - Predefined organizational structures
- **PlanWorkflowState/Transition** - Plan approval workflow
- **PlanVersion** - Historical versions of plans
- **PlanCopyConfig** - Configuration for plan duplication
- **RolloverJob/Item** - Year-end data migration

### Specialized Modules
- **LegalMatter** - Legal cases and tracking
- **ResearchStudy** - Research projects and findings
- **TourismRecord** - Tourism-specific metrics (if applicable)
- **Property** - Physical assets and utilization
- **Asset** - Equipment and resource tracking
- **Report** - Generated reports and templates
- **Evaluation** - Performance evaluation framework
- **StrategicPlan** - Multi-year strategic planning

## Relationships Verified
- PlanningYear 1:many Goal, Objective, KpiPlan, Budget, etc.
- Goal 1:many Objective
- Objective 1:many Activity, KpiPlan
- Kpi 1:many KpiPlan
- KpiPlan 1:many KpiActual
- OrgUnit 1:many Employee, KpiPlan, Budget, etc.
- User 1:many Employee (optional)
- Role 1:many RolePermission
- User 1:many Role (through roleId)
- Setting singleton for default_planning_year_id

## Missing or Incomplete Modules
No obviously missing modules detected - system appears to have comprehensive coverage for an enterprise performance management system.

## Test Coverage Status
- **Unit Tests:** 120 passing tests covering auth, reporting context, migration, kpi, monitoring, strategic, planning, rollover, templates, argon2
- **E2E Tests:** Key user journeys passing (dashboard nav, authentication, currency management)
- **Type Checking:** Passing for both frontend and backend
- **Linting:** Not verified in this audit

