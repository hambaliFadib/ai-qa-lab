# FALID AI WORKSPACE Full Specification

- Current canonical update: 2026-04-26
- Workspace root: `D:\AI-QA-LAB`
- Canonical product identity: `FALID AI WORKSPACE`
- Product tagline: `FALID AI WORKSPACE - Agentic QA Operating System`
- Historical foundation name: `AI-QA-LAB`
- Traceability note: this filename is intentionally retained because older automation, docs, and reports still refer to `AI-QA-LAB_FULL_SPEC.md`.
- Canonical status: sections above `Archived 2026-04-18 Snapshot` supersede the older snapshot. If this current section conflicts with the archived snapshot, use this current section.

## Current Canonical Specification

### 1. Executive Summary

`FALID AI WORKSPACE` is the canonical product identity for this repository. It is a local-first QA operating system for PGN Billing and related enterprise validation work. The workspace evolved from the internal `AI-QA-LAB` foundation and keeps that filesystem/runtime base for continuity, auditability, and low-risk reuse.

FALID combines one unified `Engineer` agent, project-local OpenCode runtime storage, Browser Use primary browser execution, Playwright/CDP fallback evidence and recovery, Oracle read-only validation, guarded Oracle test-data injection, Figma design reference handling, design-vs-UI comparison, Diagnosis Engine reasoning, OpenClaw orchestration in SAFE MODE, spreadsheet testcase staging, Telegram bug reporting, hot memory, and an append-only durable Learning Ledger.

The operating principle is evidence before conclusion. Browser, UI, API/network, DB, business-rule, MoM/BPMN, design, and release-decision claims must stay explicit and scoped. Automation failure, environment instability, stale design, or missing test data must not be silently promoted into product truth.

### 2. Current State Snapshot

| Area | Current State |
| --- | --- |
| Git root | `D:/AI-QA-LAB` |
| Branch | `main` |
| Latest observed commit | `ac179050d2bca47d7d4c7479afd2b159cfb25256` |
| Latest commit date | `2026-04-12T10:11:23+07:00` |
| Latest commit subject | `Based structure lab QA` |
| Working tree | Dirty: observed `105` modified paths and `900` untracked paths during the 2026-04-26 audit |
| Root `.opencode` | Junction to `D:\AI-QA-LAB\02-brain\.opencode` |
| Primary agent | `Engineer` |
| Active app | PGN Billing `dev-energy` |
| Browser executor | Browser Use MCP primary |
| Browser fallback | Playwright/CDP on local CDP port `9222` for recovery/evidence |
| DB validation | Oracle read-only validator and MCP server |
| DB setup | Guarded Oracle test-data injection only through saved plans |
| Latest ledger | `LLV1-000028`, block count `28`, latest hash `8cf004b0524943958041559a46b1d56216edbe38260b20bc034ca8e827f0a908` |
| Latest ledger summary | OpenCode local wrapper auto-starts LiteLLM proxy for Browser Use -> OpenCode Go `glm-5` |
| Browser Use readiness | Direct `browser-use-mcp-check.js` returned `READY_CONFIGURED` during audit |
| Runtime doctor caveat | `falid-doctor.js` can still show Browser Use or LiteLLM as `FAIL` when the local proxy/ports are not currently running; treat this as service-liveness status, not config absence |

### 3. Architecture

| Layer | Paths | Responsibility |
| --- | --- | --- |
| Product identity and entry docs | `README.md`, `AI-QA-LAB_FULL_SPEC.md`, `tui.json` | Canonical FALID identity, specification, theme, and operator entry points. |
| Runtime | `01-runtime/`, `01-runtime/runtime/`, `01-runtime/tools/` | Browser, CDP, Oracle, Telegram, Figma REST, memory, and OpenCode wrapper tools. |
| Trusted runtime docs | `01-runtime/runtime/docs/` | Current operating truth: active module, handoff, blockers, session health, ready commands, memory model, OpenClaw log, and this hygiene plan. |
| Durable brain | `02-brain/.opencode/` | Unified Engineer agent, prompts, skills, memory, config, API discovery, orchestrator rules, and theme. |
| Learning ledger | `02-brain/learning-ledger/` | Append-only durable learning blocks, indexes, manifests, and snapshots. |
| Distilled knowledge | `02-brain/distilled-output/` | Reusable global and per-module QA knowledge, including classification standards and module packs. |
| Auth/session | `03-auth/` | Local-only browser profile, user data, session state, and manual login support. Do not modify unless access recovery is the task. |
| Raw knowledge | `04-knowledge-raw/` | PGN app standards, MoM docs, BPMN PDFs/zips, and raw QA standards. |
| Observability | `05-observability/` | DB validation evidence, guarded DB injection evidence, Telegram outbox, and storage audits. |
| Testing/staging | `06-testing/` | DB injection plans, bug templates, design reference staging, testcase staging, smoke/exploratory/UAT buckets. |
| FALID shell | `07-falid-shell/` | Express/React local web shell, status cards, action panel, logs, and wrapper helpers. |
| Archive | `99-archive/` | Legacy agents, migration leftovers, and uncertain old assets retained for safety. |
| Temporary extracted sources | `temp_bpmn/`, `temp_mom/` | Extracted working copies from BPMN/MoM source material; useful for reference but not canonical raw source. |

### 4. Canonical Operating Flow

1. Load fast recall, user preferences, runtime handoff, active module, blockers, session health, and relevant module pack.
2. Set `analysis_mode`: `challenge`, `exploratory`, `validation`, `RCA`, or `release_decision`.
3. Use the smallest relevant source first: runtime docs, distilled module/global knowledge, app-specific standards, MoM, and only then raw BPMN extraction.
4. Use Browser Use for normal browser interaction.
5. Use Playwright/CDP only for fallback, deterministic screenshots/snapshots, low-level DOM/console evidence, or recovery.
6. Use Oracle read-only only for schema, persistence, data-state, and app-to-DB proof.
7. Use guarded `oracle_testdata` only when explicit test-data setup is required and a saved plan exists.
8. For design tasks, use Figma MCP or REST bridge as read-only evidence, score Design Confidence, stage artifacts, compare summaries, and keep mismatches in Needs Confirmation until verified.
9. For multi-layer work, use OpenClaw planning and Heavy Context Split Rule before execution.
10. Classify outcomes with the QA execution classification model.
11. Update hot memory after meaningful work; append ledger only for reusable durable deltas.

### 5. OpenCode, MCP, CLI, And Shell Surface

Active MCP config file: `opencode.json`.

| MCP | Enabled | Command/Endpoint | Purpose |
| --- | --- | --- | --- |
| `browser_use` | Yes | `cmd /c .\01-runtime\tools\browser-use-local.cmd` | Primary browser executor. Loads Browser Use env from local-only config. |
| `playwright_cdp` | Yes | `node 01-runtime/tools/playwright-mcp-server.mjs` | CDP fallback, screenshots, snapshots, low-level evidence, session recovery. |
| `oracle_readonly` | Yes | `node 01-runtime/tools/oracle-readonly-mcp-server.mjs` | Strict read-only Oracle validation. |
| `oracle_testdata` | Yes | `node 01-runtime/tools/oracle-testdata-mcp-server.mjs` | Guarded Oracle test-data DML via saved plans. |
| `telegram_bug_reporter` | Yes | `node 01-runtime/tools/telegram-bug-reporter-mcp-server.mjs` | Dry-run or explicitly approved Telegram bug reporting. |
| `google_sheets_testcase` | No | `cmd /c .\01-runtime\tools\google-sheets-testcase-placeholder.cmd` | Disabled placeholder for read-first, append-only spreadsheet testcase writing. |
| `figma_design` | No | `https://mcp.figma.com/mcp` | Disabled-by-default Figma Remote MCP entry for read-only design evidence. |

