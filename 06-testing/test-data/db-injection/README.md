# DB Injection Test Data

Saved test-data injection plans for guarded Oracle DML.

Use `_template.insert-testdata.json` as the starting point, then run this from `01-runtime/runtime`:

```powershell
node ..\tools\oracle-testdata-injector.js --plan <plan.json>
```

The command above performs dry-run validation only. For persistent DB changes, use the explicit commit form documented in `01-runtime/runtime/docs/READY_COMMANDS.md`.
