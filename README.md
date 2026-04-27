# FALID AI WORKSPACE

## 1. What Is FALID?

FALID is an Agentic QA Operating System for enterprise QA work in chaotic project environments. It helps QA teams run testcase-driven execution, collect evidence, generate issues, ask confirmation questions, diagnose gaps, and propose controlled updates.

FALID does not replace QA judgment. It is a disciplined assistant for evidence handling and workflow control. QA remains the final gatekeeper for bug escalation, spreadsheet updates, release decisions, and durable memory promotion.

Latest readiness posture: `READY_WITH_APPROVAL_GATES`.

## 2. Core Purpose

FALID helps with:

- testcase-driven QA execution
- GitLab issue control
- UI actual evidence capture
- Figma and design comparison
- MoM, BPMN, and source reconciliation
- ISQA-based QA governance
- spreadsheet update proposals
- confirmation question generation
- diagnosis and release risk discipline

## 3. Source Truth Hierarchy

| Source | Role | Can Define Truth? | Notes |
|---|---|---|---|
| TEST CASE - PGN BILLING | Controlled QA execution source | Yes, for current QA execution control | Read through Google Sheets API read-only bridge. Write is prohibited by default. |
| UI actual | Runtime evidence | No, by itself | Proves what exists now, not what should exist. |
| Figma | Design reference/candidate | No, by itself | Useful for design expectation and layout comparison. Must be confidence-scored. |
| MoM | Candidate business reference | No, until confirmed | Meeting notes may be stale, partial, or conflicting. |
| BPMN | Candidate flow reference | No, until confirmed | Flow diagrams need source confidence and reconciliation. |
| ISQA | QA governance reference | No, for PGN business truth | Improves QA discipline, not product-specific behavior. |
| GitLab | QA control board / issue tracker | No, by itself | Tracks QA work, scenario issues, bug candidates, and confirmation needs. |
| QA approval | Final gatekeeper | Yes, for QA-controlled decisions | Required for spreadsheet write, bug escalation, release decision, and durable memory promotion. |

Figma, MoM, BPMN, and ISQA must not override project truth automatically. UI actual is current behavior evidence, not expected behavior proof. Final decisions require QA approval and the relevant evidence gate.

## 4. Main Architecture

| Component | Purpose |
|---|---|
| OpenCode / Engineer | Main QA operating agent, evidence reasoner, Challenge Rule enforcer, and Decision Engine owner. |
| OpenClaw | Safe orchestration planner for multi-layer QA work. Outputs plan first and blocks writes at approval gate. |
| Browser Use | Primary browser interaction layer for UI actual inspection and manual workflow support. |
| Google Sheets bridge | Read-only testcase spreadsheet bridge and guarded approved-update tooling. |
| GitLab bridge | Read-only checks, dry-run issue preview, and approval-gated issue creation. |
| Figma REST bridge | Structured design metadata/node extraction and expected handoff generation. |
| Spreadsheet governance | Defines read/write discipline, safe columns, update plans, and approval rules. |
| ISQA governance | Reviewed QA behavior principles for evidence, defect, risk, release, communication, and delegation discipline. |
| Source registry | Tracks MoM, BPMN, and external source confidence before use. |
| Auto-memory / durable ledger | Separates hot memory from durable reusable knowledge with evidence and approval gates. |
| Oracle readonly validation | Optional DB proof layer for read-only schema/data/persistence checks. |
| Telegram reporter | Optional external report channel. Dry-run first; send only after review/approval. |

## 5. Capability Summary

| Capability | Status | Mode | Approval Needed |
|---|---|---|---|
| Google Sheets testcase read | Ready when service account is configured | read-only | No |
| Testcase scenario extraction | Ready | read-only | No |
| GitLab issue dry-run | Ready when GitLab config is available | dry-run | No |
| GitLab issue execute | Ready when GitLab config is available | external write | Yes |
| Browser Use UI actual | Ready when provider/session is available | read-only / evidence capture | Manual login may be needed |
| Figma REST extraction | Ready when token is configured | read-only | No |
| Testcase update candidate | Ready | dry-run / proposal | QA review required |
| Spreadsheet write plan | Ready | dry-run / proposal | QA approval required |
| Spreadsheet actual update | Available only through approved tool | approval-gated write | Yes |
| ISQA extraction | Ready | read-only / provisional | QA review before durable use |
| MoM/BPMN extraction | Ready | read-only / provisional | Confirmation for business truth |
| Source reconciliation | Ready | read-only / diagnosis | Approval only if it triggers writes |
| Diagnosis engine | Ready | read-only / write artifact | Approval for artifact generation if routed by OpenClaw |
| Confirmation question engine | Ready | read-only / write artifact | Approval for artifact generation if routed by OpenClaw |
| Oracle readonly | Optional | read-only | No, but VPN/network may be required |
| Telegram send | Optional | external write | Yes |
| Release decision engine | Available | prohibited unless approved/requested | Yes |

