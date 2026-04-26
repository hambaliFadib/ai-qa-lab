Use this prompt when Engineer must move from mismatch listing into conservative, evidence-aware diagnosis.

Purpose:

- explain why a mismatch likely exists
- reduce false bug classification
- identify what evidence is still missing
- propose the next smallest diagnostic step

Required input sources:

- Figma expected artifact
- UI actual summary
- MoM or BPMN summary if available
- DB or reference evidence if relevant
- testcase spreadsheet summary if available

Workflow:

1. Read the staged comparison artifact first.
2. Reuse summarized artifacts instead of reopening raw JSON, full screenshots, or full search dumps unless a specific gap requires them.
3. Diagnose likely causes conservatively and keep provisional status when evidence is incomplete.
4. If business evidence is missing, do not treat Figma as business truth.
5. Do not output release decision unless the user explicitly asks for it.

Allowed classifications:

- `design_outdated_candidate`
- `implementation_gap_candidate`
- `role_based_visibility_candidate`
- `data_dependent_visibility_candidate`
- `mode_dependent_behavior`
- `business_rule_missing`
- `needs_design_confirmation`
- `needs_business_confirmation`
- `needs_runtime_condition_validation`
- `possible_defect_candidate`
- `not_a_bug_expected_behavior`

Rules:

- Do not output a final bug unless the evidence gate passes.
- Do not output a release decision unless explicitly requested.
- If evidence is insufficient, keep the diagnosis provisional.
- If business source is missing, do not treat Figma as business truth.
- `possible_defect_candidate` is still provisional and is not a logged product bug.
- Role, mode, environment, and data caveats must be considered before suggesting an implementation gap.
- Diagnosis should reduce uncertainty, not inflate certainty.

Required output:

# Diagnosis Engine Report

## Scope
- Module:
- Page / Flow:
- Role:
- Mode:
- Evidence Sources:

## Diagnosis Summary
- Overall confidence:
- Main risk:
- Current status:

## Mismatch Diagnosis Table

| ID | Mismatch | Figma Expected | UI Actual | Likely Cause | Evidence Supporting Cause | Evidence Missing | Risk | Classification | Next Verification Step |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## Potential Defect Candidates
- Only include if evidence is strong enough to suspect a product issue, but keep it provisional unless confirmed.

## Confirmation Questions

### Product Owner
-

### UX/Design
-

### FE
-

### BE
-

### QA
-

## Next Diagnostic Actions
- capture create mode
- capture edit mode
- test different role
- test different data condition
- check DB reference
- confirm MoM or BPMN
- confirm design freshness

## Self-Audit
- Evidence sufficiency:
- Confidence calibration:
- Challenge rule applied:
- Decision score:
- Durable memory allowed:
  - Yes / No
  - Reason:
