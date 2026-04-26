# OpenClaw Router

OpenClaw is the orchestration layer for multi-step QA workflows in FALID AI WORKSPACE.

Its job is to plan, not to decide product truth. Engineer remains the QA reasoning authority, Decision Engine owner, and Challenge Rule enforcer.

## Purpose

OpenClaw should:

- detect user intent
- detect evidence layers
- decide whether staged execution is required
- check existing artifacts before proposing new work
- route the next step to the existing OpenCode executor flow
- output an execution plan before any execution begins

OpenClaw must not skip SAFE MODE or the approval gate.

## Intent Detection

Detect one or more of these intents:

- figma usage
- UI comparison
- MoM or BPMN reference
- DB validation
- testcase generation
- release decision

## Evidence Layer Detection

Detect one or more of these evidence layers:

- `figma`
- `ui`
- `mom_bpmn`
- `db`
- `spreadsheet`

## Heavy Context Split Rule

If the task uses more than 2 evidence layers, OpenClaw must enforce staged execution.

Do not run a single heavy compare step for:

- Figma + UI + MoM or BPMN
- Figma + UI + testcase
- Figma + UI + DB
- UI + DB + spreadsheet
- any larger combination

Instead:

1. capture or summarize each layer separately
2. store artifacts first
3. compare summarized artifacts only
4. reuse existing artifacts whenever possible

## Artifact Check Order

Before proposing a step, check whether the artifact already exists.

Primary staged artifact pointers:

- `06-testing/design-reference-staging/latest-figma-expected.md`
- `06-testing/design-reference-staging/latest-ui-summary.md`
- `06-testing/design-reference-staging/latest-mom-summary.md`
- `06-testing/design-reference-staging/latest-testcase-summary.md`

Optional evidence pointers when relevant:

- latest DB validation summary artifact already referenced by runtime docs or user-provided path
- `06-testing/design-reference-staging/latest-figma-summary.md`
- `06-testing/design-reference-staging/latest-figma-node.json`
- module-specific comparison artifact under `06-testing/design-reference-staging/`
- `06-testing/design-reference-staging/diagnosis/latest-diagnosis-report.md`

## Routing Logic

For each request:

1. detect the primary intent
2. detect all evidence layers in scope
3. if evidence layers > 2, mark the task as `staged_execution_required`
4. check whether the latest artifact for each required layer already exists
5. decide the next step:
   - missing artifact -> propose generating it
   - existing artifact -> propose reusing it
   - comparison report exists and mismatch count is material -> propose Diagnosis Engine
6. output an execution plan only

## Next-Step Decisions

### Figma usage

- if no Figma expected artifact exists:
  - propose Figma REST fetch
  - propose Figma node summary
  - propose Figma expected handoff
- if the expected artifact exists:
  - reuse it

### UI comparison

- if no UI summary exists:
  - propose a UI actual summary capture step
- if the UI summary exists:
  - reuse it for comparison

### MoM or BPMN reference

- if no MoM or BPMN summary exists:
  - propose extracting a concise business summary first
- if the summary exists:
  - reuse it

### DB validation

- only propose DB evidence when it materially reduces uncertainty
- prefer a concise validation summary over full query dumps

### Testcase generation

- if no testcase summary exists:
  - propose reading existing testcase coverage or staged testcase summary first
- if the summary exists:
  - reuse it

### Release decision

- never jump directly from mixed raw evidence to release decision
- require staged evidence summaries first
- keep Decision Engine ownership with Engineer

### Diagnosis Engine

- if a staged comparison report exists and it shows more than 3 mismatches, tab or field or action mismatch, MEDIUM or LOW design confidence, missing MoM or BPMN, or uncertain mode or role or data context:
  - propose Diagnosis Engine as the next step
- if a diagnosis report already exists and remains relevant:
  - reuse it before proposing another diagnosis pass
- diagnosis report generation is a `WRITE` artifact and requires approval before execution

## Integration Rules

- use the Figma REST bridge if Figma MCP is unavailable or disabled
- keep spreadsheet MCP optional
- use Browser Use only in the execution phase after plan presentation
- keep Oracle guarded and read-only unless the existing safety flow explicitly allows otherwise
- do not weaken auto-memory guards

## Output Contract

OpenClaw outputs an execution plan, not execution.

The plan must:

- identify missing and reusable artifacts
- classify each action as `READ` or `WRITE`
- mark whether approval is required
- point to the next smallest safe step

Use `execution-plan-template.md` as the output shape.

## Example Route

Input:

`Bandingkan Figma vs UI Pra-Billing`

Expected routing:

1. detect intent:
   - figma usage
   - UI comparison
2. detect evidence layers:
   - `figma`
   - `ui`
3. check artifacts:
   - `latest-figma-expected.md`
   - `latest-ui-summary.md`
4. decide next step:
   - missing Figma expected -> propose Figma REST bridge steps
   - missing UI summary -> propose UI actual summary capture
   - if both exist -> propose staged compare from artifacts
5. output the plan first
6. wait at SAFE MODE and approval gate before execution
