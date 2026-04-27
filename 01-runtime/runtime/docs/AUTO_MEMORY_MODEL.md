# FALID Hot Memory And Durable Ledger Model

FALID AI WORKSPACE uses two memory layers.

## Hot Memory

Hot memory is the current operating state needed by the next Engineer turn.

Primary files:

- `01-runtime/runtime/docs/CONTEXT_HANDOFF.md`
- `02-brain/.opencode/memory/NEXT_ACTIONS.md`
- `01-runtime/runtime/docs/LAST_RUN_SUMMARY.md`
- `01-runtime/runtime/docs/BLOCKERS.md`
- `02-brain/.opencode/memory/SESSION_SUMMARY.md`
- `02-brain/.opencode/memory/AUTO_LEARNING_LOG.md`
- relevant files under `02-brain/.opencode/memory/`

Hot memory should update automatically after every meaningful turn. It can contain current state, next actions, blocker changes, caveats, and short operational notes. It should stay concise and factual.

## Durable Ledger

The Learning Ledger is append-only audit history for reusable deltas.

Append a ledger block only when the turn creates durable knowledge, such as:

- module knowledge change
- bug pattern
- learned flow
- user preference
- RCA conclusion with sufficient cross-layer evidence
- DB validation insight
- controlled test-data insight
- Browser Use, Playwright, CDP, or orchestration reusable behavior
- challenge or confidence policy that should persist across runs
- Decision Engine policy or evidence-backed release decision learning
- stable spreadsheet testcase mapping or reusable testcase-pack improvement
- HIGH-confidence confirmed design rule or confirmed stable design-to-UI mapping
- confirmed reusable diagnostic rule or evidence-backed confirmed diagnosis pattern

Do not append ledger blocks for trivial navigation, repeated summaries, unchanged reruns, status-only responses, provisional RCA, investigation plans, severity guesses, under-evidenced release decisions, `DECISION_NOT_POSSIBLE` release outputs, or RCA/root-cause/classification output that lacks sufficient cross-layer evidence.

Trivial turns update hot memory only. Meaningful reusable insight may append ledger only when it is evidence-backed and durable.

Spreadsheet testcase writes are hot-memory events by default. Record workbook, tab, append status, and staging fallback in hot memory, but do not append ledger for each row write.

Figma design comparisons are hot-memory events by default. Record the Figma source, design confidence, expected reference, comparison status, and Needs Confirmation List in hot memory, but do not append ledger for provisional design mismatch.

MEDIUM-confidence design expected references stay in hot memory or staging until later confirmation. LOW-confidence design mismatch must never append durable ledger. `needs_design_confirmation` stays in hot memory or staging until confirmed.

Diagnosis reports are hot-memory events by default. Record the staged evidence set, likely-cause classifications, confirmation questions, and next diagnostic actions in hot memory, but do not append durable ledger for provisional diagnosis.

`possible_defect_candidate`, `design_outdated_candidate`, `role_based_visibility_candidate`, `data_dependent_visibility_candidate`, and `needs_runtime_condition_validation` stay in hot memory or staging until the cause is confirmed and reusable.

Confirmation question reports are hot-memory or staging events by default. Record the report path, stakeholder packs, blocked decision, and next answer needed in hot memory, but do not append durable ledger for questions alone.

Stakeholder answers can become durable only when:

- `stakeholder_answers_received=true`
- `confirmed=true`
- `evidence_backed=true`
- a reusable business, design, testcase, or diagnostic rule is produced

Do not rewrite historical ledger blocks when stakeholder answers arrive; append only a new confirmed reusable delta if the durable gate passes.

External source registration, MoM extraction, BPMN extraction, and source reconciliation are hot-memory or staging events by default.

Raw ISQA notes are staging or hot memory only. ISQA extraction is provisional until reviewed. Testcase update candidates and spreadsheet update plans are staging or hot memory only.

Do not append durable ledger when:

- `source_confidence` is LOW, UNKNOWN, CONFLICTED, or STALE
- `confirmed=false` or confirmation is missing
- `evidence_backed=false` or evidence backing is missing
- output contains `candidate_business_rule`
- output contains `candidate_flow`
- output contains `needs_business_confirmation`
- output contains unresolved conflict or `business_conflict_candidate`

