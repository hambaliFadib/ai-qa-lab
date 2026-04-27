# FALID READY COMMANDS

Run these commands from `D:\AI-QA-LAB\01-runtime\runtime`.
Use this file as the operator command surface for FALID AI WORKSPACE.
Use `docs/ACTIVE_RUNTIME_SURFACE.md` first so AI and operators stay on the trusted runtime path instead of scratch scripts.

## Runtime Layout

- `docs/` holds runtime truth and operator guidance.
- `access/` holds app entry and generic UI access probes.
- `capture/` holds manual flow recording.
- `modules/` holds active regression runners and module suites.
- `session/` holds session/profile entrypoints and wrappers to canonical auth tools.
- `shell/` holds lightweight PowerShell API/menu helpers.

## Runtime

- `..\tools\set-browser-use-env.ps1`
- `..\tools\ensure-litellm-opencode-go.ps1`
- `node ..\tools\browser-use-mcp-check.js`
- `node access\browser-use-open.js`
- `node ..\tools\check-cdp.js`
- `node ..\tools\check-auth-session.js`
- `node ..\tools\capture-session.js`
- `node ..\tools\restore-session.js`
- `node ..\tools\refresh-knowledge-raw-catalog.js`
- `node ..\tools\refresh-recall-index.js`
- `node session/check-session.js`
- `node session/capture-session.js`
- `node session/open-with-profile.js`
- `node access/browser-use-open.js`
- `node access/open-pgn.js`
- `node access/cdp-connect.js`
- `node modules/run-active-module-regression.js --mode happy`
- `node modules/run-active-module-regression.js --mode negative`
- `node modules/run-active-module-regression.js --mode edge`
- `node modules/run-active-module-regression.js --mode full`
- `node modules/run-active-module-regression.js --mode full --dry-run`
- `node modules/run-active-module-regression.js --module transaction-mapping --mode smoke --dry-run`
- `node modules/run-active-module-regression.js --module transaction-mapping --mode happy`
- `node modules/run-active-module-regression.js --module transaction-mapping --mode flow`
- `node modules/transaction-mapping/execution-baseline.js --mode smoke --dry-run`
- `node modules/transaction-mapping/execution-baseline.js --mode happy`
- `node modules/transaction-mapping/execution-baseline.js --mode full`
- `node modules/transaction-mapping/happy-path.js`
- `node modules/transaction-mapping/negative-suite.js`
- `node modules/transaction-mapping/edge-suite.js`
- `node modules/transaction-mapping/full-suite.js`
- `node modules/transaction-mapping/probes/verify-list.js`
- `node capture/manual-flow-recorder.js`
- `node ..\tools\check-list-persistence.js`
- `npm run check:access`

`..\tools\set-browser-use-env.ps1` prompts for the Browser Use provider key for the current PowerShell session and sets `BROWSER_USE_HEADLESS=false` without writing secrets to disk. Use `-Provider litellm` for the preferred Browser Use route: local LiteLLM proxy to OpenCode Go `glm-5`. Alternatively, copy `02-brain\.opencode\config\browser-use.local.env.example` to `02-brain\.opencode\config\browser-use.local.env`; `browser-use-local.cmd` loads that local-only file only for the Browser Use MCP process.

For OpenCode model credentials, prefer OpenCode `/connect` or `02-brain\.opencode\config\opencode-provider.local.env` copied from `opencode-provider.local.env.example`. The wrapper loads this file for OpenCode/Engineer only. Browser Use env is isolated in `browser-use-local.cmd`, which prevents a stale Browser Use `OPENAI_API_KEY` from breaking `opencode-local.cmd run --agent engineer`.

`..\tools\ensure-litellm-opencode-go.ps1` is called automatically by `..\tools\opencode-local.cmd` unless `AI_QA_AUTOSTART_LITELLM=false`. It starts LiteLLM in the background only when the configured proxy port is not already listening.

`node ..\tools\browser-use-mcp-check.js` checks whether the Browser Use MCP server is configured, `uvx` is available locally, and a provider key is present in the runtime environment. Browser Use is the primary browser executor.

`node access\browser-use-open.js` writes a Browser Use primary handoff for opening PGN Billing. It does not live-run the browser by itself. In OpenCode, use `browser_use` MCP tools for the actual browser interaction.

`node ..\tools\check-cdp.js` validates the local CDP endpoint and auto-recovers the browser when local port `9222` is down. CDP is now fallback/recovery/evidence infrastructure.
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

## Browser Use MCP

- `..\tools\set-browser-use-env.ps1`
- `node ..\tools\browser-use-mcp-check.js`
- `node access\browser-use-open.js`
- `docs\BROWSER_USE_SMOKE_TEST.md`

