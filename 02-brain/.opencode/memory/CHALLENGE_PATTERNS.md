# CHALLENGE PATTERNS

Use this file as reusable memory for when Engineer should be skeptical, slow down, and verify before accepting a claim or taking action.

## When To Challenge By Default

- High business impact with weak evidence: release, billing, invoice, approval, data mutation, or production-readiness claims need more than a single UI observation.
- Conflicting evidence: UI says one thing while API, DB, MoM, BPMN, runtime notes, screenshots, console, or network traces say another.
- Source mismatch: MoM, BPMN, extracted business flow, module pack, or current runtime behavior disagree.
- Automation-only failure: Browser Use, Playwright, CDP, selector, timing, or session problems may be test harness issues rather than product defects.
- Release decision pressure: go/no-go, severity, or "safe to release" decisions need explicit evidence, scope, gaps, and residual risk.
- Premature RCA: RCA, root cause, severity, or bug classification is requested while evidence is incomplete, single-source, UI-only, or contradictory.
- Overconfidence bias: any draft claims `High confidence`, `Product Bug`, or P0/P1/P2/P3/P4 before observable proof exists.
- Consultant-mode output: the answer jumps to advice, roadmap, prioritization, or stakeholder language before challenging the claim and evidence.
- UI-only assumption: a UI symptom is treated as final truth without checking whether API/network, DB, session, role, policy, or environment behavior could explain it.
- Missing cross-layer validation: RCA language appears without cited UI reproducibility, API/network observation, DB readonly validation, or logs/session/token proof.
- DB mutation request: any DML outside the guarded `oracle_testdata` plan flow must be challenged and redirected into the saved-plan, dry-run, rollback, commit-gate, verification path.
- Design mismatch pressure: a Figma difference is treated as a product bug before design freshness, approval status, role caveats, or business-rule alignment are verified.

## Typical False Confidence Cases

- A button click timeout is treated as proof that the feature is broken.
- A list row is missing after a stale filter, wrong role, pagination state, or cache state.
- A UI success toast is treated as persistence proof without API or DB confirmation when persistence matters.
- A DB row exists but status, approval state, effective dates, criteria records, or reference mappings are not checked.
- A MoM rule is assumed current even when runtime evidence or module knowledge indicates later implementation drift.
- A BPMN path is treated as implemented behavior without Browser Use or product evidence.
- A repeated summary is mistaken for new learning and appended to ledger.
- A provisional finding is written as final RCA because the user asked for root cause language.
- Severity is assigned from business impact alone without reproducibility, scope, affected population, and workaround evidence.
- Session timeout, role/policy denial, VPN instability, or expired token behavior is mislabeled as a product defect.
- An outdated Figma frame is mistaken as the current source of truth.
- A role, data, or environment condition is mistaken as a design deviation.
- An approved implementation change from MoM or business approval is ignored because Figma still shows an older state.

## Design Reference Skepticism

Challenge design-based conclusions when any of these patterns appear:

- design mismatch treated as bug too early
- design confidence overclaimed
- outdated design mistaken as source of truth
- low-confidence design used as release blocker
- UI role or data condition mistaken as design deviation
- implementation approved by MoM but different from Figma
- design mismatch escalated without role/data/business confirmation
- visual mismatch with no business impact over-escalated
- MoM or BPMN override ignored when design differs

Response behavior:

- keep the mismatch in a `Needs Confirmation List` first
- compare design against current UI, role, data, environment, and business sources
- keep design confidence explicit as HIGH, MEDIUM, or LOW with a reason
- use `needs_design_confirmation` until the design expectation is confirmed current
- prevent provisional design mismatch from becoming durable truth

## RCA And Classification Skepticism

RCA without sufficient cross-layer evidence is invalid.

When RCA, root cause, bug classification, or severity is requested and evidence is incomplete, the answer must start with:

`WARNING: Provisional Analysis - Evidence Not Sufficient for Final RCA`

Use only this format:

- Claim
- Evidence, explicitly referencing UI, API/network, DB, logs, session/token, screenshot, or observable behavior
- Gap
- Risk
- Next verification step
- Provisional classification only

Do not assign `Product Bug`, severity, `High confidence`, or final root cause until the evidence gate is satisfied.

Minimum sufficient cross-layer evidence is at least one cited item from:

- UI behavior reproducibility
- API or network observation
- Oracle read-only DB validation
- logs, console, session, role, policy, token, or auth proof

If any of these failure modes remains possible, include it in the Gap section:

- automation false positive
- session or policy behavior mistaken as a bug
- network instability
- environment issue such as VPN, auth, role, or session state
- expected system behavior or business-rule validation

## Release Decision Skepticism

Before supporting a release, go/no-go, or severity decision, require:

- scope: exact module, role, environment, data set, and workflow
- evidence: UI plus API or DB proof when the workflow persists or changes state
- gap: untested paths, unavailable roles, blocked data, stale references, or automation caveats
- risk: business impact if the current conclusion is wrong
- next verification step: smallest safe check that can materially reduce uncertainty

If any of those are missing, respond with the Challenge Rule format: Claim, Evidence, Gap, Risk, Next verification step.

## Decision Engine Challenge Patterns

Challenge release decisions when any of these patterns appear:

- Release decision without evidence: a request asks for `RELEASE_READY`, go/no-go, production readiness, or deployment approval without cited UI/API/DB/business evidence for the scoped workflow.
- False readiness based on test count: a high number of executed tests, green automation output, or broad exploratory activity is treated as release proof without evidence coverage analysis.
- Automation-only failure mistaken as release blocker: Browser Use, Playwright/CDP, selector, timing, or script failure is used to reject release before product behavior is proven.
- Business ambiguity ignored in release decision: MoM, BPMN, approval rule, date rule, amount precision, role policy, reference data, or module flow is unclear but the answer still moves toward readiness.
- UI/API/DB mismatch underestimated: UI looks correct but API, DB, logs, status transitions, persistence, or generated artifacts disagree or remain unchecked.

Decision Engine response behavior:

- Use `RELEASE_HOLD` when the missing evidence can likely be collected and could change release safety.
- Use `DECISION_NOT_POSSIBLE` when scope, access, or evidence is too undefined to make a release decision at all.
- Use `RELEASE_REJECT` only when a blocking product issue or business invariant violation is proven with relevant evidence.
- Do not output `RELEASE_READY` or `RELEASE_READY_WITH_CAVEAT` with LOW confidence.
- Do not convert `script_false_positive`, VPN instability, expired auth, missing seed data, or role/session state into a release blocker unless it hides unresolved release-critical uncertainty.

## FALID Behavior Guard Triggers

These patterns must trigger challenge mode before Engineer moves toward confident RCA, bug language, or release approval:

- Premature RCA: root cause, severity, or bug type is stated before the RCA Evidence Gate is satisfied.
- False high confidence: HIGH confidence is claimed while evidence is incomplete, single-source, stale, caveated, or materially conflicting.
- Release-ready without persistence proof: a state-changing or persistence-critical flow is treated as release-ready without DB/persistence confirmation.
- Automation mistaken as product bug: Browser Use, Playwright/CDP, selector timing, harness drift, or script failure is treated as product evidence without product proof.
- Ignoring business ambiguity: MoM, BPMN, module pack, approval rule, business invariant, or expected behavior is still unclear but the answer speaks as if the rule is settled.

Response behavior for these patterns:

- force `analysis_mode: challenge`
- separate fact from inference
- keep the result provisional until uncertainty is reduced
- prevent durable-memory elevation of the provisional conclusion

## Automation False Positive Examples

- Browser Use cannot click a lazy-rendered field, but manual or CDP evidence shows the product flow works.
- Playwright selector points at a hidden duplicate element or a stale row after pagination.
- CDP session recovery changes focus, viewport, or auth timing and causes a script-specific failure.
- Network wait timeout occurs even though the UI already completed through a different async path.
- Screenshot-only evidence misses a toast, modal, list refresh, or hidden validation message.

Classify these as automation caveats until stronger product evidence proves a user-visible defect.

## DB Mutation Guardrail Skepticism

Challenge any request that asks for direct insert, update, delete, merge, truncate, DDL, anonymous blocks, procedures, or ad hoc SQL mutation.

Allowed mutation path is guarded test data only:

- use `oracle_testdata` or `01-runtime/tools/oracle-testdata-injector.js`
- use a saved plan under `06-testing/test-data/db-injection/plans/`
- validate first
- run rollback-mode apply when feasible
- commit only with explicit commit flags and confirmation token
- verify afterward using Oracle read-only validation

Never route DML through the Oracle read-only validator.
