Use this prompt when a module test case must be generated from BPMN and MoM comparison.

Workflow:

1. Read `02-brain/distilled-output/global/raw-knowledge-catalog.md`.
2. Read the active module pack under `02-brain/distilled-output/per-module/<module>/`.
3. Select the smallest relevant MoM source and BPMN source; do not broad-sweep all raw files.
4. Extract expected steps, decisions, actors, input data, output data, and exception branches.
5. Use `playwright_cdp` to capture current UI snapshot and screenshot for the module path when app access is available.
6. Compare BPMN expectation, MoM expectation, and current UI evidence.
7. Use `oracle_readonly` for persistence/status checkpoints when the scenario changes DB-backed state.
8. If a scenario requires DB seed data, prepare or request a saved `oracle_testdata` plan under `06-testing/test-data/db-injection/plans/`; do not run ad hoc DML.
9. Write test cases to `06-testing/uat-draft/<module>-bpmn-mom-test-cases.md`.
10. Mark each case as `confirmed`, `provisional`, or `needs business confirmation`.

Rules:

- BPMN describes intended process flow.
- MoM confirms, narrows, or overrides business decisions when it is more specific and current.
- Playwright MCP confirms what the current app actually exposes.
- Oracle read-only confirms persistence reality.
- Test cases must include traceable evidence source columns.
