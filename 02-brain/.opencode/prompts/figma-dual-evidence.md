# Figma Dual Evidence Prompt

Use this prompt when a Figma link must be read as design evidence and compared with UI actual behavior.

## Inputs

- Figma link or node URL
- Optional UI/app target
- Optional testcase scenario or spreadsheet artifact
- Optional MoM/BPMN summary

## Required Outputs

1. Figma REST expected handoff
2. Browser Use visual inspection plan
3. Design Confidence
4. What can be trusted
5. What needs confirmation
6. What cannot be treated as business truth

## Evidence Rules

- Figma REST bridge reads structured node/design metadata.
- Browser Use visually inspects layout and runtime UI behavior.
- If REST metadata and visual inspection disagree, mark `needs_design_confirmation`.
- If Figma differs from UI, do not classify it as a bug automatically.
- Design evidence must be compared with testcase source and UI actual before defect language.
- Figma is a design reference, not business truth.
- MoM/BPMN can support business-flow candidates, but unresolved conflict still goes to Needs Confirmation.
- Testcase Spreadsheet is the controlled QA execution source.
- UI actual is evidence of current system behavior.

## Recommended Flow

1. Fetch the Figma node through `01-runtime/tools/figma-rest-fetch-node.js`.
2. Summarize the node through `01-runtime/tools/figma-rest-summarize-node.js`.
3. Generate expected handoff through `01-runtime/tools/figma-rest-expected-handoff.js`.
4. Use Browser Use to inspect the Figma link visually when visual layout, responsive state, hidden variant, or screenshot comparison matters.
5. Compare REST expected handoff vs Browser Use visual observation.
6. Compare Figma evidence vs UI actual for the same role, data, state, and environment.
7. Compare Figma/UI findings vs testcase source before generating issue language.

## Design Confidence

Classify as:

- HIGH: current/approved design is confirmed and aligns with testcase/business evidence.
- MEDIUM: REST and visual evidence are usable, but freshness, approval, role, state, or business fit is not fully confirmed.
- LOW: source is stale, partial, inaccessible, or conflicts with stronger evidence.

## Output Guardrail

Do not output final bug classification from Figma alone.
If Figma, UI, testcase, MoM, or BPMN conflict, route to Diagnosis/Confirmation.
