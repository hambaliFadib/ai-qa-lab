# FALID SOP And Specification

## 1. Scope

FALID is used for controlled QA work across testcase execution, evidence capture, design comparison, source reconciliation, issue generation, diagnosis, and governed updates.

FALID is not used as an unattended autopilot, final business authority, secret store, direct spreadsheet writer, unreviewed bug classifier, or release approver. It can propose and draft; QA decides.

## 2. Roles

| Role | Responsibility |
|---|---|
| QA Lead / Gatekeeper | Final approval for bug escalation, spreadsheet update, release decision, and durable memory promotion. |
| QA Executor / Intern | Runs assigned checks, captures evidence, updates GitLab issue notes, and asks for confirmation when blocked. |
| FALID Engineer Agent | Reads sources, reasons over evidence, generates drafts/plans/issues, enforces guardrails, and keeps outputs provisional when evidence is incomplete. |
| OpenClaw Planner | Plans multi-layer workflows, checks artifacts, classifies read/write actions, and blocks execution until approval. |
| Stakeholder / PO / BA / SA / UX / Dev / DB | Provides confirmation, design/business clarification, implementation context, and DB/API support. |

## 3. Operating Modes

| Mode | Meaning | Examples |
|---|---|---|
| read-only | Reads existing source or evidence without changing external systems. | Google Sheets read, GitLab metadata check, Figma REST fetch, Oracle SELECT. |
| dry-run | Produces preview artifacts without external write. | GitLab issue preview, spreadsheet update plan, Telegram report preview. |
| approval-gated write | Requires QA approval and explicit execute command. | Spreadsheet approved update, durable memory promotion. |
| external write | Changes an external system and must be reviewed first. | GitLab issue creation, Telegram send. |
| prohibited action | Not allowed unless a separate approved safe tool and explicit approval exist. | Direct spreadsheet edit, ad hoc Oracle DML, final bug without evidence gate. |

## 4. Standard Operating Procedure

### Testcase To GitLab Issue

1. Run Google Sheets readiness check.
2. Fetch the relevant sheet/range.
3. Extract scenarios and test cases.
4. Generate GitLab issue preview in dry-run.
5. QA reviews titles, labels, status, risk, and issue body.
6. Execute GitLab creation only after approval or explicit `--execute`.
7. Save created issue mapping.
8. Do not update spreadsheet Issue URL automatically.

### UI Evidence Capture

1. Confirm Browser Use readiness.
2. Confirm PGN login/session manually when needed.
3. Capture UI actual summary for the scoped role, data, environment, and state.
4. Use screenshot, screen recording, API/network, or DB evidence only when needed.
5. Treat automation timeouts as automation caveats until product behavior is proven.

### Figma Comparison

1. Fetch Figma node through REST bridge.
2. Summarize node metadata.
3. Generate expected handoff.
4. Use Browser Use visual inspection when layout or visual parity matters.
5. Compare REST expected handoff, visual design, UI actual, and testcase source.
6. If Figma and UI differ, route to Diagnosis or Needs Confirmation before bug language.

### MoM/BPMN Reconciliation

1. Register or identify the smallest relevant source.
2. Extract concise MoM or BPMN summary.
3. Assign source confidence.
4. Compare against controlled testcase and UI actual.
5. If sources conflict, create confirmation questions.
6. Do not overwrite testcase expected behavior from MoM/BPMN alone.

### Diagnosis

1. Start from staged evidence summaries, not raw dumps.
2. Classify likely cause as design outdated, implementation gap, role/state/data dependency, business rule missing, automation artifact, or environment caveat.
3. Keep diagnosis provisional unless cross-layer evidence is strong.
4. Use RCA Evidence Gate before final root cause.

### Confirmation Question Generation

1. Identify unclear expected behavior or conflicting source.
2. Name the blocked decision.
3. Ask targeted questions for stakeholder, UX/design, BA/PO, Dev, DB, or QA.
4. Keep answers out of durable memory until confirmed, evidence-backed, and approved.

### Testcase Update Candidate

1. Read current testcase row.
2. Compare UI actual, Figma expected, MoM/BPMN, GitLab issue, and QA confirmation.
3. Classify as execution update candidate, testcase definition update candidate, needs confirmation, bug candidate, no update needed, or blocked due conflict.
4. Show old vs new value, reason, evidence, confidence, and risk.
5. Do not write spreadsheet.

### Spreadsheet Write Plan

1. Start only from an approved testcase update candidate.
2. Show spreadsheet, sheet, row, column, old value, new value, reason, evidence, confidence, and issue URL when available.
3. Output a plan/payload only.
4. If approval text is missing, output `APPROVAL_REQUIRED`.

### Approved Spreadsheet Update

1. Run apply tool in dry-run first.
2. Execute only with `--execute` and approval text containing `APPROVED BY QA`.
3. Verify old value before write.
4. Abort on mismatch.
5. Log the update locally.
6. Do not update protected structural columns unless explicitly authorized.

### Bug Escalation

1. Confirm testcase status and latest evidence.
2. Separate failed scenario issue from final bug.
3. Use bug-candidate language unless RCA Evidence Gate is satisfied.
4. Attach or reference evidence.
5. QA approves escalation.

