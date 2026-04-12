# BUG PATTERNS

## Confirmed Pattern
- Type: Environment
- Pattern: DNS or VPN instability can mimic application failure
- Handling: verify access with CDP first

## Watch Pattern
- Type: Validation / Reference Data
- Pattern: Dropdowns depend on valid option loading
- Handling: confirm selection state

## Confirmed Watch Pattern
- Type: Frontend / Post-Submit
- Pattern: JS error `a is not a function` after Confirm
- **Status**: LOGGED - bug_log.csv #001
- Severity: Low (non-blocking)

## Automation Challenge Pattern
- Type: UI Automation
- Pattern: Approval Hierarchy can be harder to automate on lazy-render-sensitive reruns.
- Impact: one automation path may fail even though the product flow itself has already been verified.
- Workaround: prefer visible Ant Design wrapper interaction, deeper scroll handling, and manual-flow evidence before reopening the module.
- Classification: automation caveat, not a product bug by itself.

## Automation Challenge Pattern (List Action/Filter Targeting)
- Type: UI Automation
- Pattern: On Ant Design list pages, row-level `ACTION` descendants and direct column-filter trigger selectors can intermittently timeout even when page state is stable.
- Impact: can block exhaustive automation coverage while list-level controls still work.
- Workaround: prefer explicit visible descendant selectors, stable wait strategy, controlled scroll/hover, and fallback manual confirmation for final row-action truth.
- Classification: automation caveat unless a user-visible functional failure is reproduced.

## Confirmed Functional Pattern (Tax Code Condition Date)
- Type: Functional / Data Integrity
- Pattern: In `Tax Code > Create > Criteria Information > Condition`, `End Date` on saved condition row can auto-populate with `Start Date` when `End Date` was left blank.
- Impact: period data can become implicitly set without explicit user input.
- Handling: verify row values post-save in condition list; do not rely only on modal input state.

## Evidence Conflict Pattern
- Type: Run Reconciliation
- Pattern: a later weaker rerun can accidentally downgrade module truth that was already verified by stronger earlier evidence.
- Handling: preserve the strongest product evidence and record weaker contradictory evidence as caveat until the contradiction is proven.

## Data State Pattern
- Type: Data Availability / Integration Context
- Pattern: Currency-qualified account sets (e.g. USD from SA pricing rules) may have no current overlap with usage fact table despite high overall usage volume.
- Handling: classify as data-state finding first; do not file product bug unless business flow expects mandatory overlap for the same period and key mapping is confirmed.

## Rating Persistence Pattern
- Type: App to DB Integration Context
- Pattern: Calculation can show `SUCCESS` in `R_RBI_CALC_SPECIFIC_CUSTOMER` and process logs while periodic rating detail table (`M_RBI_RATING_DETAIL_PERIODIC`) still has zero rows for that calculation code.
- Handling: verify both status/log layer and rating-detail persistence layer before concluding usage was actually materialized into periodic detail records.
