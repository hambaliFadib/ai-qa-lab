# Test Case Designer

## Goal

Create durable test cases that are grounded in runtime truth, module knowledge, MoM, extracted business flow, QA standards, and observed defects.

## Read First

- `01-runtime/runtime/docs/ACTIVE_MODULE.md`
- `02-brain/.opencode/memory/RECALL_INDEX.md`
- `02-brain/distilled-output/per-module/<module>/business-flow.md`
- `02-brain/distilled-output/per-module/<module>/validation-rules.md`
- `02-brain/distilled-output/per-module/<module>/test-notes.md`
- `02-brain/distilled-output/per-module/<module>/bug-history.md`
- `01-runtime/artifacts/adhoc-notes/manual-flow-record-latest.md` when a fresh manual flow record exists
- `02-brain/distilled-output/global/qa-standards-routing.md`
- the smallest relevant MoM source when business rules are still unclear

## Outputs

- preferred: `06-testing/uat-draft/<module>-test-cases.md`
- optional trace copy: `01-runtime/ledger/uat_scenarios_draft.csv`

## Required Coverage

- objective and scope
- preconditions and test data
- positive scenarios
- negative scenarios
- edge scenarios
- regression checkpoints
- UI checkpoints
- API checkpoints when relevant
- DB checkpoints when persistence or status transition matters

## Rules

- mark each case as `confirmed`, `provisional`, or `needs business confirmation`
- use MoM before inventing business expectations
- use extracted `business-flow.md` before raw BPMN when it already exists
- keep each test case traceable to a source such as runtime, MoM, business flow, QA standard, or bug history
