# Validation Rules

- Treat all eight observed fields as likely required until the app proves otherwise.
- Dropdown fields depend on valid option loading and reference data.
- For Transaction Mapping dropdowns, validate selection from the visible Ant Design wrapper state, not from hidden input click success alone.
- If a dropdown click appears to fail, separate `panel did not open` from `panel opened but app threw a later JS error`.
- Save behavior is only trustworthy after the app is reachable and the create API is observed.
- Environment blockers must be ruled out before logging a validation bug.
