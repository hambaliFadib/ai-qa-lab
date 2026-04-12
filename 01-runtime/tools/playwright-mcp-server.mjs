import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const require = createRequire(import.meta.url);
const {
  paths,
  ensureDir,
  connectBrowser,
  getOrCreatePage,
} = require("./cdp-utils.js");
const { capturePageEvidence } = require("./table-evidence.js");

let cachedBrowser = null;
let cachedCdpUrl = null;

function clean(value, max = 240) {
  if (value === undefined || value === null) {
    return "";
  }

  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
}

function slugify(value) {
  return String(value || "artifact")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "artifact";
}

function trimOutput(text, maxLines = 60, maxChars = 12000) {
  const normalized = String(text || "").trim();
  if (!normalized) {
    return "";
  }

  const lines = normalized.split(/\r?\n/);
  const trimmedLines = lines.slice(-maxLines).join("\n");
  return trimmedLines.length <= maxChars
    ? trimmedLines
    : trimmedLines.slice(trimmedLines.length - maxChars);
}

function toolText(title, payload) {
  return {
    content: [
      {
        type: "text",
        text: `${title}\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
  };
}

async function getBrowserSession() {
  if (cachedBrowser) {
    try {
      await cachedBrowser.version();
      return { browser: cachedBrowser, cdpUrl: cachedCdpUrl };
    } catch (error) {
      cachedBrowser = null;
      cachedCdpUrl = null;
    }
  }

  const { browser, cdpUrl } = await connectBrowser();
  cachedBrowser = browser;
  cachedCdpUrl = cdpUrl;
  browser.on("disconnected", () => {
    cachedBrowser = null;
    cachedCdpUrl = null;
  });
  return { browser, cdpUrl };
}

async function resolvePage(pageHint = "") {
  const { browser, cdpUrl } = await getBrowserSession();
  const page = await getOrCreatePage(browser, pageHint);
  return { browser, page, cdpUrl };
}

async function safeTitle(page) {
  try {
    return clean(await page.title(), 180);
  } catch (error) {
    return "";
  }
}

async function listOpenPages() {
  const { browser, cdpUrl } = await getBrowserSession();
  const pages = [];

  for (const [contextIndex, context] of browser.contexts().entries()) {
    for (const [pageIndex, page] of context.pages().entries()) {
      pages.push({
        context_index: contextIndex,
        page_index: pageIndex,
        url: page.url(),
        title: await safeTitle(page),
      });
    }
  }

  return { cdp_url: cdpUrl, pages };
}

function buildSnapshotSummary(evidence = {}) {
  return {
    url: evidence.url,
    title: evidence.title,
    headings: evidence.headings,
    errors: evidence.errors,
    form_fields: evidence.formFields,
    buttons: evidence.buttons,
    tables: evidence.summary?.tables || [],
    primary_table_headers: evidence.headers,
    primary_table_row_count: evidence.rowCount,
    primary_table_rows: evidence.rows,
    visible_dropdowns: evidence.visibleDropdowns,
    visible_option_lists: evidence.visibleOptionLists,
    visible_overlays: evidence.visibleOverlays,
  };
}

async function summarizePage(page, options = {}) {
  const evidence = await capturePageEvidence(page, {
    includeFormFields: options.includeFormFields !== false,
    includeButtons: options.includeButtons !== false,
    maxRowsPerTable: Number.isFinite(options.maxRowsPerTable) ? options.maxRowsPerTable : 5,
    maxTables: Number.isFinite(options.maxTables) ? options.maxTables : 3,
    maxDropdowns: Number.isFinite(options.maxDropdowns) ? options.maxDropdowns : 3,
    maxOptionLists: Number.isFinite(options.maxOptionLists) ? options.maxOptionLists : 5,
  });

  return buildSnapshotSummary(evidence);
}

function buildScreenshotPath(label) {
  ensureDir(paths.screenshotsDir);
  return path.join(
    paths.screenshotsDir,
    `playwright-mcp-${Date.now()}-${slugify(label || "snapshot")}.png`
  );
}

function resolveRegressionScript(mode) {
  const runnerPath = path.join(paths.runtimeModulesDir, "run-active-module-regression.js");
  const dryRun = spawnSync(process.execPath, [runnerPath, "--mode", mode, "--dry-run"], {
    cwd: paths.runtimeDir,
    env: process.env,
    encoding: "utf8",
    timeout: 120000,
  });

  if (dryRun.status !== 0) {
    throw new Error((dryRun.stderr || dryRun.stdout || "Failed to resolve regression script").trim());
  }

  return JSON.parse(dryRun.stdout.trim());
}

function runRegressionScript(mode) {
  const resolution = resolveRegressionScript(mode);
  const execution = spawnSync(process.execPath, [resolution.script_path], {
    cwd: paths.runtimeDir,
    env: process.env,
    encoding: "utf8",
    timeout: 900000,
    maxBuffer: 1024 * 1024 * 20,
  });

  return {
    resolution,
    exit_code: execution.status,
    stdout: trimOutput(execution.stdout),
    stderr: trimOutput(execution.stderr),
  };
}

export function createPlaywrightMcpServer() {
  const server = new McpServer({
    name: "playwright_cdp",
    version: "1.0.0",
  });

  server.tool(
    "server_status",
    "Show the Playwright CDP MCP status and the pages currently visible to the attached browser.",
    {},
    async () => {
      try {
        const status = await listOpenPages();
        return toolText("Playwright CDP MCP Status", {
          mode: "cdp-attach",
          runtime_playwright: "01-runtime/runtime/node_modules/playwright",
          screenshots_dir: path.relative(paths.rootDir, paths.screenshotsDir).replace(/\\/g, "/"),
          ...status,
        });
      } catch (error) {
        return toolText("Playwright CDP MCP Status", {
          mode: "cdp-attach",
          connection: "disconnected",
          error: error.message,
        });
      }
    }
  );

  server.tool(
    "list_pages",
    "List pages that are open in the attached CDP browser session.",
    {},
    async () => toolText("Playwright CDP Pages", await listOpenPages())
  );

  server.tool(
    "snapshot_page",
    "Capture a structured snapshot of a page including headings, visible validation errors, buttons, and form fields.",
    {
      page_hint: z.string().optional(),
      include_form_fields: z.boolean().optional(),
      include_buttons: z.boolean().optional(),
    },
    async ({ page_hint, include_form_fields, include_buttons }) => {
      const { page, cdpUrl } = await resolvePage(page_hint || "");
      const summary = await summarizePage(page, {
        includeFormFields: include_form_fields,
        includeButtons: include_buttons,
      });

      return toolText("Playwright CDP Snapshot", {
        cdp_url: cdpUrl,
        page_hint: page_hint || "",
        summary,
      });
    }
  );

  server.tool(
    "navigate_page",
    "Navigate the selected page to a URL and wait for it to load.",
    {
      url: z.string().min(1),
      page_hint: z.string().optional(),
      wait_until: z.enum(["load", "domcontentloaded", "networkidle"]).optional(),
      timeout_ms: z.number().int().min(1000).max(120000).optional(),
    },
    async ({ url, page_hint, wait_until, timeout_ms }) => {
      const { page, cdpUrl } = await resolvePage(page_hint || "");
      await page.goto(url, {
        waitUntil: wait_until || "domcontentloaded",
        timeout: timeout_ms || 30000,
      });

      return toolText("Playwright CDP Navigate", {
        cdp_url: cdpUrl,
        url: page.url(),
        summary: await summarizePage(page, {}),
      });
    }
  );

  server.tool(
    "click_element",
    "Wait for an element to become visible, then click it and return a fresh snapshot.",
    {
      selector: z.string().min(1),
      page_hint: z.string().optional(),
      timeout_ms: z.number().int().min(1000).max(120000).optional(),
    },
    async ({ selector, page_hint, timeout_ms }) => {
      const { page, cdpUrl } = await resolvePage(page_hint || "");
      const locator = page.locator(selector).first();
      await locator.waitFor({ state: "visible", timeout: timeout_ms || 20000 });
      await locator.click({ timeout: timeout_ms || 20000 });

      return toolText("Playwright CDP Click", {
        cdp_url: cdpUrl,
        selector,
        url: page.url(),
        summary: await summarizePage(page, {}),
      });
    }
  );

  server.tool(
    "fill_element",
    "Wait for an input-like element, fill it, and return a fresh page snapshot.",
    {
      selector: z.string().min(1),
      value: z.string(),
      page_hint: z.string().optional(),
      clear_first: z.boolean().optional(),
      timeout_ms: z.number().int().min(1000).max(120000).optional(),
    },
    async ({ selector, value, page_hint, clear_first, timeout_ms }) => {
      const { page, cdpUrl } = await resolvePage(page_hint || "");
      const locator = page.locator(selector).first();
      await locator.waitFor({ state: "visible", timeout: timeout_ms || 20000 });
      if (clear_first) {
        await locator.fill("", { timeout: timeout_ms || 20000 });
      }
      await locator.fill(value, { timeout: timeout_ms || 20000 });

      return toolText("Playwright CDP Fill", {
        cdp_url: cdpUrl,
        selector,
        value_preview: clean(value, 80),
        url: page.url(),
        summary: await summarizePage(page, {}),
      });
    }
  );

  server.tool(
    "press_key",
    "Press a keyboard key on the page or after focusing a specific selector.",
    {
      key: z.string().min(1),
      selector: z.string().optional(),
      page_hint: z.string().optional(),
      timeout_ms: z.number().int().min(1000).max(120000).optional(),
    },
    async ({ key, selector, page_hint, timeout_ms }) => {
      const { page, cdpUrl } = await resolvePage(page_hint || "");
      if (selector) {
        const locator = page.locator(selector).first();
        await locator.waitFor({ state: "visible", timeout: timeout_ms || 20000 });
        await locator.focus();
      }
      await page.keyboard.press(key);

      return toolText("Playwright CDP Press", {
        cdp_url: cdpUrl,
        key,
        selector: selector || "",
        url: page.url(),
        summary: await summarizePage(page, {}),
      });
    }
  );

  server.tool(
    "wait_for_selector",
    "Wait for a selector state and return the current page snapshot.",
    {
      selector: z.string().min(1),
      state: z.enum(["attached", "detached", "visible", "hidden"]).optional(),
      page_hint: z.string().optional(),
      timeout_ms: z.number().int().min(1000).max(120000).optional(),
    },
    async ({ selector, state, page_hint, timeout_ms }) => {
      const { page, cdpUrl } = await resolvePage(page_hint || "");
      await page.waitForSelector(selector, {
        state: state || "visible",
        timeout: timeout_ms || 20000,
      });

      return toolText("Playwright CDP Wait", {
        cdp_url: cdpUrl,
        selector,
        state: state || "visible",
        url: page.url(),
        summary: await summarizePage(page, {}),
      });
    }
  );

  server.tool(
    "capture_screenshot",
    "Capture a screenshot of the selected page and return the saved artifact path.",
    {
      label: z.string().optional(),
      page_hint: z.string().optional(),
      full_page: z.boolean().optional(),
    },
    async ({ label, page_hint, full_page }) => {
      const { page, cdpUrl } = await resolvePage(page_hint || "");
      const filePath = buildScreenshotPath(label || page_hint || "page");
      await page.screenshot({
        path: filePath,
        fullPage: full_page !== false,
      });

      return toolText("Playwright CDP Screenshot", {
        cdp_url: cdpUrl,
        url: page.url(),
        screenshot: path.relative(paths.rootDir, filePath).replace(/\\/g, "/"),
      });
    }
  );

  server.tool(
    "run_active_module_regression",
    "Resolve and run the active-module regression suite for happy, negative, edge, or full mode.",
    {
      mode: z.enum(["happy", "negative", "edge", "full"]),
      dry_run: z.boolean().optional(),
    },
    async ({ mode, dry_run }) => {
      if (dry_run) {
        return toolText("Playwright CDP Regression Dry Run", resolveRegressionScript(mode));
      }

      return toolText("Playwright CDP Regression Run", runRegressionScript(mode));
    }
  );

  return server;
}

export async function startPlaywrightMcpServer() {
  const server = createPlaywrightMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startPlaywrightMcpServer().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}

