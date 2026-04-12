# 01 Runtime

Operational layer for browser attach, runtime handoff, quick scripts, artifacts, and helper utilities.

- `runtime/docs/` is the source of truth for runtime status, commands, handoff, blockers, and session health.
- `runtime/access/` contains app entry points and access validation probes.
- `runtime/capture/` contains manual-flow recording.
- `runtime/modules/` contains active regression runners and module suites.
- `runtime/session/` contains session/profile helpers.
- `runtime/shell/` contains lightweight PowerShell API and menu helpers.
- `tools/` contains reusable Node helpers such as CDP checks, Oracle read-only validation, Oracle MCP server wiring, and ledger append tooling.
- `artifacts/` stores run evidence that should stay lightweight and easy to inspect.
- `ledger/` keeps legacy bug CSVs and smoke/UAT trackers that are still useful.
- `temp/` is safe for disposable intermediate files and project-local OpenCode runtime state under `temp/opencode-xdg/`.

Use `runtime/docs/READY_COMMANDS.md` as the main entry point for daily usage.

## Oracle Read-Only Validation

- `opencode.json` now registers a real local MCP server named `oracle_readonly`.
- The MCP server process is `01-runtime/tools/oracle-readonly-mcp-server.mjs`.
- The MCP server stays read-only by delegating execution to `01-runtime/tools/oracle-readonly-validator.js`.
- The backend tries Node Thin first and automatically falls back to JDBC when legacy verifier support or driver compatibility requires it.
- Oracle credentials are loaded from `02-brain/.opencode/config/oracle-readonly.local.env` first, then `.opencode/config/oracle-readonly.local.env` when needed.
- Saved outputs go to `05-observability/db-validation/query-results/` as JSON and Markdown evidence.
