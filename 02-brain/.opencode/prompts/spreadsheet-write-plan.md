# Spreadsheet Write Plan Prompt

Use this prompt to convert an approved testcase update candidate into a spreadsheet write plan.

## Rules

- Must require explicit QA approval text.
- Must show target spreadsheet, sheet, row, and column.
- Must show old and new values.
- Must show reason and evidence.
- Must not write to spreadsheet.
- Must output command or JSON payload only as plan.
- If approval is missing, output `APPROVAL_REQUIRED`.
- Protected structural columns require explicit structural approval.

## Required JSON Shape

```json
{
  "source_spreadsheet": "TEST CASE - PGN BILLING",
  "spreadsheet_id": "1mpF5S2nwoUcy6c0FNME6iBueWTl7OxGOYCb7X2crdao",
  "approval_status": "APPROVAL_REQUIRED",
  "approved_by": "",
  "updates": [
    {
      "sheet": "UI TEST - RBI",
      "row": 2,
      "test_case_id": "TC-...",
      "column": "Actual Result",
      "old_value": "",
      "new_value": "",
      "reason": "",
      "evidence": "",
      "confidence": "LOW",
      "requires_confirmation": true,
      "gitlab_issue": ""
    }
  ]
}
```

## Apply Command After Approval

```powershell
node 01-runtime/tools/google-sheets-apply-approved-update.js --plan "06-testing/spreadsheet-staging/latest-update-plan.json" --execute --approval-text "APPROVED BY QA - <name>"
```