Primary launchers:

- `01-runtime\tools\falid-local.cmd`: preferred branded launcher.
- `01-runtime\tools\opencode-local.cmd`: backward-compatible launcher.
- `01-runtime\tools\falid.cmd`: additional FALID CLI wrapper surface.
- `07-falid-shell\web`: local web shell package.

FALID web shell:

- Backend target default: `127.0.0.1:4096`
- Web shell default/runtime port: `5180` or the selected available port; latest runtime state observed `5181`
- Local state file: `07-falid-shell/runtime/session-state.json`
- Main server: `07-falid-shell/web/server.js`
- Shell scripts: `07-falid-shell/scripts/`
- UI source: `07-falid-shell/web/src/`
- Main actions: start workspace, open TUI, open web session, run smoke, run doctor, release-check instruction
- Important caveat: `07-falid-shell/web/node_modules/`, `dist/`, dev-server logs, and runtime state are local/generated and should stay ignored unless intentionally reviewed.

### 6. Unified Engineer Agent

Engineer is the only active operating role. It owns QA architecture, business analysis, MoM/BPMN interpretation, exploratory testing, regression execution, bug logging, RCA, app/API/DB validation, guarded test-data support, release-decision challenge behavior, runtime repair, and durable memory upkeep.

Critical rules that must not be weakened:

- Challenge Rule for ambiguous, high-impact, conflicting, release, RCA, severity, bug-classification, design, or DB-mutation claims.
- RCA Evidence Gate before final root cause, severity, Product Bug, or High confidence.
- Decision Engine Rule before release, go/no-go, production readiness, or deployment safety decisions.
- Browser Use primary and Playwright/CDP fallback separation.
- Oracle read-only safety and separate guarded test-data injection path.
- Auto-memory hot/durable split and ledger gating.
- Figma Design Confidence and Needs Confirmation flow.
- OpenClaw SAFE MODE and approval gate.

### 7. Memory And Ledger

| Layer | Path | Role |
| --- | --- | --- |
| Hot runtime truth | `01-runtime/runtime/docs/` | Active module, handoff, blockers, session health, ready commands, latest run truth. |
| Durable memory | `02-brain/.opencode/memory/` | Reusable project memory, preferences, mission, challenge patterns, decision patterns, learned flow. |
| Fast recall | `02-brain/.opencode/memory/RECALL_INDEX.md` | Startup recall summary. |
| Module packs | `02-brain/distilled-output/per-module/` | Reusable module-specific business/test/API notes. |
| Global knowledge | `02-brain/distilled-output/global/` | App overview, raw catalog, QA standards routing, classification, identity. |
| Learning ledger | `02-brain/learning-ledger/` | Append-only durable deltas with hash chain. |

Current ledger state:

- Latest block: `LLV1-000028`
- Latest module: `runtime-provider-routing`
- Latest type: `runtime_config`
- Latest timestamp: `2026-04-22T09:54:00.610Z`
- Block count: `28`
- Latest hash: `8cf004b0524943958041559a46b1d56216edbe38260b20bc034ca8e827f0a908`
- Chain state file: `02-brain/learning-ledger/manifests/chain-state.json`
- Latest index file: `02-brain/learning-ledger/index/latest.json`

The older statement that ledger latest is `LLV1-000024` is stale and belongs only to the archived 2026-04-18 snapshot.

### 8. Runtime And Tooling

Important runtime docs:

- `01-runtime/runtime/docs/ACTIVE_RUNTIME_SURFACE.md`
- `01-runtime/runtime/docs/READY_COMMANDS.md`
- `01-runtime/runtime/docs/ACTIVE_MODULE.md`
- `01-runtime/runtime/docs/CONTEXT_HANDOFF.md`
- `01-runtime/runtime/docs/LAST_RUN_SUMMARY.md`
- `01-runtime/runtime/docs/BLOCKERS.md`
- `01-runtime/runtime/docs/SESSION_HEALTH.md`
- `01-runtime/runtime/docs/AUTO_MEMORY_MODEL.md`
- `01-runtime/runtime/docs/BROWSER_USE_SMOKE_TEST.md`
- `01-runtime/runtime/docs/FIGMA_REMOTE_MCP_SMOKE_TEST.md`
- `01-runtime/runtime/docs/WORKING_TREE_HYGIENE_PLAN.md`

Important tool groups:

- Browser and CDP: `browser-use-local.cmd`, `browser-use-mcp-check.js`, `check-cdp.js`, `cdp-utils.js`, `playwright-mcp-server.mjs`, `table-evidence.js`, `ant-design-helpers.js`.
- OpenCode/FALID: `falid-local.cmd`, `falid.cmd`, `opencode-local.cmd`, `ensure-litellm-opencode-go.ps1`, `start-litellm-opencode-go.ps1`, `falid-doctor.js`.
- Oracle: `oracle-readonly-validator.js`, `oracle-readonly-mcp-server.mjs`, `OracleReadonlyJdbcRunner.java`, `oracle-testdata-injector.js`, `oracle-testdata-mcp-server.mjs`, `OracleTestdataDmlJdbcRunner.java`.
- Figma REST: `figma-rest-readonly-check.js`, `figma-rest-fetch-node.js`, `figma-rest-summarize-node.js`, `figma-rest-expected-handoff.js`.
- Memory: `auto-memory-commit.js`, `append-learning-block.js`, `refresh-recall-index.js`, `refresh-knowledge-raw-catalog.js`.
- Telegram: `telegram-bug-reporter.js`, `telegram-bug-reporter-mcp-server.mjs`.

### 9. OpenClaw Orchestration

OpenClaw is the orchestration layer for multi-step QA workflows. It plans and routes; Engineer remains the QA reasoning authority and Decision Engine owner.

OpenClaw files:

- `02-brain/.opencode/orchestrator/openclaw-router.md`
- `02-brain/.opencode/orchestrator/safe-mode.md`
- `02-brain/.opencode/orchestrator/execution-plan-template.md`
- `02-brain/.opencode/orchestrator/approval-gate.md`
- `02-brain/.opencode/orchestrator/artifact-checker.md`
- Runtime log: `01-runtime/runtime/logs/openclaw-execution-log.md`

OpenClaw rules:

- Default is SAFE MODE, read-only planning first.
- No execution happens before the plan is shown.
- Any WRITE action requires explicit approval.
- Heavy tasks spanning more than two evidence layers are split into staged artifacts.
- Existing artifacts are reused before new fetch/capture work is proposed.
- Browser Use belongs in execution phase, not planning phase.
- Oracle remains read-only unless guarded test-data flow is explicitly approved.

### 10. Figma, Design Compare, And Diagnosis

Figma design is evidence, not absolute truth.

Figma support layers:

- Disabled-by-default Remote MCP: `figma_design`.
- Read-only REST fallback: local-only `FIGMA_TOKEN`, `figma-rest-readonly-check.js`, `figma-rest-fetch-node.js`, `figma-rest-summarize-node.js`, `figma-rest-expected-handoff.js`.
- Staging root: `06-testing/design-reference-staging/`.
- Raw artifacts: `06-testing/design-reference-staging/raw/`.
- Summaries: `06-testing/design-reference-staging/summaries/`.
- Expected handoffs: `06-testing/design-reference-staging/expected/`.
- Diagnosis reports: `06-testing/design-reference-staging/diagnosis/`.

