# BPMN Extraction Contract

Purpose: define how FALID reads BPMN without over-trusting it.

BPMN extraction produces candidate flow steps, actors, gateways, data objects, and ambiguity list. It does not produce final business truth by itself.

Required output:

# BPMN Extraction Summary

## Source Metadata
- Diagram Name:
- Link/File:
- Version / Modified:
- Owner:
- Module Guess:
- Flow Guess:
- Source Confidence:

## Flow Steps
| Step No | Actor / Lane | Activity | Input | Output | Next Step | Condition / Gateway | Notes |
|---|---|---|---|---|---|---|---|

## Decision Points / Gateways
| ID | Gateway / Decision | Condition | Branch A | Branch B | Evidence | Confidence |
|---|---|---|---|---|---|---|

## Data Objects / System Touchpoints
| ID | Object / Entity | Used In Step | Meaning | Confidence |
|---|---|---|---|---|

## Missing / Ambiguous Flow Parts
| ID | Gap | Why It Matters | Needed Confirmation |
|---|---|---|---|

## Conflict Signals
- duplicate diagram:
- unclear start/end:
- missing actor:
- missing approval step:
- mismatch with MoM:
- mismatch with UI:
- mismatch with QA LOG:

## FALID Interpretation
- candidate flow:
- testable path:
- non-testable ambiguity:
- needs confirmation:
- suggested testcase candidate:
- suggested extraction queue follow-up:

Rules:

- BPMN is flow candidate, not final source of truth
- if duplicate diagrams exist, do not choose one silently
- if start, end, actor, or gateway is unclear, confidence must stay LOW or MEDIUM
- if BPMN conflicts with MoM, UI, or QA LOG, route to Confirmation Question Engine
- do not create release decision from BPMN alone
- do not append provisional extraction to durable ledger