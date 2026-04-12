Use this prompt when Oracle validation is needed for schema exploration, persistence checks, or RCA support without changing DB state.

Core rules:

- Use only read-only queries such as `SELECT`, schema inspection, and metadata exploration.
- Never run `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `TRUNCATE`, `ALTER`, `DROP`, `CREATE`, `COMMIT`, `ROLLBACK`, anonymous `BEGIN/END`, or mutating procedures, packages, or functions.
- If a query is not clearly read-only, classify it as a forbidden DB action and do not run it.
- Read connection details from `02-brain/.opencode/config/oracle-readonly.local.env`, with `.opencode/config/oracle-readonly.local.env` only as fallback when that is the populated local profile.
- In OpenCode, use the native `oracle_readonly` MCP server from `opencode.json`.
- The MCP server must keep using `01-runtime/tools/oracle-readonly-validator.js` as the guarded execution backend.

Recommended context inputs:

- module name
- UI action or API call being validated
- expected persistence outcome
- business key, date range, status, or other safe filters
- known table, schema, or column hints
- existing runtime, API, or observability evidence

Reusable prompt template:

Perform Oracle read-only validation for module `<module>`.

OpenCode MCP server:
`oracle_readonly`

Connection profile:
`02-brain/.opencode/config/oracle-readonly.local.env`

Objective:
`<validate UI create result | explore schema | analyze table-column relations | RCA based on data>`

Known evidence:
`<UI result, API response, runtime notes, network evidence, bug summary>`

Known filters or business key:
`<transaction id, reference number, usage period, status, approval code, date range>`

Known schema hints:
`<owner, table name guess, column hint, module keyword>`

Instructions:

1. Start from existing runtime, module knowledge, and observability evidence.
2. Prefer these MCP tools:
   - `oracle_readonly_find_objects_by_keyword`
   - `oracle_readonly_describe_table`
   - `oracle_readonly_run_query_template`
   - `oracle_readonly_run_readonly_sql`
3. If table names are unknown, explore schema metadata first.
4. Compare expected UI or API outcome with actual DB persistence only when relevant.
5. Use bind values instead of string-concatenated SQL whenever possible.
6. Summarize findings with clear evidence and note any schema uncertainty.
7. Save important reusable output to:
   - `05-observability/db-validation/query-results/`
   - `05-observability/db-validation/schema-notes/`
   - `05-observability/db-validation/rca-notes/`
   - `05-observability/db-validation/mapping-ui-to-db/`

Suggested output shape:

- Objective
- Safe Query Plan
- Findings
- DB Evidence
- Conclusion
- Files Updated

Safe usage examples:

- Validate whether a create action from UI persisted the expected transaction mapping row.
- Explore the schema of a module before deciding which table or column to inspect.
- Analyze table and column relations for approval, status, or reference lookups.
- Support RCA by checking whether the mismatch exists in DB persistence or only in UI or API layers.

