# 03 Auth

Session and browser state used by the local QA runtime.

- `state/` keeps serialized auth/session files when available.
- `notes/` and `screenshots/` are the place for manual access notes.
- `user-data/` and `chrome-profile/` preserve browser state for CDP attach workflows.

## Manual Login With OTP Flow

Use this flow when the app requires login, OTP, or a fresh human-authenticated session.

1. Run `node 01-runtime/tools/check-auth-session.js` or `node 01-runtime/tools/run-pgn.js check-auth`.
2. If the result is `manual_login_required` or `otp_required`, complete login in the attached browser window that OpenCode already uses.
3. After login succeeds, run `node 01-runtime/tools/capture-session.js` or `node 01-runtime/tools/run-pgn.js capture-session`.
4. The fresh session is saved to `03-auth/state/dev-energy-auth.json` and can be reused or inspected later.

The expected AI behavior is:
- detect that access is blocked by login or OTP
- ask the user to complete manual login in the attached browser
- capture the fresh session after the user confirms login is done
- continue testing only after session status returns `authenticated`

## Local-Only Sensitive State

- `state/dev-energy-auth.json`, `user-data/`, and `chrome-profile/` are local-only runtime state.
- Do not commit, bundle, or share these files outside the secured local workspace.
- Prefer sharing distilled findings from `01-runtime/artifacts/` or `02-brain/` instead of raw auth state.

Do not mass-clean this folder unless you intentionally want to reset access state.
