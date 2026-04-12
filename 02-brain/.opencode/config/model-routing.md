# Model Routing

- Engineer work: combine architecture, exploratory testing, test design, automation execution, build/tooling support, bug logging, RCA, and app to DB analysis in one continuous run.
- Prefer the active lane inside Engineer instead of role handoff: architecture, flow, test case, execution, build/tooling, bug, RCA, or infrastructure.
- Use Playwright MCP for focused UI work, Oracle read-only MCP for safe validation, and Oracle test-data MCP only for guarded DML plans when test readiness needs direct DB seed data.
- Use Telegram bug reporter MCP only for final or dry-run group-ready bug reports after evidence has been curated.
- Any task that updates memory, handoff, or ledger must finish with durable file writes and a recall-index refresh.