Design Confidence:

- `HIGH`: current/approved design, aligned with business rules, role/state/data context matches.
- `MEDIUM`: relevant and usable, but freshness or approval is not fully confirmed.
- `LOW`: outdated, conflicting, or not matching target role/state/data.

Design-vs-UI Compare Engine:

- Starts from staged Figma expected and UI actual summaries.
- Compares summarized artifacts, not raw heavy dumps.
- Produces match/mismatch, missing/extra UI elements, Needs Confirmation items, and candidate follow-up questions.
- Does not create product bugs directly from mismatch.

Diagnosis Engine:

- Explains likely causes after comparison: design outdated, implementation gap, role-based visibility, data-dependent visibility, mode-dependent behavior, business rule missing, reference data mismatch, automation artifact, or environment/session caveat.
- Diagnosis remains provisional until cross-layer evidence is strong enough.
- Confirmed bugs still require Engineer's RCA Evidence Gate.

Pra-Billing current design state:

- Figma node: `29569:227563` (`Pra-Billing`)
- Design confidence: `MEDIUM`
- UI actual capture exists.
- Comparison report exists.
- MoM/BPMN source was not found in current raw set.
- Mismatches are classified as Needs Confirmation, not product bugs.

### 11. Spreadsheet Testcase Placeholder

`google_sheets_testcase` is intentionally disabled as a placeholder. The expected behavior remains:

- Read spreadsheet metadata, tabs, headers, and append point first.
- Preserve existing structure, formulas, tabs, formatting, and rows.
- Append draft rows only unless explicit approval says otherwise.
- Do not create a new testcase template unless explicitly requested.
- Use `06-testing/testcase-staging/` when MCP is unavailable or writing is not approved.

### 12. Oracle Safety

Oracle read-only is the proof layer. It allows only read-only SQL, metadata inspection, and expected-vs-actual comparison. It blocks DML, DDL, procedural blocks, commits, rollbacks, and side-effect procedures/functions.

Oracle test-data injection is the only intended DB mutation path. It requires:

- A saved plan under `06-testing/test-data/db-injection/plans/`.
- Dry-run/validation first.
- Rollback-mode apply when feasible.
- Persistent commit only with explicit `--commit --confirm <plan-token> --confirm-commit TESTDATA_DML_COMMIT`.
- Post-commit read-only verification.

Direct ad hoc DML from chat or docs is forbidden.

### 13. Active Modules And Milestones

Current active/follow-up work:

- Customer-SA Layer 116-row transformation: complete and committed.
- SA standardization for 47 SOR 739/740 accounts: scripts prepared and pre-validated, manual execution pending.
- C006/Materai activation: root cause identified; activation SQL prepared.
- Pra-Billing Figma vs UI comparison: comparison complete; business/design confirmation pending.
- Transaction Mapping: historical product flow verified; execution maturity baseline exists.
- Tax Code: list-level controls passed; Condition End Date autofill bug remains a known product bug.
- Monitoring Usage: non-destructive exploratory baseline exists; strict business-rule conclusions still need MoM/BPMN/API reconciliation.

Module packs:

- `02-brain/distilled-output/per-module/customer-sa-layer/`
- `02-brain/distilled-output/per-module/monitoring-usage/`
- `02-brain/distilled-output/per-module/tax-code/`
- `02-brain/distilled-output/per-module/transaction-mapping/`

### 14. Raw Knowledge And Evidence

Raw knowledge root: `04-knowledge-raw/`.

Current raw catalog says:

- App Testing Standards: `2`
- MoM: `8`
- BPMN Reviewed: `25`
- BPMN Ready To Review: `10`
- BPMN Revise: `3`
- QA Standards UI: `1`
- QA Standards API: `1`
- QA Standards Automation: `1`
- QA Standards Test Data: `1`

Rules:

- Do not mass-convert raw knowledge.
- Use app-specific standards before generic QA standards when product conventions matter.
- Use the smallest relevant MoM before broad BPMN sweeps.
- Prefer distilled module/global knowledge when it already exists.

### 15. Known Stale Items Fixed In This Canonical Section

The archived 2026-04-18 snapshot below is retained for traceability, but these statements are stale:

- Ledger latest is no longer `LLV1-000024`; it is `LLV1-000028`.
- Browser Use command is no longer represented as direct `uvx --from browser-use[cli] browser-use --mcp`; active MCP command is `cmd /c .\01-runtime\tools\browser-use-local.cmd`.
- Root layout now includes `07-falid-shell/`, `temp_bpmn/`, and `temp_mom/`.
- Runtime architecture now includes OpenClaw, Heavy Context Split Rule, Figma REST bridge, Diagnosis Engine, Design-vs-UI Compare Engine, and FALID CLI/web shell.
- Current design workflow does not treat Figma mismatch as product bug without confirmation.
- Working tree hygiene now needs explicit commit/archive/local-only/gitignore planning because the workspace has many generated artifacts and staged capabilities.

### 16. Maintenance And Hygiene Posture

- Do not delete, move, reset, clean, or commit without explicit instruction.
- Do not modify `03-auth/` session/auth files unless access recovery is the active task.
- Do not weaken Engineer rules, Decision Engine, OpenClaw SAFE MODE, Oracle safety, Figma confidence rules, or auto-memory gating.
- Use `01-runtime/runtime/docs/WORKING_TREE_HYGIENE_PLAN.md` as the current cleanup plan before taking any repository hygiene action.

### 17. Bottom Line

FALID AI WORKSPACE is now a Git-backed, local-first PGN Billing QA operating system with a unified Engineer brain, Browser Use primary execution, Playwright/CDP fallback evidence and recovery, Oracle read-only proof, guarded Oracle test-data mutation, Figma read-only design evidence with REST bridge, Design Confidence, Design-vs-UI Compare, Diagnosis Engine, OpenClaw orchestration in SAFE MODE, spreadsheet testcase staging, FALID CLI/web shell, auto-memory, and a durable append-only Learning Ledger.

The archived snapshot below remains useful historical context only.

## Archived 2026-04-18 Snapshot

The section below is retained for traceability. It is stale where it conflicts with `Current Canonical Specification` above.

# Archived FALID AI WORKSPACE Full Specification Snapshot

- Generated: 2026-04-18
- Workspace root: `D:\AI-QA-LAB`
- Product identity: `FALID AI WORKSPACE - Agentic QA Operating System`
- Historical foundation name: `AI-QA-LAB` (retained in selected file names and paths for traceability)
- Source basis: local analysis of repo structure, runtime docs, memory, ledger, module packs, plans, and evidence artifacts
- Live re-smoke during this refresh: not performed
- Primary operating mode: FALID AI WORKSPACE, a local-first QA operating system for PGN Billing
- Primary agent: `Engineer`
- Active app/environment: PGN Billing `dev-energy`
- Browser automation path: Browser Use MCP primary; Playwright/CDP on `127.0.0.1:9222` fallback for evidence and recovery
- DB path: Oracle read-only validation plus guarded Oracle test-data injection

## 1. Executive Summary

`FALID AI WORKSPACE` is the canonical product identity for this repository. It evolved from the internal `AI-QA-LAB` foundation and keeps that filesystem/runtime base for continuity, auditability, and low-risk workflow reuse.

`FALID AI WORKSPACE` is a local-first QA operating system for PGN Billing. It combines a unified OpenCode `Engineer` brain, durable project memory, Browser Use primary browser automation, Playwright/CDP fallback evidence and recovery, Oracle read-only validation, guarded Oracle test-data DML, Telegram bug reporting, raw MoM/BPMN/QA-standard routing, distilled module knowledge, runtime handoff docs, an append-only learning ledger, and a confidence-scored Figma design reference layer.

