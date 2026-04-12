# QA Standards Routing

## Status

Routing map for domain-specific QA standards stored under `04-knowledge-raw/QA_STANDARDS/`.

Before using generic QA standards, check `02-brain/distilled-output/global/app-specific-testing-standards.md` first.
If distilled app-specific guidance is still insufficient, read the smallest relevant raw source from `04-knowledge-raw/APP_TESTING_STANDARDS/` before opening generic QA standards.

Use this file to choose the smallest relevant QA standard before opening raw standards sources.

## Routing

- UI
  - Source: `04-knowledge-raw/QA_STANDARDS/UI/STANDARISASI QA FULL EDITION [ UI & UX - TEST ] v2.pdf`
  - Use when the issue concerns visibility, rendering, state change, validation display, navigation behavior, button response, dropdown response, copy, or UX regression.

- AUTOMATION
  - Source: `04-knowledge-raw/QA_STANDARDS/AUTOMATION/STANDARISASI QA FULL EDITION [ UI & UX - TEST ] v2.pdf`
  - Use when the issue concerns Playwright, CDP, MCP, selector strategy, timing, focus, retries, hidden inputs, visible wrappers, or automation-specific interaction methods.

- API
  - Source: `04-knowledge-raw/QA_STANDARDS/API/STANDARISASI API Test.pdf`
  - Use when the issue concerns request and response behavior, status code expectations, auth handling, payload validation, API errors, or contract expectations.

- TEST_DATA
  - Source: `04-knowledge-raw/QA_STANDARDS/TEST_DATA/Standarisasi Data Testing.pdf`
  - Use when the issue concerns seed data, reference data, required combinations, negative data, boundary data, or reproducibility setup.

## Rules

- Read only the smallest relevant standards source first.
- Prefer app-specific testing standards before generic QA standards when the assertion depends on PGN Billing formatting, status labels, list conventions, currency precision, or UI evidence rules.
- Use `04-knowledge-raw/APP_TESTING_STANDARDS/` when the rule is product-specific but not yet fully distilled.
- Do not broad-sweep every QA standard during routine module execution.
- Use QA standards to sharpen test method, bug evidence quality, severity, reproducibility, and issue classification.
- Do not let generic QA standards override stronger runtime evidence, module-specific knowledge, or business rules from MoM or BPMN.
- When multiple domains overlap, start from the suspected failure layer and expand only if uncertainty remains.
