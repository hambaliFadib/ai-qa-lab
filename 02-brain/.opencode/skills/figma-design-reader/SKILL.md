# Figma Design Reader

## Goal

Read Figma design context and transform it into QA expected references without treating design as automatic product truth.

## Read First

- `02-brain/.opencode/config/figma-design-setup.md`
- `02-brain/distilled-output/global/qa-execution-classification.md`
- `02-brain/.opencode/memory/CHALLENGE_PATTERNS.md`
- `06-testing/design-reference-staging/README.md`

## Read-Only Rule

Default mode is read-only.

- no design write
- no design update
- no design create
- no design delete

## Design Confidence Check

Before using Figma as expected reference, Engineer must classify design confidence.

### HIGH

Use when:

- design is explicitly confirmed latest, current, or approved
- design aligns with MoM, business rules, and BPMN
- no contradiction with runtime behavior or implementation notes
- target role, state, and data context matches the UI being tested

### MEDIUM

Use when:

- design appears relevant
- no contradiction is found
- but there is no explicit confirmation that it is latest or approved
- role, state, or data assumptions are only partially known

### LOW

Use when:

- design freshness or version is unclear
- design conflicts with MoM, BPMN, or runtime behavior
- design likely looks outdated
- target role, state, or data context does not match
- feature status changed after the design was made

Rules:

- HIGH can be used as a strong expected reference
- MEDIUM must include caution and `Needs Confirmation` for material mismatch
- LOW must trigger Challenge Mode
- LOW design confidence cannot be used as the sole basis for bug classification
- unknown design freshness defaults to MEDIUM at best, or LOW if material risk exists

Required output fields for any Figma expected reference:

- Design Confidence:
  - Level:
  - Reason:
  - Freshness / Approval Evidence:
  - Business Rule Alignment:
  - Role / State / Data Match:
  - Confidence Impact:

## Design Context Extraction

When the user gives a Figma link, node, or frame:

1. identify the page, frame, node, or component
2. extract the screen purpose
3. extract visible text and labels
4. extract buttons and actions
5. extract fields and placeholders
6. extract component hierarchy
7. extract states when available
8. extract colors or spacing only when they matter to QA
9. extract responsive notes when available

## Expected Result Generation

Generate expected result in QA language:

- expected visible elements
- expected field labels
- expected actions or buttons
- expected validation states if design shows them
- expected layout or state behavior
- unknowns and assumptions

## Design Is Not Absolute Truth

Mismatch between Figma and app is not automatically a bug.

It may be:

- outdated design
- approved scope change
- implementation deviation
- product bug
- environment or role permission difference
- incomplete feature

## Confirmation List Rule

All design-vs-UI mismatches must go to a `Needs Confirmation List` before bug classification.

## Bug Classification Gate

Classify as bug only if:

- design is confirmed current or approved
- UI behavior contradicts confirmed expected design or business rule
- no environment, role, or data caveat explains the mismatch

Use `needs_design_confirmation` when the design mismatch is still provisional.

## Workflow

1. Read the design context.
2. Classify design confidence before using the design as expected reference.
3. Produce a design-based expected reference.
4. Compare the expected reference with UI evidence when needed.
5. Put all mismatches into a `Needs Confirmation List` first.
6. Create testcase ideas or staging artifacts from the confirmed or provisional output as appropriate.

## Memory Rule

- durable-save only confirmed design rules or stable design-to-UI mappings
- do not append provisional mismatches to the learning ledger
- keep unconfirmed design mismatches in hot memory or staging only
