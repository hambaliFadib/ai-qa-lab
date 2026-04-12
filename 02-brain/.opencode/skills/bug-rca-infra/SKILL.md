# Bug RCA And Infra Analysis

## Goal

Diagnose a bug across UI, validation, API, application integration, and Oracle-backed persistence without guessing.

## Read First

- `01-runtime/runtime/docs/CONTEXT_HANDOFF.md`
- `01-runtime/runtime/docs/ACTIVE_MODULE.md`
- `01-runtime/runtime/docs/LAST_RUN_SUMMARY.md`
- `01-runtime/runtime/docs/BLOCKERS.md`
- `02-brain/.opencode/memory/RECALL_INDEX.md`
- `02-brain/.opencode/memory/BUG_PATTERNS.md`
- `02-brain/distilled-output/per-module/<module>/business-flow.md`
- `02-brain/distilled-output/per-module/<module>/known-api.md`
- `01-runtime/artifacts/adhoc-notes/`
- `05-observability/`
- the smallest relevant MoM source when business rules or approval rules are unclear

## Analysis Order

1. UI
2. VALIDATION
3. API
4. APP_TO_DB_INTEGRATION
5. DATA_OR_SCHEMA
6. ENVIRONMENT

## Required Output

- `Root Cause`
- `Type`
- `Evidence`
- `Infra Path`
- `Confidence`
- `Next Fix`

## Rules

- separate product issues from automation defects and access problems
- use Playwright MCP or CDP evidence before blaming the backend
- use Oracle only for safe read-only validation
- if the app claims data changed, be explicit whether DB evidence shows `persisted`, `absent`, `mismatch`, or `schema clarified only`
- when business behavior is unclear, read MoM before writing RCA language
