# 02 Brain

Persistent QA brain for Codex/OpenCode-style workflows.

- `.opencode/` stores the single Engineer agent, prompts, skills, config, memory, and API discovery notes.
- `learning-ledger/` stores append-only learning history with hash-chained blocks, indexes, manifests, and snapshots.
- `distilled-output/` stores reusable global knowledge and per-module operational summaries.
- `distilled-output/global/app-specific-testing-standards.md` stores PGN Billing application-specific testing conventions that sit alongside, but separate from, generic QA standards.

Treat this folder as the durable memory layer that survives model or session changes.
