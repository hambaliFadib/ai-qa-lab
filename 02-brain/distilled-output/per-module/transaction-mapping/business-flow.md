# Business Flow

## Status

Current flow is grounded by manual UI and API evidence captured on 2026-04-06. A dedicated BPMN source has not been confirmed yet, so BPMN extraction remains on-demand.

## Current Flow

1. Open Transaction Mapping list.
2. Click `Create`.
3. Fill the mandatory reference and text fields.
4. Resolve approval hierarchy detail as part of the create context.
5. Open the attachment section and add the required supporting file.
6. Click `Save`.
7. Continue through `Submit` and `Confirm`.
8. Observe redirect back to the list and verify whether the created row appears cleanly.

## Actors

- QA / tester using the PGN Billing UI
- Application backend through the billing item API

## Decision Points

- Is the environment reachable?
- Are reference values and approval hierarchy detail loaded?
- Does pre-submit validation pass?
- Does the create chain finish without a user-visible post-submit defect?
- Is the created row visible after redirect?