The main operating loop is:

1. Load durable memory, recall index, and runtime handoff.
2. Identify the active module and smallest relevant knowledge source.
3. Use Browser Use first for browser interaction.
4. Use Playwright/CDP only for fallback execution, deterministic evidence, screenshots, snapshots, or recovery.
5. Use Oracle read-only for persistence, schema, and data-state proof.
6. Use guarded `oracle_testdata` only for explicit DB test-data setup.
7. Classify outcomes with the QA execution classification model.
8. Save runtime notes, module knowledge, evidence, memory, and learning ledger updates.

The biggest state change since the old 2026-04-12 spec is the Customer-SA Layer work: a committed and verified 116-row representative test-data transformation now exists, and a newer pre-execution standardization plan exists for 47 SOR 739/740 accounts.

## 2. Current Operational Status

| Area | Current State | Notes |
| --- | --- | --- |
| Git workspace | Active Git repo | Root is `D:/AI-QA-LAB`. Latest observed commit: `ac179050d2bca47d7d4c7479afd2b159cfb25256`, 2026-04-12, `Based structure lab QA`. |
| Working tree | Dirty | Many modified runtime/memory files and many untracked evidence artifacts/plans. Do not clean or revert without explicit user instruction. |
| Root `.opencode` | OK | Junction to `D:\AI-QA-LAB\02-brain\.opencode`. Git status can show duplicate paths through junction and target. |
| Primary agent | Engineer | User preference remains one unified Engineer role. |
| CDP browser | ACCESS_STABLE from runtime docs | `SESSION_HEALTH.md` says CDP profile/session is stable. This refresh did not re-run CDP smoke. |
| App access | ACCESS_STABLE from runtime docs | `CONTEXT_HANDOFF.md` says PGN Billing session is valid for `qaempat (End User)`. |
| Oracle DB | ACCESS_STABLE from runtime docs | Read-only and controlled testdata injection are documented as working; latest read-only evidence includes 2026-04-16 results. |
| MCP config | Enabled servers plus two disabled safe-default integrations | `browser_use`, `playwright_cdp`, `oracle_readonly`, `oracle_testdata`, and `telegram_bug_reporter` are enabled. `google_sheets_testcase` remains a disabled placeholder, while `figma_design` points to the real Figma Remote MCP endpoint but stays disabled until local auth and a read-only smoke test pass; if remote auth hits `403`, the documented fallback is read-only Figma REST or optional Desktop MCP. |
| Active module | Customer-SA Layer Test Data Preparation | Completed 116-row transformation; dataset is ready for UI testing. |
| Latest completed milestone | Customer-SA Layer 116-row transformation | 16 guarded UPDATE statements, commit on 2026-04-14, 1,529 accumulative affected rows, 6 verification checks. |
| Newer prepared milestone | SOR 739/740 SA standardization | 47 selected accounts; pre-execution validation exists; no matching db-injection execution artifact found. |
| Ledger | Repaired | `latest.json` and `chain-state.json` now point to `LLV1-000024`; repair note stored in `02-brain/learning-ledger/manifests/ledger-drift-repair-20260418.md`. |
| Raw knowledge | OK | 52 raw files cataloged under `04-knowledge-raw`. |
| Telegram | Available | Dry-run and previous send artifacts exist. Sending requires explicit approval. |

## 3. Root Layout

| Path | Role |
| --- | --- |
| `.opencode` | Junction to `02-brain/.opencode`; active OpenCode brain surface at root. |
| `01-runtime/` | Runtime tools, package deps, CDP/browser helpers, Oracle runners, MCP servers, active artifacts. |
| `01-runtime/runtime/` | Trusted execution surface: docs, access wrappers, module suites, session wrappers, capture scripts, shell helpers. |
| `02-brain/` | Durable AI brain, OpenCode agents/skills/prompts/commands, distilled knowledge, learning ledger. |
| `03-auth/` | Chrome profile, browser state, session/auth helpers. Sensitive and low-priority unless access recovery is needed. |
| `04-knowledge-raw/` | Raw app testing standards, MoM docs, BPMN PDFs/zips, QA standards. |
| `05-observability/` | DB validation evidence, DB injection evidence, Telegram outbox, storage audit evidence. |
| `06-testing/` | Test-data plans, ad hoc fixtures, bug report templates, UAT/exploratory/smoke output areas. |
| `99-archive/` | Legacy agents, migration leftovers, old runtime scripts kept for safety. |
| `opencode.json` | MCP server configuration. |
| `README.md` | FALID AI WORKSPACE overview, quick start, and branding notes. |
| `AI-QA-LAB_FULL_SPEC.md` | This current FALID AI WORKSPACE full specification; filename retained for traceability. |
| `AI-QA-LAB_EXECUTION_MATURITY_UPGRADE.md` | Transaction Mapping execution maturity upgrade summary; filename retained for traceability. |

Approximate file counts from local scan:

| Path | Files |
| --- | ---: |
| `.opencode` | 860 |
| `01-runtime` | 4,581 |
| `02-brain` | 920 |
| `03-auth` | 1,402 |
| `04-knowledge-raw` | 53 |
| `05-observability` | 1,176 |
| `06-testing` | 12 |
| `99-archive` | 90 |

## 4. OpenCode and MCP Configuration

Active config file: `opencode.json`.

| MCP | Command | Timeout | Purpose |
| --- | --- | ---: | --- |
| `browser_use` | `uvx --from browser-use[cli] browser-use --mcp` | 30000 | Primary browser executor for PGN Billing navigation and interaction. |
| `playwright_cdp` | `node 01-runtime/tools/playwright-mcp-server.mjs` | 30000 | Fallback browser automation, deterministic snapshots/screenshots, session recovery, and low-level evidence. |
| `oracle_readonly` | `node 01-runtime/tools/oracle-readonly-mcp-server.mjs` | 20000 | Strict read-only Oracle validation. |
| `oracle_testdata` | `node 01-runtime/tools/oracle-testdata-mcp-server.mjs` | 30000 | Guarded Oracle DML plans for test-data setup. |
| `telegram_bug_reporter` | `node 01-runtime/tools/telegram-bug-reporter-mcp-server.mjs` | 30000 | Dry-run or explicitly send curated bug reports to Telegram. |
| `google_sheets_testcase` | `cmd /c .\01-runtime\tools\google-sheets-testcase-placeholder.cmd` | 30000 | Disabled placeholder for read-first, append-only spreadsheet testcase writing. Replace with a real spreadsheet MCP server before enabling. |
| `figma_design` | `https://mcp.figma.com/mcp` | 30000 | Disabled-by-default remote Figma MCP entry for read-only design reference work. Authenticate locally and smoke-test before enabling. If remote auth returns `403`, stop retrying blindly and move to the documented REST read-only fallback or Desktop MCP alternative. |

Browser Use local MCP requires `uvx` plus `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` before OpenCode starts. `opencode.json` must not contain provider keys; it should keep only safe non-secret defaults such as `BROWSER_USE_HEADLESS=false` under `environment`. `falid-local.cmd` is now the preferred product-branded launcher, while `opencode-local.cmd` remains the compatible fallback. The wrapper loads `02-brain/.opencode/config/browser-use.local.env` when that ignored local file exists.

MCP process connectivity does not by itself prove that VPN, app, or Oracle targets are reachable at this exact moment.

## 5. Engineer Agent