## 6. Approval Gate Policy

FALID may analyze, draft, compare, and propose. It cannot execute risky writes without approval.

| Action | Approval Required | Required Evidence |
|---|---|---|
| GitLab issue execute | Yes | Dry-run preview, labels, issue body, target project. |
| Spreadsheet update | Yes | Target sheet/row/column, old value, new value, reason, evidence, confidence, update plan. |
| Bug escalation | Yes | Repro or controlled testcase failure, current evidence, impact, unresolved caveats. |
| Release decision | Yes | Decision Engine scope, evidence coverage, known blockers, confidence gate. |
| Durable memory promotion | Yes for governed or high-impact truth | Confirmed, evidence-backed, reusable rule with conflict resolved. |
| Telegram send | Yes | Dry-run message preview and reviewed evidence summary. |
| Oracle test-data injection | Yes | Saved plan, dry-run/validation, rollback proof when feasible, explicit commit gate. |

## 7. Spreadsheet Governance

`TEST CASE - PGN BILLING` is the controlled QA execution source. FALID may read it to understand feature, scenario, testcase, status, actual result, issue URL, owner, and execution notes.

Spreadsheet writing is prohibited by default. Updates follow:

1. candidate
2. write plan
3. QA approval
4. guarded apply
5. local update log

Low-risk execution update columns still require approval:

- Actual Result
- Status
- Test Date
- Re-test Date
- Test Note
- Issue URL
- File Name
- Owner

High-risk testcase definition columns require stronger evidence and explicit approval:

- Title
- Priority
- Behaviour
- Data
- Steps
- Expected Result
- Automation Status

Protected structural columns should not be modified unless explicitly authorized:

- Test Case ID
- Level
- Create Date

## 8. Standard QA Workflow

1. Read testcase from spreadsheet.
2. Extract scenario.
3. Generate GitLab dry-run issue.
4. Review and approve.
5. Create GitLab issue.
6. Capture UI actual evidence.
7. Compare with Figma, MoM, or BPMN if needed.
8. Diagnose the gap.
9. Generate confirmation questions.
10. Generate testcase update candidate if needed.
11. QA approves or rejects.
12. Spreadsheet update plan/apply runs only after approval.

## 9. Monitoring Usage Example

Scope:

- Sheet: `UI TEST - RBI`
- Range: `A1:R1292`
- Feature: `FEAT-MONITORING-USAGE`

Health checks:

```powershell
node 01-runtime/tools/google-sheets-readonly-check.js
node 01-runtime/tools/gitlab-readonly-check.js
```

Dry-run GitLab issue preview:

```powershell
node 01-runtime/tools/testcase-gitlab-issue-generator.js --sheet "UI TEST - RBI" --range "A1:R1292" --feature "FEAT-MONITORING-USAGE" --dry-run
```

Execute only after QA approval:

```powershell
node 01-runtime/tools/testcase-gitlab-issue-generator.js --sheet "UI TEST - RBI" --range "A1:R1292" --feature "FEAT-MONITORING-USAGE" --execute
```

Always run dry-run first. `--execute` creates external GitLab issues and must be approved.

## 10. Local Setup For Team

1. Clone the repository.
2. Install dependencies:

```powershell
cd D:\AI-QA-LAB\01-runtime
npm install
```

3. Copy example env files to `.local.env`.
4. Fill local credentials locally only.
5. Never commit local env files, secrets, service account JSON, wallets, cookies, or browser profiles.
6. Configure Google Sheets service account and share the spreadsheet to the service account email with Viewer permission.
7. Configure GitLab token with the required project access.
8. Configure Figma token if Figma REST bridge is needed.
9. Use Browser Use after manual PGN login/session is available.
10. Use Oracle only when VPN/network and readonly config are available.

## 11. Environment Files

Copy each `.example` file to `.local.env` and fill values locally:

- `02-brain/.opencode/config/opencode-provider.local.env.example`
- `02-brain/.opencode/config/google-sheets-readonly.local.env.example`
- `02-brain/.opencode/config/gitlab.local.env.example`
- `02-brain/.opencode/config/figma-rest-readonly.local.env.example`
- `02-brain/.opencode/config/telegram-bug-reporter.local.env.example`

`.local.env` files must never be committed.

## 12. Safety Rules

