# Source Confidence

Use this model before turning external references into expected behavior, testcase coverage, bug candidates, RCA, or release-decision input.

## Trust Levels

| Trust Level | Meaning | Allowed Use |
|---|---|---|
| CONTROLLED | Source is part of the controlled QA workspace or a controlled confirmation artifact. | Can guide QA task tracking, evidence location, and current operational control. Still verify business-critical claims. |
| HIGH | Evidence is recent, confirmed, owner/version is known, and it aligns with runtime or business evidence. | Can support expected behavior when cited with scope and caveats. |
| MEDIUM | Useful and plausible, but missing some confirmation, freshness, owner, or cross-source alignment. | Can guide testing with caveats and should route material gaps to confirmation. |
| LOW | Weak, old, partial, unclear, or not aligned enough. | Can only generate exploration steps or confirmation questions. |
| UNKNOWN | Not indexed, owner/date/version unknown, or access not checked. | Cannot define expected behavior. |
| CONFLICTED | Conflicts with another MoM, BPMN, UI actual, QA log, DB evidence, or confirmed stakeholder answer. | Must route to Source Reconciliation, Diagnosis, or Confirmation Question Engine. |
| STALE | Old or superseded by newer source or current runtime evidence. | Must not drive testcase, bug, RCA, or release decision without confirmation. |

## Anti-Overconfidence Rules

- One source is never enough for final truth if impact is business-critical.
- MoM/BPMN extraction is candidate truth, not final truth.
- If MoM conflicts with BPMN, output `business_conflict_candidate`.
- If MoM/BPMN conflicts with UI, output `needs_business_confirmation`.
- If MoM/BPMN is old or unversioned, confidence cannot exceed MEDIUM.
- If source date, version, or owner is unknown, confidence must be LOW or UNKNOWN.
- If a source was verbally confirmed by client or Product Owner and documented, confidence may increase, but the confirmation reference must be included.
- Do not silently upgrade source confidence. State what changed and which evidence supports the upgrade.
- Do not overwrite a higher-confidence source with a lower-confidence external extraction. Store the conflict.