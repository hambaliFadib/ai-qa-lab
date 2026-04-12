# AI-QA-LAB Full Specification

- Generated: 2026-04-12
- Workspace root: `D:\AI-QA-LAB`
- Primary operating mode: local-first OpenCode QA workspace
- Primary agent: `Engineer`
- Current live access note: Oracle DB and PGN Billing app cannot be live-validated right now because VPN is not connected. MCP servers are configured and OpenCode reports them as connected, but app/DB reachability still depends on VPN.
- Storage policy status: `policy_compliant: true` from `01-runtime/tools/audit-opencode-storage.js`

## 1. Executive Summary

`AI-QA-LAB` is a project-local QA operating system for PGN Billing. It combines OpenCode, durable project memory, Playwright/CDP browser automation, Oracle DB read-only validation, guarded Oracle test-data injection, Telegram bug reporting, MoM/BPMN/raw knowledge routing, module knowledge packs, runtime evidence, and an append-only learning ledger.

The workspace is designed so the AI can work as one unified `Engineer` instead of splitting into separate explorer, executor, logger, debugger, or build roles. The intended loop is:

1. Load durable memory and runtime handoff.
2. Read the smallest relevant module and raw knowledge source.
3. Use Playwright/CDP for UI evidence.
4. Use Oracle read-only for DB proof when VPN is available.
5. Use guarded `oracle_testdata` only when direct DB test-data setup is explicitly required.
6. Produce test cases, exploratory findings, RCA, bug reports, or automation output.
7. Update runtime docs, distilled knowledge, memory, recall index, and learning ledger.

## 2. Current Operational Status

| Area | Status | Notes |
| --- | --- | --- |
| Root storage | OK | `.opencode` root is aligned to `02-brain/.opencode`. |
| OpenCode local wrapper | OK | Use `01-runtime/tools/opencode-local.cmd` so config/data/cache/state stay inside `01-runtime/temp/opencode-xdg/`. |
| MCP list | OK | `playwright_cdp`, `oracle_readonly`, `oracle_testdata`, and `telegram_bug_reporter` are reported connected by OpenCode. |
| CDP browser layer | OK/recovered | `check-cdp.js` recovered Chrome on port `9222` using `03-auth/chrome-profile`. |
| PGN Billing app | Blocked now | Requires VPN; current instruction says VPN is not connected. |
| Oracle DB live smoke | Blocked now | Requires VPN and network permission; do not treat this as DB failure. |
| Telegram reporting | OK dry-run | Token and chat are configured; latest dry-run wrote to `05-observability/telegram-reporting/outbox/20260412T023008Z--ai-workspace-spec-telegram-dry-run.json`. |
| Learning ledger | OK | Latest observed block: `LLV1-000020`, module `tax-code`. |
| Raw knowledge catalog | OK | `52` raw files cataloged under `02-brain/distilled-output/global/raw-knowledge-catalog.md`. |

## 3. Root Layout

| Path | Role |
| --- | --- |
| `.opencode` | Junction/link to `02-brain/.opencode`; active OpenCode brain surface. |
| `01-runtime/` | Runtime scripts, tools, active artifacts, local temp storage, Playwright runtime. |
| `02-brain/` | Durable AI brain, OpenCode agents/skills/prompts/commands, distilled knowledge, learning ledger. |
| `03-auth/` | Chrome profile, auth/session state, browser profile material. Low-priority context unless session recovery is active. |
| `04-knowledge-raw/` | Raw MoM, BPMN, QA standards, and PGN Billing app testing standards. |
| `05-observability/` | DB validation, DB injection evidence, Telegram outbox, storage audit evidence. |
| `06-testing/` | Test data, UAT/testcase output area, bug report templates, fixtures. |
| `99-archive/` | Legacy or uncertain leftovers archived instead of deleted. |
| `opencode.json` | MCP server configuration. |
| `README.md` | Workspace overview and quick start. |

## 4. OpenCode Configuration

Active OpenCode config file: `opencode.json`.

Configured MCP servers:

| MCP | Command | Timeout | Status from latest list |
| --- | --- | --- | --- |
| `playwright_cdp` | `node 01-runtime/tools/playwright-mcp-server.mjs` | `30000` | connected |
| `oracle_readonly` | `node 01-runtime/tools/oracle-readonly-mcp-server.mjs` | `20000` | connected |
| `oracle_testdata` | `node 01-runtime/tools/oracle-testdata-mcp-server.mjs` | `30000` | connected |
| `telegram_bug_reporter` | `node 01-runtime/tools/telegram-bug-reporter-mcp-server.mjs` | `30000` | connected |

Important distinction:

- MCP server connected means OpenCode can launch and talk to the local MCP process.
- It does not guarantee the PGN Billing app or Oracle DB is reachable without VPN.

## 5. Primary Agent: Engineer

Active agent file: `02-brain/.opencode/agents/engineer.md`.

Engineer combines these roles in one chain:

- QA architect
- Business analyst
- Exploratory tester
- Automation executor
- Build and tooling integrator when runtime/support repair is needed
- Bug logger
- RCA investigator
- App to API to DB infrastructure analyst
- Durable learning updater

Engineer must read these durable context files before meaningful work:

- `02-brain/.opencode/memory/RECALL_INDEX.md`
- `02-brain/.opencode/memory/USER_WORKING_PREFERENCES.md`
- `01-runtime/runtime/docs/CONTEXT_HANDOFF.md`
- `01-runtime/runtime/docs/ACTIVE_MODULE.md`
- `01-runtime/runtime/docs/LAST_RUN_SUMMARY.md`
- `01-runtime/runtime/docs/BLOCKERS.md`
- `01-runtime/runtime/docs/SESSION_HEALTH.md`
- `02-brain/.opencode/memory/CURRENT_MISSION.md`
- `02-brain/.opencode/memory/NEXT_ACTIONS.md`
- `02-brain/.opencode/memory/LEARNED_FLOW.md`
- `02-brain/.opencode/memory/BUG_PATTERNS.md`
- `02-brain/.opencode/api-discovery/API_INVENTORY_DISCOVERED.md` when API evidence exists
- `01-runtime/artifacts/adhoc-notes/manual-flow-record-latest.md` when fresh manual flow exists
- `02-brain/distilled-output/per-module/<module>/` when the active module is known
- `02-brain/distilled-output/global/raw-knowledge-catalog.md` before opening raw knowledge broadly

Engineer task lanes:

1. Architecture and scope
2. Business and flow analysis
3. Test case design
4. Exploratory and regression execution
5. Bug logging
6. RCA and infrastructure
7. Build and tooling support
8. Durable learning

Short prompts such as `lanjutkan`, `analisa`, `buat test case`, `cek db`, `cek mom`, `cek flow`, `test module`, and `rca` should continue from files instead of asking for context again.

## 6. Memory, Learning, and History Model

OpenCode has separate memory layers:

| Layer | Path | Purpose |
| --- | --- | --- |
| OpenCode session DB | `01-runtime/temp/opencode-xdg/data/opencode/opencode.db` | Chat/session history and OpenCode todos. Can be empty after reset. |
| Durable memory | `02-brain/.opencode/memory/` | Project-level reusable AI memory. |
| Fast recall | `02-brain/.opencode/memory/RECALL_INDEX.md` | Startup recall summary generated from memory/ledger/config. |
| User preferences | `02-brain/.opencode/memory/USER_WORKING_PREFERENCES.md` | Stable user collaboration preferences. |
| Runtime handoff | `01-runtime/runtime/docs/` | Current run truth, active module, blockers, session status. |
| Module knowledge | `02-brain/distilled-output/per-module/` | Reusable business/test/API/module understanding. |
| Learning ledger | `02-brain/learning-ledger/` | Append-only audit trail of durable learning blocks. |

Important rule:

- `/compact` is not durable long-term memory. It only compacts the active OpenCode session.
- Use `/memory-load` at the start of a fresh TUI session.
- Use `/memory-save` before ending important work.
- Use `append-learning-block.js` after durable updates so `RECALL_INDEX.md` is refreshed.

Project-local TUI commands:

| Command | File | Purpose |
| --- | --- | --- |
| `/memory-load` | `02-brain/.opencode/commands/memory-load.md` | Reads durable brain and runtime handoff; summarizes current mission and blockers. |
| `/memory-save` | `02-brain/.opencode/commands/memory-save.md` | Applies post-run memory updater and persists learning to runtime docs, memory, module packs, and ledger. |

