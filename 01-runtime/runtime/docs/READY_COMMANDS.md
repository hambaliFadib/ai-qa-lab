# READY COMMANDS

Run these commands from `D:\AI-QA-LAB\01-runtime\runtime`.
Use `docs/ACTIVE_RUNTIME_SURFACE.md` first so AI and operators stay on the trusted runtime path instead of scratch scripts.

## Runtime Layout

- `docs/` holds runtime truth and operator guidance.
- `access/` holds app entry and generic UI access probes.
- `capture/` holds manual flow recording.
- `modules/` holds active regression runners and module suites.
- `session/` holds session/profile entrypoints and wrappers to canonical auth tools.
- `shell/` holds lightweight PowerShell API/menu helpers.

## Runtime

- `node ..\tools\check-cdp.js`
- `node ..\tools\check-auth-session.js`
- `node ..\tools\capture-session.js`
- `node ..\tools\restore-session.js`
- `node ..\tools\refresh-knowledge-raw-catalog.js`
- `node ..\tools\refresh-recall-index.js`
- `node session/check-session.js`
- `node session/capture-session.js`
- `node session/open-with-profile.js`
- `node access/open-pgn.js`
- `node access/cdp-connect.js`
- `node modules/run-active-module-regression.js --mode happy`
- `node modules/run-active-module-regression.js --mode negative`
- `node modules/run-active-module-regression.js --mode edge`
- `node modules/run-active-module-regression.js --mode full`
- `node modules/run-active-module-regression.js --mode full --dry-run`
- `node modules/transaction-mapping/happy-path.js`
- `node modules/transaction-mapping/negative-suite.js`
- `node modules/transaction-mapping/edge-suite.js`
- `node modules/transaction-mapping/full-suite.js`
- `node modules/transaction-mapping/probes/verify-list.js`
- `node capture/manual-flow-recorder.js`
- `node ..\tools\check-list-persistence.js`
- `npm run check:access`

`node ..\tools\check-cdp.js` now validates the local CDP endpoint first and auto-recovers the browser when local port `9222` is down.
All runtime scripts that use `connectBrowser()` inherit the same auto-check before opening or testing the app.

`node ..\tools\check-auth-session.js` reports whether the attached browser is already authenticated, needs manual login, or is waiting for OTP.
If login or OTP is required, let the user finish it in the same attached browser and then run `node ..\tools\capture-session.js` to persist the fresh session.

`node session/check-session.js` and `node session/capture-session.js` are runtime-friendly wrappers that delegate to the canonical auth helpers under `01-runtime/tools/`.

## Oracle Read-Only Validation

- `node ..\tools\oracle-readonly-validator.js --sql "select 1 as ok from dual" --label smoke`
- `node ..\tools\run-pgn.js oracle-validate --sql "select 1 as ok from dual" --label smoke`
- `node ..\tools\oracle-readonly-validator.js --query-file shared\01-find-tables-by-keyword.sql --bind KEYWORD=TRANSACTION --bind OWNER_FILTER=PGNBILL --label table-discovery`
- `node ..\tools\oracle-readonly-validator.js --query-file shared\02-describe-table-columns.sql --bind OWNER=PGNBILL --bind TABLE_NAME=YOUR_TABLE --label describe-table`
- `node ..\tools\oracle-readonly-validator.js --query-file transaction-mapping\01-find-latest-transaction-mapping.sql --bind OWNER_FILTER=PGNBILL --bind KEY_HINT=REF_NO --label tx-mapping-discovery`
- `node ..\tools\oracle-readonly-validator.js --dry-run --query-file shared\01-find-tables-by-keyword.sql --bind KEYWORD=USAGE --bind OWNER_FILTER=PGNBILL --label safe-check`

Outputs are written to `05-observability/db-validation/query-results/`.
The runner blocks non-read-only SQL and uses the local env profile from `02-brain/.opencode/config/oracle-readonly.local.env` with fallback to `.opencode/config/oracle-readonly.local.env`.

## Oracle Test-Data Injection

- `node ..\tools\oracle-testdata-injector.js --plan _template.insert-testdata.json`
- `node ..\tools\oracle-testdata-injector.js --plan <plan.json> --apply`
- `node ..\tools\oracle-testdata-injector.js --plan <plan.json> --apply --commit --confirm <plan-token> --confirm-commit TESTDATA_DML_COMMIT`

