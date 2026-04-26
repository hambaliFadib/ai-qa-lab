# Working Tree Hygiene Plan

- Generated: 2026-04-26
- Workspace: `D:\AI-QA-LAB`
- Product identity: `FALID AI WORKSPACE`
- Latest observed commit: `ac179050d2bca47d7d4c7479afd2b159cfb25256` (`Based structure lab QA`, 2026-04-12T10:11:23+07:00)
- Current action status: report only. No delete, move, clean, reset, or commit action has been taken.

## Snapshot

Observed working tree summary during the 2026-04-26 audit:

| Status | Count | Meaning |
| --- | ---: | --- |
| `M` | 105 | Modified tracked paths |
| `??` | 900 | Untracked paths |

Observed untracked top-level distribution:

| Path | Count | Initial Read |
| --- | ---: | --- |
| `.opencode` | 24 | New brain config/prompt/skill/orchestrator/theme files through root junction |
| `01-runtime` | 28 | Runtime tools/docs/modules/logs |
| `02-brain` | 36 | Durable brain target files and ledger blocks |
| `05-observability` | 809 | DB validation/injection evidence and reports |
| `06-testing` | 26 | DB plans, design staging, testcase/design docs |
| `07-falid-shell` | 19 | FALID web shell source/package/runtime state |
| `temp_bpmn` | 35 | Extracted BPMN working copies |
| `temp_mom` | 129 | Extracted MoM/docx working copies |
| root docs/config | 3 | `AI-QA-LAB_EXECUTION_MATURITY_UPGRADE.md`, `tui.json`, and related root additions |

## Commit Candidates

These look like durable source, operator docs, reusable brain rules, or curated evidence. Review content first, then commit in small thematic batches.

### Documentation Sync

- `AI-QA-LAB_FULL_SPEC.md`
- `README.md`
- `01-runtime/runtime/docs/READY_COMMANDS.md`
- `01-runtime/runtime/docs/WORKING_TREE_HYGIENE_PLAN.md`
- `AI-QA-LAB_EXECUTION_MATURITY_UPGRADE.md`
- `tui.json`

Recommended commit theme: `docs: refresh FALID workspace spec and operator surface`.

### OpenCode Brain And Policy Additions

- `02-brain/.opencode/memory/CHALLENGE_PATTERNS.md`
- `02-brain/.opencode/memory/DECISION_PATTERNS.md`
- `02-brain/.opencode/memory/DECISION_QUALITY_LOG.md`
- `02-brain/.opencode/prompts/design-vs-ui-compare.md`
- `02-brain/.opencode/prompts/diagnosis-engine.md`
- `02-brain/.opencode/prompts/figma-to-expected.md`
- `02-brain/.opencode/prompts/release-decision.md`
- `02-brain/.opencode/prompts/spreadsheet-testcase-write.md`
- `02-brain/.opencode/skills/browser-use-primary/`
- `02-brain/.opencode/skills/figma-design-reader/`
- `02-brain/.opencode/skills/spreadsheet-testcase-writer/`
- `02-brain/.opencode/orchestrator/`
- `02-brain/.opencode/themes/falid-ai-workspace.json`

Note: root `.opencode` is a junction to `02-brain/.opencode`. Review staging carefully so duplicate root and target paths do not create confusing commits.

Recommended commit theme: `brain: add challenge, design, diagnosis, and orchestration rules`.

### Runtime Capability Additions

- `01-runtime/tools/browser-use-local.cmd`
- `01-runtime/tools/browser-use-mcp-check.js`
- `01-runtime/tools/set-browser-use-env.ps1`
- `01-runtime/tools/ensure-litellm-opencode-go.ps1`
- `01-runtime/tools/start-litellm-opencode-go.ps1`
- `01-runtime/tools/falid-local.cmd`
- `01-runtime/tools/falid.cmd`
- `01-runtime/tools/falid-doctor.js`
- `01-runtime/tools/auto-memory-commit.js`
- `01-runtime/tools/figma-rest-readonly-check.js`
- `01-runtime/tools/figma-rest-fetch-node.js`
- `01-runtime/tools/figma-rest-summarize-node.js`
- `01-runtime/tools/figma-rest-expected-handoff.js`
- `01-runtime/tools/figma-design-placeholder.cmd`
- `01-runtime/tools/google-sheets-testcase-placeholder.cmd`
- `01-runtime/runtime/docs/AUTO_MEMORY_MODEL.md`
- `01-runtime/runtime/docs/BROWSER_USE_SMOKE_TEST.md`
- `01-runtime/runtime/docs/FIGMA_REMOTE_MCP_SMOKE_TEST.md`

