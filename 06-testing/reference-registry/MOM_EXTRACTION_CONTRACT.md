# MoM Extraction Contract

Purpose: define how FALID reads MoM without over-trusting it.

MoM extraction produces candidate decisions, candidate business rules, open questions, and action items. It does not produce final truth by itself.

Required output:

# MoM Extraction Summary

## Source Metadata
- Title:
- Link/File:
- Date:
- Modified:
- Owner:
- Meeting Participants:
- Module Guess:
- Topic Guess:
- Source Confidence:

## Extracted Decisions
| ID | Decision / Statement | Module | Evidence Text | Confidence | Status |
|---|---|---|---|---|---|

## Extracted Business Rules
| ID | Rule Candidate | Module | Condition | Expected Behavior | Evidence Text | Confidence | Status |
|---|---|---|---|---|---|---|---|

## Extracted Open Questions
| ID | Question / Ambiguity | Related Module | Stakeholder | Risk | Next Confirmation |
|---|---|---|---|---|---|

## Extracted Action Items
| ID | Action | Owner | Due / Timing | Module | Status |
|---|---|---|---|---|---|

## Conflict Signals
- duplicate rule:
- unclear owner:
- old/stale reference:
- conflicting statement:
- missing decision:

## FALID Interpretation
- What can be used for QA planning:
- What cannot be used as final expected behavior:
- What needs confirmation:
- Suggested extraction queue follow-up:

Rules:

- quote or reference source text when possible
- separate decision, business rule, action item, and discussion note
- do not turn discussion notes into rules
- if date, owner, or version is missing, confidence cannot exceed LOW or MEDIUM
- if MoM conflicts with current UI or QA evidence, mark `needs_business_confirmation`
- do not generate final testcase directly from MoM unless confidence and confirmation are sufficient
- do not append provisional extraction to durable ledger