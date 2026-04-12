# Test Notes

- Module: Tax Code
- Path: System Setup > Master Data > Tax Code
- URL: https://dev-energy.pgn.co.id/system-setup/tax-code
- Status: **TESTED WITH AUTOMATION CAVEAT**

## Executed Coverage (2026-04-11)

### List-Level Controls
- Advanced Search: open/close
- Add Linear Filter
- Add Filter Rules
- Clear Filter
- Refresh
- Create Tax Code -> open create page
- Create page Cancel -> Confirm -> return list
- Top-right profile dropdown (`Q`) open/close and menu visibility
- Download List click (no visible error during run)
- Column Settings click (no visible error during run)

### Evidence
- `01-runtime/artifacts/screenshots/playwright-mcp-1775913684616-tax-code-baseline.png`
- `01-runtime/artifacts/screenshots/playwright-mcp-1775913902590-tax-code-advanced-search-open.png`
- `01-runtime/artifacts/screenshots/playwright-mcp-1775913913166-tax-code-advanced-search-linear-filter-added.png`
- `01-runtime/artifacts/screenshots/playwright-mcp-1775913917291-tax-code-advanced-search-filter-rules-added.png`
- `01-runtime/artifacts/screenshots/playwright-mcp-1775913974456-tax-code-final-state-after-functional-pass.png`

## Automation Caveat
- Row-level action descendants and direct per-column filter trigger targeting showed intermittent MCP selector timeout.
- Classified as automation caveat until user-visible functional failure is reproduced.

## Confirmed Product Bug (2026-04-11)

- Area: `Create Tax Code` > `CRITERIA INFORMATION` > `Condition`
- Scenario: create condition row, fill mandatory fields up to `Start Date`, leave `End Date` empty, then save.
- Observed: resulting condition list row shows `END DATE` auto-filled equal to `START DATE` (`11 Apr 2026`).
- Expected: `END DATE` remains empty/null when not explicitly entered by user.

### Evidence
- `01-runtime/artifacts/adhoc-notes/tax-code-condition-list-current-state.json`
- `01-runtime/artifacts/screenshots/tax-code-condition-list-current-state.png`
- `05-observability/telegram-reporting/outbox/20260411T151408Z--tax-code-end-date-pada-condition-auto-terisi-mengikuti-start-date-meski-end-date-tidak-diinput.md`