Recommended commit theme: `runtime: add FALID launchers, browser use, figma bridge, and auto memory tooling`.

### Regression Baseline Additions

- `01-runtime/runtime/modules/shared/`
- `01-runtime/runtime/modules/transaction-mapping/execution-baseline.js`
- `01-runtime/runtime/modules/transaction-mapping/execution-profile.json`
- `01-runtime/runtime/modules/transaction-mapping/execution-result-schema.md`
- `01-runtime/runtime/modules/transaction-mapping/selector-registry.json`
- `02-brain/distilled-output/global/qa-execution-classification.md`

Recommended commit theme: `runtime: add flow-aware transaction mapping baseline`.

### Learning Ledger And Distilled Knowledge

- `02-brain/learning-ledger/blocks/LLV1-000022.json` through `LLV1-000028.json`
- `02-brain/learning-ledger/manifests/ledger-drift-repair-20260418.md`
- updated ledger indexes and snapshots
- `02-brain/distilled-output/global/falid-workspace-identity.md`
- `02-brain/distilled-output/per-module/customer-sa-layer/`

Recommended commit theme: `brain: append durable ledger and customer sa knowledge`.

### FALID CLI/Web Shell Source

Commit source and lockfiles, not generated runtime/dependency output:

- `07-falid-shell/scripts/`
- `07-falid-shell/web/package.json`
- `07-falid-shell/web/package-lock.json`
- `07-falid-shell/web/index.html`
- `07-falid-shell/web/server.js`
- `07-falid-shell/web/src/`
- `07-falid-shell/web/vite.config.mjs`
- `07-falid-shell/web/tailwind.config.cjs`
- `07-falid-shell/web/postcss.config.cjs`

Recommended commit theme: `shell: add FALID local web shell`.

### Curated Testing And Design Staging

Commit only curated/reference artifacts that are intentionally reusable:

- `06-testing/design-reference-staging/README.md`
- `06-testing/design-reference-staging/COMPARE_BRIDGE_WORKFLOW.md`
- `06-testing/design-reference-staging/latest-figma-expected.md`
- `06-testing/design-reference-staging/latest-ui-summary.md`
- `06-testing/design-reference-staging/pra-billing-figma-vs-ui-comparison-20260424-latest.md`
- `06-testing/design-reference-staging/diagnosis/latest-diagnosis-report.md`
- `06-testing/design-reference-staging/needs-confirmation/pra-billing-needs-confirmation-20260424T135500Z.md`
- `06-testing/testcase-staging/README.md`

Recommended commit theme: `testing: add design reference staging and diagnosis artifacts`.

### DB Plans And High-Signal Evidence

Commit only reusable, non-secret, reviewable plans/reports:

- `06-testing/test-data/db-injection/plans/c006-materai-activation.sql`
- `06-testing/test-data/db-injection/plans/sa-standardization-sor739-740.json`
- `06-testing/test-data/db-injection/plans/sa-standardization-sor739-740-EXECUTE.sql`
- `06-testing/test-data/db-injection/plans/invoice-injection-5-accounts-sample.json`
- `06-testing/test-data/db-injection/plans/customer-sa-layer-116-final-transformation-rollback.json`
- `05-observability/db-validation/query-results/CUSTOMER-SA-LAYER-116-FINAL-REPORT.md`
- `05-observability/db-validation/query-results/PRE-EXECUTION-VALIDATION-REPORT.md`

Do not batch-commit every DB query result blindly. Prefer a curated evidence commit per milestone.

## Archive Candidates

Archive candidates should move only after explicit approval. Do not delete them.

- `temp_bpmn/`: extracted copies from raw BPMN archives. Raw source is already under `04-knowledge-raw/`.
- `temp_mom/`: extracted docx working copies. Raw source is already under `04-knowledge-raw/MOM/`.
- Old retry/rollback DB injection evidence after the final proof is preserved. Candidate examples: repeated `apply-rollback-*retry*` and duplicate `apply-commit-*retry*` files under `05-observability/db-injection/execution-results/`.
- Older duplicate design comparison drafts when `*-latest.md` and the diagnosis report are confirmed sufficient.
- Telegram dry-run duplicates when the final report artifact is confirmed.
- Web shell development logs under `07-falid-shell/web/dev-server.*.log`.

