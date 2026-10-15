# User Guide

## Overview

IJA-WPMS (Institutional Job Analysis - Work Planning and Management System) is a comprehensive platform for managing organizational strategy, planning, execution, monitoring, and reporting. This guide covers all modules available to logged-in users.

## Getting Started

1. Open the application in your browser.
2. Enter your username and password on the login screen.
3. Click **Sign in** to access the Executive Dashboard.

## Dashboard

The Executive Dashboard (`/dashboard`) provides an at-a-glance view of organizational performance.

### Features
- **Planning Year Selector**: Switch between planning years to change the data context.
- **KPI Cards**: View total revenue, active employees, budget utilization, and risk metrics.
- **Quick Navigation**: Click any card to navigate to the relevant module.

### Navigation
- **Total Revenue** → links to Budget module
- **Active Employees** → links to Organization module
- **High/Critical Risks** → links to Risk & Compliance module

## Organization Management

Navigate to **Work Management > Organizations** (`/organization`).

### Managing Organizational Units
- Create parent/child organizational units (Company > Division > Sector > Directorate > Department > Branch > Team).
- View the hierarchical tree structure.
- Assign managers to units.
- Link employees to organizational units.

### Employee Management
- **Create Employee**: Click **+ New Employee**. Fill in full name, employee number, job title, email, and optional fields. Click **Save Employee**.
- **Edit Employee**: Click **Edit** on any row. Modify fields and click **Save Employee**.
- **Deactivate Employee**: Click **Deactivate** to mark an employee as inactive.
- **View Details**: Click a row to open the detail modal showing full employee information.

## Strategic Management

Navigate to **Work Management > Strategic Plans** (`/strategic`).

### Strategic Hierarchy
The system enforces a four-level hierarchy:

1. **Strategic Plan**: The top-level plan document with vision, mission, and status.
2. **Theme**: Broad focus areas within a plan (e.g., "Service Excellence").
3. **Result**: Expected outcomes from each theme.
4. **Goal**: Specific goals linked to results and planning years.
5. **Objective**: Measurable objectives linked to goals.

### Creating a Strategic Plan
- Click **Create Strategic Plan**.
- Enter name, description, vision, and mission.
- Select status: `draft`, `active`, `cancelled`.
- Click **Save**.

### Managing Themes
- Expand any plan to view its themes.
- Click **Add Theme** to create a new theme linked to the plan.
- Themes have an order index for display ordering.

### Managing Results and Goals
- Expand a theme to view its results.
- Click **Add Result** to create a result.
- Expand a result to view its goals.
- Goals are filtered by planning year.

### Copying Structure to Year
- Use the **Copy to Year** feature to replicate themes, results, goals, and objectives from one planning year to another.
- Select source and target years.
- The system copies only the structure, not actuals or performance data.

## Planning Years

Navigate to **Work Management > Planning Years** (`/planning`).

- View all planning years with their status (active, draft, closed).
- Create new planning years.
- Historical (closed) years are visible but protected from modification.

## KPI Management

Navigate to **Work Management > KPIs** (`/kpi`).

### KPI Definitions
- Click **New KPI** to create a KPI definition.
- Enter code, name, description, area, formula, unit, frequency, and direction.
- Categories help group related KPIs.

### KPI Plans
- Assign KPIs to planning years with annual and quarterly targets.
- Set weight for each KPI plan.
- Submit plans for approval.
- View achievement percentage, variance, and status.

### Entering Actuals
- Click **Enter Actual** on any KPI plan row.
- Enter the actual value for the period.
- Add comments and evidence links.
- Verify actuals (multi-step approval).

### Dashboard Metrics
- View total KPIs, weighted achievement, on-track count, at-risk count, and below-target count.

## Workplan Management

Navigate to **Work Management > Activities** (`/workplan`).

### View Modes
- **List**: Tabular view of all activities with columns for work plan, quarter, priority, progress, due date, and status.
- **Board**: Kanban-style board with columns for Not Started, In Progress, Completed, and Cancelled.
- **Calendar**: Quarterly timeline view grouped by Q1-Q4.

