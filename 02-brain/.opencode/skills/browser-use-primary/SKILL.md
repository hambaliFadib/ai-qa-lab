# Browser Use Primary

## Goal

Use Browser Use as the primary browser automation layer for PGN Billing QA while preserving Playwright/CDP as the fallback, evidence, screenshot, and recovery layer.

## Use Browser Use First For

- Opening PGN Billing pages.
- Navigating menus and tabs.
- Normal click/type/scroll interactions.
- Exploratory module sweeps.
- Broad UI state extraction through `browser_get_state` and `browser_extract_content`.

## Preferred Browser Use MCP Tools

- `browser_navigate`
- `browser_click`
- `browser_type`
- `browser_get_state`
- `browser_scroll`
- `browser_extract_content`
- `browser_list_tabs`
- `browser_switch_tab`
- `browser_list_sessions`
- `browser_close_session`
- `retry_with_browser_use_agent`

## Fallback To Playwright/CDP When

- Browser Use cannot reach or operate the page.
- A deterministic screenshot, DOM snapshot, console check, or selector-level artifact is needed.
- CDP browser/session recovery is needed.
- Low-level evidence is needed before bug reporting.
- Browser Use output conflicts with UI/API/DB evidence.

## Classification Rule

Browser Use failure is not automatically a product bug. Classify it as `script_false_positive` or `needs_manual_review` unless stable Browser Use, Playwright/CDP, manual, API, or DB evidence proves product behavior is wrong.

## Oracle Boundary

- Use `oracle_readonly` only for read-only proof.
- Use `oracle_testdata` only for explicit controlled test-data setup when UI/API setup is blocked or direct setup is required.
- Never use Oracle write paths as a shortcut for ordinary browser execution.
