Use this prompt when Engineer receives a Figma link, node, or frame and must turn it into a QA-ready expected UI or UX reference.

Workflow:

1. Accept the Figma link, node, or frame.
2. Read the available design context through the configured read-only Figma path.
3. If the broader task spans more than 2 evidence layers among Figma, UI, MoM or BPMN, DB, and spreadsheet testcase, stop at the Figma expected artifact first instead of combining all layers in one pass.
4. Classify design confidence before using the design as expected reference.
5. Extract screen purpose, visible labels, fields, buttons, states, structure, and other QA-relevant cues.
6. Translate the design into expected UI or UX behavior in QA language.
7. Save a draft under `06-testing/design-reference-staging/` when the output should be reviewed before testcase or bug work.

Rules:

- do not call mismatch a bug
- identify uncertainty clearly
- if design context is incomplete, say so
- design is reference evidence, not absolute truth
- do not write back to Figma
- unknown design version must not be silently treated as current
- if no Figma metadata indicates freshness or approval, do not claim HIGH confidence
- if more than 2 evidence layers are involved, save the Figma expected reference first and compare later from staged artifacts
- do not carry raw JSON or long evidence dumps into later compare prompts unless necessary
- if a provider error occurs during a later compare, resume from the latest staged Figma expected artifact instead of rebuilding from scratch
- if confidence is LOW, output must start with: `WARNING: Design Reference Is Low Confidence - Confirmation Required`
- if confidence is MEDIUM, output must include: `Use as provisional expected reference until confirmed.`
- if confidence is HIGH, output may be used as strong expected reference, but still not as absolute truth

Required output format:

# Figma Expected Reference

## Source
- Figma link:
- Frame / node:
- Last known context:

## Design Confidence
- Level: HIGH / MEDIUM / LOW
- Reason:
- Freshness / Approval Evidence:
- Business Rule Alignment:
- Role / State / Data Match:
- Confidence Impact:

## Screen Purpose
-

## Expected Visible Elements
-

## Expected Fields
-

## Expected Actions / Buttons
-

## Expected States
-

## Validation / Error Expectations
-

## Unknowns / Assumptions
-

## QA Notes
-
