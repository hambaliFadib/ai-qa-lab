# LAST RUN SUMMARY

- Date: 2026-04-09
- App: PGN Billing (dev-energy)
- Role: qaempat (End User)
- Runtime mode: Oracle read-only validation + CDP session available

## Ad-hoc DB Validation Summary (USD + Prabill Usage)

### Objective
- Check accounts with currency `USD` in Prabill that already have usage data.

### Evidence Executed
1. `PRABILL_USAGE` schema and row volume verified (`TOTAL_USAGE_ROWS = 6,703,931`).
2. `PRABILL_SA` + `PRABILL_SA_PRCRULE` join verified for `CURRENCY = 'USD'`.
3. Per-account usage check executed for all USD account numbers from SA pricing rule.
4. Fast overlap existence check executed between USD SA accounts and `PRABILL_USAGE` by account number.

### Result
- USD accounts found in SA pricing context: **12 account numbers**.
- Usage rows for all 12 USD accounts: **0**.
- Overlap check result: **0** (no USD SA account number currently appears in `PRABILL_USAGE`).

### Interpretation
- Current DB evidence shows **no account with currency USD (from `PRABILL_SA_PRCRULE`) that has usage data in `PRABILL_USAGE`**.
- This is a **data state finding**, not an application blocker.

### Key Evidence Files
- `05-observability/db-validation/query-results/20260409T081130Z--prabill-usage-total-rows.json`
- `05-observability/db-validation/query-results/20260409T081206Z--sample-usd-sa-account-number.json`
- `05-observability/db-validation/query-results/20260409T081222Z--usd-sa-accounts-usage-check-per-account.json`
- `05-observability/db-validation/query-results/20260409T081319Z--usd-usage-overlap-exists-check.json`

## Next Steps

1. If needed, verify whether usage linkage should be by `ACCOUNT_NUMBER`, `ACCOUNT_ID`, or another key from the business flow/API contract.
2. If user provides one target account, run focused triage across SA, pricing rule, usage, and account master.

## Ad-hoc DB Validation Summary (Calculation Detail - 2026-04-10)

### Objective
- Check usage count in rating calculation detail for `CALCULATION_CODE = 'CLC260400000038'`.

### Evidence Executed
1. Count rows in `PGNBILL.M_RBI_RATING_DETAIL_PERIODIC` by calc code.
2. Sum `USAGE_VOLUME` for the same calc code.
3. Cross-check execution traces in `PGNBILL.R_RBI_CALC_SPECIFIC_CUSTOMER` and `PGNBILL.CALCULATE_LOG`.

### Result
- Rating detail usage row count: **0**
- Rating detail total usage volume: **0**
- Calc specific customer row exists and status is **SUCCESS** for account `0000000000000517`.
- Calculate log rows exist (5 rows), without explicit `USAGE` keyword lines.

### Key Evidence Files
- `05-observability/db-validation/query-results/20260410T040520Z--usage-count-and-sum-from-rating-detail-038.json`
- `05-observability/db-validation/query-results/20260410T040525Z--usage-profile-in-rating-detail-038.json`
- `05-observability/db-validation/query-results/20260410T040443Z--detail-calc-specific-customer-038.json`
- `05-observability/db-validation/query-results/20260410T040508Z--calc-log-038-full-msg.json`

## Ad-hoc UI Functional Check Summary (Tax Code - 2026-04-11)

### Objective
- Execute functional checks on Tax Code list page controls under `System Setup > Master Data > Tax Code`.

### Scope Executed
1. Open and close `Advanced Search` modal.
2. Use `Add Linear Filter`, `Add Filter Rules`, and `Clear Filter` inside Advanced Search.
3. Close Advanced Search via `Cancel`.
4. Click `Refresh` on list page.
5. Click `Create Tax Code` and verify navigation to `/system-setup/tax-code/create`.
6. Trigger create-page `Cancel` and verify confirmation popup + `Confirm` return to list.
7. Open and close top-right profile dropdown (`Q`) and verify visible menu options.
8. Trigger `Download List` click (no visible error shown in current CDP observation).
9. Trigger `Column Settings` click (no visible error shown in current CDP observation).

### Result
- **PASS (executed controls)** for all items in scope above.
- **No visible validation/runtime error** appeared during those interactions.

### Partial Coverage / Caveat
- Some lower-level interaction checks timed out on CDP for selector-specific attempts:
  - row-level `ACTION` column clickable descendants
  - direct header-filter trigger automation attempts on specific columns
- Classification: **AUTOMATION_CAVEAT** (interaction/selector reliability), not yet evidence of product defect.

### Evidence Screenshots
- `01-runtime/artifacts/screenshots/playwright-mcp-1775913684616-tax-code-baseline.png`
- `01-runtime/artifacts/screenshots/playwright-mcp-1775913902590-tax-code-advanced-search-open.png`
- `01-runtime/artifacts/screenshots/playwright-mcp-1775913913166-tax-code-advanced-search-linear-filter-added.png`
- `01-runtime/artifacts/screenshots/playwright-mcp-1775913917291-tax-code-advanced-search-filter-rules-added.png`
- `01-runtime/artifacts/screenshots/playwright-mcp-1775913974456-tax-code-final-state-after-functional-pass.png`

## Ad-hoc Bug Confirmation (Tax Code Condition End Date - 2026-04-11)

### Objective
- Validate user-reported issue: on `Create Tax Code` > `CRITERIA INFORMATION` > `Condition`, `End Date` is auto-filled with `Start Date` even when `End Date` is not entered.

### Evidence Executed
1. Navigated to `https://dev-energy.pgn.co.id/system-setup/tax-code/create`.
2. Opened `CRITERIA INFORMATION` and selected `Condition` mode.
3. Created a condition row and populated required fields up to `Start Date`.
4. Saved condition row and inspected resulting condition list row values.

### Result
- **BUG CONFIRMED** on condition list row:
  - `START DATE`: `11 Apr 2026`
  - `END DATE`: `11 Apr 2026` (auto-filled), despite `End Date` not being explicitly entered.

### Classification
- Type: Functional / Data Integrity
- Severity: Medium
- Status: Open (reported to Telegram group)

### Key Evidence Files
- `01-runtime/artifacts/adhoc-notes/tax-code-condition-list-current-state.json`
- `01-runtime/artifacts/screenshots/tax-code-condition-list-current-state.png`
- `05-observability/telegram-reporting/outbox/20260411T151408Z--tax-code-end-date-pada-condition-auto-terisi-mengikuti-start-date-meski-end-date-tidak-diinput.json`
