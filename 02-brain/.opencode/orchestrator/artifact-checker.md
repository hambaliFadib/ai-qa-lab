# OpenClaw Artifact Checker

Before executing any step, OpenClaw must check whether the required artifact already exists.

## Rule

- if the artifact exists -> reuse it
- if the artifact does not exist -> generate it

Avoid re-fetch, re-summarize, or duplicate work unless the user explicitly asks to refresh.

## Primary Artifact Targets

- `06-testing/design-reference-staging/latest-figma-node.json`
- `06-testing/design-reference-staging/latest-figma-summary.md`
- `06-testing/design-reference-staging/latest-figma-expected.md`
- `06-testing/design-reference-staging/latest-ui-summary.md`
- `06-testing/design-reference-staging/latest-mom-summary.md`
- `06-testing/design-reference-staging/latest-testcase-summary.md`
- module-specific comparison artifact under `06-testing/design-reference-staging/`
- `06-testing/design-reference-staging/diagnosis/latest-diagnosis-report.md`

## Decision Pattern

1. identify the next required artifact
2. check whether it exists and is still relevant
3. if yes, reuse it
4. if no, propose generating it
5. only move to the next comparison step after the required artifact is available
6. if a comparison artifact already exists and diagnosis triggers are met, propose diagnosis before reopening raw evidence

## Reuse Principles

- prefer summarized artifacts over raw evidence
- prefer latest staged artifacts before reopening large raw sources
- if a provider error interrupted the workflow, resume from the latest valid artifact instead of restarting from the first step
- diagnosis reports should be reused when they still match the same scope, role, mode, and evidence set
