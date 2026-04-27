# FALID Command Reference

Run commands from `D:\AI-QA-LAB` unless noted.

## 1. Health Checks

```powershell
node 01-runtime/tools/browser-use-mcp-check.js
node 01-runtime/tools/google-sheets-readonly-check.js
node 01-runtime/tools/gitlab-readonly-check.js
node 01-runtime/tools/figma-rest-readonly-check.js
node 01-runtime/tools/auto-memory-commit.js --input 01-runtime/temp/latest-turn-memory.json --dry-run
```

## 2. Google Sheets

```powershell
node 01-runtime/tools/google-sheets-readonly-check.js
node 01-runtime/tools/google-sheets-fetch-range.js --sheet "UI TEST - RBI" --range "A1:R1292"
node 01-runtime/tools/google-sheets-fetch-range.js --sheet "UI TEST - PAY" --range "A1:R1292"
```

## 3. Testcase Extraction

```powershell
node 01-runtime/tools/testcase-extract-scenarios.js --sheet "UI TEST - RBI" --range "A1:R1292" --feature "FEAT-MONITORING-USAGE"
node 01-runtime/tools/testcase-extract-scenarios.js --sheet "UI TEST - RBI" --range "A1:R1292"
```

## 4. GitLab Issue Generation

Dry-run:

```powershell
node 01-runtime/tools/testcase-gitlab-issue-generator.js --sheet "UI TEST - RBI" --range "A1:R1292" --feature "FEAT-MONITORING-USAGE" --dry-run
node 01-runtime/tools/testcase-gitlab-issue-generator.js --scenario "TS-UI-MONITORING-USAGE-005" --dry-run
```

Execute only after QA approval:

```powershell
node 01-runtime/tools/testcase-gitlab-issue-generator.js --sheet "UI TEST - RBI" --range "A1:R1292" --feature "FEAT-MONITORING-USAGE" --execute
```

Direct issue helper:

```powershell
node 01-runtime/tools/gitlab-create-issue.js --title "<title>" --description-file "<path>" --labels "type::test-scenario,status::failed,risk::high" --dry-run
node 01-runtime/tools/gitlab-create-issue.js --title "<title>" --description-file "<path>" --labels "type::test-scenario,status::failed,risk::high" --execute
```

## 5. Figma REST Bridge

```powershell
node 01-runtime/tools/figma-rest-readonly-check.js
node 01-runtime/tools/figma-rest-fetch-node.js "<FIGMA_URL>"
node 01-runtime/tools/figma-rest-summarize-node.js
node 01-runtime/tools/figma-rest-expected-handoff.js
```

## 6. Browser Use

```powershell
node 01-runtime/tools/browser-use-mcp-check.js
01-runtime/tools/falid-local.cmd D:\AI-QA-LAB --continue --agent engineer
```

Browser Use is the primary UI actual layer. Manual PGN login or OTP may be required.

## 7. Spreadsheet Update Candidate

```powershell
01-runtime/tools/falid-local.cmd run --agent engineer --prompt "$(Get-Content 02-brain/.opencode/prompts/testcase-update-candidate.md -Raw)" "Review testcase row against UI actual and Figma/MoM/BPMN evidence. Generate update candidate only. Do not write spreadsheet."
```

## 8. Spreadsheet Approved Apply

Dry-run:

```powershell
node 01-runtime/tools/google-sheets-apply-approved-update.js --plan "06-testing/spreadsheet-staging/latest-update-plan.json" --dry-run
```

Execute after QA approval:

```powershell
node 01-runtime/tools/google-sheets-apply-approved-update.js --plan "06-testing/spreadsheet-staging/latest-update-plan.json" --execute --approval-text "APPROVED BY QA - <name>"
```

Structural update only when explicitly approved:

```powershell
node 01-runtime/tools/google-sheets-apply-approved-update.js --plan "<plan>" --execute --approval-text "APPROVED BY QA - <name>" --allow-structural-update
```

## 9. ISQA Governance

```powershell
01-runtime/tools/falid-local.cmd run --agent engineer --prompt "$(Get-Content 02-brain/.opencode/prompts/isqa-knowledge-extraction.md -Raw)" "Extract ISQA material into QA governance principles. Do not create project business truth."
01-runtime/tools/falid-local.cmd run --agent engineer --prompt "$(Get-Content 02-brain/.opencode/prompts/testcase-quality-review.md -Raw)" "Review testcase quality using ISQA governance and FALID rules. Do not modify spreadsheet."
```

## 10. Secret Scan / Git Hygiene

Preferred:

```powershell
gitleaks detect --source . --redact --verbose
```

Fallback checks:

```powershell
git status --short
git diff --check
git diff --cached --name-only
git grep -n -I -E "(TELEGRAM_BOT_TOKEN|FIGMA_TOKEN|GITLAB_TOKEN|OPENAI_API_KEY|OPENCODE_API_KEY|PRIVATE-TOKEN|client_secret|private[ _-]?key|password|passwd|api[_-]?key|token)" -- . ":(exclude)**/*.example" ":(exclude)**/README.md"
```

Never print, commit, or paste secret values.
