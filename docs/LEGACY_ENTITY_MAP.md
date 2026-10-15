# Legacy Entity Map

The current SQLite system contains the following major tables and their intended modern model:

| Legacy table | Modern model | Notes |
|---|---|---|
| planning_years | PlanningYear | Future-year reusable planning cycle |
| org_units | OrgUnit | Parent/child hierarchy backbone |
| roles | Role | RBAC |
| role_permissions | RolePermission | Module/action permissions |
| users | User | Secure auth identity |
| user_module_access | UserModuleAccess | Per-user module access |
| manager_assignments | ManagerAssignment | Explicit approval/manager authority |
| employees | Employee | Workforce record |
| strategic_plans | StrategicPlan | Strategy |
| strategic_themes | StrategicTheme | Strategy grouping |
| strategic_results | StrategicResult | Strategic result |
| goals | Goal | Year-scoped goal |
| objectives | Objective | Goal child |
| kpis | Kpi | Reusable KPI definition |
| kpi_plans | KpiPlan | Year/org-specific KPI plan |
| kpi_actuals | KpiActual | Period actuals |
| projects | Project | Project master |
| project_milestones | ProjectMilestone | Project children |
| activities | Activity | Operational work |
| task_updates | TaskUpdate | Execution updates |
| annual_plan_allocations | AnnualPlanAllocation | Planning-level allocation |
| budgets | Budget | Operational budget |
| budget_requests | BudgetRequest | Funding requests |
| budget_lines | BudgetLine | Budget breakdown |
| finance_categories | FinanceCategory | Configurable income/expense categories |
| finance_entries | FinanceEntry | Financial actuals |
| employee_evaluations | EmployeeEvaluation | Performance evaluation |
| evaluation_criteria | EvaluationCriterion | Configurable scoring criteria |
| evaluations | Evaluation | General organizational evaluations |
| monitoring_visits | MonitoringVisit | Monitoring records |
| risk_reviews | RiskReview | Risk review history |
| risks | Risk | Risk register |
| compliance_requirements | ComplianceRequirement | Compliance |
| corrective_actions | CorrectiveAction | Follow-up actions |
| management_actions | ManagementAction | Executive follow-up |
| audits | Audit | Internal audit |
| audit_findings | AuditFinding | Audit findings |
| procurements | Procurement | Procurement lifecycle |
| hr_actions | HrAction | HR action tracking |
| trainings | Training | Training |
| assets | Asset | Asset register |
| properties | Property | Property register |
| tourism_records | TourismRecord | Tourism operations |
| stakeholders | Stakeholder | Stakeholder register |
| legal_matters | LegalMatter | Legal matters |
| research_studies | ResearchStudy | Research |
| reports | Report | Reports |
| approvals | Approval | Approval history/workflow |
| audit_log | AuditLog | Immutable governance trace |
| attachments | Attachment | Unified attachment system |
| settings | Setting | Configurable system settings |
| period_definitions | PeriodDefinition | Flexible reporting periods |
