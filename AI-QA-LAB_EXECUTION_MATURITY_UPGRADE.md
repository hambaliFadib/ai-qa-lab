# FALID AI WORKSPACE Execution Maturity Upgrade

- Date: 2026-04-12
- Scope: focused execution maturity upgrade for FALID AI WORKSPACE, not architecture redesign
- Primary module baseline: Transaction Mapping
- Current app/DB caveat: live PGN Billing and Oracle checks require VPN; use dry-run until VPN is connected.

## 1. Gap Analysis Summary

| Gap | Resolution |
| --- | --- |
| Module execution profiles missing | Added Transaction Mapping `execution-profile.json`. |
| Flow-aware testing not standardized | Added `execution-baseline.js` with `listSmoke`, `createSmoke`, `happyPath`, and `edgeCase`. |
| `fast-happy-path` placeholder | Implemented skill guidance and Transaction Mapping commands. |
| `network-response-observer` placeholder | Implemented skill guidance and shared runtime observer utility. |
| Bug classification inconsistent | Added global classification standard and shared helper logic. |
| Selector strategy not durable enough | Added selector registry JSON and selector observation persistence helper. |
| Active module runner tied to current module | Added `--module` override and flow-aware modes. |

## 2. Roadmap Summary

1. Use Transaction Mapping as the reference baseline.
2. Validate the baseline in dry-run while VPN is disconnected.
3. When VPN is connected, run `smoke` first, then `happy`, then `full`.
4. Reuse the same pattern for future modules: profile, selector registry, baseline runner, result schema, module pack notes.
5. Promote repeated selector observations into each module selector registry.

## 3. Files Created

| File | Purpose |
| --- | --- |
| `01-runtime/runtime/modules/shared/qa-classification.js` | Shared classification helper for `bug`, `expected_validation`, `script_false_positive`, `blocked_by_business_rule`, and `needs_manual_review`. |
| `01-runtime/runtime/modules/shared/network-observer.js` | Lightweight Playwright response/request-failure observer. |
| `01-runtime/runtime/modules/shared/selector-registry.js` | Selector registry loader and observation persistence helper. |
| `01-runtime/runtime/modules/shared/README.md` | Shared utility notes. |
| `01-runtime/runtime/modules/transaction-mapping/execution-profile.json` | Transaction Mapping flow, action order, required fields, validation rules, safety, and network profile. |
| `01-runtime/runtime/modules/transaction-mapping/selector-registry.json` | Module/page-specific selector candidates and observation slots. |
| `01-runtime/runtime/modules/transaction-mapping/execution-baseline.js` | Flow-aware executable baseline with `smoke`, `happy`, `edge`, and `full` modes. |
| `01-runtime/runtime/modules/transaction-mapping/execution-result-schema.md` | Result JSON schema documentation. |
| `02-brain/distilled-output/global/qa-execution-classification.md` | Global QA execution classification standard. |

## 4. Files Updated

| File | Update |
| --- | --- |
| `01-runtime/runtime/modules/run-active-module-regression.js` | Added `--module` override, `smoke`, `flow`, `listSmoke`, `createSmoke`, and legacy mode aliases. |
| `01-runtime/runtime/modules/transaction-mapping/README.md` | Documented flow-aware baseline usage. |
| `01-runtime/runtime/package.json` | Added Transaction Mapping smoke/flow scripts. |
| `01-runtime/runtime/docs/READY_COMMANDS.md` | Added flow-aware execution commands. |
| `02-brain/.opencode/skills/fast-happy-path/SKILL.md` | Implemented skill. |
| `02-brain/.opencode/skills/network-response-observer/SKILL.md` | Implemented skill. |
| `02-brain/.opencode/agents/engineer.md` | Added classification-standard read and execution classification rule. |
| `02-brain/.opencode/config/workspace-rules.md` | Added classification standard as operating truth. |
| `02-brain/.opencode/config/model-routing.md` | Added flow-aware execution/classification routing rule. |
| `02-brain/distilled-output/per-module/transaction-mapping/test-notes.md` | Added execution maturity baseline note. |
| `02-brain/distilled-output/per-module/transaction-mapping/handoff.md` | Added next execution steps. |

## 5. Transaction Mapping Commands

Dry-run without VPN:

```powershell
cd D:\AI-QA-LAB\01-runtime\runtime
node modules\transaction-mapping\execution-baseline.js --mode full --dry-run
node modules\run-active-module-regression.js --module transaction-mapping --mode flow --dry-run
```

When VPN and app access are available:

```powershell
cd D:\AI-QA-LAB\01-runtime\runtime
node modules\transaction-mapping\execution-baseline.js --mode smoke --label tm-smoke
node modules\transaction-mapping\execution-baseline.js --mode happy --label tm-happy
node modules\transaction-mapping\execution-baseline.js --mode full --label tm-full
```

Through active-module runner:

```powershell
cd D:\AI-QA-LAB\01-runtime\runtime
node modules\run-active-module-regression.js --module transaction-mapping --mode smoke
node modules\run-active-module-regression.js --module transaction-mapping --mode happy
node modules\run-active-module-regression.js --module transaction-mapping --mode flow
```

## 6. Success Criteria

- Dry-run prints `schema_version: ai-qa-lab.flow-execution-result.v1` (legacy schema id retained for compatibility).
- Selected scopes include `listSmoke`, `createSmoke`, `edgeCase`, and `happyPath` for `full` mode.
- Runtime result JSON contains classification fields.
- On real run, output is written under `01-runtime/artifacts/adhoc-notes/`.
- If VPN/app is unavailable, result should classify as `needs_manual_review`, not as `bug`.
- If selectors/timeouts fail before product behavior is proven, result should classify as `script_false_positive`.
- If required-field validation appears as expected, result should classify as `expected_validation`.

## 7. Next Module Template

For the next module, create:

- `execution-profile.json`
- `selector-registry.json`
- `execution-baseline.js`
- `execution-result-schema.md`
- module pack notes under `02-brain/distilled-output/per-module/<module>/`

Then register the module in `run-active-module-regression.js`.