Durable ledger is allowed only when:

- `confirmed=true`
- `evidence_backed=true`
- QA approval exists when the source is ISQA governance, testcase update, spreadsheet update, bug escalation, or release decision
- stakeholder confirmation or controlled source confirms it
- source confidence is HIGH or CONTROLLED
- a reusable rule is produced
- conflict is resolved

Durable ledger is blocked when:

- `source_confidence` is LOW, UNKNOWN, CONFLICTED, or STALE
- `needs_confirmation` exists
- `testcase_update_candidate` is unresolved
- spreadsheet update is not approved
- ISQA extraction is not reviewed
- final bug or release conclusion is attempted without the evidence gate

Dry-run examples:

```powershell
node 01-runtime/tools/auto-memory-commit.js --input 01-runtime/temp/provisional-mom-extraction.json --dry-run
```

Expected: provisional MoM extraction with LOW/UNKNOWN/MEDIUM unconfirmed source confidence is classified as hot memory/staging only and ledger is blocked.

```powershell
node 01-runtime/tools/auto-memory-commit.js --input 01-runtime/temp/conflicting-bpmn-extraction.json --dry-run
```

Expected: conflicting BPMN extraction with `business_conflict_candidate`, `candidate_flow`, or unresolved conflict is classified as hot memory/staging only and ledger is blocked.

```powershell
node 01-runtime/tools/auto-memory-commit.js --input 01-runtime/temp/confirmed-business-rule.json --dry-run
```

Expected: confirmed, evidence-backed, reusable rule with HIGH or CONTROLLED source confidence may be classified as durable.

```powershell
node 01-runtime/tools/auto-memory-commit.js --input 01-runtime/temp/isqa-raw-extraction.json --dry-run
```

Expected: raw ISQA extraction is blocked from durable ledger until reviewed and approved by QA.

```powershell
node 01-runtime/tools/auto-memory-commit.js --input 01-runtime/temp/figma-expected-result-change.json --dry-run
```

Expected: MoM/Figma suggested Expected Result change is blocked until confirmation and QA approval.

```powershell
node 01-runtime/tools/auto-memory-commit.js --input 01-runtime/temp/confirmed-testcase-improvement.json --dry-run
```

Expected: UI actual plus confirmed stakeholder answer plus QA approval may be allowed as a reviewed testcase improvement if evidence-backed and reusable.

```powershell
node 01-runtime/tools/auto-memory-commit.js --input 01-runtime/temp/spreadsheet-update-plan-no-approval.json --dry-run
```

Expected: spreadsheet update plan without approval is blocked from durable ledger.

```powershell
node 01-runtime/tools/auto-memory-commit.js --input 01-runtime/temp/approved-update-log.json --dry-run
```

Expected: approved update log may become operational memory only when evidence-backed, QA-approved, and conflict-resolved.

RCA without sufficient cross-layer evidence is invalid as durable knowledge and must stay in hot memory until verified.

Release decisions without scoped evidence coverage are invalid as durable final decision truth and must stay in hot memory until verified. Only evidence-backed release decisions may become durable reusable memory.

After appending a ledger block, refresh `02-brain/.opencode/memory/RECALL_INDEX.md` and the global brain snapshot.

## Automatic Flow

1. Decide whether the turn was meaningful.
2. Update hot memory files that changed.
3. Decide whether the turn created a durable reusable delta.
4. If durable, append a Learning Ledger v1 block with evidence references.
5. Refresh recall index only after ledger append.

The helper `01-runtime/tools/auto-memory-commit.js` can apply this from a structured payload:

```powershell
node 01-runtime/tools/auto-memory-commit.js --input 01-runtime/temp/latest-turn-memory.json
```

Use `--dry-run` first when checking classification behavior.

## Role Of `/memory-save`

`/memory-save` remains useful as a manual force flush or fallback checkpoint when:

- automatic hot memory update was skipped or interrupted
- the user wants an explicit durable checkpoint
- a long run needs a clean handoff before stopping
- memory edits need a deliberate review pass

It should not replace the automatic hot-memory pass, and it should still avoid noisy ledger blocks unless explicitly forced as a durable checkpoint.
