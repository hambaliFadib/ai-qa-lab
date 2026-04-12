# CONTEXT_HANDOFF.md

## Current App
- App: PGN Billing
- Environment: dev-energy
- Access method: CDP browser (port 9222)

## Access Status
- CDP browser: **Working** (Chrome with remote debugging)
- Application access: **ACCESS_STABLE** (session valid)
- Session: Fresh session captured after manual login
- User: qaempat (End User)

## Active Module
- Module: Tax Code (ad-hoc functional check)
- Path: System Setup > Master Data > Tax Code
- URL: https://dev-energy.pgn.co.id/system-setup/tax-code
- Status: **TESTED WITH AUTOMATION CAVEAT** - key list controls executed successfully; row-action/column-targeted selector checks need deeper automation strategy

## Reconciled Evidence Summary (2026-04-06)

### Verified Product Outcome
1. Manual create flow reached `Save`, `Submit`, and `Confirm`.
2. CDP verification confirmed created rows persisted in the list with `Waiting Approval` status.
3. Post-submit JS error `a is not a function` is confirmed non-blocking and already logged.

### Additional Test Coverage
1. Empty Required Fields - passed with 8 expected validation errors.
2. Only Name Filled - passed with 7 expected validation errors.
3. Special Characters - passed without evidence of XSS bypass.

### Automation Caveat
- A later retest identified an automation-path limitation around the Approval Hierarchy field because the field can stay hard to access until deeper scrolling or a different interaction strategy is used.
- This is useful automation knowledge, but it does not outweigh the stronger earlier evidence that the module flow already worked and persisted successfully.

## Interpretation Rule

- Do not downgrade the module from `COMPLETED` to `BLOCKED` or `AUTOMATION ISSUE IDENTIFIED` unless a newer run disproves the persisted-product evidence.
- When evidence conflicts, keep the strongest verified product truth and record the weaker evidence as a caveat or strategy note.

## Ad-hoc DB Validation (2026-04-09)

- Task: check Prabill accounts with `CURRENCY = 'USD'` that already have usage data.
- Oracle read-only evidence confirms `PRABILL_USAGE` is populated (`6,703,931` rows), but overlap with USD SA pricing accounts is currently `0`.
- USD account list in SA pricing context currently contains 12 account numbers, each with usage row count `0` when checked against `PRABILL_USAGE.ACCOUNT_NUMBER`.
- Classification: data-state finding (no active product blocker).

## Next Best Action

1. Keep current Tax Code evidence as functional pass for executed list controls.
2. If user requests exhaustive row-level actions, continue with targeted selectors plus explicit wait/scroll strategy.
3. Preserve Transaction Mapping completed truth separately; this ad-hoc Tax Code run does not change Transaction Mapping status.

## Ad-hoc DB Validation (2026-04-10)

- Request: check usage count in rating calculation detail for `CALCULATION_CODE = 'CLC260400000038'`.
- DB result in `M_RBI_RATING_DETAIL_PERIODIC`: **0 rows** and **0 usage volume**.
- Cross-check:
  - `R_RBI_CALC_SPECIFIC_CUSTOMER` has 1 row with status `SUCCESS` for account `0000000000000517`.
  - `CALCULATE_LOG` has 5 process log rows for the calc code.
- Classification: calculation detail dataset for this calc code is empty in periodic rating detail table at query time.
