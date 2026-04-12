---
description: Persist current run into AI-QA-LAB brain
agent: engineer
---

Persist the latest run so a future OpenCode reset or new session can continue from durable project memory.

Apply `02-brain/.opencode/skills/post-run-memory-updater/SKILL.md`.

Required outcome:

- Update runtime docs under `01-runtime/runtime/docs/`.
- Update durable memory under `02-brain/.opencode/memory/`.
- Update active module knowledge under `02-brain/distilled-output/per-module/<module>/` if a module changed.
- Append a new Learning Ledger v1 block under `02-brain/learning-ledger/`.
- Refresh `02-brain/.opencode/memory/RECALL_INDEX.md`.

Keep only reusable operational learning. Do not store raw secrets, OTP, cookies, DB passwords, or Telegram tokens.
