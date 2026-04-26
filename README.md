# FALID AI WORKSPACE

FALID AI WORKSPACE - Agentic QA Operating System

FALID AI WORKSPACE is the canonical product identity for this repository. It evolved from the internal AI-QA-LAB foundation and keeps that filesystem/runtime base for continuity, auditability, and low-risk reuse.

It is a local-first QA operating system for PGN Billing with a unified Engineer brain, Browser Use primary browser automation, Playwright/CDP fallback evidence and recovery, Oracle validation, guarded test-data injection, controlled execution support, durable memory, and an append-only learning ledger.

## Canonical Docs

- Full specification: `AI-QA-LAB_FULL_SPEC.md`
- Operator commands: `01-runtime/runtime/docs/READY_COMMANDS.md`
- Runtime truth: `01-runtime/runtime/docs/`
- Working tree hygiene plan: `01-runtime/runtime/docs/WORKING_TREE_HYGIENE_PLAN.md`

## Layout

- `01-runtime/` holds runtime scripts, helper tools, working artifacts, and lightweight temp state.
- `02-brain/` holds `.opencode`, distilled knowledge, and Learning Ledger v1.
- `03-auth/` stores browser profile, user-data, auth state, and access helper notes.
- `04-knowledge-raw/` stores MoM, BPMN PDFs, QA standards, and raw references.
- `05-observability/` stores network mapping and DB validation evidence.
- `06-testing/` stores adhoc fixtures, test assets, spreadsheet testcase staging drafts, and design reference staging drafts.
- `07-falid-shell/` stores the FALID CLI/web shell surface for local status, actions, ports, and logs.
- `99-archive/` stores legacy playground material and migration leftovers that were kept for safety.

## Quick Start

1. Ensure `uvx` is available in `PATH`; Browser Use MCP is configured as `browser_use` in `opencode.json`.
2. Set model-provider credentials before starting OpenCode. Browser Use now starts through `01-runtime\tools\browser-use-local.cmd`, which loads `02-brain\.opencode\config\browser-use.local.env` only for the Browser Use MCP process. OpenCode/Engineer loads `02-brain\.opencode\config\opencode-provider.local.env` separately.
   - Preferred Browser Use route: LiteLLM local proxy -> OpenCode Go `glm-5`, using `02-brain\.opencode\config\litellm-opencode-go.glm-5.yaml`.
   - Keep the OpenCode Go key in `litellm-opencode-go.local.env` as `OPENCODE_GO_API_KEY`. Use `LITELLM_MASTER_KEY` as Browser Use `OPENAI_API_KEY`.
3. Run `node .\01-runtime\tools\browser-use-mcp-check.js`; `READY_CONFIGURED` means config, `uvx`, and provider key are all present.
4. Start FALID AI WORKSPACE with `01-runtime\tools\falid-local.cmd` or `01-runtime\tools\falid-local.cmd serve`; the branded wrapper keeps the same project-local storage behavior and auto-starts the local LiteLLM proxy when Browser Use is configured for OpenCode Go `glm-5`.
   - Backward-compatible fallback: `01-runtime\tools\opencode-local.cmd`
   - Optional local web shell: from `07-falid-shell\web`, run `npm.cmd run dev`.
5. Use Browser Use first for PGN Billing browser interaction.
6. Keep CDP port `9222` available for Playwright/CDP fallback, deterministic evidence, screenshots, and session recovery.
7. From `01-runtime/runtime`, run one of the prepared commands in `docs/READY_COMMANDS.md`.
8. Let Engineer update runtime, memory, recall index, distilled knowledge, and Learning Ledger v1 after each meaningful run.
9. Use MoM and extracted business flow before broad testing when the topic is application behavior or business rules.
10. Use BPMN extraction only on-demand through the prompts and skills in `02-brain/.opencode/`.

## Product Surface

