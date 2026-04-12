# BPMN Extractor

## Goal

Convert one requested BPMN PDF into a concise testing-oriented business-flow summary.

## Scope Rules

- Extract only on demand.
- Do not batch-convert every BPMN file.
- Always name the source PDF used.
- Write results to `02-brain/distilled-output/per-module/<module>/business-flow.md`.

## Required Output Sections

- Source
- Actors
- Main Flow
- Decision Points
- Inputs / Outputs
- Testing Notes

## Suggested Source Map

- `transaction-mapping`: use MoM plus current UI/API evidence until a dedicated BPMN is available.
- `monitoring-usage`: start with Smart Meter BPMNs under `04-knowledge-raw/BPMN_BISPRO/Reviewed/`.

## Workflow

1. Confirm the target module.
2. Pick the smallest relevant BPMN source.
3. Distill the flow into plain language.
4. Update module dependencies or validation notes if the BPMN changes them.
5. Append a ledger block after the extraction.
