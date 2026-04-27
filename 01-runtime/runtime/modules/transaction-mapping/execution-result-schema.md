# Transaction Mapping Execution Result Schema

Flow-aware baseline runner:

```powershell
node modules\transaction-mapping\execution-baseline.js --mode <smoke|happy|edge|full>
```

Dry-run:

```powershell
node modules\transaction-mapping\execution-baseline.js --mode full --dry-run
```

## Required Top-Level Fields

- `schema_version`: currently `ai-qa-lab.flow-execution-result.v1`
- `checked_at`
- `module`
- `mode`
- `selected_scopes`
- `safety`
- `summary`
- `results`
- `notes`

## Required Result Sections

- `results.listSmoke`
- `results.createSmoke`
- `results.happyPath`
- `results.edgeCase`

Each section should contain:

- `id`
- `title`
- `phase`
- `status`
- `classification`
- `classification_reason`
- `expected`
- `actual`
- `evidence`
- `network`
- `error`

## Classification Values

- `bug`
- `expected_validation`
- `script_false_positive`
- `blocked_by_business_rule`
- `needs_manual_review`
- `null` only for passing cases where no defect classification is required

## Safe Stop

If list or create smoke fails, downstream mutation-heavy phases should be skipped and classified as `needs_manual_review` until the blocker is resolved.