### Creating Activities
- Click **+ New Activity**.
- Enter title, description, quarter, start date, due date, priority, and planned quantity.
- Link to a work plan and organizational unit.
- Click **Save**.

### Managing Subtasks and Deliverables
- Open an activity to view and manage subtasks and deliverables.
- Create subtasks with individual progress tracking.
- Mark deliverables as complete with evidence.

### Progress Tracking
- Click **Update** on any activity to modify progress.
- Enter progress percentage and notes.

## Projects

Navigate to **Work Management > Projects** (`/projects`).

- Create projects with name, description, year, and status.
- Add milestones to track key project deliverables.
- View project summary statistics.
- Filter by year and organizational unit.

## Budget & Finance

Navigate to **Finance > Budget & Funds** (`/budget`).

### Budgets
- Create annual budgets linked to a planning year and organizational unit.
- Submit budgets for approval.
- View budget-vs-actual calculations.

### Budget Lines
- Add line items to a budget with category, description, and amount.
- Update or delete budget lines.

### Finance Entries
- Record actual financial transactions (expenses, income).
- Post entries to finalize them.
- View quarterly budget breakdowns and expense summaries.

## Risk & Compliance

Navigate to **Governance > Risks** (`/risk-compliance?tab=risks`) and **Compliance** (`/risk-compliance?tab=compliance`).

### Risks
- Register new risks with title, description, likelihood, impact, and mitigation plan.
- View risk overview with risk matrix.
- Track risk status (open, mitigated, closed).

### Compliance
- View total compliance requirements.
- Copy recurring requirements to the next year.
- Track compliance status and findings.

## Monitoring

Navigate to **Governance > Monitoring** (accessible via the Governance page).

### Monitoring Periods
- Define monitoring periods (e.g., quarterly, semi-annual).
- Link periods to planning years.

### Monitoring Reports
- Create monitoring reports with type, period, and status.
- Submit reports for approval.
- Track report completion.

### Monitoring Visits
- Schedule field monitoring visits.
- Record findings and follow-up actions.

## Reporting

Navigate to **Governance > Reports** (`/reporting`).

### Available Reports
- Risk reports
- Compliance reports
- Budget reports
- KPI reports

### Export Formats
- **CSV**: Comma-separated values for spreadsheet import.
- **XLSX**: Excel workbook with formatting.
- **PDF**: Print-ready document.

### Using Filters
- Select the report type.
- Choose the planning year.
- Select the view (Chart or Table).
- Click **Export** in the desired format.

## Search

Use the global search bar in the app header to search across all modules. Search supports:
- KPI names and codes
- Project names
- Risk titles
- Budget names
- Activity titles
- Employee names

## Templates

Navigate to **Administration > Templates** (`/templates`).

### Template Types
- KPI Definitions
- Activities
- Projects
- Risks
- Compliance Requirements
- Reporting Formats
- Work-Plan Structures
- Organizational Structures

### Using Templates
- Browse templates by type.
- Instantiate a template into a planning year to create real records.
- Import master data from CSV.

## Rollover

Navigate to **Administration > Rollover** (`/rollover`).

### When to Use Rollover
At the end of a planning year, use the rollover wizard to carry forward strategic structures, KPIs, activities, projects, and other data to the new year.

### Rollover Process
1. Select source and target years.
2. Choose rollover mode (all items or selected items).
3. Review the preview showing what will be copied.
4. Execute the rollover.
5. Monitor the job status.

### Protected Data
Performance data (actuals, finance entries, monitoring results) is **never** copied during rollover.

## Settings

Navigate to **Administration > Settings** (`/settings`).

### Currencies Tab
- View, create, edit, and archive currencies.
- Set the default currency used across the system.

### General Tab
- Application-level configuration.

### Appearance Tab
- Theme and branding settings.

### Notifications Tab
- Email and system notification preferences.

### Security Tab
- Session timeout configuration.
- Password policy settings.
