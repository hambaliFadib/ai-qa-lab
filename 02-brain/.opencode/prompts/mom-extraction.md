# MoM Extraction

Use this prompt to extract a MoM source into structured candidate decisions, business rules, open questions, and action items.

Required contract:

- `06-testing/reference-registry/MOM_EXTRACTION_CONTRACT.md`
- `06-testing/reference-registry/source-confidence.md`

Workflow:

1. Read the source registry and extraction queue item first.
2. Read the smallest relevant MoM source or excerpt.
3. Extract only what is supported by the text.
4. Classify each item as candidate, active_candidate, conflicted, stale, needs_review, confirmed, or rejected.
5. Assign source confidence.
6. Save or propose the extraction artifact path when writing is approved.

Rules:

- produce source confidence
- do not invent business rules
- discussion note is not a decision
- decision without owner/date is provisional
- if extracted rule is relevant to testcase, mark `testcase_candidate`, not `confirmed_testcase`
- if extracted rule conflicts with other sources, mark `needs_business_confirmation`
- output only concise summary and extraction artifact path when saving
- do not generate final testcase directly from MoM
- do not create bug, RCA, release decision, spreadsheet update, Telegram report, or durable ledger append from MoM extraction alone

Required output:

- MoM Extraction Summary using the contract
- Source confidence rationale
- Candidate module mapping update
- Extraction queue status recommendation
- Needs Confirmation topics
- Confirmation Question Engine recommendation when ambiguity remains