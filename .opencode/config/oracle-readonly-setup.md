# Oracle Read-Only MCP Setup

This workspace now has a real Oracle MCP server for OpenCode.

## What Is Active Now

The active Oracle integration is:

- project config: `opencode.json`
- MCP server name: `oracle_readonly`
- MCP server process: `01-runtime/tools/oracle-readonly-mcp-server.mjs`
- read-only execution backend: `01-runtime/tools/oracle-readonly-validator.js`
- local JDBC fallback: `01-runtime/tools/OracleReadonlyJdbcRunner.java`

The MCP server is real, but it intentionally stays read-only by delegating all execution to the existing guarded validator.

## Main Local Secret File

Fill real DB access in:

- `02-brain/.opencode/config/oracle-readonly.local.env`

Fallback only when the root brain file is the populated source:

- `.opencode/config/oracle-readonly.local.env`

Do not share the local secret file after it contains credentials.

## Files In This Setup

- `opencode.json`: project-level OpenCode config that registers the Oracle MCP server
- `01-runtime/tools/oracle-readonly-mcp-server.mjs`: stdio MCP server for OpenCode
- `01-runtime/tools/oracle-readonly-validator.js`: guarded read-only validator used by the MCP server
- `01-runtime/tools/OracleReadonlyJdbcRunner.java`: JDBC fallback used when Node Thin cannot authenticate legacy verifier types
- `02-brain/.opencode/config/oracle-readonly.local.env`: preferred local secret file
- `02-brain/.opencode/config/oracle-readonly.env.example`: shareable template
- `05-observability/db-validation/queries/shared/03-minimum-readonly-grants.sql`: DBA grant template

## OpenCode MCP Registration

The Oracle MCP server is registered in `opencode.json` under:

- `mcp.oracle_readonly`

It is configured as:

- `type: local`
- `command: ["node", "01-runtime/tools/oracle-readonly-mcp-server.mjs"]`
- `enabled: true`

When OpenCode starts in this project, it can load this server as a native MCP server.

## Exposed MCP Tools

The `oracle_readonly` MCP server exposes these read-only tools:

- `oracle_readonly_server_status`
- `oracle_readonly_find_objects_by_keyword`
- `oracle_readonly_describe_table`
- `oracle_readonly_run_query_template`
- `oracle_readonly_run_readonly_sql`

The exact visible tool name in OpenCode uses the server prefix `oracle_readonly_`.

## Read-Only Safety Model

All Oracle access still goes through the guarded validator backend.

Enforced rules:

- allows only `SELECT` and `WITH`
- blocks `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `TRUNCATE`, `ALTER`, `DROP`, `CREATE`
- blocks `COMMIT`, `ROLLBACK`, `BEGIN/END`, `DECLARE`, `CALL`, and `FOR UPDATE`
- blocks schema-qualified objects outside `ORACLE_SCHEMA_ALLOWLIST`
- writes evidence only to `05-observability/db-validation/query-results/`

## Endpoint Koneksi

Provide these connection fields:

- `ORACLE_HOST`
- `ORACLE_PORT`
- `ORACLE_SERVICE_NAME` or `ORACLE_SID`
- `ORACLE_TNS_ALIAS` if the environment uses TNS naming
- `ORACLE_PROTOCOL` as `tcp` or `tcps`
- `ORACLE_RUNNER_MODE`, `ORACLE_FORCE_JDBC`, `ORACLE_JDBC_JAR`, and `ORACLE_JDBC_URL` when you need to override the default runner or JDBC driver
- `ORACLE_USE_WALLET`, `ORACLE_WALLET_PATH`, and `ORACLE_WALLET_PASSWORD` when wallet-based TLS is required
- `ORACLE_REQUIRE_VPN` and `ORACLE_SOURCE_IP_NOTES` when network access is restricted

Rule:

- Prefer `SERVICE_NAME` unless the DBA explicitly says the connection must use `SID`.

## Akun Read-Only

Required fields:

- `ORACLE_USERNAME`
- `ORACLE_PASSWORD`
- `ORACLE_SCHEMA_ALLOWLIST`

Rules:

- Use a dedicated account for AI QA validation.
- Do not reuse a developer account that has write permissions.
- Keep the schema allowlist explicit so validation stays scoped.

## Izin Akses Minimum

Required:

- `CREATE SESSION`
- `SELECT` on approved tables and views in approved schemas
- metadata read access for schema exploration and relationship inspection

Metadata coverage expected by the query library:

- `ALL_TABLES`
- `ALL_VIEWS`
- `ALL_TAB_COLUMNS`
- `ALL_CONSTRAINTS`
- `ALL_CONS_COLUMNS`
- `ALL_COL_COMMENTS`

Must not have:

- `INSERT`
- `UPDATE`
- `DELETE`
- `MERGE`
- `TRUNCATE`
- `ALTER`
- `DROP`
- `CREATE`
- `EXECUTE` on mutating procedures, packages, or functions
- broad admin roles such as `DBA`

## DBeaver Mapping

If the target DB is already configured in DBeaver, map these values into the local env file:

- Host -> `ORACLE_HOST`
- Port -> `ORACLE_PORT`
- Database or Service -> `ORACLE_SERVICE_NAME`
- SID -> `ORACLE_SID`
- User name -> `ORACLE_USERNAME`
- Password -> `ORACLE_PASSWORD`
- Driver property or network note -> `ORACLE_PROTOCOL`, wallet, VPN, or source IP notes

## Dependency Install

Install runtime dependencies once from `01-runtime/`:

- `npm install`

This installs both the Oracle driver and the MCP SDK needed by the local Oracle MCP server.

## Troubleshooting

If the smoke test or an MCP tool fails:

- `NJS-116` means the account uses a legacy password verifier that Node Thin cannot handle. The backend falls back to JDBC automatically when `ojdbc11.jar` is available.
- `ORA-12170` or `NJS-510` means the Oracle host or port is not reachable from this machine right now.
- If DBeaver works but the MCP server still cannot connect, set `ORACLE_JDBC_JAR` explicitly to the local `ojdbc11.jar` path or force JDBC with `ORACLE_RUNNER_MODE=jdbc`.

## Teammate Setup

For another local machine, copy these files and fill the local secret file separately:

- `opencode.json`
- `01-runtime/tools/oracle-readonly-mcp-server.mjs`
- `01-runtime/tools/oracle-readonly-validator.js`
- `01-runtime/tools/OracleReadonlyJdbcRunner.java`
- `02-brain/.opencode/config/oracle-readonly.env.example`

Then create that machine's own:

- `02-brain/.opencode/config/oracle-readonly.local.env`

