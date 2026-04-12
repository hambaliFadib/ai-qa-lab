# AUTO LEARNING LOG

## 2026-04-05 - Workspace Migration

- What happened: runtime, brain, auth, knowledge, observability, and testing layers were separated into a cleaner local-first structure.
- Learning: agent continuity depends more on durable files than on chat history.
- Pattern: archive uncertain leftovers instead of deleting them during refactor.
- Impact: the workspace is safer to continue across model or session changes.
- Reuse: future runs should update memory, handoff, module docs, and ledger in one pass.

## 2026-04-05 - Environment Reliability Reminder

- What happened: previous Transaction Mapping attempts were blocked by network or VPN instability.
- Learning: access health must be checked before module RCA.
- Pattern: environment blockers can look like app failures if CDP is active but the host is unreachable.
- Impact: bug quality improves when access is classified first.
- Reuse: always run access stabilization before a deep exploratory retry.

## 2026-04-06 - Transaction Mapping Manual Flow Record

- What happened: a fresh manual flow record reached `Save`, `Submit`, and `Confirm`, then returned to the Transaction Mapping list page.
- Learning: the old `Approval Hierarchy not visible` blocker is stale unless a fresh rerun proves it again.
- Pattern: a nominally successful create chain can still hide a frontend defect or post-submit persistence issue.
- Impact: future runs should start from the manual flow record and verify list persistence before reopening old UI blockers.
- Reuse: treat notification EventSource aborts as noise unless they correlate with a user-visible failure.

## 2026-04-06 - Logger: Post-Submit JS Error Logging

- What happened: logged the `a is not a function` error after Transaction Mapping create flow.
- Learning: JS error after Confirm does not block data persistence because the item appears in the list correctly.
- Pattern: frontend errors that appear post-submit but do not affect data are low-severity quality issues.
- Impact: bug log entry created with severity `Low` and type `Frontend`.
- Reuse: always verify list persistence before classifying post-submit JS errors as product bugs.

## 2026-04-06 - QA Standards Routing Integration

- What happened: the agent chain and orchestration prompt were wired to use `QA_STANDARDS` by domain instead of ignoring the folder.
- Learning: QA standards are most useful when routed by issue layer such as UI, API, automation, or test data, not when all PDFs are read at once.
- Pattern: a routing map keeps standards reusable without bloating normal module runs.
- Impact: future runs can automatically pull the smallest relevant QA standard before deciding expected behavior, severity, reproducibility, or interaction method.
- Reuse: use QA standards to sharpen testing and bug quality, but do not let them override runtime truth or module business evidence.

## 2026-04-06 - Evidence Reconciliation Guardrail

- What happened: a later automation-focused rerun downgraded Transaction Mapping despite stronger earlier evidence that the module was already complete and persistence-verified.
- Learning: weaker reruns must not overwrite stronger verified product truth without disproving it.
- Pattern: treat contradictory weaker evidence as caveat first, then downgrade only if the contradiction is stronger and reproducible.
- Impact: runtime truth now preserves completed product status while documenting the automation caveat separately.
- Reuse: reconcile manual flow record, module notes, and ledger history before changing module status.

## 2026-04-08 - Unified Engineer Brain Upgrade

- What happened: archived legacy Explorer, Logger, and Debugger roles and replaced them with a single Engineer operating model.
- Learning: the workspace becomes easier to continue when one agent owns architecture, testing, RCA, and infrastructure analysis end to end.
- Pattern: read recall memory, module pack, MoM, extracted flow, Playwright evidence, and Oracle validation in one chain instead of splitting responsibility across roles.
- Impact: future runs can create test cases, analyze bugs, inspect app to DB behavior, and persist learning without virtual handoff loss.
- Reuse: after every meaningful interaction, refresh the recall index and user-preference memory so the Engineer brain gets sharper over time.