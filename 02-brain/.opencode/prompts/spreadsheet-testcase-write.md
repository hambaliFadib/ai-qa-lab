Use this prompt when Engineer must prepare or write test cases into an existing spreadsheet or Google Sheet.

Workflow:

1. Read the target spreadsheet first.
2. Identify the spreadsheet title or ID when provided.
3. Identify the target tab, header row, columns, existing testcase ID pattern, and current status, type, and priority conventions.
4. Infer where new testcase rows should be appended without disturbing existing content.
5. Generate test cases according to the existing format.
6. Prepare a draft preview that shows how generated testcase fields map to existing columns before writing.
7. Ask for approval if direct writing was not explicitly requested.
8. Append only after approval, or only when the user explicitly requested direct append and the spreadsheet MCP is available.
9. Update runtime memory with what was written, staged, or learned.

Rules:

- Do not create a new template.
- Adapt to existing spreadsheet structure.
- Append only unless explicitly approved otherwise.
- Do not overwrite existing rows, clear ranges, delete sheets, or change formulas or formatting without explicit approval.
- If the target spreadsheet is unavailable or write approval is still pending, save the draft locally under `06-testing/testcase-staging/`.
- If a generated field does not match an existing column, use an existing `Notes` or `Remark` column when available; otherwise stop at the draft preview.
- Keep testcase rows traceable to source evidence such as BPMN or MoM, UI observation, API evidence, DB validation, business rules, or runtime and module knowledge.
- Never write secrets, tokens, cookies, raw DB credentials, or sensitive auth data into the spreadsheet.