Active agent file: `02-brain/.opencode/agents/engineer.md`.

Engineer is the single preferred role and the primary operating agent of FALID AI WORKSPACE. It covers QA architecture, business analysis, MoM/BPMN interpretation, exploratory testing, regression execution, bug reporting, RCA, Oracle validation, guarded test-data setup, runtime repair, and durable memory updates.

Before meaningful work, Engineer should read:

- `02-brain/.opencode/memory/RECALL_INDEX.md`
- `02-brain/.opencode/memory/USER_WORKING_PREFERENCES.md`
- `01-runtime/runtime/docs/CONTEXT_HANDOFF.md`
- `01-runtime/runtime/docs/ACTIVE_MODULE.md`
- `01-runtime/runtime/docs/LAST_RUN_SUMMARY.md`
- `01-runtime/runtime/docs/BLOCKERS.md`
- `01-runtime/runtime/docs/SESSION_HEALTH.md`
- `02-brain/.opencode/memory/NEXT_ACTIONS.md`
- `02-brain/.opencode/memory/LEARNED_FLOW.md`
- `02-brain/.opencode/memory/BUG_PATTERNS.md`
- `02-brain/distilled-output/per-module/<module>/` for active module work
- `02-brain/distilled-output/global/raw-knowledge-catalog.md` before opening raw knowledge broadly
- `02-brain/distilled-output/global/qa-execution-classification.md` before classifying execution outcomes

Short prompts such as `lanjutkan`, `analisa`, `buat test case`, `cek db`, `cek mom`, `cek flow`, `test module`, and `rca` should continue from local files rather than asking for context again.

## 6. Memory, Recall, and Ledger

| Layer | Path | Purpose |
| --- | --- | --- |
| OpenCode session DB | `01-runtime/temp/opencode-xdg/data/opencode/opencode.db` | Chat/session history and OpenCode todos. Not durable project memory. |
| Durable memory | `02-brain/.opencode/memory/` | Reusable project-level AI memory. |
| Fast recall | `02-brain/.opencode/memory/RECALL_INDEX.md` | Startup summary generated from memory/ledger/config. |
| User preferences | `02-brain/.opencode/memory/USER_WORKING_PREFERENCES.md` | Stable collaboration and QA preferences. |
| Runtime handoff | `01-runtime/runtime/docs/` | Current run truth: active module, blockers, health, last run, commands. |
| Module knowledge | `02-brain/distilled-output/per-module/` | Module-specific business/test/API notes. |
| Global knowledge | `02-brain/distilled-output/global/` | Raw catalog, app overview, standards routing, execution classification. |
| Learning ledger | `02-brain/learning-ledger/` | Append-only durable learning blocks and snapshots. |

Current memory themes: one unified `Engineer`, connect app/API/DB evidence, use MoM and extracted business flow for business rules, prefer Browser Use for browser action, keep Playwright/CDP for fallback evidence and recovery, and use guarded DB setup with validation, rollback proof, explicit commit, and read-only verification.

Ledger state: indexed latest block is `LLV1-000024` for `monitoring-usage`, block count 24. The previous drift between block files and `latest.json` / `chain-state.json` was repaired on 2026-04-18 without rewriting historical block files.

## 7. Skills and Prompts

Skills live under `02-brain/.opencode/skills/`.

| Skill | Status | Capability |
| --- | --- | --- |
| `bpmn-extractor` | active | On-demand BPMN extraction into module flow notes. |
| `bpmn-mom-testcase-comparator` | active | Reconciles BPMN, MoM, UI evidence, and Oracle checkpoints. |
| `bug-ledger-format` | active | Formats bug output into ledger/module history shape. |
| `bug-rca-infra` | active | RCA workflow from UI to API to DB/schema/data. |
| `context-handoff-generator` | active | Writes runtime handoff. |
| `fast-happy-path` | implemented | Quick safe happy-path regression guidance. |
| `interaction-memory-amplifier` | active | Captures stable user preferences and collaboration patterns. |
| `module-knowledge-updater` | active | Keeps module packs aligned. |
| `module-precheck` | active | Enforces read-order before module work. |
| `network-response-observer` | implemented | Lightweight API/network observation guidance. |
| `browser-use-primary` | active | Defines Browser Use as primary browser executor and Playwright/CDP fallback rules. |
| `figma-design-reader` | active | Reads Figma design context as reference evidence, scores design confidence, generates expected UI references, and keeps mismatches in Needs Confirmation until verified. |
| `open-pgn-app` | active | Opens PGN Billing with Browser Use first, then Playwright/CDP fallback. |
| `oracle-debug-check` | active | Oracle read-only workflow and forbidden operations. |
| `post-run-memory-updater` | active | End-of-run durable memory updater and ledger append path. |
| `spreadsheet-testcase-writer` | active | Reads existing testcase spreadsheets first, adapts to current headers and tabs, and appends draft rows without creating new templates. |
| `test-case-designer` | active | Produces positive, negative, edge, regression, UI, API, and DB-aware test cases. |

Prompts live under `02-brain/.opencode/prompts/`: `access-stabilization.md`, `adhoc-bug-capture.md`, `auto-orchestration.md`, `bpmn-extraction.md`, `bpmn-mom-testcase-generation.md`, `bpmn-monitoring-usage.md`, `bpmn-transaction-mapping.md`, `db-readonly-validation.md`, `debugger-rca.md`, `design-vs-ui-compare.md`, `exploratory-run.md`, `figma-to-expected.md`, `handoff-generate.md`, `module-refresh.md`, `post-run-update.md`, `spreadsheet-testcase-write.md`, and `uat-draft.md`.

## 8. Runtime Workspace

Runtime root: `01-runtime/runtime/`.

Authoritative runtime docs:

- `docs/ACTIVE_RUNTIME_SURFACE.md`
- `docs/READY_COMMANDS.md`
- `docs/ACTIVE_MODULE.md`
- `docs/CONTEXT_HANDOFF.md`
- `docs/LAST_RUN_SUMMARY.md`
- `docs/BLOCKERS.md`
- `docs/SESSION_HEALTH.md`
- `docs/RUNTIME_STRUCTURE.md`
- `docs/OPENCODE_MEMORY_GUIDE.md`

Runtime folder map:

| Path | Purpose |
| --- | --- |
| `access/` | App entry points and generic access checks. |
| `access/probes/` | Generic access probes. |
| `capture/` | Manual flow recorder and evidence helpers. |
| `docs/` | Runtime truth and operator guidance. |
| `modules/` | Active regression runner plus module suites. |
| `modules/shared/` | Shared classification, selector registry, and network observer helpers. |
| `modules/transaction-mapping/` | Transaction Mapping suite, profile, selector registry, execution baseline. |
| `session/` | Session/profile wrappers delegating to canonical auth helpers. |
| `shell/` | PowerShell API/menu/session helpers. |

Runtime NPM scripts: `open:pgn`, `open:pgn:browser-use`, `check:access`, `check:browser-use`, `check:cdp`, `run:open`, `regression:happy`, `regression:negative`, `regression:edge`, `regression:full`, `regression:tm:smoke`, `regression:tm:flow`, and `record:manual`.

Root runtime package scripts: `brain:refresh`, `browser-use:check`, `oracle:validate`, `oracle:mcp`, and `playwright:mcp`.

## 9. Runtime Tools

Important browser automation and evidence tools:

- `01-runtime/tools/set-browser-use-env.ps1`
- `01-runtime/tools/browser-use-mcp-check.js`
- `01-runtime/tools/opencode-local.cmd`
- `01-runtime/runtime/access/browser-use-open.js`
- `01-runtime/runtime/docs/BROWSER_USE_SMOKE_TEST.md`
- `01-runtime/tools/check-cdp.js`
- `01-runtime/tools/start-browser.bat`
- `01-runtime/tools/cdp-utils.js`
- `01-runtime/tools/attach-and-open.js`
- `01-runtime/tools/check-current-page.js`
- `01-runtime/tools/check-console-errors.js`
- `01-runtime/tools/dom-observation.js`
- `01-runtime/tools/ant-design-helpers.js`
- `01-runtime/tools/table-evidence.js`
- `01-runtime/tools/transaction-mapping-cdp.js`
- `01-runtime/tools/run-pgn.js`

Important auth/session tools: `auth-session-utils.js`, `check-auth-session.js`, `capture-session.js`, `restore-session.js`, `check-auth-info.js`, `check-session-state.js`, and `debug-session-restore.js`.

Important Oracle tools: `oracle-readonly-validator.js`, `oracle-readonly-mcp-server.mjs`, `OracleReadonlyJdbcRunner.java`, `oracle-testdata-injector.js`, `oracle-testdata-mcp-server.mjs`, and `OracleTestdataDmlJdbcRunner.java`.

Important memory/storage tools: `append-learning-block.js`, `refresh-recall-index.js`, `refresh-knowledge-raw-catalog.js`, `audit-opencode-storage.js`, `audit-external-opencode-leftovers.js`, `archive-temp-workdirs.js`, `archive-external-opencode-leftovers.js`, `workspace-paths.js`, and `opencode-local.cmd`.

Important Telegram tools: `telegram-bug-reporter.js` and `telegram-bug-reporter-mcp-server.mjs`.

## 10. QA Execution Classification

Global standard: `02-brain/distilled-output/global/qa-execution-classification.md`.

| Classification | Use When |
| --- | --- |
| `bug` | Product behavior contradicts expected flow after environment, Browser Use, and script issues are ruled out. |
| `expected_validation` | Required-field, format, permission, or guardrail validation appears as expected. |
| `script_false_positive` | Browser Use or Playwright/CDP automation failed due timing, model/tool action drift, selector brittleness, hidden Ant Design input, stale element, or script flow before product failure is proven. |
| `blocked_by_business_rule` | A known workflow, approval, status, reference-data, or permission rule legitimately blocks the scenario. |
| `needs_manual_review` | Evidence is incomplete, access is unavailable, or UI/API/DB evidence conflicts. |

Required result fields: `status`, `classification`, `classification_reason`, `expected`, `actual`, `evidence`, and `network` when UI execution observes API effects.

Guardrail: expected validation is a pass, not a bug. Script failure is not an app defect until product behavior is proven.

## 11. Active Module and Major Milestones

### Current Active Module

- Module: Customer-SA Layer Test Data Preparation
- Path: Database Layer (`PRABILL_SA`, `PRABILL_SA_PRCRULE`)
- URL: N/A, DB-only operation
- Status: completed 116-row transformation; dataset ready for UI testing
- Related modules: Monitoring Usage, Rating & Billing, Customer Management

Next best actions: verify transformed accounts in PGN Billing UI modules, use the dataset for usage entry/rating/billing workflow testing, and compare any UI data-quality issue against the final DB report.

### Customer-SA Layer 116-Row Transformation

Status: committed and verified.

Business rules applied:

- RT segment: all main SA = BBG, no child.
- PK/KI segments: main SA = PJBG, one child per main where applicable.
- Child types: KEPMEN, BAGP, SPOTGAS, INTERRUPTIBLE, AMENDMENT.
- Price rule/currency split: N/Y and IDR/USD.
- Time unit: MONTHLY (`BILL_PERIOD=453`).
- Status: Active, approval = APPROVED where applicable.
- End date: 2030-12-31.
- Usage constraints: RT 10-50, PK/KI 1000-5000.

Execution: 16 UPDATE statements via guarded `oracle_testdata`; flow was validate -> rollback apply -> explicit commit -> read-only verification; duration 13.8 seconds; rows affected 1,529 accumulative.

Key evidence:

- `06-testing/test-data/db-injection/plans/customer-sa-layer-116-final-transformation-rollback.json`
- `05-observability/db-injection/execution-results/20260414T105106Z--apply-commit-116-final.md`
- `05-observability/db-validation/query-results/CUSTOMER-SA-LAYER-116-FINAL-REPORT.md`
- `02-brain/distilled-output/per-module/customer-sa-layer/module-knowledge.md`
- `02-brain/distilled-output/per-module/customer-sa-layer/handoff.md`

### SOR 739/740 SA Standardization Plan

Status: prepared and pre-validated, not confirmed executed in db-injection artifacts.

Purpose: standardize 47 selected SOR 739/740 accounts so each has at least one active SA with `START_DATE=2025-01-01` and `END_DATE=2030-12-31`.

| Segment | Accounts |
| --- | ---: |
| PK | 7 |
| RT | 10 |
| KI | 30 |
| Total | 47 |

Pre-execution state from 2026-04-16: 30 accounts with active SA, 14 with inactive/expired SA needing activation, and 3 without SA needing new SA creation.

Prepared files:

- `06-testing/test-data/db-injection/plans/sa-standardization-sor739-740.json`
- `06-testing/test-data/db-injection/plans/sa-standardization-sor739-740-EXECUTE.sql`
- `05-observability/db-validation/query-results/PRE-EXECUTION-VALIDATION-REPORT.md`
- `05-observability/db-validation/query-results/FINAL-SELECTION-ADJUSTED-ACCOUNTS.md`
- `05-observability/db-validation/query-results/FINAL-SA-PROCESSING-REQUIRED.md`

Safety note: the SQL file contains direct DML plus `COMMIT`; treat it as reference unless the user explicitly asks to execute it. Preferred path remains guarded JSON plan validation, rollback proof, explicit commit confirmation, and read-only verification.

### Account `00018585` Enrichment

Status: committed and verified on 2026-04-13.

Final committed state:

- `M_ACCOUNT.ID=1393`: `SOR_ID=740`, `ACCOUNT_SEGMENT=601`, `UPDATED_BY=qautomation`
- `M_ACCOUNT_TAX_IMPLICATION`: active `TAX_IMPLICATION_ID=599`
- Related SA pricing rule (`PRABILL_SA_ID=601470`) has target USD row with expected range/value/code fields.

Evidence:

- `05-observability/db-injection/execution-results/20260413T044004Z--apply-commit-00018585-enrichment-v2.json`
- `05-observability/db-validation/query-results/20260413T044014Z--verify-committed-m-account-00018585.json`
- `05-observability/db-validation/query-results/20260413T044017Z--verify-committed-taximplication-1393.json`
- `05-observability/db-validation/query-results/20260413T044020Z--verify-committed-prcrule-601470.json`

## 12. Module Knowledge Packs

Module packs live under `02-brain/distilled-output/per-module/`.

| Module | Available Files | Status |
| --- | --- | --- |
| `customer-sa-layer` | `handoff.md`, `module-knowledge.md` | New DB/test-data foundation pack; ready for UI testing. |
| `monitoring-usage` | `bug-history.md`, `business-flow.md`, `dependencies.md`, `handoff.md`, `known-api.md`, `test-notes.md`, `validation-rules.md` | Explored in non-destructive UI pass; needs MoM/BPMN/API reconciliation for strict business assertions. |
| `tax-code` | `handoff.md`, `test-notes.md` | Ad hoc list-level functional pass plus confirmed condition End Date bug. |
| `transaction-mapping` | `bug-history.md`, `business-flow.md`, `dependencies.md`, `handoff.md`, `known-api.md`, `test-notes.md`, `validation-rules.md` | Flow verified historically; execution maturity baseline added. |

