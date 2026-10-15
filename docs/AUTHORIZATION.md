# Authorization Model

## Overview (Stage 12 - Implemented)

Governance, approvals, permissions and audit have been implemented as a dedicated
GovernanceModule under apps/api/src/governance/. It provides a consistent,
database-driven authorization model that is fully configurable - the default roles
are templates only and can be customized without code changes.

Four separate concepts are mandatory:

1. Role - what actions a user may perform.
2. Module access - which functional areas they may enter.
3. Organization scope - which organizational descendants they may see/change.
4. Approval authority - which workflow decisions they may make.

A CEO/business executive is not automatically a system administrator.

## Server-side rule

Never authorize based on a frontend button. Every API operation must calculate:

effective permissions = role permissions INTERSECT module access INTERSECT organization scope INTERSECT workflow authority

and load the stored record before authorizing an update/delete/approval.

## Configuration model

Permissions are expressed as action grants per resource and stored per role in RolePermission:

RolePermission { id, roleId -> Role, resource, actions[] }

The action vocabulary is granular:

view | create | edit | submit | approve | reject | close | archive | export | delete | manage

### Default roles (configurable templates)

DEFAULT_ROLE_TEMPLATES in permissions.ts seeds these system roles (not final - configurable):

- System Administrator - all permissions, all resources.
- Executive - view / approve / export on strategic resources.
- Plan Manager - authoring + approve on planning resources.
- Directorate Manager - authoring + approve on directorate resources.
- Unit Manager - authoring + submit on unit resources.
- Finance - authoring + approve on budget & finance resources.
- HR - authoring + approve on employee / org / training.
- Project Manager - authoring + submit + close on project resources.
- KPI/Data Officer - authoring + submit on KPI resources.
- Reviewer - view + submit on activities/projects/reports.
- Auditor - view + export on audit / risk / compliance.
- Read Only - view only on everything.

System roles (isSystem = true) are protected from modification/deletion.

## Permission enforcement

- GovernanceService.hasPermission(userId, resource, action, recordId?) is the central check.
- PermissionsGuard, YearProtectionGuard and SeparationOfDutiesGuard are provided as Nest guards.
- AuditMixin offers reusable permission/audit helpers for services.

## Separation of duties

A user cannot approve (or reject/close) their own restricted submissions when the
resource is in SEPARATION_OF_DUTIES_RESOURCES. checkSeparationOfDuties loads the stored
record, compares the creator to the acting user, and refuses self-approval for:

activity | project | budget | kpi_plan | report

## Historical year protection

checkYearProtection(userId, resource, yearId) blocks changes to YEAR_PROTECTED_RESOURCES
in a closed/archived year unless the actor is a System Administrator or holds the
year_override:modify_closed permission.

## Audit trail

GovernanceService.logAudit() records every material change to AuditLog:

- user (acting user with joined detail)
- action (CREATE / UPDATE / APPROVE / DELETE ...)
- entity (resource type)
- record (the record id)
- timestamp (server time)
- old value / new value (JSON snapshots where appropriate)
- IP / user-agent / metadata

AuditLog is queryable via /api/v1/governance/audit with filters and per-record history.

## Web UI

A Governance screen (apps/web/src/app/governance/page.tsx) provides tabs for Roles &
Permissions, a Permission Reference, and the Audit Log view with filtering, plus a
one-click "Initialize Default Roles" action.
