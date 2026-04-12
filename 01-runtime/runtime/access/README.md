# Access

Use this folder for entrypoints that open the app or validate high-level access health.

- `open-pgn.js`: open the app through the current CDP browser.
- `cdp-connect.js`: validate access markers and write an access summary artifact.
- `probes/`: keep only generic access probes here. Module-specific probes belong under `modules/<module>/probes/`.