### Release Decision

1. Use Decision Engine only when release/go-no-go is explicitly requested.
2. Verify scope, evidence coverage, blockers, business invariants, and confidence.
3. Do not output release-ready if evidence is low, conflicted, or missing for persistence-critical flows.
4. QA approves final decision.

## 5. Decision Rules

| Rule | Requirement |
|---|---|
| Challenge Rule | Challenge ambiguous, high-impact, conflicting, or under-evidenced claims. |
| RCA Evidence Gate | No final root cause, severity, or product bug classification without sufficient cross-layer evidence. |
| Confidence Gate | HIGH confidence requires strong cited evidence; LOW confidence stays provisional. |
| Decision Engine | Required for release, go/no-go, production readiness, or deployment safety language. |
| QA Gatekeeper Rule | QA approves final classification, spreadsheet update, bug escalation, release decision, and durable memory promotion. |
| Anti-overconfidence memory rule | Provisional ISQA, MoM, BPMN, Figma, diagnosis, or testcase update candidates stay out of durable ledger. |

## 6. Evidence Requirements

| Evidence Type | Use |
|---|---|
| UI screenshot | Shows visible UI state at a point in time. |
| UI actual summary | Captures current runtime behavior for role, data, state, and environment. |
| API/network evidence | Shows request, response, endpoint, status, payload, or missing call. |
| DB evidence | Shows persisted, absent, mismatched, or schema-clarified state through read-only validation. |
| Figma expected handoff | Captures design metadata and expected UI reference. |
| MoM extraction summary | Captures candidate business rule or decision with confidence. |
| BPMN extraction summary | Captures candidate flow rule with confidence. |
| GitLab issue | Tracks QA control, scenario status, evidence needed, and follow-up. |
| Stakeholder answer | Can confirm expected behavior when documented and scoped. |

## 7. Source Confidence

| Level | Meaning |
|---|---|
| CONTROLLED | Controlled QA workspace or confirmed control artifact. |
| HIGH | Recent, confirmed, owner/version known, aligned with runtime or business evidence. |
| MEDIUM | Useful but missing freshness, owner, confirmation, or cross-source alignment. |
| LOW | Weak, old, partial, unclear, or poorly aligned. |
| UNKNOWN | Not indexed, owner/date/version unknown, or access not checked. |
| CONFLICTED | Conflicts with another source, UI actual, QA log, DB evidence, or stakeholder answer. |
| STALE | Old or superseded by newer source or runtime evidence. |

LOW, UNKNOWN, CONFLICTED, and STALE sources cannot define expected behavior. They can generate exploration steps and confirmation questions.

## 8. Spreadsheet Update SOP

FALID may update spreadsheet only when all are explicit:

- target spreadsheet
- target sheet
- target row
- target column
- old value
- new value
- reason
- evidence
- confidence
- QA approval
- update log
- GitLab issue reference when available

Default is dry-run. Direct write requires an approved write plan and explicit execute command.

## 9. GitLab SOP

- One GitLab issue is generated per Test Scenario row.
- Test Case rows become checklist items inside the issue.
- Failed scenario -> `status::failed`.
- Untested scenario -> `status::untested`.
- Mixed passed/untested scenario -> `status::testing`.
- Critical scenario -> `risk::critical`.
- Dry-run preview is mandatory before execute.
- Created issue mapping is saved after execution.

## 10. Team Setup SOP

1. Clone the repository.
2. Install `01-runtime` dependencies.
3. Copy `.local.env.example` files to `.local.env`.
4. Fill local credentials locally.
5. Configure Google Sheets service account and Viewer access.
6. Configure GitLab token and project ID.
7. Configure Figma token if needed.
8. Configure Browser Use provider and perform manual PGN login when required.
9. Configure optional Oracle readonly access only when VPN/network is available.
10. Run readiness checks.
11. Run Monitoring Usage dry-run before any write.

## 11. Prohibited Practices

- Committing secrets, service account JSON, wallet files, cookies, sessions, or local env files.
- Direct spreadsheet write without approval.
- Direct bug finalization without evidence gate.
- Unreviewed durable memory promotion.
- Treating raw MoM/BPMN as final truth.
- Treating raw ISQA as product/business truth.
- Sending Telegram reports without dry-run review.
- Running Oracle DML outside an approved plan.
- Making release decisions without Decision Engine.

## 12. Daily QA Rhythm

Morning:

1. Pull latest safe repo changes.
2. Confirm local env files exist.
3. Run Google Sheets and GitLab checks.
4. Check Browser Use readiness and PGN login.
5. Review GitLab QA board.

Execution:

1. Pick controlled testcase scenario.
2. Assign intern or QA executor task.
3. Capture UI actual and evidence.
4. Update GitLab notes.
5. Route unclear behavior to confirmation.

Checkpoint:

1. Review failed/blocked/untested scenarios.
2. Generate confirmation questions.
3. Generate testcase update candidates when evidence supports them.
4. Keep spreadsheet writes blocked until QA approval.

End of day:

1. Summarize GitLab changes and blockers.
2. Save hot memory or handoff notes.
3. Promote durable memory only if evidence-backed and approved.
