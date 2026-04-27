# FALID Reference Registry

This registry stores external and controlled source links, intake status, source confidence, extraction queues, and module mapping for FALID AI WORKSPACE.

It does not store full raw documents by default. Raw files should stay in their source system or in a separately approved raw-evidence location. FALID should extract the smallest relevant summary before using a source in QA reasoning.

## Source Pools

- QA-DELIVERY-CONTROL-CENTER is the controlled QA workspace for delivery control, checkpoints, task tracking, and QA operating context.
- OneDrive MoM Folder is an external raw meeting pool. It may contain mixed old and new meeting notes and must be indexed before use.
- Camunda BPMN Folder is an external raw flow candidate pool. It may contain duplicate or conflicting diagrams and must be indexed before use.

## Trust Posture

External chaotic sources are untrusted until they are:

1. registered
2. indexed
3. classified by source type
4. extracted into a small summary
5. confidence-scored
6. mapped to a module
7. reconciled against other available sources
8. routed to Needs Confirmation when uncertainty remains

Source confidence must be checked before using MoM, BPMN, or other external references for testcase design, bug classification, RCA, release decision, or confirmation output.

## Operating Rule

FALID should never process a full chaotic folder in one prompt. It should register the source, create an extraction queue item, then extract the smallest relevant document or diagram summary needed for the current module or question.