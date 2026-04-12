# Test Notes

- BPMN extraction should happen before broad exploratory testing.
- Use the module-specific BPMN prompt and the Smart Meter source map.
- Capture the first API inventory only after access is stable.

## Ad-hoc DB Notes (2026-04-09)

- Request executed: check accounts with `CURRENCY='USD'` in DB that have Prabill usage data.
- `PRABILL_USAGE` table is populated (6,703,931 rows), but overlap with USD SA pricing accounts is currently zero.
- USD account-number set from `PRABILL_SA` + `PRABILL_SA_PRCRULE` returned 12 accounts; each currently has `USAGE_ROWS = 0` in `PRABILL_USAGE` by `ACCOUNT_NUMBER`.

## Ad-hoc DB Notes (2026-04-10)

- Request executed: check usage count in rating calculation detail for `CALCULATION_CODE='CLC260400000038'`.
- `M_RBI_RATING_DETAIL_PERIODIC` returned `USAGE_COUNT = 0` and `TOTAL_USAGE_VOLUME = 0`.
- Cross-check tables:
  - `R_RBI_CALC_SPECIFIC_CUSTOMER`: 1 row, `STATUS=SUCCESS`, customer `0000000000000517`.
  - `CALCULATE_LOG`: 5 log rows for the calc code.
- Practical note: for this calc code, status/log success does not imply periodic detail rows are present.
