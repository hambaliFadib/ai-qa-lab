# ACTIVE MODULE

- Module: Tax Code (ad-hoc functional check)
- Path: System Setup > Master Data > Tax Code
- URL: https://dev-energy.pgn.co.id/system-setup/tax-code
- Priority: High
- Status: **TESTED WITH AUTOMATION CAVEAT** - Major list-level functions were executed via Playwright CDP; some selector-specific row/action checks timed out and need deeper interaction strategy.

## Current Goal

Complete as much functional validation as possible for Tax Code list page controls and report executed pass results with explicit caveats.

## Latest Evidence (2026-04-11)

### Executed And Passed
1. Advanced Search opened and closed.
2. Advanced Search controls worked for:
   - `Add Linear Filter`
   - `Add Filter Rules`
   - `Clear Filter`
   - `Cancel`
3. `Refresh` click executed without visible error.
4. `Create Tax Code` navigated to create form.
5. Create form `Cancel` triggered confirmation popup and `Confirm` returned to list page.
6. Top-right profile dropdown (`Q`) opened and displayed menu (`Profile`, `Switch Position`, `Logout`), then closed.
7. `Download List` click executed with no visible runtime error in current observation.
8. `Column Settings` click executed with no visible runtime error in current observation.

### Automation Caveat
- Some row-level and column-filter-targeted selector attempts hit MCP timeouts during this run, especially around:
  - ACTION-column clickable descendants
  - direct per-column filter trigger targeting
- This is currently classified as automation interaction reliability caveat, not confirmed product bug.

### Newly Confirmed Product Bug (2026-04-11)
- Scope: `Create Tax Code` > `CRITERIA INFORMATION` > `Condition`
- Behavior: condition row `End Date` is auto-filled to the same value as `Start Date` even when `End Date` is not explicitly entered.
- Current classification: Functional / Data Integrity bug (Medium).

## Next Step

1. Keep current evidence as list-level functional pass for executed controls.
2. If deeper coverage is requested, run dedicated row-action checks with stronger selector strategy (visible descendants, stable waits, scroll and hover support).
3. Only classify product defect if manual or stable automation evidence reproduces functional failure.