- Do not commit secrets.
- Do not bypass QA approval.
- Do not treat Figma, MoM, BPMN, or ISQA as final truth.
- Do not update spreadsheet without explicit approval.
- Do not run Oracle DML outside an approved test-data injection plan.
- Do not send Telegram report without dry-run review.
- Do not make release decision without the Decision Engine.
- Do not classify a final bug without the evidence gate.
- Do not promote provisional evidence to durable ledger.

## 13. Troubleshooting

| Symptom | Likely Cause | Safe Next Step |
|---|---|---|
| Google Sheets access denied | Spreadsheet is not shared to the service account or env path is missing | Run readonly check and verify service account Viewer access. |
| GitLab token invalid | Token missing, expired, wrong scope, or wrong project ID | Run GitLab readonly check and update local env only. |
| Figma token missing | Figma REST config absent | Copy example env, fill token locally, run readonly check. |
| Browser Use ready but PGN login missing | Browser automation is configured but app session is not authenticated | User manually logs in, then continue UI evidence capture. |
| Oracle timeout | VPN/network/host unavailable | Treat as optional blocker unless DB validation is required. |
| Provider returned context error | Task is too heavy or has too many evidence layers | Use OpenClaw staged artifacts and compare summaries. |
| Secret leak detected in git history | A credential or private runtime artifact was committed | Stop push, rotate credential, clean history, scan again, push only with `--force-with-lease` if rewrite is approved. |

## 14. Repository Hygiene

Can be committed:

- source tools
- safe documentation
- prompt files
- governance templates
- `.local.env.example` placeholder files
- package metadata

Must stay local:

- `*.local.env`
- `*.local.json`
- service account JSON
- Oracle wallet/config
- browser profiles and sessions
- runtime logs
- staging artifacts
- screenshots, videos, raw evidence, DB evidence
- `node_modules`, `dist`, build outputs

Secret scan examples:

```powershell
gitleaks detect --source . --redact --verbose
git diff --cached --name-only
git diff --check
```

If history was intentionally rewritten to remove leaked private data, push only with `--force-with-lease`, never plain `--force`.

## 15. Quick Command Reference

Health checks:

```powershell
node 01-runtime/tools/browser-use-mcp-check.js
node 01-runtime/tools/google-sheets-readonly-check.js
node 01-runtime/tools/gitlab-readonly-check.js
node 01-runtime/tools/figma-rest-readonly-check.js
```

Testcase extraction:

```powershell
node 01-runtime/tools/google-sheets-fetch-range.js --sheet "UI TEST - RBI" --range "A1:R1292"
node 01-runtime/tools/testcase-extract-scenarios.js --sheet "UI TEST - RBI" --range "A1:R1292" --feature "FEAT-MONITORING-USAGE"
```

GitLab issue generation:

```powershell
node 01-runtime/tools/testcase-gitlab-issue-generator.js --sheet "UI TEST - RBI" --range "A1:R1292" --feature "FEAT-MONITORING-USAGE" --dry-run
node 01-runtime/tools/testcase-gitlab-issue-generator.js --sheet "UI TEST - RBI" --range "A1:R1292" --feature "FEAT-MONITORING-USAGE" --execute
```

Figma REST bridge:

```powershell
node 01-runtime/tools/figma-rest-fetch-node.js "<FIGMA_URL>"
node 01-runtime/tools/figma-rest-summarize-node.js
node 01-runtime/tools/figma-rest-expected-handoff.js
```

Spreadsheet update candidate:

```powershell
01-runtime/tools/falid-local.cmd run --agent engineer --prompt "$(Get-Content 02-brain/.opencode/prompts/testcase-update-candidate.md -Raw)" "Generate testcase update candidate only. Do not write spreadsheet."
```

Spreadsheet write plan:

```powershell
01-runtime/tools/falid-local.cmd run --agent engineer --prompt "$(Get-Content 02-brain/.opencode/prompts/spreadsheet-write-plan.md -Raw)" "Generate spreadsheet write plan from approved candidate. Do not execute."
```

Approved spreadsheet apply:

```powershell
node 01-runtime/tools/google-sheets-apply-approved-update.js --plan "06-testing/spreadsheet-staging/latest-update-plan.json" --dry-run
node 01-runtime/tools/google-sheets-apply-approved-update.js --plan "06-testing/spreadsheet-staging/latest-update-plan.json" --execute --approval-text "APPROVED BY QA - <name>"
```

Memory dry-run:

```powershell
node 01-runtime/tools/auto-memory-commit.js --input 01-runtime/temp/latest-turn-memory.json --dry-run
```
