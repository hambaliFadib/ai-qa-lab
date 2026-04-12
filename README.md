# PGN Billing AI QA Local Brain

Local-first QA operating system for PGN Billing with a unified Engineer brain, CDP-based runtime, Playwright MCP support, and append-only learning ledger.

## Layout

- `01-runtime/` holds runtime scripts, helper tools, working artifacts, and lightweight temp state.
- `02-brain/` holds `.opencode`, distilled knowledge, and Learning Ledger v1.
- `03-auth/` stores browser profile, user-data, auth state, and access helper notes.
- `04-knowledge-raw/` stores MoM, BPMN PDFs, QA standards, and raw references.
- `05-observability/` stores network mapping and DB validation evidence.
- `06-testing/` stores adhoc fixtures and test assets.
- `99-archive/` stores legacy playground material and migration leftovers that were kept for safety.

## Quick Start

1. Start or reuse a browser with CDP port `9222`.
2. Confirm auth/session state inside `03-auth/`.
3. From `01-runtime/runtime`, run one of the prepared commands in `docs/READY_COMMANDS.md`.
4. Let Engineer update runtime, memory, recall index, distilled knowledge, and Learning Ledger v1 after each meaningful run.
5. Use MoM and extracted business flow before broad testing when the topic is application behavior or business rules.
6. Use BPMN extraction only on-demand through the prompts and skills in `02-brain/.opencode/`.

## Local Brain Rules

- Runtime context lives in `01-runtime/runtime/docs/*.md`.
- Runtime scripts are grouped by function under `01-runtime/runtime/access`, `capture`, `modules`, `session`, and `shell`.
- Durable learning lives in `02-brain/.opencode/` and `02-brain/learning-ledger/`.
- Fast recall lives in `02-brain/.opencode/memory/RECALL_INDEX.md` and user preferences live in `02-brain/.opencode/memory/USER_WORKING_PREFERENCES.md`.
- Precision UI automation lives in the local `playwright_cdp` MCP server.
- Raw knowledge is never mass-converted; BPMN stays raw until explicitly extracted.
- Legacy files were archived instead of deleted when there was migration uncertainty.