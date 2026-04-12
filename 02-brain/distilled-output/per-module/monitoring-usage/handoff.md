# Handoff

- Trigger on-demand BPMN extraction for monitoring usage.
- Store the distilled flow in this module folder.
- After the flow is clear, continue with UI and network observation in the migrated runtime.

## Latest DB Reality (2026-04-09)

- Ad-hoc Oracle read-only check for `CURRENCY='USD'` with Prabill usage returned zero overlap.
- Evidence files:
  - `05-observability/db-validation/query-results/20260409T081130Z--prabill-usage-total-rows.json`
  - `05-observability/db-validation/query-results/20260409T081206Z--sample-usd-sa-account-number.json`
  - `05-observability/db-validation/query-results/20260409T081222Z--usd-sa-accounts-usage-check-per-account.json`
  - `05-observability/db-validation/query-results/20260409T081319Z--usd-usage-overlap-exists-check.json`
- Continue with BPMN/API extraction to confirm expected linkage key and expected overlap behavior before classifying defect.

## Latest DB Reality (2026-04-10)

- Request: usage count in rating calculation detail for `CLC260400000038`.
- Result: `M_RBI_RATING_DETAIL_PERIODIC` has 0 rows for this calc code (usage count 0, usage volume 0).
- Cross-check still shows calc execution trail:
  - `R_RBI_CALC_SPECIFIC_CUSTOMER` status `SUCCESS` for `0000000000000517`.
  - `CALCULATE_LOG` has 5 rows for the same calc code.
- Follow-up: if business expects detail persistence on success, validate target detail table path (periodic vs alternate rating detail storage) and ETL/materialization timing.