Memory guide:

- `01-runtime/runtime/docs/OPENCODE_MEMORY_GUIDE.md`

## 7. Skills Inventory

Skills live under `02-brain/.opencode/skills/`.

| Skill | Status | Capability |
| --- | --- | --- |
| `bpmn-extractor` | active | On-demand BPMN extraction into per-module business flow notes. Avoids broad batch conversion. |
| `bpmn-mom-testcase-comparator` | active | Reconciles BPMN expected flow, MoM business confirmation, Playwright evidence, and Oracle checkpoint when needed; outputs traceable test cases. |
| `bug-ledger-format` | active | Formats bug outputs into bug ledger, per-module bug history, and learning ledger. |
| `bug-rca-infra` | active | RCA workflow from UI to validation to API to app-to-DB to data/schema; separates product bugs from automation/env issues. |
| `context-handoff-generator` | active | Writes concise `CONTEXT_HANDOFF.md` with app state, access, active module, blocker, API, and next action. |
| `fast-happy-path` | placeholder | File exists but is currently empty; needs implementation before relying on it. |
| `interaction-memory-amplifier` | active | Captures stable user preferences and durable collaboration patterns into memory and ledger. |
| `module-knowledge-updater` | active | Keeps per-module `business-flow.md`, `validation-rules.md`, `dependencies.md`, `known-api.md`, `bug-history.md`, `test-notes.md`, and `handoff.md` aligned. |
| `module-precheck` | active | Read-order discipline before module work: active module, recall, preferences, module pack, raw catalog. |
| `network-response-observer` | placeholder | File exists but is currently empty; needs implementation before relying on it. |
| `open-pgn-app` | active | Opens/reuses PGN Billing app through CDP, separates auth/network/product failures. |
| `oracle-debug-check` | active | Oracle read-only validation workflow, query template use, DB output targets, and forbidden operations. |
| `post-run-memory-updater` | active | End-of-run durable memory updater; updates memory files and appends ledger block. |
| `test-case-designer` | active | Produces positive, negative, edge, regression, UI, API, and DB-aware test cases from module/MoM/BPMN/evidence. |

## 8. Prompt Inventory

Prompts live under `02-brain/.opencode/prompts/`.

| Prompt | Intended Use |
| --- | --- |
| `access-stabilization.md` | Stabilize access/session. |
| `adhoc-bug-capture.md` | Capture ad hoc bug with evidence and update bug history. |
| `auto-orchestration.md` | Full Engineer orchestration over active module. |
| `bpmn-extraction.md` | BPMN extraction workflow. |
| `bpmn-mom-testcase-generation.md` | Testcase generation from BPMN and MoM with Playwright validation. |
| `bpmn-monitoring-usage.md` | Monitoring Usage BPMN-specific flow extraction. |
| `bpmn-transaction-mapping.md` | Transaction Mapping BPMN-specific flow extraction. |
| `db-readonly-validation.md` | Oracle read-only DB validation. |
| `debugger-rca.md` | Compact RCA workflow. |
| `exploratory-run.md` | Exploratory testing run. |
| `handoff-generate.md` | Runtime handoff generation. |
| `module-refresh.md` | Refresh module distilled knowledge. |
| `post-run-update.md` | Persist runtime, memory, module, and ledger updates. |
| `uat-draft.md` | Draft UAT output. |

## 9. MCP Integration Details

### 9.1 `playwright_cdp`

Server file: `01-runtime/tools/playwright-mcp-server.mjs`.

Mode:

- Attaches to existing Chrome/CDP endpoint.
- Preferred CDP endpoint: `http://127.0.0.1:9222/json/version`.
- Uses browser profile: `03-auth/chrome-profile`.
- Saves screenshots to `01-runtime/artifacts/screenshots/`.
- Can run active-module regression wrappers.

Exposed tools:

- `server_status`
- `list_pages`
- `snapshot_page`
- `navigate_page`
- `click_element`
- `fill_element`
- `press_key`
- `wait_for_selector`
- `capture_screenshot`
- `run_active_module_regression`

Latest offline-safe CDP check:

- `01-runtime/tools/check-cdp.js` recovered Chrome on 2026-04-12.
- Browser: `Chrome/146.0.7680.178`
- Recovery path: direct spawn of Chrome through `01-runtime/tools/start-browser.bat`
- App URL target: `https://dev-energy.pgn.co.id`
- Current caveat: actual app access still requires VPN.

