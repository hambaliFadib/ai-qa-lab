# FALID Team Quick Start

## Clone Repo

```powershell
git clone https://github.com/hambaliFadib/ai-qa-lab.git D:\AI-QA-LAB
cd D:\AI-QA-LAB
```

## Setup Local Env

Copy example files to `.local.env` and fill values locally:

- `02-brain/.opencode/config/opencode-provider.local.env.example`
- `02-brain/.opencode/config/google-sheets-readonly.local.env.example`
- `02-brain/.opencode/config/gitlab.local.env.example`
- `02-brain/.opencode/config/figma-rest-readonly.local.env.example`
- `02-brain/.opencode/config/telegram-bug-reporter.local.env.example`

Never commit `.local.env`, `.local.json`, service account JSON, wallets, cookies, or browser profiles.

## Install

```powershell
cd D:\AI-QA-LAB\01-runtime
npm install
```

## Run Health Checks

```powershell
cd D:\AI-QA-LAB
node 01-runtime/tools/browser-use-mcp-check.js
node 01-runtime/tools/google-sheets-readonly-check.js
node 01-runtime/tools/gitlab-readonly-check.js
node 01-runtime/tools/figma-rest-readonly-check.js
```

## Generate Monitoring Usage Issue Dry-Run

```powershell
node 01-runtime/tools/testcase-gitlab-issue-generator.js --sheet "UI TEST - RBI" --range "A1:R1292" --feature "FEAT-MONITORING-USAGE" --dry-run
```

Review generated markdown/JSON before any execute command.

## Browser Use Login / Session

1. Start FALID through the local wrapper.
2. Let the user manually log in to PGN Billing if needed.
3. Use Browser Use for UI actual evidence.
4. Treat login or OTP as manual user steps.

## Working With GitLab Issues

- Scenario issue comes from Test Scenario row.
- Test Case rows become checklist items.
- Failed testcase becomes `status::failed` scenario issue, not final bug by default.
- If evidence is incomplete, keep `Evidence Needed`.
- QA approves any bug escalation.

## What Not To Touch

- Auth/session/browser profile files.
- Local env/secrets.
- Service account JSON.
- Oracle wallet/config.
- Runtime logs and staging artifacts.
- Spreadsheet cells without approval.
- GitLab execute without review.

## Who Approves What

| Action | Approver |
|---|---|
| GitLab issue execute | QA Lead / Gatekeeper |
| Spreadsheet update | QA Lead / Gatekeeper |
| Bug escalation | QA Lead / Gatekeeper |
| Release decision | QA Lead / Gatekeeper |
| Durable memory promotion | QA Lead / Gatekeeper when governed/high-impact |
| Telegram send | QA Lead / Gatekeeper |
| Oracle test-data injection | QA Lead / Gatekeeper plus DB/technical owner when required |
