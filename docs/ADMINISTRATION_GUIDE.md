# Administration Guide

## Overview

The IJA-WPMS Administration module covers user management, role-based access control, system configuration, and master data setup. All administrative functions require the Super Administrator role or a custom role with matching permissions.

## User Management

### Creating Users

Navigate to **Administration > Users** (`/users`).

Required fields:
- Username (unique, alphanumeric)
- Full Name
- Email
- Password (minimum 8 characters)
- Role (select from available roles)

Optional fields:
- Phone
- Employee assignment (links to an existing employee record)

Click **Create User** to persist. The system returns HTTP 201 on success.

### Editing Users

Click the **Edit** button on any user row. The edit modal pre-populates all fields. Update the desired fields and click **Save Changes**.

### Password Reset

Click the **Password** button on a user row. Enter and confirm the new password. Click **Reset Password**. The system validates that both password fields match before saving.

### Module Access

Click the **Modules** button on a user row. Check the modules the user should access. Click **Save Module Access**. Available modules:
- Dashboard
- Organization
- Planning
- KPI
- Workplan
- Projects
- Budget
- Risk & Compliance
- Monitoring
- Reporting
- Users
- Settings
- Templates
- Rollover
- Governance

### User Status

- **Activate**: Re-enables a deactivated user. The user can log in again.
- **Deactivate**: Disables the user. The user cannot log in while deactivated. Confirmation dialog is shown.

## Role Management

Navigate to **Administration > Governance** (`/governance?tab=roles`).

### Default Roles

The system seeds the following roles on initialization:
- Super Administrator
- Administrator
- Manager
- Employee
- Viewer

### Creating Custom Roles

Click **Create Role**. Enter:
- Role Name
- Role Code (unique identifier, e.g., `e2e_role_123`)
- Description (optional)

Assign permissions by toggling actions for each resource group:

**Resource Groups:**
- Planning: `planning_year`, `strategic_plan`, `theme`, `goal`, `objective`
- KPI: `kpi`, `kpi_plan`, `kpi_actual`, `kpi_category`
- Activities: `activity`, `deliverable`, `sub_task`, `task_update`
- Projects: `project`, `project_milestone`, `project_phase`, `project_risk`, `project_document`
- Budget & Finance: `budget`, `budget_line`, `budget_request`, `finance_entry`, `finance_category`
- Risk & Compliance: `risk`, `risk_mitigation`, `compliance_requirement`, `compliance_finding`, `corrective_action`, `audit`
- Organization: `org_unit`, `employee`, `role`, `user`
- Reports: `report`, `reporting_period`, `report_correction`
- Other: `training`, `procurement`, `asset`, `dashboard`, `setting`

**Available Actions:** `view`, `create`, `edit`, `delete`, `submit`, `approve`, `reject`, `close`, `archive`, `export`, `manage`

Click **Save Role** to persist. The role is immediately available for user assignment.

### Editing Roles

Click **Edit** on any role row. Modify name, description, or permissions. Click **Save Changes**. System roles cannot be deleted but can be edited.

### Deleting Roles

Click **Delete** on a custom role. A confirmation dialog is shown. Roles with assigned users cannot be deleted.

## Currency Management

Navigate to **Administration > Settings** (`/settings`), then select the **Currencies** tab.

### Viewing Currencies

The currencies table displays:
- Code (ISO 4217 or custom)
- Name
- Symbol
- Decimal Places
- Locale
- Active status
- Default status

### Creating a Currency

Click **Add Currency**. Enter:
- Code (unique, e.g., `USD`, `EUR`, `ETB`)
- Name (e.g., `US Dollar`)
- Symbol (e.g., `$`)
- Decimal Places (typically 2)
- Locale (e.g., `en-US`, `en-ET`)

Click **Save**.

### Setting Default Currency

Select a currency from the list and click **Set as Default**. Only one currency can be the default at any time. The default currency is used in budget and financial displays.

### Editing a Currency

Click **Edit** on any currency row. Modify the fields and click **Save**.

### Archiving a Currency

Click the archive/delete icon to archive a currency. Archived currencies are hidden from active dropdowns but retained for historical data integrity.

## Planning Year Management

Navigate to **Planning** (`/planning`).

### Year Statuses

- **Active**: The current working year. All CRUD operations are permitted.
- **Closed**: A historical year. Protected by governance rules. Modifications require special permissions.
- **Draft**: A future year being prepared.

### Creating a Planning Year

Click **Create Planning Year**. Enter:
- Year label (e.g., `2026 Planning Year`)
- Year number (e.g., `2026`)
- Status (default: `draft`)

Click **Save**.

### Closing a Year

When a planning year is complete, change its status to `closed`. Closed years are protected from modification by the governance layer.

## System Settings

Navigate to **Administration > Settings** (`/settings`).

### General Settings
- Application name
- Default language
- Date format
- Timezone

### Appearance Settings
- Primary color
- Logo URL
- Theme (light/dark)

### Notification Settings
- Email notifications for approvals
- System alerts

### Security Settings
- Session timeout
- Password policy
- Two-factor authentication toggle

## Audit Log

Navigate to **Administration > Governance** (`/governance?tab=audit`).

The audit log captures all administrative actions. Filter by:
- Entity type (e.g., `user`, `role`, `budget`)
- Action (e.g., `create`, `update`, `delete`)
- Date range
- User

Click **Apply Filters** to refresh the log.

## Approval Workflows

The governance layer enforces approval workflows for:
- KPI Plans: `submit` → `approve` or `reject`
- Work Plans: `submit` → `approve` or `reject`
- Budgets: `submit` → `approve` or `reject`
- Monitoring Reports: `submit` → `approve` or `reject`

Only users with the `approve` permission for the relevant resource can approve or reject submissions.

## Data Backup

Database backups should be performed using standard PostgreSQL tools:

```bash
pg_dump -U ija -d ija_wpms > backup_$(date +%Y%m%d).sql
```

Restore:

```bash
psql -U ija -d ija_wpms < backup_20260915.sql
```

## Performance Monitoring

- API health: `GET /api/v1/health`
- Database connection pool: Monitor via `prisma studio` or database-level monitoring
- Storage: Monitor `/app/storage/uploads` disk usage
