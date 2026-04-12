# Runtime Structure

## Goal

Keep runtime files grouped by function so operators and AI read the right surface first and avoid noise from mixed responsibilities.

## Folder Map

- `docs/`: runtime truth, handoff, blockers, command guide, session health.
- `access/`: app entry points and generic access checks.
- `access/probes/`: generic access probes such as login-surface checks.
- `capture/`: manual-flow recorder and evidence capture helpers.
- `modules/`: active-module regression runner and per-module folders.
- `modules/transaction-mapping/`: Transaction Mapping suites.
- `modules/transaction-mapping/probes/`: module-specific exploratory probes that stay near the module they inspect.
- `session/`: session/profile entrypoints. Canonical auth logic lives in `01-runtime/tools/`.
- `session/shell/`: PowerShell helpers for saved session inspection.
- `shell/`: PowerShell helpers for API/menu exploration.

## Operating Rule

Read `docs/ACTIVE_RUNTIME_SURFACE.md` and `docs/READY_COMMANDS.md` before running or extending runtime code.
