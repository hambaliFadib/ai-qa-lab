# DECISION QUALITY LOG

Use this file to track self-audited critical outputs from Engineer.

This log is for:

- decision plus score visibility
- weak-decision pattern detection
- recurring mistake tracking across RCA and release judgment

This file does not replace the Decision Engine, RCA Evidence Gate, Challenge Rule, or durable ledger. It is a hot-memory and quality-tracking surface for how well Engineer is making critical decisions.

## Logging Rules

- Record critical outputs that received self-audit.
- Include `Self-Audit Result` and `Decision Score` when available.
- Use `Decision Score: INCOMPLETE` for provisional outputs or skipped final scoring.
- Low-score, provisional, or failed self-audit outputs may stay here as hot-memory learning but must not become durable final truth.

## Weak Decision Patterns To Watch

- scope unclear
- UI-only conclusion for cross-layer claim
- persistence-critical flow without persistence proof
- business ambiguity ignored
- automation or environment issue treated as product proof
- confidence too high for the available evidence
- release conclusion without Decision Engine discipline
- RCA conclusion without Evidence Gate discipline
- blocker or caveat not stated clearly
- next action missing or unsafe

## Recurring Mistake Tracking

When a weak pattern repeats, summarize it here:

- Pattern:
- Where it repeated:
- Why it is risky:
- What Engineer should do differently next time:

## Decision Entries

New self-audit entries may be appended automatically below.
