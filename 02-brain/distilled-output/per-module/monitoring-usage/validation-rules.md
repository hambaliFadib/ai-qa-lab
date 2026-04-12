# Validation Rules

- Confirm the BPMN source first; do not invent field rules.
- Treat date or usage-period assumptions as unconfirmed until a source or UI observation proves them.
- Keep any validation notes explicitly tied to the extracted source file.

## Current DB Validation Guardrail

- For USD scope, use `PRABILL_SA_PRCRULE.CURRENCY` as the currency source and join through `PRABILL_SA.PRABILL_SA_ID`.
- Do not assume `PRABILL_USAGE` contains SA-level key linkage; schema check confirms no `SA_NUMBER` column in `PRABILL_USAGE`.
- Treat zero-overlap result as provisional data-state truth until BPMN/API evidence defines required key mapping and expected overlap behavior.

## Calc-Code Detail Guardrail

- For calc-code usage claims, query `M_RBI_RATING_DETAIL_PERIODIC` directly using `CALCULATION_CODE` and usage fields (`USAGE_MEAS_DATE`, `USAGE_VOLUME`, `USAGE_ENERGY`).
- Validate with dual-layer cross-check: `R_RBI_CALC_SPECIFIC_CUSTOMER` (status/message) and `CALCULATE_LOG` (process trail).
- Do not infer detail-row existence from `SUCCESS` status alone.
