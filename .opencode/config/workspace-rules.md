# Workspace Rules

## Operating Truth

- Engineer is the only active QA operating role in `.opencode/agents/`.
- Treat `01-runtime/runtime/docs/*.md` as operational truth for the current run.
- Treat `02-brain/.opencode/memory/*.md` as durable session memory.
- Treat `02-brain/.opencode/memory/RECALL_INDEX.md` as the fast-start recall layer.
- Treat `02-brain/.opencode/memory/USER_WORKING_PREFERENCES.md` as stable user collaboration memory.
- Treat `02-brain/distilled-output/` as reusable module and global knowledge.
- Treat `02-brain/distilled-output/global/raw-knowledge-catalog.md` as the inventory map for all raw sources before opening raw folders directly.
- Treat `02-brain/learning-ledger/` as append-only audit history; never rewrite old blocks.
- Treat `02-brain/distilled-output/global/qa-standards-routing.md` as the routing map for QA standards reuse.
- Treat `04-knowledge-raw/QA_STANDARDS/` as raw QA standards that must be pulled only by the smallest relevant domain source.
- Treat `04-knowledge-raw/MOM/` as the preferred raw business source when application behavior, validation, approval, or business rules are under discussion and distilled knowledge is still insufficient.
- Preserve stronger verified module evidence when a weaker later rerun conflicts with it.
- Prefer extracted `business-flow.md` before raw BPMN when it already exists.
- Prefer CDP attach over login automation.
- Prefer `playwright_cdp` MCP for precise UI actions, waits, snapshots, screenshots, and focused regression work.
- If a fresh manual flow record exists, use it before repeating blind create-flow exploration.
- Use QA standards on-demand to clarify UI, API, automation, and test-data expectations.
- BPMN extraction must stay on-demand and module-scoped.
- Refresh recall memory after each learning-ledger append.

## Oracle DB Safety

- Oracle MCP is read-only validation only.
- Oracle test-data injection must use the separate `oracle_testdata` MCP or `01-runtime/tools/oracle-testdata-injector.js`; never add DML into `oracle_readonly`.
- Use Oracle for persistence checks, schema exploration, metadata exploration, expected-versus-actual comparison, and RCA support.
- Treat Oracle as a validation source, not a modification layer.
- Never use Oracle for `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `TRUNCATE`, `ALTER`, `DROP`, or `CREATE`.
- Never execute anonymous `BEGIN/END` blocks, mutating procedures, packages, or functions.
- If a query or DB action is not clearly read-only, classify it as a forbidden DB action and do not run it.
- For test-data injection only, allow DML through `oracle_testdata` when a saved plan exists under `06-testing/test-data/db-injection/plans/`, the target owner is schema-allowlisted, DDL/procedural SQL is blocked, `--apply` is explicit, and persistent commit requires `--commit --confirm <plan-token> --confirm-commit TESTDATA_DML_COMMIT`.
- Prefer dry-run or rollback execution before any committed DB test-data injection.

## Context Priority

- Archive uncertain leftovers instead of deleting them.
- Keep legacy role files in `99-archive/legacy-agents/` instead of restoring them into active `.opencode/agents/`.
- Run OpenCode through `01-runtime/tools/opencode-local.cmd` so config, data, cache, and lock state stay under `01-runtime/temp/opencode-xdg/`.
- Treat workspace-root folders such as `_tmp-xdg*` or `opencode-config-temp/` as non-compliant leftovers; do not create new ones outside the prepared `01-runtime/temp/` and `99-archive/` structure.
- Archive stale assistant temp folders such as `_tmp-xdg*` into `99-archive/assistant-temp/` instead of leaving them in the active workspace.
- Treat `02-brain/.opencode/node_modules/`, `03-auth/` auth profile and session state, and `99-archive/` as low-priority context unless dependency repair, session recovery, or historical evidence lookup is the active task.

## Telegram Reporting Safety

- Telegram bug reporting must use `telegram_bug_reporter` or `01-runtime/tools/telegram-bug-reporter.js`.
- Keep `02-brain/.opencode/config/telegram-bug-reporter.local.env` local-only and ignored.
- Dry-run is the default; sending requires explicit `--send` or MCP `send=true`.
- Do not paste credentials, session tokens, DB passwords, or raw auth artifacts into Telegram messages.
