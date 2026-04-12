# PGN Billing App Testing Standards

## Purpose

Working raw source for PGN Billing application-specific testing standards.

This file exists outside `04-knowledge-raw/QA_STANDARDS/` because the rules here are product-specific, not generic QA method.

## Current Rules

| Rule | Scope | Source | Status | Last Verified | Notes |
| --- | --- | --- | --- | --- | --- |
| USD amounts should be rounded and displayed with 2 decimal places, e.g. `10` -> `10.00`. | Cross-module amount assertions | User request on 2026-04-09 | user-seeded | 2026-04-09 | Upgrade to stronger status after runtime or business confirmation. |
| Dates currently render in list/detail UI as `DD MMM YYYY`, e.g. `09 Apr 2026`. | Billing Cycle, Transaction Mapping | Live UI observation | observed | 2026-04-09 | Re-check when module-specific evidence differs. |
| Boolean-style list values display in uppercase `TRUE` / `FALSE`. | Transaction Mapping list | Live UI observation | observed | 2026-04-09 | Keep uppercase in assertions unless stronger evidence replaces it. |
| List assertions must read headers from the active DOM table and must not use stale notes or hardcoded column indexes. | Cross-module list verification | Live DOM observation and RCA | observed | 2026-04-09 | Prevents AI from replaying stale column assumptions. |
| `ACTION` columns may be icon-only and appear blank as text; assertions must inspect clickable descendants or helper output. | List pages with row actions | Live UI observation | observed | 2026-04-09 | Prevents false negatives on action detection. |
| Ant Design list pages can split header and body into separate DOM tables. | UI evidence capture | Live DOM observation | observed | 2026-04-09 | Evidence must build a logical table, not trust one raw `table`. |
| Active option lists can come from Ant Select or Ant Menu overlays; assertions must capture the live overlay options, not infer them. | Dropdown and menu evidence capture | Live DOM observation and RCA | observed | 2026-04-09 | Covers Select Column, context menus, and similar overlay-driven lists. |
| Active Ant Design dropdowns can exist before standard visibility filters pass; evidence must follow expanded combobox ownership, not opacity alone. | Ant Design dropdown automation | Live DOM observation | observed | 2026-04-09 | Prevents missing options during opening animation. |

## Maintenance

- Add exact scope and example formatting whenever possible.
- Keep source strength explicit: `confirmed`, `observed`, `user-seeded`, or `provisional`.
- Distill stable rules into `02-brain/distilled-output/global/app-specific-testing-standards.md`.
- Replace weaker rules when stronger runtime or business evidence appears.
