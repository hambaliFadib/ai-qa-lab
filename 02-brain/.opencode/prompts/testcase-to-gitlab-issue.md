# Testcase To GitLab Issue Prompt

Use this prompt to reconcile testcase scenario extraction with UI actual evidence and optional reference sources before generating GitLab-ready issue drafts.

## Inputs

- Testcase scenario extraction JSON or Markdown
- UI actual summary
- Optional Figma expected handoff
- Optional MoM/BPMN extraction
- Optional scenario filter

## Source Priority

- Testcase spreadsheet is the controlled QA execution source.
- UI actual is runtime evidence.
- Figma is a design candidate/reference.
- MoM/BPMN is business/flow candidate evidence until confirmed.
- GitLab is the QA Control Center.

## Classification Rules

- If testcase failed but no recent UI/API/DB evidence exists, keep it as a failed scenario issue with Evidence Needed.
- If testcase failed and evidence is strong, generate a Bug Candidate issue draft, not a final bug.
- If expected behavior is unclear or sources conflict, generate Needs Confirmation issue draft.
- If testcase is untested, generate Ready/Untested execution issue.
- Do not final-classify a bug.
- Do not make release decisions.
- Do not update spreadsheet Issue URL automatically.
- Do not treat MoM/BPMN/Figma as final truth without confirmation.

## Required Output

For each scenario:

- Issue title
- Labels
- Description
- Evidence needed
- Guardrail
- Recommended board column

## Guardrail Text

This issue is generated from controlled testcase source.
It is not a final bug report.
Failed test cases require latest evidence before final bug classification.
MoM/BPMN/Figma conflicts must go to Needs Confirmation.
