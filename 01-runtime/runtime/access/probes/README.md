# Access Probes

This folder is for lightweight probes that check generic access surfaces such as login presence or top-level navigation state.

Rule:

- Keep module-specific probes out of this folder.
- If a probe inspects one module only, move it under `modules/<module>/probes/`.
