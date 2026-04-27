# Figma REST Read-Only Fallback Setup

## Goal

Provide a realistic read-only fallback when `figma_design` remote MCP auth is blocked or unsupported in OpenCode.

This fallback is for design context extraction only. It exists so FALID can still:

- read Figma file metadata
- read selected nodes
- extract frames, text, components, and visible structure
- generate expected UI references
- stage design evidence for review

Design remains evidence, not absolute product truth.

## When To Use This Fallback

Use this path when:

- Figma Remote MCP auth returns repeated HTTP `403 Forbidden`
- the MCP client path is not currently supported by Figma's remote rollout
- you still need read-only design context in FALID

Remote MCP remains preferred if it is supported and working. This REST fallback is the pragmatic read-only alternative.

## Read-Only Only

This fallback does not include write operations.

Do not use it to:

- modify Figma files
- create or update canvas content
- post comments
- create product bugs directly from design mismatch

## Auth

Use a local-only Figma Personal Access Token in `FIGMA_TOKEN`.

Preferred local setup:

- shell environment variable: `FIGMA_TOKEN`
- or ignored local env file: `02-brain/.opencode/config/figma-rest-readonly.local.env`

Do not commit the token to Git.

Recommended minimum scope:

- `file_content:read`

The token only works for files your Figma account can access.

Figma auth reference:

- Personal access tokens are sent through the `X-Figma-Token` header
- Figma documents PAT generation and scopes in the REST API docs

## Target Operations

This fallback is intentionally narrow:

1. Get file metadata
   - endpoint: `GET /v1/files/:key`
   - use for file name, last modified time, editor type, version, and document tree metadata
2. Get specific nodes
   - endpoint: `GET /v1/files/:key/nodes?ids=<node_id>`
   - use for selected frame, layer, or component extraction
3. Extract QA-relevant design context
   - frames and screen purpose
   - text labels
   - fields and placeholders
   - buttons and actions
   - component names or hierarchy
   - validation-state clues when clearly visible
4. Generate expected reference
   - route the extracted context into `figma-to-expected.md`
   - keep Design Confidence scoring
   - keep mismatch handling at `needs_design_confirmation` by default

## Local Storage And Staging

Store reviewable outputs under:

- `06-testing/design-reference-staging/`

Use that staging area for:

- raw extracted design notes
- expected-reference drafts
- design-vs-UI comparison drafts
- Needs Confirmation lists

## Local Readiness Check

Run this from `D:\AI-QA-LAB`:

```powershell
node .\01-runtime\tools\figma-rest-readonly-check.js
```

Expected statuses:

- `READY_CONFIGURED`: `FIGMA_TOKEN` is available in shell env or ignored local env file
- `READY_NO_TOKEN`: fallback path is available but no token is loaded yet
- `NEEDS_SETUP`: config path assumptions or staging path assumptions are missing

## Suggested Local Env File

If you prefer a local file instead of a shell env var, create:

- `02-brain/.opencode/config/figma-rest-readonly.local.env`

Example contents:

```dotenv
FIGMA_TOKEN=replace_with_local_pat_only
```

Do not commit this file.

## Suggested Workflow

1. Confirm remote MCP is blocked or not practical.
2. Run `figma-rest-readonly-check.js`.
3. Put `FIGMA_TOKEN` in shell env or ignored local env file.
4. Run `node .\01-runtime\tools\figma-rest-fetch-node.js "<FIGMA_URL>"`.
5. Run `node .\01-runtime\tools\figma-rest-summarize-node.js`.
6. Run `node .\01-runtime\tools\figma-rest-expected-handoff.js`.
7. Stage extracted output under `06-testing/design-reference-staging/`.
8. Keep mismatch classification as `needs_design_confirmation` unless stronger confirmed evidence exists.

## Manual Read-Only Smoke Test

After `FIGMA_TOKEN` is available locally, you can perform one safe metadata-only smoke request from PowerShell:

```powershell
$headers = @{ "X-Figma-Token" = $env:FIGMA_TOKEN }
Invoke-RestMethod -Headers $headers -Uri "https://api.figma.com/v1/files/<FILE_KEY>" -Method Get |
  Select-Object name, lastModified, version, editorType
```

For a node-scoped smoke after you have a node link:

```powershell
$headers = @{ "X-Figma-Token" = $env:FIGMA_TOKEN }
Invoke-RestMethod -Headers $headers -Uri "https://api.figma.com/v1/files/<FILE_KEY>/nodes?ids=<NODE_ID_WITH_COLONS>" -Method Get
```

Notes:

- convert Figma node IDs from URL form like `1-3` to API form like `1:3`
- keep results as read-only extraction only
- stage summaries in `06-testing/design-reference-staging/` instead of treating raw design output as final truth

## References

- Figma REST authentication: https://developers.figma.com/docs/rest-api/authentication/
- Figma REST scopes: https://developers.figma.com/docs/rest-api/scopes/
- Figma file and node endpoints: https://developers.figma.com/docs/rest-api/file-endpoints/
- Compare the Figma APIs: https://developers.figma.com/compare-apis
