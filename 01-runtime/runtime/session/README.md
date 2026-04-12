# Session

This folder exposes runtime entrypoints for browser session work.

- `check-session.js`: wrapper to the canonical auth status helper in `01-runtime/tools/check-auth-session.js`
- `capture-session.js`: wrapper to the canonical auth capture helper in `01-runtime/tools/capture-session.js`
- `open-with-profile.js`: launch the browser with the saved profile and CDP enabled
- `shell/`: PowerShell inspection helpers for saved session state

Rule:

- Keep the core auth logic in `01-runtime/tools/`
- Keep runtime session files thin and operator-friendly
