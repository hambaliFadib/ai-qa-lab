# Figma Design Reference Layer Setup

## Purpose

Use Figma as a read-only design reference layer inside FALID AI WORKSPACE.

The goal is to let Engineer:

- read design context from a Figma file, frame, or node
- extract labels, visible text, components, hierarchy, and layout clues
- generate expected UI or UX references for QA
- compare current UI against design reference
- keep design mismatch in `needs_design_confirmation` by default until stronger evidence exists

Design is reference evidence, not absolute product truth.

## Current MCP Wiring

`figma_design` in `opencode.json` now points to Figma's remote MCP endpoint:

- type: `remote`
- url: `https://mcp.figma.com/mcp`
- enabled: `false` by default

This keeps the workspace safe by default while still wiring the real remote MCP target.

Remote MCP remains preferred when the client is supported, but this workspace keeps it disabled by default until auth and a read-only smoke test succeed.

## Supported Intended Usage

- read design context
- extract labels, text, components, and layout structure
- generate expected UI or UX references for QA
- compare current UI against design reference
- generate testcase ideas from design without writing to spreadsheet by default

## Forbidden For Now

- writing to the Figma canvas
- modifying Figma files
- creating or deleting Figma content
- auto-creating product bugs from design mismatch

## Auth Rule

Do not place Figma tokens, OAuth secrets, or API keys in repo files.

Preferred auth path:

- use OpenCode remote MCP OAuth through `figma_design`
- run auth through `01-runtime\tools\falid-local.cmd`
- let OpenCode store OAuth tokens in project-local XDG storage under `01-runtime/temp/`

Why the wrapper matters:

- `falid-local.cmd` delegates to `opencode-local.cmd`
- `opencode-local.cmd` sets `XDG_CONFIG_HOME`, `XDG_DATA_HOME`, `XDG_STATE_HOME`, and `XDG_CACHE_HOME` under `01-runtime/temp/opencode-xdg/`
- OpenCode's documented MCP OAuth token file normally lives under the XDG data path, so FALID keeps it local to the workspace temp area instead of your global home profile, typically under `01-runtime/temp/opencode-xdg/data/opencode/`
- `falid-local.cmd mcp ...` now auto-skips LiteLLM startup so MCP auth and list flows do not print unrelated Browser Use proxy noise

Do not commit anything from `01-runtime/temp/`.

## Remote MCP 403 / Client Allowlist Limitation

If `cmd /c "01-runtime\tools\falid-local.cmd mcp auth figma_design"` fails with HTTP `403 Forbidden`, do not assume the Figma account or password is wrong.

Figma's official remote MCP docs say only supported clients listed in the Figma MCP catalog can connect to the remote MCP server, and Figma's setup guides document specific client integrations rather than generic remote-OAuth support for every MCP host. In practice, a `403` during remote MCP auth can mean:

- the client is not currently supported by Figma's remote MCP rollout
- the OAuth or client identity used by the host is not accepted yet
- the remote MCP connection path is restricted even though the Figma account itself is valid

For this workspace, treat repeated `403` on OpenCode remote auth as a client-support limitation first, not as proof of bad credentials.

If the same `403` repeats, stop retrying blindly and move to one of these fallbacks:

- Figma REST read-only fallback via `FIGMA_TOKEN`
- Figma Desktop MCP if your setup, seat, and client path support it

Keep `figma_design.enabled=false` by default until a real supported remote connection is confirmed.

## Exact Setup Steps

Run these from `D:\AI-QA-LAB`.

1. Keep the repo config disabled by default. `figma_design.enabled` stays `false` until you are ready to run the documented read-only smoke flow locally.
2. Start Figma OAuth for the remote MCP server:

```powershell
cmd /c "01-runtime\tools\falid-local.cmd mcp auth figma_design"
```

3. Complete the browser login and authorization flow with the Figma account that has access to the target design.
4. Check MCP status:

```powershell
cmd /c "01-runtime\tools\falid-local.cmd mcp list"
```

5. If auth succeeds, follow `01-runtime/runtime/docs/FIGMA_REMOTE_MCP_SMOKE_TEST.md` for the read-only smoke test.
6. If auth returns `403 Forbidden`, stop retrying and switch to `02-brain/.opencode/config/figma-rest-readonly-setup.md` or evaluate Desktop MCP.

## Access and Safety Guidance

- Use the least-privilege Figma account or seat that still allows design context reading for the target file.
- Prefer file permissions that do not grant edit capability when practical.
- Even if the upstream Figma remote MCP server supports broader capabilities, workspace policy remains read-only.
- Engineer must use `figma-design-reader`, `figma-to-expected.md`, and `design-vs-ui-compare.md` in read-only mode only.
- Design mismatch stays `needs_design_confirmation` by default unless stronger confirmed evidence exists.
- If remote MCP is blocked by client support or allowlist constraints, use the REST fallback only for read-only design extraction and staging.
- Figma Desktop MCP is an optional alternative when the desktop app and seat or plan constraints are satisfied.

## Read-Only Smoke Test Goal

The smoke test should prove only this:

- `figma_design` can authenticate
- Engineer can read one Figma file or node URL
- Engineer can extract expected UI reference content without attempting any canvas write

The smoke test must not:

- write to canvas
- modify the Figma file
- turn design mismatch directly into bug classification

## How To Enable After Smoke Passes

After auth is complete and the read-only smoke test passes:

1. Open `opencode.json`.
2. Change `figma_design.enabled` from `false` to `true`.
3. Re-run:

```powershell
cmd /c "01-runtime\tools\falid-local.cmd mcp list"
```

4. Use only the read-only Figma prompts and skills already defined in this workspace.
5. Keep write-to-Figma out of scope unless the workspace policy is explicitly expanded later.

## References

- OpenCode MCP servers docs: https://opencode.ai/docs/mcp-servers
- Figma MCP guide: https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server
- Figma remote setup docs: https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/
- Figma remote vs desktop comparison: https://help.figma.com/hc/en-us/articles/35281385065751-Figma-MCP-collection-Compare-Figma-s-remote-and-desktop-MCP-servers