Plans must live under `06-testing/test-data/db-injection/plans/`. Dry-run is the default; `--apply` executes with rollback unless `--commit` and both confirmation tokens are present.

## Playwright MCP

- `npm run playwright:mcp`
- `node ..\tools\playwright-mcp-server.mjs`

The Playwright MCP server attaches to the existing CDP browser, exposes focused UI tools, and saves screenshots under `01-runtime/artifacts/screenshots/`.
If the local CDP endpoint is unavailable, the shared CDP utility now attempts browser recovery before the MCP server attaches.

## Active Module Regression

- `node modules/run-active-module-regression.js --mode happy`
- `node modules/run-active-module-regression.js --mode negative`
- `node modules/run-active-module-regression.js --mode edge`
- `node modules/run-active-module-regression.js --mode full`
- `node modules/run-active-module-regression.js --mode full --dry-run`

## Transaction Mapping

- `node modules/transaction-mapping/happy-path.js`
- `node modules/transaction-mapping/negative-suite.js`
- `node modules/transaction-mapping/edge-suite.js`
- `node modules/transaction-mapping/full-suite.js`
- `node modules/transaction-mapping/probes/verify-list.js`
- `node modules/transaction-mapping/probes/get-existing-item.js`
- `node ..\tools\append-learning-block.js --input <payload.json>`

## Session And PowerShell Helpers

- `node session/check-session.js`
- `node session/capture-session.js`
- `node session/open-with-profile.js`
- `.\session\shell\check-session.ps1`
- `.\session\shell\decode-token.ps1`
- `.\shell\discover-api.ps1`
- `.\shell\fetch-menu.ps1`
- `.\shell\find-menu.ps1 -Keyword Transaction`
- `.\shell\test-api.ps1`

## OpenCode Orchestration

Use `..\tools\opencode-local.cmd` so OpenCode config/data/state stay inside `01-runtime/temp/opencode-xdg/`.
This wrapper keeps future OpenCode runtime storage inside the project instead of spilling `_tmp-xdg*` folders into `D:\AI-QA-LAB`.
See `01-runtime/runtime/docs/OPENCODE_MEMORY_GUIDE.md` for the difference between `/compact`, session resume, and durable AI-QA-LAB brain updates.
In the OpenCode TUI, use `/memory-load` at the start of a fresh session and `/memory-save` before ending important work.

- `..\tools\opencode-local.cmd run --dir ..\.. --prompt "$(Get-Content ..\..\.opencode\prompts\auto-orchestration.md -Raw)" "Run Engineer orchestration for the active module."`
- `..\tools\opencode-local.cmd run --dir ..\.. --continue --prompt "$(Get-Content ..\..\.opencode\prompts\auto-orchestration.md -Raw)" "Continue the latest Engineer orchestration from the current runtime state."`
- `..\tools\opencode-local.cmd run --dir ..\.. --prompt "$(Get-Content ..\..\.opencode\prompts\auto-orchestration.md -Raw)" "Retest the active module with Engineer mode and reconcile any new evidence against the strongest verified local truth."`
- `node ..\tools\audit-opencode-storage.js`
- `node ..\tools\audit-external-opencode-leftovers.js`
- `node ..\tools\archive-temp-workdirs.js --dry-run`
- `node ..\tools\archive-external-opencode-leftovers.js`

## Telegram Bug Reporting

- `node ..\tools\telegram-bug-reporter.js --input ..\..\06-testing\bug-reports\telegram\_template.bug-report.json`
- `node ..\tools\telegram-bug-reporter.js --get-updates --label chat-discovery`
- `node ..\tools\telegram-bug-reporter.js --input ..\..\06-testing\bug-reports\telegram\<bug>.json --send`

Dry-run is the default and writes artifacts to `05-observability/telegram-reporting/outbox/`. Fill `02-brain/.opencode/config/telegram-bug-reporter.local.env` or `02-brain/.opencode/config/telegram-bug-reporter.env` before using `--send`.

## Fixtures

- `06-testing\adhoc\fixtures\transaction-mapping-dummy-upload.pdf`

## Ledger

Use `node ..\tools\append-learning-block.js --input <payload.json>` after updating runtime state and distilled knowledge.
The append step now also refreshes `02-brain/.opencode/memory/RECALL_INDEX.md` and the global brain snapshot automatically.
