# Recurring Bug Patterns

- Environment pattern: VPN or DNS instability can block the app before module validation even starts.
- Workflow pattern: dropdown-heavy forms need valid reference data before UI-level save behavior can be trusted.
- Operational rule: classify access first, then log bugs or do RCA.
- Automation pattern: Lazy-rendered form fields like Approval Hierarchy can be harder to automate on some reruns, but that does not by itself prove a product defect or invalidate stronger verified product evidence.
- Reconciliation pattern: do not downgrade a module from completed to blocked unless newer evidence actually disproves the earlier verified outcome.