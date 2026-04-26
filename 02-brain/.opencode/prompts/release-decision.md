Use this prompt when the user asks for release readiness, go/no-go, production readiness, deployment safety, or whether a module is safe to release.

First apply the Challenge Rule, RCA Evidence Gate, Confidence Gate, QA execution classification standard, and the Engineer `DECISION ENGINE RULE`. The Decision Engine sits above execution results; testing activity is not release proof.

Decision workflow:

1. Define the exact release scope: module, workflow, role, environment, data set, business process, and release-critical paths.
2. Evaluate evidence layers:
   - UI / functional evidence
   - API / network evidence when relevant
   - DB / persistence evidence when relevant
   - business rule / MoM / BPMN / module-pack alignment
   - design / Figma evidence when relevant
   - automation, environment, session, role, and test-data caveat status
3. Identify blocking findings and non-blocking findings.
4. Assess business risk and whether any business invariant remains ambiguous.
5. Choose exactly one decision output:
   - `RELEASE_READY`
   - `RELEASE_READY_WITH_CAVEAT`
   - `RELEASE_HOLD`
   - `RELEASE_REJECT`
   - `DECISION_NOT_POSSIBLE`
6. Explain confidence as HIGH, MEDIUM, or LOW.
7. Run Engineer self-audit before finalizing the release decision.
8. Explain evidence gaps and the next required action.

## DESIGN EVIDENCE IN RELEASE DECISION

Design evidence may influence release only based on confidence level:

- HIGH: can support release readiness or release hold or reject if the mismatch affects a critical UX path or business invariant, but it still requires UI evidence and business-rule alignment
- MEDIUM: may produce `RELEASE_READY_WITH_CAVEAT` or `RELEASE_HOLD` depending on risk, but cannot alone produce `RELEASE_REJECT`
- LOW: cannot block release by itself and should instead produce `Needs Confirmation` or `DECISION_NOT_POSSIBLE` when design ambiguity is material

Release hard guard:

- Do not output `RELEASE_REJECT` solely from design mismatch unless design confidence is HIGH, the mismatch is verified in UI, business impact is material, and no MoM, BPMN, role, data, or environment caveat explains it

Hard guard:

- Do not output `RELEASE_READY` or `RELEASE_READY_WITH_CAVEAT` when confidence is LOW.
- Do not output release-ready when persistence correctness is unverified for a persistence-critical flow.
- Do not output release-ready when a business invariant is ambiguous.
- Do not output release-ready when UI/API/DB/log/session evidence materially conflicts.
- Do not output release-ready when a known blocking bug remains unresolved.
- Do not use test count, automation pass count, or a single UI observation as release proof.

If evidence is insufficient, do not force final release readiness. Use the Challenge Rule format first:

- Claim
- Evidence
- Gap
- Risk
- Next verification step
- Provisional classification only

Then, if a release decision label is still needed, choose `RELEASE_HOLD` or `DECISION_NOT_POSSIBLE`.

Required output format:

### Release Decision
- Decision:
- Confidence:
- Scope:
- Business Risk:
- Blocking Findings:
- Non-Blocking Findings:
- Evidence Coverage:
  - Design/Figma: HIGH / MEDIUM / LOW / N/A
- Gap:
- Next Required Action:
- Self-Audit Result:
- Decision Score:
- Score Rationale:

Scoring rules:

- final release decisions must include `Self-Audit Result`, `Decision Score`, and `Score Rationale`
- provisional or incomplete release decisions must use `Decision Score: INCOMPLETE`
- if decision score is below 75, downgrade the release outcome before treating it as final
