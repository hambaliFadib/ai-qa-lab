# Open PGN App

## Goal

Open or re-attach to PGN Billing through the existing CDP browser without forcing a new login flow.

## Steps

1. Run `node ..\\tools\\check-cdp.js`.
2. Run `node open-pgn.js` or `node cdp-connect.js` from `01-runtime/runtime`.
3. Confirm sidebar, topbar, and profile markers.
4. Save concise evidence to `01-runtime/artifacts/adhoc-notes/`.
5. Update runtime blockers and handoff if access is not stable.

## Rules

- Prefer browser reuse.
- Do not assume every failure is auth-related.
- Separate login redirect, DNS/VPN issues, and module UI issues.
