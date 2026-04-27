const path = require("path");
const { paths, ensureDir, writeJson } = require("../../tools/workspace-paths");

function main() {
  ensureDir(paths.adhocNotesDir);

  const targetUrl = process.argv[2] || "https://dev-energy.pgn.co.id";
  const output = {
    generated_at: new Date().toISOString(),
    status: "PREPARED_HANDOFF",
    handoff_type: "browser_use_primary_app_open",
    live_run_performed: false,
    target_url: targetUrl,
    primary_mcp: "browser_use",
    primary_planned_path:
      "Use Browser Use MCP first for opening, navigating, interacting with, and summarizing PGN Billing.",
    preferred_tools: [
      "browser_navigate",
      "browser_get_state",
      "browser_click",
      "browser_type",
      "browser_scroll",
      "browser_extract_content",
      "browser_list_tabs",
      "browser_switch_tab",
    ],
    fallback_mcp: "playwright_cdp",
    fallback_role:
      "Use Playwright/CDP only for fallback execution, deterministic evidence, screenshots, snapshots, session recovery, or low-level DOM/console evidence.",
    fallback_when: [
      "Browser Use cannot reach or operate the page",
      "deterministic screenshot or snapshot evidence is required",
      "CDP session health or browser recovery is required",
      "low-level DOM, console, or selector evidence is required",
    ],
    classification: {
      access_stable:
        "Browser Use reaches PGN Billing and visible app markers such as sidebar, topbar, or profile are present.",
      access_partial:
        "Browser Use opens a browser/page but auth, VPN, slow loading, or partial UI state prevents full module work.",
      access_blocked:
        "Browser Use cannot open PGN Billing or access is blocked by login, OTP, DNS, VPN, or network failure.",
    },
    oracle_policy: {
      readonly: "Use oracle_readonly only for validation.",
      testdata:
        "Use oracle_testdata only for explicit controlled test-data setup when UI/API setup is blocked or required.",
    },
    handoff_note:
      "This script only prepares a handoff artifact. It does not start Browser Use MCP and does not prove the app was opened.",
    next_browser_use_steps: [
      "Use browser_use.browser_navigate to open the target URL.",
      "Use browser_use.browser_get_state to classify access.",
      "Use Browser Use tools for normal interaction.",
      "Fallback to playwright_cdp only for evidence, recovery, screenshots, or Browser Use failure.",
    ],
  };

  const filePath = path.join(paths.adhocNotesDir, "browser-use-open-handoff-latest.json");
  writeJson(filePath, output);
  process.stdout.write(`${JSON.stringify({ output: filePath, ...output }, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
}