### 9.2 `oracle_readonly`

Server file: `01-runtime/tools/oracle-readonly-mcp-server.mjs`.

Mode:

- Strict read-only Oracle validation.
- Uses local config such as `02-brain/.opencode/config/oracle-readonly.local.env`.
- Uses local wallet folder under `02-brain/.opencode/config/oracle-wallet/`.
- Writes evidence under `05-observability/db-validation/query-results/`.

Exposed tools:

- `server_status`
- `find_objects_by_keyword`
- `describe_table`
- `run_query_template`
- `run_readonly_sql`

Allowed:

- `SELECT`
- `WITH`
- Metadata/schema inspection
- Read-only expected vs actual comparison
- DB evidence for RCA

Forbidden:

- `INSERT`, `UPDATE`, `DELETE`, `MERGE`
- `TRUNCATE`, `ALTER`, `DROP`, `CREATE`
- `COMMIT`, `ROLLBACK`
- Anonymous `BEGIN/END`
- Procedures, packages, functions with possible side effects
- Any query not clearly read-only

Current live status:

- OpenCode reports the MCP process connected.
- Live DB smoke was not completed in this run because VPN is not connected.
- Last known successful VPN smoke evidence:
  - `05-observability/db-validation/query-results/20260411T114650Z--vpn-smoke-root.json`
  - `05-observability/db-validation/query-results/20260411T114812Z--oracle-mcp-vpn-smoke.json`

### 9.3 `oracle_testdata`

Server file: `01-runtime/tools/oracle-testdata-mcp-server.mjs`.

Mode:

- Guarded test-data DML only.
- Separate from `oracle_readonly`; never mix write testing into read-only validation.
- Plans must live under `06-testing/test-data/db-injection/plans/`.
- Default is dry-run.
- `--apply` executes and rolls back unless commit gates are supplied.

Exposed tools:

- `server_status`
- `validate_plan`
- `execute_plan`

Guardrails:

- Persistent commit requires:
  - `--apply`
  - `--commit`
  - `--confirm <plan-token>`
  - `--confirm-commit TESTDATA_DML_COMMIT`
- Blocks DDL, procedural SQL, multi-statement scripts, unqualified target tables, non-allowlisted schemas, and broad update/delete.
- Stores evidence under `05-observability/db-injection/execution-results/`.

Available plans:

- `06-testing/test-data/db-injection/plans/_template.insert-testdata.json`
- `06-testing/test-data/db-injection/plans/_smoke.rollback-update-noop.json`

Last known safe DML evidence:

- `05-observability/db-injection/execution-results/20260411T131001Z--rollback-noop-dml-smoke.json`
- This was rollback/no-commit and affected 0 rows.

Current live status:

- MCP process is connected.
- Actual DB execution requires VPN and should not be attempted while VPN is disconnected.

### 9.4 `telegram_bug_reporter`

Server file: `01-runtime/tools/telegram-bug-reporter-mcp-server.mjs`.

Mode:

- Dry-run by default.
- Sends only when `send=true` or CLI `--send` is explicit.
- Uses local ignored config:
  - `02-brain/.opencode/config/telegram-bug-reporter.local.env`
  - `02-brain/.opencode/config/telegram-bug-reporter.env`
- Never paste Telegram token, DB password, session token, cookies, or raw auth material into reports.

Exposed tools:

- `server_status`
- `discover_chats`
- `report_bug`

Artifacts:

- Outbox: `05-observability/telegram-reporting/outbox/`
- Template: `06-testing/bug-reports/telegram/_template.bug-report.json`

Current status:

- Dry-run works and token/chat are configured.
- Latest dry-run: `05-observability/telegram-reporting/outbox/20260412T023008Z--ai-workspace-spec-telegram-dry-run.json`
- Last known real send:
  - `05-observability/telegram-reporting/outbox/20260411T144013Z--telegram-config-smoke-send.json`
  - Telegram `message_id=20042`
- Topic/thread ID is not configured (`thread=false`), so messages go to the main group.

## 10. Runtime Tools

Runtime tools live under `01-runtime/tools/`.

Major categories:

