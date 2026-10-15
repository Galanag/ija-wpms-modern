# Operating Model

## Admin-first configuration

Normal business data is created from the running UI. Seed/migrations initialize the environment; they are not the daily management method.

## Immutable governance records

Audit logs, finalized approval decisions and finalized employee evaluations should not be destructively edited. Provide controlled revision/reversal workflows and preserve history.

## Organization scope

A user can have one primary organization scope plus explicit manager assignments. Descendants are resolved recursively. Filters can reduce visibility but never grant extra visibility.

## Global filters

Filter state is designed to travel between dashboard cards and source lists. Source APIs should receive the same normalized filter vocabulary.
