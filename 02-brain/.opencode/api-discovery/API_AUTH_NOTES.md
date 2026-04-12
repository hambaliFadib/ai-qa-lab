# API Auth Notes

- Preferred auth path is the existing browser session and profile state in `03-auth/`.
- `03-auth/state/dev-energy-auth.json` can be used as a supporting source for session or token inspection.
- Access checks should start with profile view or granted-access endpoints, not with blind module calls.
