# Tool Usage Policy

- Start with local runtime files and local brain before asking for more context.
- Prefer `01-runtime/tools/*` helpers for CDP, Oracle read-only validation, and ledger operations.
- In OpenCode sessions, prefer the native MCP tools exposed by the `oracle_readonly` server for DB validation.
- The `oracle_readonly` MCP server must stay read-only and must delegate execution to `01-runtime/tools/oracle-readonly-validator.js`.
- Use the validator script directly only for manual CLI verification or backend troubleshooting.
- Use raw knowledge only when distilled knowledge is missing or stale.
- When a skill is needed but is not formally registered, read `SKILL.md` directly and follow it.
- Do not mass-convert BPMN PDFs.

