# Learning Ledger v1

Lightweight append-only learning history for the local QA brain.

## Structure

- `blocks/` stores immutable block JSON files.
- `index/` stores lightweight lookup files by module, type, and latest block.
- `snapshots/` stores the latest distilled knowledge snapshots for fast reuse.
- `manifests/` stores chain state metadata.

Use `01-runtime/tools/append-learning-block.js` to add new blocks after runtime and brain updates are completed.
Each append now also refreshes `02-brain/.opencode/memory/RECALL_INDEX.md` and the latest global brain snapshot.