### Browser/CDP/UI

- `check-cdp.js`
- `start-browser.bat`
- `cdp-utils.js`
- `attach-and-open.js`
- `check-current-page.js`
- `check-console-errors.js`
- `dom-observation.js`
- `ant-design-helpers.js`
- `table-evidence.js`
- `transaction-mapping-cdp.js`
- `run-pgn.js`

Capabilities:

- Validate CDP port `9222`
- Launch/recover Chrome with `03-auth/chrome-profile`
- Attach to an existing app session
- Navigate PGN Billing
- Inspect page structure, tables, buttons, forms, dropdowns, overlays
- Capture screenshots and page evidence
- Reuse browser session instead of automating login when possible

### Auth/session

- `auth-session-utils.js`
- `check-auth-session.js`
- `capture-session.js`
- `restore-session.js`
- `check-auth-info.js`
- `check-session-state.js`
- `debug-session-restore.js`

Capabilities:

- Detect authenticated vs login/OTP states
- Capture local storage/cookie evidence
- Restore session state into browser profile
- Keep manual login as preferred path when OTP is required

### Oracle DB

- `oracle-readonly-validator.js`
- `oracle-readonly-mcp-server.mjs`
- `OracleReadonlyJdbcRunner.java`
- `oracle-testdata-injector.js`
- `oracle-testdata-mcp-server.mjs`
- `OracleTestdataDmlJdbcRunner.java`

Capabilities:

- Safe read-only SQL validation
- Query templates with bind variables
- Schema/table discovery
- Result JSON/Markdown evidence
- Guarded test-data DML plans with rollback default and commit gates

### Memory and storage

- `append-learning-block.js`
- `refresh-recall-index.js`
- `refresh-knowledge-raw-catalog.js`
- `audit-opencode-storage.js`
- `audit-external-opencode-leftovers.js`
- `archive-temp-workdirs.js`
- `archive-external-opencode-leftovers.js`
- `workspace-paths.js`
- `opencode-local.cmd`

Capabilities:

- Append immutable learning blocks
- Refresh recall index/global brain snapshot
- Refresh raw knowledge inventory
- Keep OpenCode runtime storage inside `01-runtime/temp/opencode-xdg/`
- Audit external leftovers and archive safely instead of deleting

### Telegram

- `telegram-bug-reporter.js`
- `telegram-bug-reporter-mcp-server.mjs`

Capabilities:

- Format bug report as Telegram-safe HTML
- Dry-run to local outbox
- Send to configured Telegram group when explicit
- Discover group chat IDs via bot updates
- Mask tokens in artifacts

## 11. Runtime Workspace

Runtime root: `01-runtime/runtime/`.

Important subfolders:

| Path | Purpose |
| --- | --- |
| `access/` | App/CDP entry points and access probes. |
| `capture/` | Manual flow recorder. |
| `docs/` | Active runtime truth and operator guidance. |
| `modules/` | Active module regression runners. |
| `session/` | Session/profile wrappers. |
| `shell/` | PowerShell helpers for API/menu/session checks. |

Runtime NPM scripts:

- `open:pgn`
- `check:access`
- `check:cdp`
- `run:open`
- `regression:happy`
- `regression:negative`
- `regression:edge`
- `regression:full`
- `record:manual`

Active module context:

- Module: `Tax Code (ad-hoc functional check)`
- Path: `System Setup > Master Data > Tax Code`
- Known confirmed product bug: `End Date` in Tax Code condition row auto-populates from `Start Date` even when not explicitly entered.
- Current caveat: deeper row action / per-column filter targeting needs stronger selector strategy.

## 12. Knowledge Base

Raw knowledge root: `04-knowledge-raw/`.

Catalog:

- `02-brain/distilled-output/global/raw-knowledge-catalog.md`
- Total files: `52`

Raw groups:

| Group | Count | Use |
| --- | --- | --- |
| App Testing Standards | 2 | Use first for PGN Billing-specific app rules. |
| MoM | 8 | Business rules, approval logic, validation expectations, workshop decisions. |
| BPMN Reviewed | 25 | Use on demand after distilled flow and MoM are insufficient. |
| BPMN Ready To Review | 10 | Use when reviewed BPMN does not cover module. |
| BPMN Revise | 3 | Lower-confidence raw flow input. |
| QA Standards UI | 1 | UI behavior, usability, presentation validation. |
| QA Standards API | 1 | Endpoint behavior, payload, contract, status codes. |
| QA Standards Automation | 1 | Selector strategy, waits, retries, automation discipline. |
| QA Standards Test Data | 1 | Test data coverage, seeding, data quality. |

