# NEXT ACTIONS

## Current Status

Transaction Mapping is product-complete and persistence-verified.

## Active Follow-Up

1. Preserve the completed module status unless stronger contradictory product evidence appears.
2. If retesting is needed, treat Approval Hierarchy as an automation caveat for one path, not as the module truth.
3. Use Ant Design wrapper interaction, deeper scroll handling, Playwright MCP actions, and QA Standards AUTOMATION guidance before concluding an automation blocker.
4. For monitoring-usage DB checks, treat current USD usage overlap as zero until new ingestion evidence appears.
5. For calc-code checks, validate `M_RBI_RATING_DETAIL_PERIODIC` row presence plus `R_RBI_CALC_SPECIFIC_CUSTOMER` and `CALCULATE_LOG` together before concluding rating data completeness.

## Brain Upgrade Priorities

1. Keep `Engineer` as the only active operating role.
2. Use MoM and extracted business flow whenever application behavior or business rules are discussed.
3. Use Oracle as the read-only proof layer for app to DB analysis.
4. Refresh `RECALL_INDEX.md` and user preferences after meaningful learning updates.

## Confirmed Evidence

- Manual flow reached `Save -> Submit -> Confirm -> return to list`
- CDP verification confirmed created rows persisted with `Waiting Approval`
- Validation coverage expanded with empty-field, partial-fill, and special-character checks
- Post-submit JS error `a is not a function` is logged as low-severity and non-blocking
- Oracle validation on 2026-04-09 found no overlap between USD SA pricing accounts and current `PRABILL_USAGE` rows (by `ACCOUNT_NUMBER`).
- Oracle validation on 2026-04-10 found `CALCULATION_CODE = CLC260400000038` has zero rows in `M_RBI_RATING_DETAIL_PERIODIC` (usage count 0; volume 0), while calc-specific status/log rows exist.

## Rule For Future Runs

- Do not downgrade a completed module because of a weaker automation rerun unless the rerun disproves the stronger verified product evidence.
- Record conflicting evidence as a caveat first, then escalate only if the contradiction is real and reproducible.

## Tax Code Follow-Up (2026-04-11)

1. Keep Tax Code list-level controls marked passed for executed scope.
2. If user needs exhaustive "tanpa terkecuali" depth, continue with row-action and per-column filter-targeting using strengthened selector strategy.
3. Escalate to product bug only if manual/robust automation proves user-visible failure.
4. Follow up confirmed Tax Code condition-date issue: validate whether backend persists `END_DATE = START_DATE` when omitted, and align expected business rule with product owner.
