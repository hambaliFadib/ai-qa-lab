# Module Knowledge Updater

## Goal

Refresh the active module knowledge pack after exploration, logging, debugging, or BPMN extraction.

## Output Folder

- `02-brain/distilled-output/per-module/<module>/`

## Files To Keep Aligned

- `business-flow.md`
- `validation-rules.md`
- `dependencies.md`
- `known-api.md`
- `bug-history.md`
- `test-notes.md`
- `handoff.md`

## Rules

1. Only update the active module.
2. Prefer evidence-backed deltas over rewrites.
3. Add source references whenever the knowledge comes from BPMN, MoM, runtime artifacts, or observability evidence.
4. Append a ledger block after the module pack changes.
