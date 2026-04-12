# API Inventory Discovered

## Confirmed

- `GET /rbi/v1/dbs/api/billingitem/get-paging`
  - Module: transaction-mapping
  - Role: load list data
  - Confidence: high

- `POST /rbi/v1/dbs/api/billingitem`
  - Module: transaction-mapping
  - Role: create or submit record
  - Confidence: medium until a clean success run is recorded after migration

## Access Layer

- `GET /um/v1/dbs/api/profile/view-profile`
  - Role: confirm current user profile and session health

- `POST /um/v1/dbs/api/auth/check-granted-access`
  - Role: fetch granted menu access and support menu mapping

## Notes

- Use `01-runtime/runtime/discover-api.ps1` for a quick recheck after access is stable.
- Update this file before appending a learning block when a new endpoint is observed.
