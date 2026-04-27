# FALID Local Team Setup

This guide is for team members cloning FALID on a local machine.

## Prerequisites

- Git
- Node.js LTS
- npm
- PowerShell
- Access to required local credentials from the approved owner
- Browser access to PGN Billing
- Optional: VPN/network for Oracle readonly validation

## Clone

```powershell
git clone https://github.com/hambaliFadib/ai-qa-lab.git D:\AI-QA-LAB
cd D:\AI-QA-LAB
```

## Install

```powershell
cd D:\AI-QA-LAB\01-runtime
npm install
```

## Copy Env Examples

Copy examples to `.local.env` and fill local values:

```powershell
Copy-Item D:\AI-QA-LAB\02-brain\.opencode\config\opencode-provider.local.env.example D:\AI-QA-LAB\02-brain\.opencode\config\opencode-provider.local.env
Copy-Item D:\AI-QA-LAB\02-brain\.opencode\config\google-sheets-readonly.local.env.example D:\AI-QA-LAB\02-brain\.opencode\config\google-sheets-readonly.local.env
Copy-Item D:\AI-QA-LAB\02-brain\.opencode\config\gitlab.local.env.example D:\AI-QA-LAB\02-brain\.opencode\config\gitlab.local.env
Copy-Item D:\AI-QA-LAB\02-brain\.opencode\config\figma-rest-readonly.local.env.example D:\AI-QA-LAB\02-brain\.opencode\config\figma-rest-readonly.local.env
```

Do not commit `.local.env` files.

## Configure Google Sheets

1. Create a Google Cloud service account.
2. Download service account JSON to a local ignored path.
3. Set `GOOGLE_APPLICATION_CREDENTIALS` to that local JSON path.
4. Set `GOOGLE_SHEETS_SPREADSHEET_ID`.
5. Set `GOOGLE_SHEETS_DEFAULT_SHEET=UI TEST - RBI`.
6. Share `TEST CASE - PGN BILLING` to the service account email with Viewer permission.
7. Run:

```powershell
node D:\AI-QA-LAB\01-runtime\tools\google-sheets-readonly-check.js
```

## Configure GitLab

1. Create or request a GitLab token with required project access.
2. Fill `GITLAB_URL`, `GITLAB_PROJECT_ID`, and `GITLAB_TOKEN` in local env.
3. Run:

```powershell
node D:\AI-QA-LAB\01-runtime\tools\gitlab-readonly-check.js
```

## Configure Figma

1. Create or request a Figma token for read-only REST access.
2. Fill `FIGMA_TOKEN` in local env.
3. Run:

```powershell
node D:\AI-QA-LAB\01-runtime\tools\figma-rest-readonly-check.js
```

## Optional Telegram

Copy:

```powershell
Copy-Item D:\AI-QA-LAB\02-brain\.opencode\config\telegram-bug-reporter.local.env.example D:\AI-QA-LAB\02-brain\.opencode\config\telegram-bug-reporter.local.env
```

Fill local values only. Telegram send requires dry-run review and approval.

## Optional Oracle

Oracle readonly validation requires local network/VPN and local ignored config. Use readonly checks only. Do not run DML unless an approved test-data injection plan exists.

## Run Checks

```powershell
cd D:\AI-QA-LAB
node 01-runtime/tools/browser-use-mcp-check.js
node 01-runtime/tools/google-sheets-readonly-check.js
node 01-runtime/tools/gitlab-readonly-check.js
node 01-runtime/tools/figma-rest-readonly-check.js
```

## First Test: Monitoring Usage Dry-Run

```powershell
node 01-runtime/tools/testcase-gitlab-issue-generator.js --sheet "UI TEST - RBI" --range "A1:R1292" --feature "FEAT-MONITORING-USAGE" --dry-run
```

Review the preview before any execute command.

## Safety Checklist

- `.local.env` files are ignored.
- Service account JSON is outside tracked paths.
- No token or password is pasted into docs or GitLab comments.
- GitLab issue creation uses dry-run first.
- Spreadsheet write requires `APPROVED BY QA`.
- Figma, MoM, BPMN, and ISQA do not override project truth automatically.
- Oracle DML is not run outside an approved plan.
- Release decision uses Decision Engine and QA approval.
