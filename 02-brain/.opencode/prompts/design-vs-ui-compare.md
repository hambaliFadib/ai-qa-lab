Use this prompt when Engineer must compare a Figma-based expected reference against the current UI.

Workflow:

1. Read the Figma expected reference first.
2. If the task spans more than 2 evidence layers among Figma, UI, MoM or BPMN, DB, and spreadsheet testcase, split the work into staged artifacts first.
3. Use `browser_use` to observe the current UI and capture a concise UI actual summary before broad compare.
4. Use `playwright_cdp` only when deterministic screenshot, DOM, or snapshot evidence is needed.
5. Compare design expected versus actual UI behavior using summarized artifacts only.
6. Put every mismatch into a confirmation-oriented output first.
7. Save draft artifacts under `06-testing/design-reference-staging/` when review is needed before bug or testcase work.

Rules:

- mismatch is not automatically bug
- if design freshness is unknown, mark Needs Confirmation
- if MoM or BPMN conflicts with design, challenge and escalate confirmation
- if UI is role, data, or environment dependent, note the caveat
- if more than 3 mismatches exist, a tab or field or action mismatch exists, design confidence is MEDIUM or LOW, MoM or BPMN is missing, or UI mode or role or data condition is uncertain, recommend Diagnosis Engine
- if more than 2 evidence layers are involved, fetch or summarize each layer separately and compare the summaries only
- do not include raw JSON, full screenshots, or full search dumps unless necessary to resolve a specific gap
- if a provider error occurs, resume from the latest staged artifact instead of restarting the whole workflow
- only include `Potential Bugs` when design confidence is HIGH, the design is confirmed current or approved, UI actual contradicts expected design, MoM or BPMN does not override design, and no role, data, or environment caveat explains the difference
- otherwise use `needs_design_confirmation` and include the item in the `Needs Confirmation List`

Required output format:

# Design vs UI Comparison

## Scope
- Module:
- Page / Flow:
- Role:
- Figma source:
- UI source:

## Design Confidence
- Level:
- Reason:
- Impact on Comparison:

## Matching Items
-

## Mismatches / Differences
Each item:
- Area:
- Figma Expected:
- UI Actual:
- Evidence:
- Possible Explanation:
- Risk:
- Design Confidence Impact:
  - HIGH design confidence: mismatch may be a stronger candidate for issue, but it still needs confirmation if business, role, data, or environment caveat exists.
  - MEDIUM design confidence: mismatch goes to Needs Confirmation by default.
  - LOW design confidence: mismatch cannot be a bug candidate; treat it as design confirmation risk first.
- Needs Confirmation:
  - Yes / No
- Suggested Owner:
  - PM / Design / FE / BE / QA

## Needs Confirmation List
-

## Diagnosis Recommended
- Yes / No
- Reason:
- Suggested diagnosis scope:

## Potential Bugs
-

## Next Verification Step
-
