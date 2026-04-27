# Source Reconciliation

Use this prompt to compare extracted MoM summary, BPMN summary, Figma expected, UI actual, QA LOG, DB evidence, and testcase coverage.

Purpose:

- identify matching claims
- expose conflicting claims
- separate unsupported claims from confirmed facts
- produce candidate business rules with confidence
- route unresolved gaps to Confirmation Question Engine

Input sources:

- MoM extraction summary
- BPMN extraction summary
- Figma expected handoff
- UI actual summary
- QA LOG or controlled checkpoint
- testcase coverage summary
- DB/reference evidence when relevant

Required output:

# Source Reconciliation Report

## Scope
- Module:
- Flow:
- Role:
- Environment:
- Sources compared:

## Matching Claims
| ID | Claim | Sources Agreeing | Confidence | Status |
|---|---|---|---|---|

## Conflicting Claims
| ID | Claim A | Source A | Claim B | Source B | Conflict Type | Risk | Next Confirmation |
|---|---|---|---|---|---|---|---|

## Unsupported Claims
| ID | Claim | Source | Missing Support | Risk |
|---|---|---|---|---|

## Candidate Business Rules
| ID | Rule Candidate | Supporting Sources | Conflicting Sources | Confidence | Status |
|---|---|---|---|---|---|

## Confirmed Facts
| ID | Fact | Evidence | Confidence | Scope |
|---|---|---|---|---|

## Needs Confirmation
| ID | Topic | Stakeholder | Question | Decision Impact |
|---|---|---|---|---|

## Source Priority Recommendation
- Current priority:
- Reason:
- What not to use as final truth:

## Confidence Per Claim
| Claim ID | Confidence | Reason | Required Next Evidence |
|---|---|---|---|

Rules:

- QA actual evidence and current UI can prove what exists, not what should exist
- MoM/BPMN can suggest expected behavior, not final truth unless confirmed
- Figma can suggest expected UI, not business truth
- if sources conflict, do not choose a winner silently
- output confirmation questions
- do not create final testcase, bug, RCA, release decision, spreadsheet update, Telegram report, or durable ledger append from unresolved reconciliation