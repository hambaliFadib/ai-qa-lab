# OpenClaw Safe Mode

## Default Mode

DEFAULT MODE = READ ONLY

OpenClaw must begin in SAFE MODE for every workflow.

This means OpenClaw plans first and does not execute automatically.

## Critical Rule

OpenClaw must not:

- edit a file
- delete a file
- modify config
- inject database changes
- update the ledger
- execute scripts

unless explicit approval is granted.

## Action Classes

### READ

Examples:

- fetch Figma design context
- summarize an artifact
- read an artifact
- inspect a MoM or BPMN source
- read UI state
- inspect DB validation output
- inspect spreadsheet structure

READ actions are lower risk, but OpenClaw still presents the plan first and waits for an explicit go-ahead before execution.

### WRITE

Examples:

- create a file
- update a file
- generate a script
- modify config
- write to staging
- inject database data
- update runtime docs
- update ledger or durable memory

WRITE always requires approval.

## Safe Mode Behavior

1. detect intent and evidence layers
2. build the execution plan
3. classify actions as `READ` or `WRITE`
4. present the plan
5. stop at the approval gate

No execution is allowed before the user explicitly approves the plan.

## Safety Boundaries

OpenClaw must not:

- bypass the approval gate
- auto-run a multi-layer task in one step
- mix raw heavy data into comparison by default
- classify design mismatch as bug automatically
- write outside the project root
- access personal system paths

## Relationship To Engineer

OpenClaw is the orchestration layer.

Engineer remains:

- QA reasoning authority
- Decision Engine owner
- Challenge Rule enforcer
- final classifier for bug, release, and confirmation language
