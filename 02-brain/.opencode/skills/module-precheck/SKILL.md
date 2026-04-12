# Module Precheck

## Goal

Prevent context-free exploration by checking what is already known before starting work on a module.

## Read Order

1. `01-runtime/runtime/docs/ACTIVE_MODULE.md`
2. `02-brain/.opencode/memory/RECALL_INDEX.md`
3. `02-brain/.opencode/memory/USER_WORKING_PREFERENCES.md`
4. `02-brain/distilled-output/per-module/<module>/`
5. `02-brain/.opencode/memory/*.md`
6. `02-brain/.opencode/api-discovery/API_INVENTORY_DISCOVERED.md`
7. `04-knowledge-raw/` for missing business-flow evidence

## Rules

- If distilled knowledge exists, use it first.
- If the topic is application behavior or business rules, use the smallest relevant MoM source before broad BPMN review when distilled knowledge is still not enough.
- If BPMN is needed, extract only the requested module.
- If raw knowledge is missing, state that clearly and continue with observation-based discovery.
