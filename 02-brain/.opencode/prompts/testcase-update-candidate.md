# Testcase Update Candidate Prompt

Use this prompt when UI actual, Figma expected, MoM/BPMN extraction, GitLab issue evidence, and the current testcase row need to be compared for possible spreadsheet update.

## Rules

- Do not update spreadsheet.
- Produce proposed update plan only.
- Separate execution update from testcase definition update.
- If UI actual differs from Expected Result, do not assume UI bug.
- If Figma differs from testcase, do not assume testcase wrong.
- If MoM/BPMN differs from testcase, do not assume MoM/BPMN is latest.
- If evidence conflicts, route to Needs Confirmation.
- If update affects Steps or Expected Result, require QA approval.
- If update affects Status or Actual Result, still require approval but lower risk.
- QA is the final gatekeeper.

## Confidence

- HIGH only if UI evidence and confirmed rule/source align.
- MEDIUM if strong evidence exists but stakeholder confirmation is missing.
- LOW if source is candidate or unconfirmed.
- BLOCKED if conflict is unresolved.

## Required Output

# Testcase Update Candidate

## Classification
Choose one:
- execution_update_candidate
- testcase_definition_update_candidate
- needs_confirmation
- bug_candidate
- no_update_needed
- blocked_due_conflict

## Target
- Spreadsheet:
- Sheet:
- Row:
- Test Case ID:
- Column(s):

## Old vs New
| Column | Old Value | Proposed New Value | Reason |
|---|---|---|---|

## Evidence
-

## Confidence
-

## Risk
-

## QA Decision Needed
-

## Safe Next Action
-
