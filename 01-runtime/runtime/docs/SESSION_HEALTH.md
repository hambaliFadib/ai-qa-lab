# SESSION HEALTH

- Preferred attach: `http://127.0.0.1:9222/json/version`
- Preferred browser profile: `03-auth/chrome-profile`
- Runtime mode: Chrome launched via batch script with user-data-dir
- Current status: **ACCESS_STABLE**

## Session Details

- Session captured: `2026-04-05 14:39:xx` (UTC+7)
- Token: Valid (not expired)
- User: qaempat (End User)
- 3 cookies captured + localStorage with token, side_bar, config

## Resolution Steps Completed

1. [x] Started Chrome with `--remote-debugging-port=9222 --user-data-dir=...`
2. [x] User performed manual login in browser
3. [x] Captured session using `capture-session.js`
4. [x] Verified access = ACCESS_STABLE

Re-check this file after each access stabilization run.