The Browser Use MCP server is configured as `browser_use` in `opencode.json` and is the primary browser executor. It runs locally through:

```powershell
01-runtime\tools\browser-use-local.cmd
```

Preferred local model route:

```text
Browser Use -> LiteLLM proxy -> OpenCode Go glm-5
```

Put the OpenCode Go key in `02-brain\.opencode\config\litellm-opencode-go.local.env` as `OPENCODE_GO_API_KEY`. Put the LiteLLM master key in `browser-use.local.env` as `OPENAI_API_KEY`, with `OPENAI_BASE_URL=http://127.0.0.1:4000/v1` and `OPENAI_API_BASE=http://127.0.0.1:4000/v1`. Do not store provider keys in `opencode.json`. The default local QA posture is non-headless (`BROWSER_USE_HEADLESS=false`).

Daily startup:

```powershell
cd D:\AI-QA-LAB
node .\01-runtime\tools\browser-use-mcp-check.js
D:\AI-QA-LAB\01-runtime\tools\falid-local.cmd D:\AI-QA-LAB --continue --agent engineer
```

OpenCode serve startup:

```powershell
cd D:\AI-QA-LAB
cmd /c "01-runtime\tools\falid-local.cmd serve"
```

Use the wrapper, not direct `opencode serve`, when you want project-local storage and automatic LiteLLM proxy startup.

OpenCode provider smoke:

```powershell
cmd /c "01-runtime\tools\falid-local.cmd run --agent engineer --title provider-smoke ""Say exactly READY"""
```

## FALID CLI And Web Shell

Use these from `D:\AI-QA-LAB` when you need the local FALID status/action shell rather than the OpenCode TUI:

- `node .\01-runtime\tools\falid-doctor.js`
- `node .\07-falid-shell\scripts\get-status.js`
- `cd .\07-falid-shell\web`
- `npm.cmd run dev`
- `npm.cmd run build`
- `npm.cmd run preview`

The web shell exposes status cards, port information, action buttons, and sanitized log tails. It launches through `07-falid-shell\web\server.js` and reuses the FALID/OpenCode wrappers instead of bypassing project-local runtime storage.

