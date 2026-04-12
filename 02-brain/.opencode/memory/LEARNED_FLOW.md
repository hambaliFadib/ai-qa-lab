# LEARNED FLOW

## Transaction Mapping

- Path: System Setup > Master Data > Transaction Mapping
- URL: https://dev-energy.pgn.co.id/system-setup/billing-item
- Status: **TESTING** - Validation scenarios tested

### Working Flow
1. Open list page
2. Click "Create Transaction Mapping" button
3. Fill required fields
4. Click Save -> Submit -> Confirm

### Required Fields (8 Total)
1. Category (dropdown)
2. Type (dropdown)
3. Name (text input)
4. Bill Type (dropdown)
5. Criteria (dropdown)
6. Start Date (date picker)
7. Description (textarea)
8. Approval Hierarchy (dropdown)

### Important APIs
- `POST /rbi/v1/dbs/api/billingitem/validate-create` - pre-submit validation
- `POST /rbi/v1/dbs/api/billingitem/create` - create request
- `POST /rbi/v1/dbs/api/billingitem/attachment-upload` - attachment upload

### Known Issue (Automation)
- **Approval Hierarchy field**: Has 0x0 dimensions until page scrolls
- Workaround: Use JS click or manual test to fill this field

### Interaction Rule (Ant Design Dropdowns)
1. Click the dropdown wrapper (not the hidden input)
2. Wait for `.ant-select-dropdown` to appear
3. Click option or use keyboard (ArrowDown + Enter)
4. Press Escape to close dropdown
5. Verify selection via `.ant-select-selection-item`

## Access Pattern
- Reuse browser and session
- Verify list data after create operations
- Always close dropdowns after selection to avoid conflicts

## Tax Code (Ad-hoc Functional Pass)

- Path: System Setup > Master Data > Tax Code
- URL: https://dev-energy.pgn.co.id/system-setup/tax-code
- Status: **TESTED** - list-level controls executed with one automation caveat

### Working Flow (Observed)
1. Open Tax Code list page
2. Use `Advanced Search` -> open modal
3. Use `Add Linear Filter` and `Add Filter Rules`
4. Use `Clear Filter` then `Cancel` to close modal
5. Click `Refresh` on list page
6. Click `Create Tax Code` -> create page opens
7. Click create-page `Cancel` -> confirm popup -> `Confirm` to return list

### Observed Overlay/Menu Behavior
- Top-right profile dropdown (`Q`) opens Ant Design menu with:
  - Profile
  - Switch Position
  - Logout
- Advanced Search uses modal overlay and keeps internal filter-builder controls.

### Automation Caveat
- Some selector-specific checks timed out during row-action and direct per-column filter-trigger probing.
- Classification: automation interaction reliability caveat, not yet product defect.

### Confirmed Bug Observation (Condition Date)
- In `Create Tax Code` > `CRITERIA INFORMATION` > `Condition`, saving a condition row with `Start Date` filled and `End Date` left empty produced a row where `END DATE` equals `START DATE` (`11 Apr 2026`).
- Observation source: live UI condition list row inspection after save.

## Monitoring Usage (DB Observation)
- When checking `USD` in Prabill, currency source is `PRABILL_SA_PRCRULE.CURRENCY` joined by `PRABILL_SA_ID`.
- `PRABILL_USAGE` does not contain `SA_NUMBER`; practical overlap checks in current schema rely on `ACCOUNT_NUMBER` or `ACCOUNT_ID`.
- Current observation (2026-04-09): USD SA pricing account numbers show zero usage overlap in `PRABILL_USAGE`.

## Monitoring Usage (Calculation Detail Observation)
- For calc-code-specific checks, `M_RBI_RATING_DETAIL_PERIODIC` is the direct periodic detail layer containing usage fields (`USAGE_MEAS_DATE`, `USAGE_VOLUME`, `USAGE_ENERGY`).
- Observation (2026-04-10): `CALCULATION_CODE = CLC260400000038` returns zero rows in this table, even though calc-specific status/log rows exist.
