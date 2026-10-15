# Global Filters

Canonical filter state:

- yearId
- divisionId
- sectorId
- directorateId
- departmentId
- branchId
- teamId
- quarter
- month
- week
- fromDate
- toDate
- status
- categoryId
- employeeId
- projectId
- kpiId

The frontend stores this state once. The API accepts the same normalized fields. Permission scope is always applied in addition to filters so a filter can only reduce a user's visibility, never expand it.

Useful semantics:

- Division includes authorized descendants.
- Department includes authorized branches/teams.
- Branch selects exactly that branch and descendants.
- Quarter/month/week use the canonical record date.
- Date ranges are inclusive.
