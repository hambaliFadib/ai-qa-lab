# OpenCode Memory Guide

## Key Rule

`/compact` is not durable long-term memory. It compacts the current active session so the model can continue with fewer tokens, but it does not replace session resume, exported session backup, or AI-QA-LAB brain updates.

## Three Memory Layers

1. OpenCode session history lives in `01-runtime/temp/opencode-xdg/data/opencode/opencode.db`.
2. AI-QA-LAB durable brain lives in `02-brain/.opencode/memory/`, `02-brain/distilled-output/`, and `02-brain/learning-ledger/`.
3. Runtime handoff lives in `01-runtime/runtime/docs/`.

If OpenCode is reset and its session database is removed or changed, chat transcript resume can be empty. The durable project brain can still be reused only if the new run starts from the Engineer pre-run context files.

## Start Commands

Start the TUI from the project-local wrapper:

```powershell
D:\AI-QA-LAB\01-runtime\tools\opencode-local.cmd D:\AI-QA-LAB --continue --agent engineer
```

Run non-interactive continuation from the same local storage:

```powershell
D:\AI-QA-LAB\01-runtime\tools\opencode-local.cmd run --dir D:\AI-QA-LAB --continue --agent engineer "lanjutkan dari memory dan runtime handoff"
```

List available sessions:

```powershell
D:\AI-QA-LAB\01-runtime\tools\opencode-local.cmd session list
```

Export a session before reset:

```powershell
D:\AI-QA-LAB\01-runtime\tools\opencode-local.cmd export <sessionID>
```

Import a saved session after reset:

```powershell
D:\AI-QA-LAB\01-runtime\tools\opencode-local.cmd import <session.json>
```

## End-Of-Run Habit

Before ending an important run, ask Engineer to apply `post-run-memory-updater` and update:

- `01-runtime/runtime/docs/LAST_RUN_SUMMARY.md`
- `01-runtime/runtime/docs/CONTEXT_HANDOFF.md`
- `01-runtime/runtime/docs/BLOCKERS.md`
- `02-brain/.opencode/memory/RECALL_INDEX.md`
- `02-brain/.opencode/memory/NEXT_ACTIONS.md`
- `02-brain/.opencode/memory/AUTO_LEARNING_LOG.md`
- `02-brain/learning-ledger/`

Then use `/compact` only if the active chat is getting long and you still want to continue in the same session.

## TUI Slash Commands

These project-local commands are available from `.opencode/commands/`:

- `/memory-load` reads the durable AI-QA-LAB brain and runtime handoff at the start of a new session.
- `/memory-save` persists the current run into runtime docs, durable memory, module knowledge, and the learning ledger.