Distilled global knowledge:

- `api-shadow-doc.md`
- `app-overview.md`
- `app-specific-testing-standards.md`
- `business-flow-summary.md`
- `qa-standards-routing.md`
- `raw-knowledge-catalog.md`
- `raw-knowledge-catalog.json`
- `recurring-bug-patterns.md`
- `recurring-patterns.md`

Distilled per-module packs:

| Module | Available files |
| --- | --- |
| `monitoring-usage` | `bug-history.md`, `business-flow.md`, `dependencies.md`, `handoff.md`, `known-api.md`, `test-notes.md`, `validation-rules.md` |
| `tax-code` | `handoff.md`, `test-notes.md` |
| `transaction-mapping` | `bug-history.md`, `business-flow.md`, `dependencies.md`, `handoff.md`, `known-api.md`, `test-notes.md`, `validation-rules.md` |

## 13. Observability and Evidence

Observability root: `05-observability/`.

Important areas:

| Path | Purpose |
| --- | --- |
| `db-validation/` | Oracle read-only evidence, schema notes, query templates, mapping UI to DB. |
| `db-validation/queries/` | Safe SQL templates for shared, monitoring-usage, and transaction-mapping checks. |
| `db-validation/query-results/` | JSON/Markdown query evidence. |
| `db-injection/` | Guarded test-data DML execution evidence. |
| `telegram-reporting/` | Telegram bug/reporting dry-runs and send artifacts. |
| `opencode-storage/` | Storage policy/audit evidence if generated. |

Latest relevant evidence:

- CDP recovered: `01-runtime/artifacts/adhoc-notes/check-cdp-result.json`
- DB last known VPN smoke: `05-observability/db-validation/query-results/20260411T114650Z--vpn-smoke-root.json`
- Oracle MCP last known smoke: `05-observability/db-validation/query-results/20260411T114812Z--oracle-mcp-vpn-smoke.json`
- DB injection rollback smoke: `05-observability/db-injection/execution-results/20260411T131001Z--rollback-noop-dml-smoke.json`
- Telegram latest dry-run: `05-observability/telegram-reporting/outbox/20260412T023008Z--ai-workspace-spec-telegram-dry-run.json`
- Telegram prior smoke send: `05-observability/telegram-reporting/outbox/20260411T144013Z--telegram-config-smoke-send.json`

## 14. Testing Area

Testing root: `06-testing/`.

Important areas:

| Path | Purpose |
| --- | --- |
| `adhoc/fixtures/` | Ad hoc testing fixtures such as upload dummy PDF. |
| `bug-reports/telegram/` | Telegram bug report template and future report JSON files. |
| `exploratory/` | Exploratory test outputs. |
| `smoke/` | Smoke test outputs. |
| `test-data/db-injection/` | DB test-data injection plans and README. |
| `uat-draft/` | UAT draft/test case outputs. |

Current DB injection plan files:

- `_template.insert-testdata.json`
- `_smoke.rollback-update-noop.json`

Current Telegram bug report template:

- `06-testing/bug-reports/telegram/_template.bug-report.json`

## 15. Security and Safety Guardrails

### General storage

- Use `01-runtime/tools/opencode-local.cmd` for OpenCode runs.
- Do not create `_tmp-xdg*` or random OpenCode config temp folders at root.
- Archive uncertain leftovers to `99-archive/` instead of deleting.
- Treat `99-archive/`, `03-auth/`, and `02-brain/.opencode/node_modules/` as low-priority context unless relevant.

### Secrets

- Do not paste Telegram tokens, DB passwords, session tokens, cookies, OTP, or raw auth artifacts into reports.
- Local secret configs are expected under `02-brain/.opencode/config/`.
- `telegram-bug-reporter.env` and `telegram-bug-reporter.local.env` are local-only and ignored.
- Oracle local env and wallet are local config assets; do not expose secret contents in reports.

### DB

