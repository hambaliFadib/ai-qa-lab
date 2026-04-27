# FALID Figma Remote MCP Smoke Test

## Purpose

Prove that `figma_design` can read one Figma file, frame, or node through the remote MCP server in read-only mode.

This smoke test is only for design context extraction. It must not:

- write to canvas
- modify the Figma file
- create a product bug directly from any mismatch

## Prerequisites

- `opencode.json` contains the remote `figma_design` entry pointed at `https://mcp.figma.com/mcp`
- Figma OAuth has already been completed with:

```powershell
cmd /c "01-runtime\tools\falid-local.cmd mcp auth figma_design"
```

- You have a Figma file URL or a copied node or layer link
- You will use the existing read-only Figma prompt and skill only

## Temporary Enable For Smoke

The repo default stays disabled for safety. To run the smoke test locally:

1. Open `D:\AI-QA-LAB\opencode.json`
2. Change `figma_design.enabled` from `false` to `true`
3. Validate status:

```powershell
cmd /c "01-runtime\tools\falid-local.cmd mcp list"
```

## Read-Only Smoke Command

Run this from `D:\AI-QA-LAB` after replacing `<FIGMA_LINK_OR_NODE_URL>` with a real Figma URL:

```powershell
$prompt = Get-Content .\02-brain\.opencode\prompts\figma-to-expected.md -Raw
.\01-runtime\tools\falid-local.cmd run --dir D:\AI-QA-LAB --agent engineer --prompt $prompt "Baca design Figma ini sebagai referensi read-only: <FIGMA_LINK_OR_NODE_URL>. Jangan tulis ke canvas. Keluarkan Design Confidence dan jangan klasifikasikan mismatch sebagai bug."
```

## Success Criteria

- Engineer can read the Figma link or node
- The response includes expected visible elements or screen context
- The response includes the `Design Confidence` block
- No canvas-write or modify action is attempted
- Any mismatch language stays at `needs_design_confirmation` or equivalent confirmation wording

## Failure Interpretation

- Auth failure: rerun `mcp auth figma_design` and complete the OAuth browser flow again
- Disabled server: confirm `figma_design.enabled` is `true` for the local smoke attempt
- Access failure: confirm the authenticated Figma account can open the target file or node
- Incomplete design context: the prompt should say so explicitly rather than inventing details
- Write attempt: treat as policy failure and stop; this layer is read-only only

## Troubleshooting 403 Forbidden

If remote MCP auth returns HTTP `403 Forbidden`, do not keep retrying the same auth flow blindly.

Why this matters:

- Figma's official remote MCP docs say only supported clients from the Figma MCP catalog can connect
- OpenCode may not yet be accepted by Figma's remote MCP rollout even if the Figma account is valid
- a repeated `403` can therefore reflect client support or allowlist limits, not bad credentials

Practical rule:

- one retry after checking the obvious account or access mistake is enough
- if the same `403` repeats, stop the remote auth attempt
- keep `figma_design` disabled by default

Next steps after repeated `403`:

1. Use the read-only REST fallback described in `02-brain/.opencode/config/figma-rest-readonly-setup.md`
2. Run `node .\01-runtime\tools\figma-rest-readonly-check.js`
3. Or evaluate Figma Desktop MCP if your desktop app, seat, and client path support it

Do not classify a design mismatch as bug evidence just because the remote MCP path is unavailable. The fallback remains read-only design evidence only.

## After Smoke Passes

- Keep using `figma_design` only through the read-only Figma prompts and skills
- If you want the MCP active by default in this workspace, leave `figma_design.enabled` as `true`
- If you want to keep the repo safe-by-default, change it back to `false` after the smoke and re-enable only when needed locally
