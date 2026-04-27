# Google Sheets Testcase MCP Setup

`google_sheets_testcase` is reserved in `opencode.json` as a disabled placeholder.

Current state:

- no spreadsheet MCP server implementation was found in this workspace
- the placeholder stays `enabled: false`
- the command points to `01-runtime/tools/google-sheets-testcase-placeholder.cmd` so accidental enablement fails safely

## Required behavior

- read spreadsheet metadata first
- list tabs or sheets before planning writes
- inspect the header row and existing columns
- infer testcase ID, status, priority, and type conventions from existing rows
- append draft rows only unless the user explicitly approved a stronger action
- preserve existing workbook structure, formatting, formulas, and rows
- do not create a new testcase template unless the user explicitly asks

## Activation checklist

1. Choose or install an approved spreadsheet or Google Sheets MCP server outside this placeholder.
2. Keep credentials in an ignored local env file or local secret store, not in Git and not in `opencode.json`.
3. Replace the placeholder command in `opencode.json` with the real MCP server command.
4. Keep `enabled` set to `false` until a smoke test confirms the server can read spreadsheet metadata safely.
5. Enable the server only after the read-first flow is verified.

## Credential posture

- do not hardcode service-account JSON, OAuth tokens, API keys, cookies, or raw auth data in repo files
- prefer local-only env files under `02-brain/.opencode/config/` or the user's shell environment
- write only non-sensitive testcase content and safe evidence references to spreadsheets

## Fallback

If the spreadsheet MCP is unavailable or direct write has not been approved yet, save draft testcase output under `06-testing/testcase-staging/` for review first.