- `oracle_readonly` is read-only only.
- `oracle_testdata` is the only path for direct DB test-data DML.
- Direct DB DML requires saved plan, dry-run, optional rollback apply, and explicit commit confirmation gates.
- Never change table structure.
- Never run ad hoc DML from chat text.

### Telegram

- Dry-run first unless user explicitly asks to send.
- Use concise group-ready summaries.
- Reference local evidence paths instead of pasting sensitive raw dumps.

### App automation

- Prefer CDP attach and existing browser session.
- Ask user to manually login or complete OTP when needed.
- Use Playwright MCP for precise UI actions, waits, screenshots, and snapshots.
- Treat automation timeouts as automation caveats until product failure is confirmed with stronger evidence.

## 16. Known Gaps and Caveats

1. VPN is currently disconnected, so live PGN Billing app and Oracle DB validation are intentionally blocked.
2. MCP connected status does not equal app/DB reachable status.
3. `fast-happy-path` and `network-response-observer` skill files are empty placeholders.
4. Telegram group topic/thread ID is not configured; reports go to main group.
5. OpenCode session history may be empty after reset; durable AI memory is in project files, not guaranteed by `/compact`.
6. `SESSION_HEALTH.md` says prior access was stable, but it must be rechecked after VPN returns because current app access is VPN-blocked.
7. This root folder is not currently a Git repository, so `git status` is not available as a change audit.
8. Some Tax Code row-level selector actions need a stronger Playwright selector strategy before exhaustive coverage can be claimed.
9. Direct DB test-data injection is powerful and must stay behind plan-based guardrails and explicit user approval.

## 17. Recommended Daily Operating Flow

Start OpenCode TUI:

```powershell
D:\AI-QA-LAB\01-runtime\tools\opencode-local.cmd D:\AI-QA-LAB --continue --agent engineer
```

Inside TUI at the start:

```text
/memory-load
```

Before ending important work:

```text
/memory-save
```

Use `/compact` only when the active chat becomes long and you are continuing the same session.

Run storage audit:

```powershell
node D:\AI-QA-LAB\01-runtime\tools\audit-opencode-storage.js
```

When VPN is connected, validate app/CDP:

```powershell
node D:\AI-QA-LAB\01-runtime\tools\check-cdp.js
```

When VPN is connected, validate Oracle read-only:

```powershell
node D:\AI-QA-LAB\01-runtime\tools\oracle-readonly-validator.js --sql "select 1 as ok from dual" --label smoke --rows 5
```

Telegram dry-run:

```powershell
node D:\AI-QA-LAB\01-runtime\tools\telegram-bug-reporter.js --input D:\AI-QA-LAB\06-testing\bug-reports\telegram\_template.bug-report.json --label telegram-dry-run
```

Telegram send only when explicitly approved:

```powershell
node D:\AI-QA-LAB\01-runtime\tools\telegram-bug-reporter.js --input D:\AI-QA-LAB\06-testing\bug-reports\telegram\<bug>.json --send --label telegram-send
```

## 18. Recommended Improvements

1. Implement `fast-happy-path/SKILL.md` or remove it from active expectations.
2. Implement `network-response-observer/SKILL.md` to formalize API/network observation.
3. Add a periodic "VPN reconnected" smoke checklist that runs CDP, app page title, Oracle read-only smoke, and MCP status.
4. Add a per-module Playwright selector strategy note for Tax Code row actions and column filters.
5. Add Telegram topic/thread ID if bug reports should go to a specific group topic.
6. Add a root `CHANGELOG` or local audit log if this workspace remains non-Git.
7. Expand `tax-code` distilled pack to include `business-flow.md`, `validation-rules.md`, `dependencies.md`, `known-api.md`, and `bug-history.md`.
8. Add a saved DB injection plan template per common testing need after business-safe table targets are confirmed.

## 19. Bottom Line

This AI workspace can already act as a local QA engineer for PGN Billing with durable memory, MoM/BPMN-aware reasoning, Playwright/CDP UI testing, Oracle read-only validation, guarded test-data injection, Telegram bug reporting, runtime handoff, and append-only learning.

The two main operational dependencies are:

- VPN must be connected before app/Oracle live checks.
- Every meaningful run must end with durable file updates and learning-ledger append so the AI becomes more useful across sessions instead of relying on transient chat history.
