# Shared Module Execution Utilities

This folder contains small reusable utilities for flow-aware QA execution.

## Files

- `qa-classification.js`: standardizes `bug`, `expected_validation`, `script_false_positive`, `blocked_by_business_rule`, and `needs_manual_review`.
- `network-observer.js`: lightweight Playwright response/request-failure observer for UI-to-API evidence.
- `selector-registry.js`: JSON selector registry loader and observation updater.

Keep this folder practical and module-agnostic. Module-specific selectors and flow rules belong under `01-runtime/runtime/modules/<module>/`.
