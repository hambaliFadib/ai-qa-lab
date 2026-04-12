# 04 Knowledge Raw

Raw business and QA source material.

- `APP_TESTING_STANDARDS/` keeps application-specific testing rules for PGN Billing that sit outside generic QA standards.
- `MOM/` keeps meeting notes and workshop documents.
- `BPMN_BISPRO/` keeps original business-process PDFs and zips.
- `QA_STANDARDS/` keeps source QA standards grouped by domain.
- `REFERENCES/` is reserved for supporting raw references.

Business rules, approval rules, and application-functional expectations should prefer the smallest relevant app-specific standards or MoM source before a broad BPMN sweep.
BPMN files should be extracted on-demand, never batch-converted without a clear need.
Refresh `02-brain/distilled-output/global/raw-knowledge-catalog.md` whenever raw inventory changes so Engineer can see the full source map before choosing the smallest relevant raw file.
