# CRUD Audit

**Date:** 2026-09-06  
**Status:** In Progress - Remediation

## Summary

This document tracks the CRUD (Create, Read, Update, Delete) status for all modules in the IJA-WPMS system.

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | VERIFIED - Works end-to-end with database persistence |
| ⚠️ | PARTIAL - Some functionality works, some missing |
| ❌ | NOT IMPLEMENTED - Feature not available |
| 🔄 | FIXED - Was broken, now fixed |

## Module CRUD Matrix

| Resource | List | Create | Read | Update | Delete/Archive | Notes |
|----------|------|--------|------|--------|----------------|-------|
| **Planning Years** | ✅ | ✅ | ✅ | ✅ | ✅ | Year-independent |
| **Plans** | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **Strategic Plans** | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **Strategic Themes** | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **Goals** | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **Objectives** | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **KPIs** | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **KPI Plans** | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **KPI Actuals** | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ | Verify not overwriting |
| **Activities** | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **Projects** | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **Project Milestones** | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **Budgets** | ✅ | 🔄 | ✅ | ⚠️ | ⚠️ | Create Entry FIXED |
| **Budget Lines** | ✅ | 🔄 | ✅ | ⚠️ | ⚠️ | Now integrated in Budget page |
| **Finance Entries** | ✅ | 🔄 | ✅ | ⚠️ | ⚠️ | Now integrated in Budget page |
| **Funding Sources** | ✅ | 🔄 | ✅ | ⚠️ | ⚠️ | Now integrated in Budget page |
| **Risks** | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **Compliance Requirements** | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **Compliance Findings** | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **Monitoring Visits** | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **Organizations** | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **Employees** | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ | Basic CRUD |
| **Users** | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ | Admin only |
| **Templates** | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **Rollover** | ✅ | 🔄 | ✅ | N/A | N/A | Fixed API endpoints |
| **Periods** | ✅ | ✅ | ✅ | ✅ | ✅ | |
| **Reports** | ✅ | ✅ | ✅ | ✅ | ✅ | |

## Critical Fixes Applied

### 1. Projects Page API Endpoint (FIXED)
- **Issue:** Used `/dashboard/dashboard` (double path)
- **Fix:** Changed to `/api/dashboard` through proxy
- **File:** `apps/web/src/app/(authenticated)/projects/page.tsx`

### 2. Rollover Page API Endpoints (FIXED)
- **Issue:** Used non-existent `/api/rollover-helper/*` endpoints
- **Fix:** Changed to `/api/crud/org-units` and `/api/crud/goals`
- **File:** `apps/web/src/app/(authenticated)/rollover/page.tsx`

### 3. Workplan Page Hardcoded Year (FIXED)
- **Issue:** Used hardcoded `2026` instead of fetching from API
- **Fix:** Added `fetchYears()` function and dynamic year selection
- **File:** `apps/web/src/app/(authenticated)/workplan/page.tsx`

### 4. Budget Page Dead Buttons (FIXED)
- **Issue:** Create Budget, Add Entry, Add Source buttons had no handlers
- **Fix:** Implemented full modal forms with API calls:
  - `handleCreateBudget()` → POST `/api/budget`
  - `handleCreateEntry()` → POST `/api/budget/entries`
  - `handleCreateFunding()` → POST `/api/budget` (allocations)
- **File:** `apps/web/src/app/(authenticated)/budget/page.tsx`

## Known Remaining Issues

1. **KPI Actual Verification** - Need to verify that verified actuals cannot be overwritten
2. **Budget Update/Delete** - Need to implement edit and archive functionality
3. **Employee/User Management** - Basic CRUD only, need role management
4. **Finance Entry Posting** - Need to implement posting workflow

## Files Modified

| File | Changes |
|------|---------|
| `apps/web/src/lib/dashboard-types.ts` | NEW - Shared Dashboard API types |
| `apps/web/src/app/(authenticated)/projects/page.tsx` | Fixed API endpoint |
| `apps/web/src/app/(authenticated)/rollover/page.tsx` | Fixed API endpoints |
| `apps/web/src/app/(authenticated)/workplan/page.tsx` | Added year fetching |
| `apps/web/src/app/(authenticated)/budget/page.tsx` | Implemented budget CRUD forms |