Transaction Mapping execution maturity files include shared classification, network observer, selector registry, module execution profile, selector registry, execution baseline, and result schema.

Transaction Mapping profile highlights:

- Menu: `System Setup > Master Data > Transaction Mapping`
- List URL: `https://dev-energy.pgn.co.id/system-setup/billing-item`
- Create URL: `https://dev-energy.pgn.co.id/system-setup/billing-item/create`
- Safe action order: `listSmoke`, `createSmoke`, `edgeCase`, `happyPath`
- Network pattern: `/rbi/v1/dbs/api/billingitem/`

## 13. Known Findings and Caveats

### Confirmed Product Bug: Tax Code Condition End Date

- Module: `System Setup > Master Data > Tax Code`
- Area: Create Tax Code -> Criteria Information -> Condition
- Symptom: saved condition row auto-populates `End Date` with `Start Date` when `End Date` was left blank.
- Observed row values: `START DATE = 11 Apr 2026`, `END DATE = 11 Apr 2026`.
- Classification: functional/data integrity bug.
- Severity: Medium.
- Status: open/reported to Telegram.

Evidence:

- `01-runtime/artifacts/adhoc-notes/tax-code-condition-list-current-state.json`
- `01-runtime/artifacts/screenshots/tax-code-condition-list-current-state.png`
- `05-observability/telegram-reporting/outbox/20260411T151408Z--tax-code-end-date-pada-condition-auto-terisi-mengikuti-start-date-meski-end-date-tidak-diinput.json`

### Tax Code List-Level Functional Pass

Executed controls passed for: Advanced Search open/close, Add Linear Filter, Add Filter Rules, Clear Filter, Refresh, Create navigation, create-page Cancel/Confirm return, profile dropdown, Download List click, and Column Settings click.

Remaining caveat: row-level action and per-column filter targeting need stronger selector strategy before exhaustive coverage can be claimed.

### Monitoring Usage Exploratory Baseline

Executed non-destructive scope: list load, Advanced Search controls, Refresh, Column Settings, Download List click, Approval modal entry, Upload Usage page entry, and back navigation.

Result: pass for executed scope.

Caveat: one `Reject` click attempt in approval modal timed out through MCP. Classify as automation caveat / `script_false_positive` candidate until product failure is proven.

### Transaction Mapping Reconciliation Rule

Do not downgrade Transaction Mapping from completed/verified product truth because of a weaker later automation path unless the later run disproves persisted product behavior.

Known caveat: Approval Hierarchy can be hard to automate on lazy-render-sensitive reruns; treat as automation caveat until product behavior fails under stable/manual proof.

## 14. Oracle Read-Only Validation

`oracle_readonly` is the proof layer for schema, data, and persistence checks.

Allowed:

- `SELECT`
- `WITH`
- Metadata/schema inspection
- Read-only expected-vs-actual comparison
- DB evidence for RCA

Forbidden:

- `INSERT`, `UPDATE`, `DELETE`, `MERGE`
- `TRUNCATE`, `ALTER`, `DROP`, `CREATE`
- `COMMIT`, `ROLLBACK`
- Anonymous `BEGIN/END`
- Side-effect procedures/packages/functions
- Any query not clearly read-only

Output target: `05-observability/db-validation/query-results/`.

Useful smoke command:

```powershell
cd D:\AI-QA-LAB\01-runtime\runtime
node ..\tools\oracle-readonly-validator.js --sql "select 1 as ok from dual" --label smoke
```

## 15. Oracle Test-Data Injection

`oracle_testdata` is the only intended direct DB mutation path.

Rules:

- Plans live under `06-testing/test-data/db-injection/plans/`.
- Default is dry-run/validation.
- `--apply` executes and rolls back unless commit gates are supplied.
- Persistent commit requires explicit confirmation gates.
- Evidence is stored under `05-observability/db-injection/execution-results/`.
- Any business parameter correction requires revalidation and rollback apply before commit.

Commit gate pattern:

```powershell
cd D:\AI-QA-LAB\01-runtime\runtime
node ..\tools\oracle-testdata-injector.js --plan <plan.json> --apply --commit --confirm <plan-token> --confirm-commit TESTDATA_DML_COMMIT
```

Current key plan files:

- `_template.insert-testdata.json`
- `_smoke.rollback-update-noop.json`
- `tax-code-account-00018585-enrichment-rollback.json`
- `customer-sa-layer-116-balance-currency-pricing-rollback.json`
- `customer-sa-layer-116-balance-currency-and-rule-4way.json`
- `customer-sa-layer-116-final-transformation-rollback.json`
- `sa-standardization-sor739-740.json`
- `sa-standardization-sor739-740-EXECUTE.sql` as reference SQL, not preferred execution path

## 16. Telegram Bug Reporting

Mode:

- Dry-run by default.
- Sends only with explicit `--send` / `send=true`.
- Uses local ignored config in `02-brain/.opencode/config/`.
- Never paste tokens, DB passwords, cookies, session tokens, OTP, wallet secrets, or raw auth material into reports.

Artifacts:

- Outbox: `05-observability/telegram-reporting/outbox/`
- Template: `06-testing/bug-reports/telegram/_template.bug-report.json`

Known artifacts:

- `05-observability/telegram-reporting/outbox/20260412T023008Z--ai-workspace-spec-telegram-dry-run.json`
- `05-observability/telegram-reporting/outbox/20260411T151408Z--tax-code-end-date-pada-condition-auto-terisi-mengikuti-start-date-meski-end-date-tidak-diinput.json`
- `05-observability/telegram-reporting/outbox/20260411T144013Z--telegram-config-smoke-send.json`

Telegram topic/thread ID is not configured in observed docs, so reports go to the main group unless config changes.

## 17. Raw Knowledge Base

Raw knowledge root: `04-knowledge-raw/`.

Catalog:

- `02-brain/distilled-output/global/raw-knowledge-catalog.md`
- `02-brain/distilled-output/global/raw-knowledge-catalog.json`
- Total raw files: 52
- Catalog generated: 2026-04-10T16:18:34.785Z

| Group | Count | Preferred Use |
| --- | ---: | --- |
| App Testing Standards | 2 | Use first for PGN Billing-specific rules. |
| MoM | 8 | Business rules, approval logic, validation expectations, workshop decisions. |
| BPMN Reviewed | 25 | Use on demand after distilled flow and MoM are insufficient. |
| BPMN Ready To Review | 10 | Use only when reviewed BPMN does not cover the module. |
| BPMN Revise | 3 | Lower-confidence raw flow input. |
| QA Standards UI | 1 | UI behavior, usability, presentation validation. |
| QA Standards API | 1 | Endpoint behavior, payload, status code, contract validation. |
| QA Standards Automation | 1 | Selector strategy, waits, retries, automation discipline. |
| QA Standards Test Data | 1 | Test data coverage, seeding, data quality. |

Rule: do not mass-convert raw knowledge. Read the smallest relevant raw source, and prefer distilled module/global knowledge when already available.

## 18. Observability and Evidence

Observability root: `05-observability/`.

