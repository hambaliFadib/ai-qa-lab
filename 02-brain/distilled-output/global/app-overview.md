# App Overview

PGN Billing AI QA local brain is organized around a lightweight runtime plus durable knowledge model.

## Core Principles

- Use existing browser sessions through CDP.
- Keep auth and browser profile isolated from the brain.
- Store long-term knowledge in local files, not chat history.
- Distill knowledge by module so the next run starts from context, not from zero.
- Record reusable learning in Learning Ledger v1 with append-only blocks.
