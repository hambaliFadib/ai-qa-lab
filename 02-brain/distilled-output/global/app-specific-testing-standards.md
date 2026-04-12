# App-Specific Testing Standards

## Purpose

This file stores PGN Billing application-specific testing conventions that sit outside generic QA standards.

Raw source lives in `04-knowledge-raw/APP_TESTING_STANDARDS/PGN_BILLING_APP_TESTING_STANDARDS.md`.

Use it for assertions such as:

- currency and amount formatting
- date formatting
- status label wording
- list and action-column conventions
- dropdown, menu, and overlay evidence rules that are specific to this application stack

## Source Priority

When a rule is added here, keep its strength explicit:

1. `confirmed`
   Source is strong runtime evidence plus business confirmation, MoM, BPMN, or repeated validated behavior.
2. `observed`
   Source is repeated runtime evidence, but business confirmation is still absent.
3. `user-seeded`
   Source comes from a direct user instruction and should guide testing until stronger evidence replaces it.
4. `provisional`
   Source is a working assumption only. Do not use it alone to declare a product bug.

## Current Rules

| Rule | Scope | Source | Status | Last Verified | Notes |
| --- | --- | --- | --- | --- | --- |
| USD amounts should be rounded and displayed with 2 decimal places, e.g. `10` -> `10.00`. | Cross-module amount assertions | User request on 2026-04-09 | user-seeded | 2026-04-09 | Treat as app-specific expectation until stronger runtime or business evidence refines it. |
| Dates currently render in list/detail UI as `DD MMM YYYY`, e.g. `09 Apr 2026`. | Billing Cycle, Transaction Mapping | Live UI observation | observed | 2026-04-09 | Seen in Billing Cycle and Transaction Mapping evidence captures. |
| Transaction Mapping boolean-style list values display in uppercase `TRUE` / `FALSE`. | Transaction Mapping list | Live UI observation | observed | 2026-04-09 | Preserve uppercase in assertions unless module-specific evidence says otherwise. |
| List assertions must read headers from the live DOM table and must not use stale artifacts or hardcoded column indexes. | Cross-module list verification | Live DOM observation and RCA | observed | 2026-04-09 | Prevents AI from replaying outdated column truth. |
| `ACTION` columns may be icon-only and appear blank as text; automation must inspect clickable descendants instead of using cell text alone. | List pages with row actions | Live UI observation | observed | 2026-04-09 | Prevents false negatives when action cells have no visible text. |
| Ant Design list pages in this app can split header and body into separate DOM tables. | UI evidence capture | Live DOM observation | observed | 2026-04-09 | Evidence extraction must build a logical table instead of trusting a single raw `table` node. |
| Active option lists can come from Ant Select or Ant Menu overlays; assertions must capture the live option list, not infer it. | Dropdown and menu evidence capture | Live DOM observation and RCA | observed | 2026-04-09 | Covers `Select Column`, context menus, and overlay-driven lists. |
| Active Ant Design dropdowns can exist before standard visibility filters pass; evidence must follow expanded combobox ownership, not opacity alone. | UI evidence capture | Live DOM observation | observed | 2026-04-09 | Prevents false assumptions when `Select Column` or similar dropdowns are animating. |

## How To Maintain

- Add the module or scope.
- Add the source type and date.
- Mark the rule as `confirmed`, `observed`, `user-seeded`, or `provisional`.
- Update the raw source in `04-knowledge-raw/APP_TESTING_STANDARDS/` when the rule becomes durable.
- Update or remove weaker rules when stronger evidence arrives.
- Keep this file focused on application-specific truth, not generic QA method.

## Entry Template

| Rule | Scope | Source | Status | Last Verified | Notes |
| --- | --- | --- | --- | --- | --- |
| Example rule | Example module | Live UI observation | provisional | YYYY-MM-DD | Replace with stronger evidence when available. |
