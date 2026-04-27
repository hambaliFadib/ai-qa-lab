# External Reference Intake

Use this prompt when the user provides a messy external source link, folder link, or list of links such as OneDrive MoM folders, Camunda BPMN folders, Google Drive QA control folders, or mixed business documentation.

Purpose:

- register the source without over-trusting it
- classify source type and trust level
- guess module and topic conservatively
- create extraction queue item
- identify what must not be trusted yet

Required output:

# External Reference Intake Report

## Source Registry Entry
- Source:
- Type:
- Link/File:
- Owner:
- Access Status:
- Trust Level:
- Current Use:
- Notes:

## Module Guess
- Candidate module:
- Topic guess:
- Evidence for guess:
- Confidence:

## Trust Level
- Level:
- Reason:
- What would raise confidence:
- What would lower confidence:

## Extraction Priority
- Priority:
- Reason:
- Smallest safe extraction target:

## Risk of Misuse
- What must not be assumed:
- What false conclusion could happen:
- Which guardrail applies:

## Next Safe Action
- Registry update:
- Extraction queue item:
- Confirmation route:

## Extraction Queue Item
| Queue ID | Source Type | Link/File | Module | Extraction Goal | Priority | Requested By | Status | Output Artifact | Notes |
|---|---|---|---|---|---|---|---|---|---|

Rules:

- do not treat external docs as authoritative by default
- do not read all files in one pass
- do not make testcase or bug from unverified external source
- summarize only the smallest relevant part
- mark conflicts and duplicates explicitly
- if access is blocked, create `blocked_access` queue item
- if context is insufficient, create `blocked_context` queue item
- do not call external APIs, download files, or create credentials unless separately approved