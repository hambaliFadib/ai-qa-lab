# Spreadsheet Testcase Writer

## Goal

Help write test cases into existing spreadsheets by adapting to the current workbook, tab, header, and row format.

Do not create a new testcase template unless the user explicitly asks.

## Read First

- target spreadsheet metadata, title, ID, or URL when provided
- workbook tab or sheet list
- candidate testcase sheet header row and existing columns
- existing testcase ID pattern, status values, priority/type vocabulary, and notes columns
- latest populated row and safe append point
- `02-brain/.opencode/skills/test-case-designer/SKILL.md`
- `06-testing/testcase-staging/README.md` when direct spreadsheet write is unavailable or not approved

## Read-First Rule

Before writing anything:

- read spreadsheet metadata
- list tabs or sheets
- inspect header rows
- detect existing columns
- infer testcase format
- detect where new rows should be appended

## Workflow

1. Inspect the workbook and identify the intended testcase tab.
2. Infer the current structure from headers, sample rows, formulas, and conventions already present.
3. Generate testcase content in the existing format instead of inventing a new one.
4. Prepare a draft preview that maps generated fields to existing columns.
5. Append draft rows only after approval, unless the user explicitly requested direct append and the spreadsheet MCP is ready.
6. Update hot memory with what was written.
7. Append durable ledger only when a reusable testcase pattern, improved module testcase pack, or stable spreadsheet mapping was learned.

## Rules

### No New Template Rule

- do not create a new testcase template unless the user explicitly asks
- do not silently add default testcase columns
- do not create a new sheet or tab without explicit approval

### Default Write Rule

- default to append-only
- use a draft or status column when available
- never overwrite existing rows
- never clear ranges
- never delete rows or sheets

### Approval Rule

Require explicit user approval before:

- modifying existing rows
- clearing ranges
- deleting content
- creating a new sheet or tab
- changing formatting
- changing formulas

### Format Adaptation Rule

- map generated testcase fields only to existing columns
- preserve current sheet naming, header order, ID pattern, status vocabulary, and cell-style conventions
- if a column is missing, do not invent structure silently
- write unmapped details into a `Notes`, `Remark`, or equivalent column when available
- otherwise stop at a local draft preview and ask for user decision

### Source Evidence Rule

Generated test cases should reference source basis when available:

- BPMN or MoM
- UI observation
- API evidence
- DB validation
- user story or business rule
- runtime or module knowledge

### Safety Rule

- never write secrets, tokens, cookies, raw DB credentials, OTP, or sensitive auth data to a spreadsheet
- keep spreadsheet rows limited to testcase content and safe evidence references

### Fallback Rule

- if spreadsheet MCP is unavailable or the user has not approved direct write, save the draft locally under `06-testing/testcase-staging/`