Generated web-shell outputs such as `07-falid-shell\web\node_modules\`, `07-falid-shell\web\dist\`, `07-falid-shell\web\dev-server.*.log`, and `07-falid-shell\runtime\` are local/runtime artifacts unless an operator explicitly decides otherwise.

Expected check statuses:

- `READY_CONFIGURED`: `opencode.json`, `uvx`, and `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` are ready.
- `READY_NO_PROVIDER_KEY`: Browser Use config and `uvx` are present, but no provider key is visible in the runtime environment.
- `NEEDS_SETUP`: config schema, command, enabled state, secret placement, or `uvx` needs correction.

Smoke prompts inside OpenCode:

```text
buka aplikasi pgn
buka transaction mapping dan ringkas state halaman
buka create transaction mapping lalu coba pilih Category
```

## Playwright/CDP Fallback

- `npm run playwright:mcp`
- `node ..\tools\playwright-mcp-server.mjs`

The Playwright MCP server attaches to the existing CDP browser, exposes focused UI tools, and saves screenshots under `01-runtime/artifacts/screenshots/`.
Use it only when Browser Use fails, deterministic screenshot/snapshot evidence is required, CDP session recovery is needed, or low-level DOM/console evidence is needed.
If the local CDP endpoint is unavailable, the shared CDP utility now attempts browser recovery before the MCP server attaches.

## Active Module Regression

- `node modules/run-active-module-regression.js --module transaction-mapping --mode smoke --dry-run`
- `node modules/run-active-module-regression.js --module transaction-mapping --mode happy`
- `node modules/run-active-module-regression.js --module transaction-mapping --mode flow`
- `node modules/run-active-module-regression.js --mode happy`
- `node modules/run-active-module-regression.js --mode negative`
- `node modules/run-active-module-regression.js --mode edge`
- `node modules/run-active-module-regression.js --mode full`
- `node modules/run-active-module-regression.js --mode full --dry-run`

## Transaction Mapping

- `node modules/transaction-mapping/execution-baseline.js --mode smoke --dry-run`
- `node modules/transaction-mapping/execution-baseline.js --mode happy`
- `node modules/transaction-mapping/execution-baseline.js --mode edge`
- `node modules/transaction-mapping/execution-baseline.js --mode full`
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

Use `..\tools\falid-local.cmd` as the preferred FALID AI WORKSPACE launcher so OpenCode config/data/state stay inside `01-runtime/temp/opencode-xdg/`. `..\tools\opencode-local.cmd` remains the backward-compatible fallback.
This wrapper keeps future OpenCode runtime storage inside the project instead of spilling `_tmp-xdg*` folders into `D:\AI-QA-LAB`.
See `01-runtime/runtime/docs/OPENCODE_MEMORY_GUIDE.md` for the difference between `/compact`, session resume, and durable FALID AI WORKSPACE brain updates.
In the OpenCode TUI, use `/memory-load` at the start of a fresh session and `/memory-save` before ending important work.

- `..\tools\falid-local.cmd run --dir ..\.. --prompt "$(Get-Content ..\..\.opencode\prompts\auto-orchestration.md -Raw)" "Run Engineer orchestration for the active module."`
- `..\tools\falid-local.cmd run --dir ..\.. --continue --prompt "$(Get-Content ..\..\.opencode\prompts\auto-orchestration.md -Raw)" "Continue the latest Engineer orchestration from the current runtime state."`
- `..\tools\falid-local.cmd run --dir ..\.. --prompt "$(Get-Content ..\..\.opencode\prompts\auto-orchestration.md -Raw)" "Retest the active module with Engineer mode and reconcile any new evidence against the strongest verified local truth."`
- `node ..\tools\audit-opencode-storage.js`
- `node ..\tools\audit-external-opencode-leftovers.js`
- `node ..\tools\archive-temp-workdirs.js --dry-run`
- `node ..\tools\archive-external-opencode-leftovers.js`

## OpenClaw Orchestration

Use these inside OpenCode when a task spans multiple evidence layers and should be planned before execution:

- `preview execution plan`
- `run orchestration plan`
- `approve execution`
- `reject execution`
- `resume orchestration from artifacts`

OpenClaw routing and safety docs:

- `..\..\02-brain\.opencode\orchestrator\openclaw-router.md`
- `..\..\02-brain\.opencode\orchestrator\safe-mode.md`
- `..\..\02-brain\.opencode\orchestrator\execution-plan-template.md`
- `..\..\02-brain\.opencode\orchestrator\approval-gate.md`
- `..\..\02-brain\.opencode\orchestrator\artifact-checker.md`
- `logs\openclaw-execution-log.md`

Default behavior:

- OpenClaw shows the plan first
- SAFE MODE is read-only by default
- no execution happens before explicit approval
- multi-layer tasks must be split into staged artifact steps
- if artifacts already exist, reuse them

## Spreadsheet Test Case Writing

Use these inside OpenCode with Engineer when a target spreadsheet is available:

- `cek format spreadsheet testcase`
- `baca sheet testcase`
- `generate testcase sesuai format sheet`
- `append testcase draft ke spreadsheet`
- `update status execution di spreadsheet`

Route the request through `.opencode/prompts/spreadsheet-testcase-write.md`.
Default behavior is read-first and append-only, and the fallback is `06-testing/testcase-staging/` when spreadsheet MCP is unavailable or write approval is still pending.

Optional non-interactive wrapper:

```powershell
..\tools\falid-local.cmd run --dir ..\.. --prompt "$(Get-Content ..\..\.opencode\prompts\spreadsheet-testcase-write.md -Raw)" "cek format spreadsheet testcase"
```

## Figma Design Reference

Use these inside OpenCode with Engineer when a Figma link or node is available:

- `baca design figma`
- `fetch figma design dari link`
- `cek confidence design figma`
- `generate expected dari figma dengan confidence`
- `summarize figma node`
- `generate expected dari figma bridge`
- `capture UI actual summary only`
- `compare figma dengan UI dan buat confirmation list`
- `compare figma expected dengan UI`
- `compare figma expected dengan MoM/BPMN`
- `compare figma expected dengan testcase`
- `run diagnosis engine`
- `diagnose figma vs ui mismatch`
- `diagnose missing tab cause`
- `diagnose missing field cause`
- `classify mismatch cause`
- `generate confirmation questions`
- `resume compare from artifacts after provider error`
- `buat confirmation list dari design mismatch`
- `generate testcase dari design figma tanpa tulis spreadsheet dulu`
- `evaluasi design mismatch untuk release decision`

Route the request through `.opencode/prompts/figma-to-expected.md` or `.opencode/prompts/design-vs-ui-compare.md`.
Default behavior is read-only, Figma expected references are confidence-scored, and design mismatch requires confirmation before bug classification. Use `06-testing/design-reference-staging/` for reviewable drafts.
If the task spans more than 2 evidence layers among Figma, UI, MoM or BPMN, DB, and spreadsheet testcase, split the work into staged artifacts first and compare summaries only.
If mismatch analysis needs likely-cause reasoning, route through `.opencode/prompts/diagnosis-engine.md` and save the report under `06-testing/design-reference-staging/diagnosis/`.
Remote MCP auth and smoke guidance:

- `docs\FIGMA_REMOTE_MCP_SMOKE_TEST.md`
- `cmd /c "01-runtime\tools\falid-local.cmd mcp auth figma_design"`
- `cmd /c "01-runtime\tools\falid-local.cmd mcp list"`
- `node ..\tools\figma-rest-readonly-check.js`

`falid-local.cmd` now auto-skips LiteLLM startup for `mcp` commands, so Figma auth and list flows should no longer print unrelated Browser Use proxy noise.
If remote MCP auth returns repeated `403 Forbidden`, stop retrying blindly and switch to `..\..\02-brain\.opencode\config\figma-rest-readonly-setup.md` or evaluate Desktop MCP.

Figma REST bridge commands:

- `node ..\tools\figma-rest-fetch-node.js "<FIGMA_URL>"`
- `node ..\tools\figma-rest-summarize-node.js`
- `node ..\tools\figma-rest-expected-handoff.js`

Bridge artifact flow:

- raw source artifact: `06-testing\design-reference-staging\raw\`
- readable structural summary: `06-testing\design-reference-staging\summaries\`
- QA expected handoff: `06-testing\design-reference-staging\expected\`
- diagnosis reports: `06-testing\design-reference-staging\diagnosis\`
- bridge workflow doc: `06-testing\design-reference-staging\COMPARE_BRIDGE_WORKFLOW.md`

Heavy-context split flow:

- fetch or summarize each evidence layer separately
- save artifacts first
- compare summarized artifacts only
- avoid raw JSON, full screenshots, and full search dumps unless they are needed for a specific gap
- if a provider error occurs, resume from the latest artifact instead of restarting the whole compare chain

Optional non-interactive wrappers:

```powershell
..\tools\falid-local.cmd run --dir ..\.. --prompt "$(Get-Content ..\..\.opencode\prompts\figma-to-expected.md -Raw)" "generate expected dari figma dengan confidence"
..\tools\falid-local.cmd run --dir ..\.. --prompt "$(Get-Content ..\..\.opencode\prompts\design-vs-ui-compare.md -Raw)" "compare figma dengan UI dan buat confirmation list"
..\tools\falid-local.cmd run --dir ..\.. --prompt "$(Get-Content ..\..\.opencode\prompts\release-decision.md -Raw)" "evaluasi design mismatch untuk release decision"
```

Read-only smoke command from `D:\AI-QA-LAB`:

```powershell
$prompt = Get-Content .\02-brain\.opencode\prompts\figma-to-expected.md -Raw
.\01-runtime\tools\falid-local.cmd run --dir D:\AI-QA-LAB --agent engineer --prompt $prompt "Baca design Figma ini sebagai referensi read-only: <FIGMA_LINK_OR_NODE_URL>. Jangan tulis ke canvas. Keluarkan Design Confidence dan jangan klasifikasikan mismatch sebagai bug."
```

Figma REST bridge flow from `D:\AI-QA-LAB`:

```powershell
node .\01-runtime\tools\figma-rest-fetch-node.js "<FIGMA_URL>"
node .\01-runtime\tools\figma-rest-summarize-node.js
node .\01-runtime\tools\figma-rest-expected-handoff.js
```

Staged comparison prompts to run inside OpenCode after artifacts exist:

- `capture UI actual summary only`
- `compare staged Figma vs UI`
- `compare staged Figma vs MoM/BPMN`
- `compare staged Figma vs testcase`
- `resume compare from artifacts after provider error`

## Telegram Bug Reporting

- `node ..\tools\telegram-bug-reporter.js --input ..\..\06-testing\bug-reports\telegram\_template.bug-report.json`
- `node ..\tools\telegram-bug-reporter.js --get-updates --label chat-discovery`
- `node ..\tools\telegram-bug-reporter.js --input ..\..\06-testing\bug-reports\telegram\<bug>.json --send`

Dry-run is the default and writes artifacts to `05-observability/telegram-reporting/outbox/`. Fill `02-brain/.opencode/config/telegram-bug-reporter.local.env` before using `--send`.

## Fixtures

- `06-testing\adhoc\fixtures\transaction-mapping-dummy-upload.pdf`

## Ledger

Use `node ..\tools\append-learning-block.js --input <payload.json>` after updating runtime state and distilled knowledge.
The append step now also refreshes `02-brain/.opencode/memory/RECALL_INDEX.md` and the global brain snapshot automatically.
