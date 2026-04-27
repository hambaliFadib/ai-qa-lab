# Safe Update Columns

## Low-risk execution update columns

These can be proposed more frequently but still require approval:

- Actual Result
- Status
- Test Date
- Re-test Date
- Test Note
- Issue URL
- File Name
- Owner

## High-risk testcase definition columns

These require stronger evidence and explicit approval:

- Title
- Priority
- Behaviour
- Data
- Steps
- Expected Result
- Automation Status

## Protected structural columns

These should not be modified unless user explicitly authorizes:

- Test Case ID
- Level
- Create Date

## Rules

- FALID must not silently change testcase definition.
- Any change to Steps or Expected Result must be treated as `testcase_update_candidate` first.
- If MoM/BPMN/Figma/UI conflict exists, route to Confirmation before update.