| Path | Purpose |
| --- | --- |
| `db-validation/` | Oracle read-only evidence, schema notes, query templates, UI-to-DB mapping, RCA notes. |
| `db-validation/queries/` | Safe shared/module SQL templates. |
| `db-validation/query-results/` | JSON/Markdown query results and reports. |
| `db-injection/` | Guarded test-data DML evidence. |
| `db-injection/execution-results/` | Validation/rollback/commit execution artifacts. |
| `telegram-reporting/` | Telegram dry-run/send artifacts. |
| `opencode-storage/` | Storage audit evidence. |

High-signal evidence:

- `05-observability/db-validation/query-results/CUSTOMER-SA-LAYER-116-FINAL-REPORT.md`
- `05-observability/db-injection/execution-results/20260414T105106Z--apply-commit-116-final.md`
- `05-observability/db-validation/query-results/PRE-EXECUTION-VALIDATION-REPORT.md`
- `05-observability/db-validation/query-results/FINAL-SA-PROCESSING-REQUIRED.md`
- `05-observability/db-validation/query-results/20260416T044803Z--ad-hoc-readonly-query.md`
- `05-observability/db-validation/query-results/20260413T044014Z--verify-committed-m-account-00018585.json`
- `05-observability/telegram-reporting/outbox/20260411T151408Z--tax-code-end-date-pada-condition-auto-terisi-mengikuti-start-date-meski-end-date-tidak-diinput.json`

Encoding note: several generated Markdown artifacts contain mojibake from emoji/symbol encoding. Future durable specs and reports should prefer plain ASCII status labels unless the output path is proven UTF-8 safe.

## 19. Testing Area

Testing root: `06-testing/`.

| Path | Purpose |
| --- | --- |
| `adhoc/fixtures/` | Ad hoc fixtures such as Transaction Mapping dummy upload PDF. |
| `bug-reports/telegram/` | Telegram bug report template and future curated report JSON files. |
| `design-reference-staging/` | Local staging area for Figma expected references, comparison drafts, and Needs Confirmation Lists. |
| `exploratory/` | Exploratory output area. |
| `smoke/` | Smoke output area. |
| `testcase-staging/` | Local staging area for spreadsheet testcase drafts when MCP or approval is unavailable. |
| `test-data/db-injection/` | DB injection README and plans. |
| `uat-draft/` | UAT draft/test case output area. |

Primary fixture:

- `06-testing/adhoc/fixtures/transaction-mapping-dummy-upload.pdf`

## 20. Security and Safety Guardrails

General:

- Use `01-runtime/tools/falid-local.cmd` for FALID AI WORKSPACE runs so config/data/cache/state stay inside `01-runtime/temp/opencode-xdg/`. `opencode-local.cmd` remains the compatible fallback.
- Do not create random `_tmp-xdg*` folders at root.
- Archive uncertain leftovers to `99-archive/` instead of deleting.
- Treat `99-archive/`, `03-auth/`, and `node_modules` as low-priority context unless relevant.

Secrets:

- Do not reveal Telegram tokens, DB passwords, cookies, session tokens, OTP, wallet secrets, or raw auth artifacts.
- Local secret configs are expected under `02-brain/.opencode/config/`.
- Browser Use provider keys are runtime/local-only values (`OPENAI_API_KEY` or `ANTHROPIC_API_KEY`) and must not be hardcoded in `opencode.json`; use shell env or `02-brain/.opencode/config/browser-use.local.env`.
- Reference evidence paths instead of pasting sensitive raw dumps.

DB:

- `oracle_readonly` is read-only only.
- `oracle_testdata` is the only intended path for DB DML.
- Direct DB DML requires saved plan, validation/dry-run, rollback proof when feasible, explicit commit gates, and post-commit read-only verification.
- Never change table structure.
- Never run ad hoc DML from chat text.

Telegram:

- Dry-run first unless the user explicitly asks to send.
- Use concise group-ready summaries.
- Keep role strings exact when requested, e.g. `Role: qautomation (End User)`.

App automation:

- Prefer Browser Use for normal browser interaction.
- Keep CDP attach and existing browser session for fallback, screenshots, snapshots, and recovery.
- Ask user to manually login or complete OTP when required.
- Use Playwright MCP/CDP for fallback actions, waits, deterministic screenshots, snapshots, and low-level evidence.
- Treat timeouts as automation caveats until product failure is confirmed.
- For spreadsheet testcase writing, read workbook metadata, tabs, and headers first; preserve the existing structure; default to append-only draft rows; and do not create a new template unless explicitly requested.
- For Figma design reference work, keep Figma read-only, treat design as reference evidence rather than absolute truth, require design confidence scoring, and require confirmation before turning design mismatch into bug language or release blockers.

## 21. Recommended Operating Flow

Start FALID AI WORKSPACE TUI:

```powershell
D:\AI-QA-LAB\01-runtime\tools\falid-local.cmd D:\AI-QA-LAB --continue --agent engineer
```

Inside TUI at the start:

```text
/memory-load
```

Before ending important work:

```text
/memory-save
```

Common runtime commands:

```powershell
cd D:\AI-QA-LAB
.\01-runtime\tools\set-browser-use-env.ps1
cd D:\AI-QA-LAB\01-runtime\runtime
node ..\tools\browser-use-mcp-check.js
node access\browser-use-open.js
node ..\tools\check-cdp.js
node ..\tools\check-auth-session.js
node ..\tools\capture-session.js
node modules\run-active-module-regression.js --mode full --dry-run
node modules\run-active-module-regression.js --module transaction-mapping --mode smoke --dry-run
node ..\tools\oracle-readonly-validator.js --sql "select 1 as ok from dual" --label smoke
node ..\tools\refresh-knowledge-raw-catalog.js
node ..\tools\refresh-recall-index.js
```

Telegram dry-run:

```powershell
cd D:\AI-QA-LAB\01-runtime\runtime
node ..\tools\telegram-bug-reporter.js --input ..\..\06-testing\bug-reports\telegram\_template.bug-report.json
```

## 22. Known Gaps and Maintenance Items

1. Ledger index drift was observed before this migration and repaired: `latest.json` and `chain-state.json` now point to `LLV1-000024`.
2. Working tree is dirty and includes many generated artifacts; avoid cleanup without explicit user approval.
3. SA standardization for 47 accounts has plan/report artifacts but no observed matching db-injection execution artifact.
4. Some generated Markdown evidence has mojibake; future long-lived specs should stay ASCII or enforce UTF-8 output.
5. Tax Code condition End Date bug needs backend persistence correlation if final RCA is requested.
6. Monitoring Usage approval-modal action requires stronger selector/API evidence before classifying any reject/approve failure as product bug.
7. Transaction Mapping Approval Hierarchy automation still benefits from stronger lazy-render/scroll strategy.
8. Telegram topic/thread ID is not configured in observed docs.
9. Raw knowledge catalog is current to 2026-04-10; refresh it if new raw docs are added.

## 23. Bottom Line

`FALID AI WORKSPACE` is now a Git-backed, local-first PGN Billing QA operating system with a unified Engineer brain, project-local OpenCode storage, Browser Use primary browser automation, Playwright/CDP fallback evidence and recovery, Oracle read-only proof, guarded Oracle test-data DML, Telegram bug reporting, MoM/BPMN/QA-standard routing, flow-aware execution classification, Transaction Mapping execution baseline, Customer-SA Layer module pack, a committed 116-row Customer-SA dataset, and a prepared SOR 739/740 SA standardization plan for 47 accounts.

The most important operating rule remains: keep using evidence hierarchy and guardrails. For UI issues, prove product behavior before calling a bug. For DB setup, use saved guarded plans and verification. For memory, update runtime docs, module packs, recall index, and learning ledger so the lab improves across sessions instead of depending on transient chat history.