- Canonical product name: `FALID AI WORKSPACE`
- Default tagline: `FALID AI WORKSPACE - Agentic QA Operating System`
- Primary operating agent: `Engineer`
- Preferred launcher: `01-runtime\tools\falid-local.cmd`
- Backward-compatible launcher: `01-runtime\tools\opencode-local.cmd`
- Local CLI/web shell: `07-falid-shell/`
- Project-local TUI theme config: `tui.json`
- Project-local custom theme: `.opencode/themes/falid-ai-workspace.json`

Use `/theme` inside OpenCode or edit `tui.json` if you want to switch themes later.

## Local Brain Rules

- Runtime context lives in `01-runtime/runtime/docs/*.md`.
- Runtime scripts are grouped by function under `01-runtime/runtime/access`, `capture`, `modules`, `session`, and `shell`.
- Durable learning lives in `02-brain/.opencode/` and `02-brain/learning-ledger/`.
- Fast recall lives in `02-brain/.opencode/memory/RECALL_INDEX.md` and user preferences live in `02-brain/.opencode/memory/USER_WORKING_PREFERENCES.md`.
- Primary browser interaction lives in the local `browser_use` MCP server, launched through `01-runtime\tools\browser-use-local.cmd`; the LiteLLM proxy it depends on is auto-ensured by `01-runtime\tools\opencode-local.cmd`.
- Precision fallback, screenshots, deterministic snapshots, and session recovery live in the local `playwright_cdp` MCP server.
- Oracle validation lives in `oracle_readonly`; controlled DB setup lives only in guarded `oracle_testdata` plans.
- Raw knowledge is never mass-converted; BPMN stays raw until explicitly extracted.
- OpenClaw orchestration plans multi-layer work first, defaults to SAFE MODE, and requires approval before writes.
- Figma REST bridge, Design Confidence, Design-vs-UI Compare, and Diagnosis Engine are read-only/reference-first flows that keep mismatches in Needs Confirmation until verified.
- Legacy files were archived instead of deleted when there was migration uncertainty.

## Spreadsheet Testcase Writing

- FALID can read existing spreadsheet or Google Sheets testcase workbooks through `google_sheets_testcase` when a real MCP server is configured.
- Default behavior is read-first and append-only draft rows so existing sheet structure, tabs, formulas, formatting, and rows are preserved.
- New testcase templates are not created unless explicitly requested.
- If spreadsheet MCP is unavailable or direct write is not approved, stage the draft under `06-testing/testcase-staging/`.
- The current `google_sheets_testcase` entry in `opencode.json` is a disabled placeholder; setup notes live in `02-brain/.opencode/config/google-sheets-testcase-setup.md`.

## Figma Design Reference Layer

- FALID wires `figma_design` to the Figma Remote MCP endpoint in a safe disabled-by-default state.
- Figma Remote MCP remains the preferred path when the client is supported, but OpenCode can still hit a remote-auth `403` if Figma does not currently accept that client path.
- Engineer can read design context, generate expected UI references, compare current UI versus design, and stage design-derived testcase ideas locally.
- FALID includes a Design Confidence Layer so Figma expected references are scored as `HIGH`, `MEDIUM`, or `LOW` before they influence testing or release decisions.
- Figma design is reference evidence, not absolute product truth.
- Design mismatch becomes `needs_design_confirmation` by default unless confidence and evidence are strong enough.
- Release decision can include `Design/Figma` evidence coverage when design is relevant.
- If Figma MCP is unavailable or the output needs review first, stage the artifact under `06-testing/design-reference-staging/`.
- Figma OAuth and remote MCP auth stay local through `01-runtime\tools\falid-local.cmd`, which keeps OpenCode auth storage under `01-runtime/temp/` and now auto-skips LiteLLM startup for `mcp` commands.
- If remote MCP auth is blocked, use the read-only REST fallback with local-only `FIGMA_TOKEN` guidance in `02-brain/.opencode/config/figma-rest-readonly-setup.md`.
- Figma Desktop MCP is an optional alternative when the desktop app, seat, and client path support it.
- The repo default keeps `figma_design` disabled until the documented read-only smoke flow passes. See `02-brain/.opencode/config/figma-design-setup.md` and `01-runtime/runtime/docs/FIGMA_REMOTE_MCP_SMOKE_TEST.md`.
