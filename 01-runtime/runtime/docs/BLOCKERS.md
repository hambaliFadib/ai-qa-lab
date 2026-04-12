# BLOCKERS

## Current Status

- **NO ACTIVE PRODUCT BLOCKERS** for Transaction Mapping.
- Product create flow has already been verified and persistence is confirmed.
- **NO CONFIRMED PRODUCT BLOCKER** observed on Tax Code list-level controls for the 2026-04-11 ad-hoc run.

## Automation Caveat

- Type: AUTOMATION_CAVEAT
- Status: OPEN_FOR_STRATEGY_IMPROVEMENT
- Scope: specific retest path for Approval Hierarchy interaction
- Impact: does not invalidate the completed product verification

## Reconciled Evidence

### Verified Product Outcome
- Manual create flow reached final submit and confirm steps.
- CDP verification confirmed created rows appear in the list with `Waiting Approval` status.
- Post-submit JS error `a is not a function` is logged as a low-severity non-blocking frontend issue.

### Verified Validation Coverage
- Empty required fields: passed
- Only name filled: passed
- Special characters: passed without XSS bypass evidence

### Remaining Automation Challenge
- Approval Hierarchy may render lazily and become hard to access through one automation path.
- This is an automation-method issue unless newer evidence proves the product itself fails.
- Do not reopen Transaction Mapping as blocked unless persistence or user-visible product behavior regresses.

## What To Do Next

1. Keep module status complete for product verification.
2. Improve automation strategy only if more retests are needed.
3. Reclassify only when stronger contradictory evidence exists.
4. For Tax Code, continue deeper row-action checks only with stable selector strategy if exhaustive coverage is required.

## Tax Code Automation Caveat (2026-04-11)

- Type: AUTOMATION_CAVEAT
- Scope: row-level `ACTION` descendant interaction and direct per-column filter targeting
- Symptom: intermittent MCP click timeouts on selector-specific attempts
- Impact: list-level controls are still validated as passing for executed scope

## Tax Code Product Bug (2026-04-11)

- Type: PRODUCT_BUG
- Module: Tax Code > Create > Criteria Information > Condition
- Symptom: `End Date` on condition list row auto-populates with `Start Date` even when user does not input `End Date`.
- Impact: data-period integrity risk in condition records.
- Severity: Medium
- Status: OPEN_REPORTED (Telegram sent)

## Monitoring Usage Data Note (2026-04-09)

- DB validation request executed: `CURRENCY = 'USD'` accounts with usage data in Prabill.
- Result: 0 overlap rows found.
- Classification: not a blocker by itself; treat as current data availability state.

## Rating Calculation Detail Note (2026-04-10)

- DB validation request executed: usage count for `CALCULATION_CODE = 'CLC260400000038'` in periodic rating detail.
- Result: `M_RBI_RATING_DETAIL_PERIODIC` has 0 rows for this calc code (usage count 0; summed usage volume 0).
- Cross-check status/log rows still exist and show success path in calc-specific tracking.
- Classification: data-state/integration observation; no new product blocker declared from this single check.
