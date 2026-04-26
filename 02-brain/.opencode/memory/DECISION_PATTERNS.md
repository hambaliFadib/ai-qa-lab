# DECISION PATTERNS

Use this file as reusable memory for safe release, go/no-go, production readiness, and deployment safety decisions.

## Safe Release Decisions

### RELEASE_READY

Use only when:

- scope is clear
- release-critical UI behavior is proven
- API/network behavior is proven when relevant
- Oracle read-only persistence is proven when the workflow saves, submits, approves, rejects, calculates, exports, invoices, or changes state
- MoM/BPMN/module/app-specific business invariants are aligned
- no known blocking bug remains unresolved
- confidence is HIGH

Example: A submit workflow is verified through Browser Use, the API response is successful, Oracle confirms persisted status and values, the approval rule matches MoM/module knowledge, and no blocking caveat remains.

### RELEASE_READY_WITH_CAVEAT

Use only when release-critical behavior is proven but a bounded non-blocking caveat remains.

Example: Core billing calculation and persistence are proven, but a low-impact UI alignment issue remains outside the release-critical path.

## Hold, Reject, And Not Possible

### RELEASE_HOLD

Use when evidence can likely be collected and could change release safety.

Examples:

- persistence is unverified for a save/submit/approve flow
- required API/network proof is missing for a contract-sensitive workflow
- missing test data prevents proof of a release-critical path
- automation failed and no alternate manual/CDP proof exists yet
- a business invariant is unclear but can be clarified through MoM/BPMN/product owner evidence

### RELEASE_REJECT

Use only when a blocking product issue is proven.

Examples:

- Oracle read-only proof shows saved data is wrong for a release-critical flow
- approval status changes incorrectly and affects downstream billing
- an invoice/rating/export result is materially wrong
- access-control or role-policy behavior violates confirmed business rules
- a known blocking defect remains reproducible and unresolved

### DECISION_NOT_POSSIBLE

Use when a release decision cannot be responsibly made.

Examples:

- scope is undefined
- target environment or role is unknown
- app/DB access is unavailable and no useful evidence exists
- evidence conflicts across UI/API/DB but cannot be reconciled now
- the user asks for release readiness outside observed system boundaries

## Unsafe Overconfident Decisions

- Declaring release-ready because many tests ran.
- Declaring release-ready from UI-only evidence for a persistence-critical flow.
- Declaring release-ready when MoM/BPMN business rules are ambiguous.
- Rejecting release because Browser Use or Playwright failed before product behavior was proven.
- Treating VPN, auth, session, role, or missing seed data as a product release blocker without evidence.
- Treating a green automation result as proof that API, DB, and business invariants are correct.

## Automation Caveats

Automation issues should not block release by themselves.

Use `RELEASE_HOLD` only when the automation issue hides unresolved release-critical uncertainty. Use non-blocking caveat language when alternate evidence proves the product behavior.

Examples that should not directly block release:

- selector timeout on a lazy-rendered field when manual/CDP proof confirms the flow
- screenshot miss of a transient toast when API/DB proof confirms the state change
- Browser Use action drift when Playwright/CDP or manual evidence confirms expected behavior

## Business Invariant Caveats

Business ambiguity is release-risky.

Use `RELEASE_HOLD` when an unclear rule could change expected behavior, persisted data, approval status, invoice/rating output, tax handling, billing period, amount precision, or customer-facing result.

## Design Reference Caveats

- Do not block release from design mismatch alone.
- Treat outdated or unapproved Figma design as a weak release signal until current approval is confirmed.
- If MoM, BPMN, or approved implementation scope differs from Figma, challenge the design mismatch before escalating release risk.
- A visual mismatch with no confirmed business or workflow impact should not be over-escalated into a release blocker by itself.
- Do not overclaim design confidence when freshness, approval, or role/state/data fit is unclear.
- Do not use LOW-confidence design as a release blocker.
- Do not escalate design mismatch without role, data, and business confirmation.
- If MoM or BPMN overrides the design, the override must be handled before release escalation.