Suggested archive target when approved:

- `99-archive/assistant-temp/`
- `99-archive/migration-YYYYMMDD/`
- or a new dated archive folder under `99-archive/` with a short README.

## Local-Only Candidates

These should remain local-only and should not be committed.

- `03-auth/chrome-profile/`
- `03-auth/user-data/`
- `03-auth/state/*.json`
- `03-auth/notes/`
- `03-auth/screenshots/`
- `01-runtime/temp/`
- `01-runtime/artifacts/`
- `07-falid-shell/runtime/`
- `07-falid-shell/web/node_modules/`
- `07-falid-shell/web/dist/`
- `07-falid-shell/web/dev-server.stdout.log`
- `07-falid-shell/web/dev-server.stderr.log`
- `02-brain/.opencode/config/*.local.env`
- `.opencode/config/*.local.env`
- `02-brain/.opencode/config/oracle-wallet/`
- any Telegram, Oracle, Browser Use, OpenCode, Figma, or provider token file

## Gitignore Candidates

Some are already ignored, but verify after this plan before staging broadly.

- `temp_bpmn/`
- `temp_mom/`
- `opencode-config-temp/`
- `07-falid-shell/runtime/`
- `07-falid-shell/web/node_modules/`
- `07-falid-shell/web/dist/`
- `07-falid-shell/web/dev-server.*.log`
- `01-runtime/artifacts/`
- `01-runtime/temp/`
- `03-auth/state/*.json`
- `03-auth/chrome-profile/`
- `03-auth/user-data/`
- `.opencode/config/*.local.env`
- `02-brain/.opencode/config/*.local.env`
- `02-brain/.opencode/config/oracle-wallet/`

Do not add broad ignores for `05-observability/` or `06-testing/` without a narrower evidence policy; those folders contain both durable evidence and noisy generated outputs.

## Risky Files That Must Not Be Deleted

Treat these as protected unless the user explicitly gives a targeted instruction and a backup/verification path exists.

- `03-auth/` session/profile/state files. These preserve app access and can require manual login/OTP to restore.
- `02-brain/learning-ledger/blocks/*.json`, `index/*.json`, `manifests/chain-state.json`, and snapshots. The ledger is append-only durable history.
- `02-brain/.opencode/agents/engineer.md`, memory files, Challenge/Decision patterns, and OpenClaw rules. These are operating safety policy.
- `opencode.json`, `tui.json`, and FALID launcher scripts.
- `04-knowledge-raw/` MoM, BPMN, and standards source files.
- Guarded DB plans under `06-testing/test-data/db-injection/plans/`.
- Final DB proof artifacts such as `CUSTOMER-SA-LAYER-116-FINAL-REPORT.md`, `PRE-EXECUTION-VALIDATION-REPORT.md`, and committed injection evidence.
- Figma/design staging `latest-*` pointers and Needs Confirmation lists until superseded.
- `07-falid-shell/web/package-lock.json`, source files, and scripts if the web shell is kept.

## Recommended Batch Plan

1. Commit docs/spec sync only.
2. Commit brain policy/orchestrator/prompt/skill additions.
3. Commit runtime tool additions.
4. Commit Transaction Mapping baseline additions.
5. Commit FALID web shell source only.
6. Commit curated design/test/DB evidence only after review.
7. Add/adjust gitignore entries for generated/local-only paths.
8. Archive extracted temp and duplicate evidence only after user approval.

## Remaining Inconsistencies To Review

- Root `.opencode` and `02-brain/.opencode` both appear in Git status because root `.opencode` is a junction. Staging should be deliberate.
- `browser-use-mcp-check.js` can report `READY_CONFIGURED` while `falid-doctor.js` reports Browser Use or LiteLLM `FAIL` if service ports are not live. Document this as config readiness vs liveness.
- `SESSION_HEALTH.md` contains older session/user details while current handoff references newer `qautomation` work. Do not edit auth/session data during hygiene.
- Many DB evidence files are useful but too noisy for a single broad commit. Curate by milestone.
- Some Markdown evidence contains mojibake from prior encoding. Prefer ASCII for durable specs and future reports.
