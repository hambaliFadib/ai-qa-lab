# FALID Browser Use Smoke Test

## Prerequisites

- `uvx` is installed and available in `PATH`.
- Browser Use starts through `01-runtime\tools\browser-use-local.cmd`, which loads `02-brain\.opencode\config\browser-use.local.env` only for the Browser Use MCP process.
- Preferred local LLM route: Browser Use -> LiteLLM proxy -> OpenCode Go `glm-5`.
- `01-runtime\tools\opencode-local.cmd` auto-starts the proxy with `01-runtime\tools\ensure-litellm-opencode-go.ps1` when `02-brain\.opencode\config\litellm-opencode-go.local.env` is filled. You can still start it manually with `01-runtime\tools\start-litellm-opencode-go.ps1` for direct proxy debugging.
- In `browser-use.local.env`, `OPENAI_API_KEY` must be the LiteLLM master key and `OPENAI_BASE_URL` / `OPENAI_API_BASE` should be `http://127.0.0.1:4000/v1`. Do not put the OpenCode Go key directly in `OPENAI_API_KEY`.
- If OpenCode itself needs explicit provider env, copy `02-brain\.opencode\config\opencode-provider.local.env.example` to `02-brain\.opencode\config\opencode-provider.local.env`; it is separate from Browser Use env.
- `BROWSER_USE_HEADLESS=false` for local QA unless a headless run is explicitly needed.
- PGN Billing access, VPN, and session state are available.

## Steps

From `D:\AI-QA-LAB`:

```powershell
node .\01-runtime\tools\browser-use-mcp-check.js
cmd /c "01-runtime\tools\falid-local.cmd mcp list"
```

You can also copy `02-brain\.opencode\config\browser-use.local.env.example` to `02-brain\.opencode\config\browser-use.local.env` and fill the LiteLLM master key locally. Copy `litellm-opencode-go.local.env.example` to `litellm-opencode-go.local.env` and put the OpenCode Go key there as `OPENCODE_GO_API_KEY`. Do not commit either local file.

Open FALID AI WORKSPACE through the branded local wrapper, then run these prompts in order:

```text
buka aplikasi pgn
buka transaction mapping dan ringkas state halaman
buka create transaction mapping lalu coba pilih Category
```

## Expected Outcomes

- `browser_use` is used before Playwright/CDP for app open, navigation, page state, clicks, typing, and content extraction.
- `playwright_cdp` is used only when Browser Use fails, hard screenshot/snapshot evidence is required, CDP recovery is needed, or low-level DOM/console evidence is needed.
- `node .\01-runtime\tools\browser-use-mcp-check.js` returns `READY_CONFIGURED` when config, `uvx`, and a provider key are all present.

## Failure Interpretation

- `READY_NO_PROVIDER_KEY`: config and `uvx` are present, but `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is missing from the runtime environment.
- `NEEDS_SETUP`: config schema, command, enabled state, `uvx`, or secret placement needs correction.
- Browser Use MCP start failure: check `uvx`, LiteLLM proxy health, provider key placement, package resolution, and local network restrictions.
- OpenCode Go auth failure through LiteLLM: check `OPENCODE_GO_API_KEY` in `litellm-opencode-go.local.env`, not `browser-use.local.env`.
- LiteLLM auto-start can be disabled for a single terminal with `set AI_QA_AUTOSTART_LITELLM=false`.
- App/VPN/session issue: validate VPN and auth state, then use CDP health/recovery only as fallback support.
- Browser Use automation caveat: treat timing, tool-action drift, selector ambiguity, and hidden UI controls as automation caveats until product failure is proven with stronger evidence.
