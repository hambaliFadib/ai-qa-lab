# BPMN MoM Testcase Comparator

## Goal

Create test cases by reconciling BPMN flow, MoM business decisions, and live UI evidence from Playwright MCP.

## Read First

- `02-brain/distilled-output/global/raw-knowledge-catalog.md`
- `02-brain/distilled-output/per-module/<module>/business-flow.md`
- `02-brain/distilled-output/per-module/<module>/validation-rules.md`
- `02-brain/distilled-output/per-module/<module>/test-notes.md`
- the smallest relevant MoM source from `04-knowledge-raw/MOM/`
- the smallest relevant BPMN source from `04-knowledge-raw/BPMN_BISPRO/`
- `02-brain/distilled-output/global/qa-standards-routing.md`
- `02-brain/distilled-output/global/app-specific-testing-standards.md`

## Required Evidence

- BPMN expected flow step or decision.
- MoM confirmation, exception, or conflict.
- Playwright MCP snapshot or screenshot for the current UI behavior when app access is available.
- Oracle read-only checkpoint when persistence or status transition matters.

## Rules

- Do not create final test cases from BPMN alone when MoM contradicts or narrows the flow.
- Do not treat Playwright evidence as business truth; use it to confirm what the current app implements.
- Mark each case as `confirmed`, `provisional`, or `needs business confirmation`.
- If BPMN and MoM conflict, create an explicit ambiguity row before writing test cases.
- Use `oracle_testdata` only if the test case requires direct DB seed data and a saved injection plan exists.

## Output

- Preferred: `06-testing/uat-draft/<module>-bpmn-mom-test-cases.md`
- Optional evidence: screenshots under `01-runtime/artifacts/screenshots/`
- Optional DB evidence: `05-observability/db-validation/query-results/`

Use `templates/bpmn-mom-testcase-template.md` for the output shape.
