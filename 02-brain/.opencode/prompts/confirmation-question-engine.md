# Confirmation Question Engine

Use this prompt when Engineer must turn a diagnosis report, comparison report, or Needs Confirmation list into stakeholder-specific clarification questions.

Purpose:

- convert unresolved findings into meeting-ready questions
- prevent false escalation into bug, design update, testcase update, business rule change, release decision, or no-action expected behavior
- identify exactly what answer is needed, from whom, and why it changes the decision path

Primary input sources:

- latest diagnosis report
- latest design-vs-UI comparison report
- Needs Confirmation list
- Figma expected handoff
- UI actual summary
- MoM or BPMN summary if available
- testcase summary if available
- DB or reference evidence if relevant

Input reading order:

1. Read the latest diagnosis report first.
2. Reuse latest comparison and Needs Confirmation artifacts before reopening raw Figma, UI, MoM, BPMN, testcase, or DB evidence.
3. Read only the smallest extra source required to fill a specific evidence gap.
4. Do not fetch live browser, Figma, DB, spreadsheet, or Telegram data unless the user separately approves that execution.

Hard rules:

- Do not create a bug report.
- Do not create or output a release decision.
- Do not update a spreadsheet.
- Do not send Telegram.
- Do not update DB or Figma.
- Do not append provisional confirmation questions to the durable ledger.
- Keep Challenge Rule, Diagnosis Engine, Decision Engine, Design Confidence, OpenClaw SAFE MODE, Oracle safety, and Auto-Memory guards intact.
- Questions are provisional until stakeholder answers are received.
- Never phrase questions as accusations.
- Be sharp, professional, and evidence-led.
- Avoid vague questions.
- Each question must map to an evidence gap or decision impact.
- Do not invent business rules.
- Do not classify a final bug from stakeholder questions alone.
- If an answer is required before release, state what decision is blocked.

Required output:

# Confirmation Question Report

## Scope
- Module:
- Page / Flow:
- Role:
- Mode:
- Environment:
- Evidence Sources:

## Executive Summary
- Why this confirmation is needed:
- Current confidence:
- Main unresolved risk:
- What decision is blocked:

## Confirmation Matrix

| ID | Topic | Current Finding | Suspected Cause | Stakeholder | Question | Why It Matters | Evidence To Bring | Expected Answer Type | Decision Impact | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Allowed stakeholders:

- Product Owner / Business Owner
- UX / Design
- Frontend
- Backend
- QA
- DB / Data Owner when relevant

Priority:

- HIGH: blocks bug classification, release decision, or critical testcase design
- MEDIUM: affects testcase coverage or workflow interpretation
- LOW: improves documentation or clarity but does not block execution

Expected answer type:

- Yes / No
- Rule confirmation
- Design freshness confirmation
- Role/permission confirmation
- Data-condition confirmation
- Implementation ownership
- Testcase coverage decision
- No-action expected behavior

Decision Impact allowed values:

- promote_to_bug_candidate
- update_design_expected
- update_testcase_coverage
- update_business_rule
- run_more_validation
- mark_expected_behavior
- keep_needs_confirmation

## Stakeholder Question Packs

### For Product Owner / Business Owner

Questions must focus on:

- business rule
- workflow expectation
- approval/status rules
- release impact
- conditional behavior
- business priority

### For UX / Design

Questions must focus on:

- design freshness
- design mode: create/edit/view/detail/list
- component visibility
- field label expectation
- tab/section expectation
- approved design vs outdated design

### For Frontend

Questions must focus on:

- UI rendering logic
- role-based rendering
- conditional tabs/fields
- hidden/disabled states
- implementation against design/spec
- frontend ownership

### For Backend

Questions must focus on:

- API payload
- field source
- status and workflow logic
- validation rules
- whether UI depends on backend flags/data

### For QA

Questions must focus on:

- testcase gap
- regression scope
- role/data/mode coverage
- evidence needed
- automation/manual split
- pass/fail criteria

### For DB / Data Owner

Include only if DB/data is relevant.

Questions must focus on:

- reference data
- feature flags
- persisted state
- data condition required to trigger UI visibility
- source table or config ownership

## Meeting Agenda Draft

Create a concise agenda:

1. Context
2. Evidence reviewed
3. Key unresolved findings
4. Stakeholder questions
5. Decisions needed
6. Next actions after confirmation

## Decision After Confirmation

For each major topic, define possible next actions:

- If confirmed as intended behavior:
  - update testcase
  - update expected reference
  - no bug
- If confirmed as design outdated:
  - update design or design expected
  - keep UI as current truth if business agrees
- If confirmed as implementation gap:
  - promote to possible_defect_candidate
  - request UI/API/DB evidence before final bug
- If confirmed as business ambiguity:
  - update MoM/business rule
  - keep release decision on hold if critical
- If still unresolved:
  - keep needs_confirmation
  - define next evidence step

## Self-Audit
- Is this report a bug? No
- Is this report a release decision? No
- Is this report provisional? Yes, until stakeholder answers are received
- Durable ledger allowed:
  - Yes / No
  - Reason: