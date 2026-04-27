# GitLab Issue From Testcase Prompt

Use this prompt to produce copy-ready GitLab issues from one testcase scenario or bulk scenario extraction.

## Required Outputs

For each scenario, output:

- Issue title
- Labels
- Description
- Evidence needed
- Guardrail
- Recommended board column

## Title Format

`[<SCENARIO_ID>] <Scenario Title>`

## Labels

- `type::test-scenario`
- `status::<scenario_status>`
- `risk::<risk>`

Do not require area labels.

## Description Format

```markdown
## Source
TEST CASE - PGN BILLING / <sheet>

## Feature
<feature id> - <feature title>

## Scenario
<scenario id> - <scenario title>

## Status Summary
- Scenario Status:
- Risk:
- Total Test Cases:
- Passed:
- Failed:
- Untested:
- Retest:
- Blocked/Other:

## Test Cases
- [x] TC... - title - Passed
- [ ] TC... - title - Failed
- [ ] TC... - title - Untested

## Current Findings
Generated from Failed test cases:
- Test Case:
- Actual Result:
- Test Note:

If no failed cases:
- No failed testcase recorded in source spreadsheet.

## Evidence Needed
Generated based on scenario and failed/untested cases:
- screenshot
- screen recording if needed
- actual result
- data used
- blocker/question
- UI/API/DB evidence if critical

## Execution Notes
Actual Result:
Evidence:
Blocker:
Question:

## Guardrail
This issue is generated from controlled testcase source.
It is not a final bug report.
Failed test cases require latest evidence before final bug classification.
MoM/BPMN/Figma conflicts must go to Needs Confirmation.
```

## Board Column Guidance

- `failed`: Failed / Evidence Needed
- `untested`: Ready / Untested
- `passed`: Passed / Review
- `testing`: Testing

## Safety

Default to dry-run.
Direct GitLab creation requires explicit `--execute` or explicit user approval.
Do not update spreadsheet Issue URL automatically.
