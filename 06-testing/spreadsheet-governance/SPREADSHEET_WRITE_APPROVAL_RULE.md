# Spreadsheet Write Approval Rule

FALID may update spreadsheet only if all conditions are met:

1. Target spreadsheet is explicit.
2. Target sheet is explicit.
3. Target row is explicit.
4. Target column is explicit.
5. Old value is shown.
6. New value is shown.
7. Reason is shown.
8. Source evidence is attached or referenced.
9. Confidence is declared.
10. QA approval is given.
11. Update is logged to local artifact.
12. If GitLab issue exists, update must reference issue URL.

Default mode:

- dry-run only

Direct write allowed only with:

- explicit command
- explicit QA approval
- write tool available
- generated update plan reviewed
