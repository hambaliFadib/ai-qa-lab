# Oracle Debug Check

## Goal

Use Oracle only as a read-only validation source to confirm persistence, inspect schema, compare expected versus actual outcomes, and strengthen RCA without changing DB state.

## Allowed Operations

- `SELECT`
- Schema inspection through `ALL_*`, `USER_*`, or equivalent read-only metadata views
- Metadata exploration for tables, columns, constraints, views, and relationships
- Read-only persistence checks for UI or API outcomes
- Expected-versus-actual comparison for status, approval, or stored values
- RCA support when DB evidence can reduce ambiguity safely

## Forbidden Operations

- `INSERT`
- `UPDATE`
- `DELETE`
- `MERGE`
- `TRUNCATE`
- `ALTER`
- `DROP`
- `CREATE`
- `COMMIT`
- `ROLLBACK`
- Anonymous `BEGIN/END` or `DECLARE` blocks
- Executing procedures, packages, or functions with unknown or mutating side effects
- Any query that is not clearly read-only

## Source Folders

- `01-runtime/runtime/`
- `01-runtime/artifacts/`
- `02-brain/.opencode/memory/`
- `02-brain/distilled-output/per-module/<module>/`
- `05-observability/network-observation/`
- `05-observability/db-validation/queries/`
- `05-observability/db-validation/known-checks/`

## Connection Source

Use these setup files as the connection truth:

- `opencode.json`
- `02-brain/.opencode/config/oracle-readonly.local.env`
- `.opencode/config/oracle-readonly.local.env` as fallback only when the root brain file is the populated profile
- `02-brain/.opencode/config/oracle-readonly-setup.md`
- `05-observability/db-validation/queries/shared/03-minimum-readonly-grants.sql`

## Preferred MCP Server

In OpenCode, use the native MCP server:

- server name: `oracle_readonly`
- server config: `opencode.json`
- server process: `01-runtime/tools/oracle-readonly-mcp-server.mjs`

Preferred MCP tools:

- `oracle_readonly_server_status`
- `oracle_readonly_find_objects_by_keyword`
- `oracle_readonly_describe_table`
- `oracle_readonly_run_query_template`
- `oracle_readonly_run_readonly_sql`

## Backend Guard

The MCP server must delegate execution to:

- `01-runtime/tools/oracle-readonly-validator.js`

This backend:

- enforces `SELECT` or `WITH` only
- blocks forbidden SQL patterns before execution
- uses the local read-only Oracle profile
- stores JSON and Markdown evidence in `05-observability/db-validation/query-results/`

## Output Target

Important findings may be written to:

- `05-observability/db-validation/query-results/`
- `05-observability/db-validation/schema-notes/`
- `05-observability/db-validation/rca-notes/`
- `05-observability/db-validation/mapping-ui-to-db/`

## Rules

1. Treat the query library as read-only only.
2. Start from UI, API, runtime, or module evidence before touching DB validation.
3. If table names are unknown, inspect schema metadata first.
4. If a query looks unsafe, stop and classify it as a forbidden DB action.
5. Treat Oracle as a validator of persisted outcomes, not a layer for fixing or modifying data.
6. Use only the dedicated read-only account configured in `oracle-readonly.local.env`.
7. Prefer MCP tools or saved query templates plus bind values over ad-hoc inline SQL.

## Safe Validation Task Examples

- Validate whether a successful UI create action is persisted in the expected table by business key.
- Explore the schema for `transaction-mapping` or `monitoring-usage` before writing a mapping note.
- Compare API response status with DB status and approval fields using read-only lookups.
- Map UI form fields to candidate Oracle columns and store the note for later reuse.
- Support RCA by checking whether the mismatch is in persistence, reference data, or schema understanding.

