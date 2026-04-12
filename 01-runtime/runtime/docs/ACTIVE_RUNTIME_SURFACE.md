# Active Runtime Surface

## Purpose

This file defines which runtime files are authoritative for current PGN Billing testing and which files are exploratory only.

Use this before reading `01-runtime/runtime/` broadly.

## Current Structure

Read runtime folders by responsibility:

- `01-runtime/runtime/docs/` for runtime truth and operating guidance.
- `01-runtime/runtime/access/` for app entry and access validation.
- `01-runtime/runtime/access/probes/` for generic access probes only.
- `01-runtime/runtime/capture/` for manual-flow evidence capture.
- `01-runtime/runtime/modules/` for active regression runners and suites.
- `01-runtime/runtime/modules/<module>/probes/` for module-specific exploratory probes.
- `01-runtime/runtime/session/` for browser session helpers.
- `01-runtime/runtime/shell/` for lightweight API/menu probes.

## Trusted Runtime Truth

Read these first when you need the current testing surface:

- `01-runtime/runtime/docs/READY_COMMANDS.md`
- `01-runtime/runtime/docs/ACTIVE_MODULE.md`
- `01-runtime/runtime/docs/CONTEXT_HANDOFF.md`
- `01-runtime/runtime/docs/LAST_RUN_SUMMARY.md`
- `01-runtime/runtime/docs/SESSION_HEALTH.md`
- `01-runtime/runtime/modules/run-active-module-regression.js`
- `01-runtime/runtime/modules/transaction-mapping/happy-path.js`
- `01-runtime/runtime/modules/transaction-mapping/negative-suite.js`
- `01-runtime/runtime/modules/transaction-mapping/edge-suite.js`
- `01-runtime/runtime/modules/transaction-mapping/full-suite.js`
- `01-runtime/runtime/capture/manual-flow-recorder.js`
- `01-runtime/runtime/session/check-session.js` and `01-runtime/runtime/session/capture-session.js` as runtime wrappers only
- `01-runtime/tools/transaction-mapping-cdp.js`
- `01-runtime/tools/table-evidence.js`
- `01-runtime/tools/ant-design-helpers.js`
- `01-runtime/tools/playwright-mcp-server.mjs`
- `01-runtime/tools/check-*.js` and `01-runtime/tools/debug-page-structure.js` for evidence capture only

## Exploratory Or Legacy Scripts

Treat any local scratch or one-off probe script as non-authoritative unless the user explicitly asks to inspect or run it.

Examples of non-authoritative naming patterns:

- `tmp-*`
- `*-v*.js`
- `tx-*`
- `test-*`
- `debug-*`
- `investigate-*`
- `analyze-*`
- `final-*`
- `full-flow.js`
- `force-*`
- `stable-fill-*`
- `direct-fill-*`
- `complete-v*`

Most of the older scratch scripts in those families have been removed from `01-runtime/runtime` during cleanup. If they still matter for historical context, prefer `99-archive/` instead of rebuilding runtime truth from them.

## Rules

- Never let a scratch script replace verified module truth from the active suite.
- Never infer list headers, menu options, or approval IDs from exploratory scripts alone.
- Prefer shared helpers over local selector experiments.
- If trusted runtime truth conflicts with an exploratory script, trust the stronger live evidence and shared helper path.
