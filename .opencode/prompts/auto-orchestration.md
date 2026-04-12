Use this prompt to run the active module through the unified Engineer chain.

Workflow:

1. Read `01-runtime/runtime/docs/ACTIVE_RUNTIME_SURFACE.md`, `01-runtime/runtime/docs/READY_COMMANDS.md`, `01-runtime/runtime/docs/ACTIVE_MODULE.md`, `01-runtime/runtime/docs/CONTEXT_HANDOFF.md`, and `01-runtime/runtime/docs/LAST_RUN_SUMMARY.md` first.
2. Treat `tmp-*`, `*-v*.js`, `test-*`, `tx-*`, `debug-*`, `investigate-*`, `final-*`, and other exploratory runtime scripts as non-authoritative unless the user explicitly asks to inspect them.
3. Read `02-brain/.opencode/memory/RECALL_INDEX.md` and `02-brain/.opencode/memory/USER_WORKING_PREFERENCES.md`.
4. Read the latest manual flow record in `01-runtime/artifacts/adhoc-notes/manual-flow-record-latest.md` when a fresh record exists.
5. Read the active module pack in `02-brain/distilled-output/per-module/<module>/` when the module is known.
6. Read `02-brain/distilled-output/global/app-specific-testing-standards.md` when it exists.
7. Read `02-brain/distilled-output/global/qa-standards-routing.md` when it exists.
8. Read `02-brain/distilled-output/global/raw-knowledge-catalog.md` before opening raw folders broadly.
9. If app-specific testing guidance is still incomplete, read the smallest relevant raw source from `04-knowledge-raw/APP_TESTING_STANDARDS/`.
10. Reconcile the latest run against stronger prior evidence before changing module truth.
11. Decide the active Engineer lane: architecture, flow analysis, test-case design, exploratory execution, bug logging, build/tooling support, RCA, or infra validation.
12. Check app-specific testing standards before reading generic QA standards when the assertion depends on PGN Billing formatting, list behavior, labels, amount precision, or UI evidence rules.
13. Auto read the smallest relevant QA standard source from `04-knowledge-raw/QA_STANDARDS/` when expected behavior, severity, reproducibility, or test method is still unclear.
14. If the topic concerns application behavior, approval logic, validation, or business rules, auto read the smallest relevant MoM source when distilled knowledge is still not enough.
15. Prefer extracted `business-flow.md` before raw BPMN and use BPMN extraction only on demand when memory, module knowledge, manual flow, app-specific standards, QA standards, and MoM still leave the flow unclear.
16. Validate CDP health before application access. Prefer the shared runtime CDP utilities so local port `9222` can auto-recover before Playwright MCP or runtime scripts attach.
17. Validate auth state before module testing. If the app is on login or OTP, ask the user to finish manual login in the attached browser and then capture the fresh session before continuing.
18. Use `playwright_cdp` MCP or existing CDP runtime scripts for precise execution and observation.
19. When generating test cases from BPMN and MoM, use `playwright_cdp` to verify current UI behavior before marking cases as confirmed.
20. When persistence, schema ambiguity, or app to DB mismatch needs confirmation, use `oracle_readonly` as a safe read-only validation source.
21. When test readiness requires direct DB seed data, use only saved `oracle_testdata` plans and dry-run first.
22. Produce the right output in one run: test cases, exploratory result, bug record, build/tooling fix, RCA, or app to DB infra analysis.
23. After the chain is complete, commit runtime updates, memory updates, user preference updates, module knowledge updates, a Learning Ledger v1 block, and the next handoff.

Rules:

- Engineer is the only active operating role
- do not skip the trusted runtime surface, recall index, or memory context reads
- do not let exploratory runtime scripts override stronger suite evidence or live DOM evidence
- use the latest manual flow record when it is newer than the current blocker context
- do not downgrade a completed or verified module unless newer evidence disproves the stronger earlier evidence
- use app-specific testing standards before generic QA standards when the claim depends on PGN Billing behavior or formatting conventions
- use the raw knowledge catalog before deciding which raw source to open
- use raw app-specific standards only when distilled guidance is not enough
- use the smallest relevant QA standards source instead of broad raw-knowledge sweeps
- use the smallest relevant MoM source instead of broad raw-knowledge sweeps
- validate CDP before opening the app and let the shared runtime auto-recover local browser access when needed
- when auth is blocked by login or OTP, ask for manual completion in the attached browser instead of treating it as a product bug
- capture the refreshed browser session after manual login before resuming module testing
- use Playwright MCP before creating a new one-off script when the action is already supported
- use Oracle only as a read-only validation source for safe persistence or schema confirmation
- never run write SQL, mutating procedures, or unsafe DB blocks
- stay inside the active module unless access stabilization forces a stop
- separate access issues from product issues
- stop module testing until access is stable
- never skip the final durable commit after the chain finishes
