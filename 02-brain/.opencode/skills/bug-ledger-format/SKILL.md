# Bug Ledger Format

## Goal

Keep bug logging factual and compatible with both the legacy CSV ledger and Learning Ledger v1.

## Required Outputs

- `01-runtime/ledger/bug_log.csv`
- `02-brain/distilled-output/per-module/<module>/bug-history.md`
- a new learning block when the bug adds reusable knowledge

## Rule

One bug row equals one reproducible issue. Keep environment blockers out of the product bug ledger unless the environment problem itself is the subject of the record.
