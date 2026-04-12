const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const { spawn } = require("child_process");
const { URL } = require("url");

const {
  paths,
  ensureDir,
  readJsonIfExists,
  writeJson,
  writeText,
} = require("./workspace-paths");
const { readSavedAuthState, restoreAuthState } = require("./auth-session-utils");

const { chromium } = require(path.join(
  paths.runtimeDir,
  "node_modules",
  "playwright"
));

function getJson(targetUrl, options = {}) {
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 5000;

  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl);
    const client = url.protocol === "https:" ? https : http;

    const request = client.get(url, (response) => {
      let body = "";

      response.on("data", (chunk) => {
        body += chunk;
      });

      response.on("end", () => {
        if (response.statusCode && response.statusCode >= 400) {
          reject(
            new Error(
              `Request to ${targetUrl} failed with status ${response.statusCode}`
            )
          );
          return;
        }

        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(
            new Error(`Invalid JSON response from ${targetUrl}: ${error.message}`)
          );
        }
      });
    });

    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error(`Request to ${targetUrl} timed out after ${timeoutMs}ms`));
    });

    request.on("error", reject);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function summarizeError(error) {
  if (!error) {
    return "unknown error";
  }
  return error.message || String(error);
}

function getDefaultCdpVersionUrl() {
  return process.env.CDP_VERSION_URL || "http://127.0.0.1:9222/json/version";
}

function getDefaultAppUrl() {
  return process.env.APP_URL || "https://dev-energy.pgn.co.id";
}

function getExplicitCdpUrl() {
  const value = String(process.env.CDP_URL || "").trim();
  return value || null;
}

function getDefaultProfileDir() {
  return process.env.PROFILE_DIR || paths.chromeProfileDir;
}

function buildDirectCdpStatus(cdpUrl) {
  return {
    status: "ready",
    source: "cdp_url_env",
    versionUrl: null,
    version: {
      Browser: "unknown",
      "Protocol-Version": "unknown",
      "User-Agent": "unknown",
      webSocketDebuggerUrl: cdpUrl,
    },
    recovered: false,
    recovery_attempted: false,
    recovery: null,
    initial_error: null,
  };
}

function parseVersionUrl(targetUrl) {
  try {
    return new URL(targetUrl);
  } catch (error) {
    return null;
  }
}

function isLocalVersionUrl(targetUrl) {
  const parsed = parseVersionUrl(targetUrl);
  if (!parsed) {
    return false;
  }

  return ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname);
}

function inferCdpPort(versionUrl, fallbackPort) {
  if (fallbackPort) {
    return String(fallbackPort);
  }

  const parsed = parseVersionUrl(versionUrl);
  if (parsed && parsed.port) {
    return parsed.port;
  }

  return "9222";
}

function getStartBrowserScriptPath() {
  return path.join(paths.runtimeToolsDir, "start-browser.bat");
}

function getBrowserCandidates(explicitPath) {
  const candidates = [];
  const envCandidates = [
    explicitPath,
    process.env.BROWSER_BIN,
  ];

  for (const candidate of envCandidates) {
    if (candidate) {
      candidates.push(candidate);
    }
  }

  const programFiles = [process.env.ProgramFiles, process.env["ProgramFiles(x86)"]].filter(Boolean);

  for (const root of programFiles) {
    candidates.push(path.join(root, "Google", "Chrome", "Application", "chrome.exe"));
    candidates.push(path.join(root, "Microsoft", "Edge", "Application", "msedge.exe"));
  }

  return candidates;
}

function findBrowserExecutable(explicitPath) {
  for (const candidate of getBrowserCandidates(explicitPath)) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function shouldAutoRecoverCdp(versionUrl) {
  if (getExplicitCdpUrl()) {
    return false;
  }

  const explicit = String(process.env.CDP_AUTO_RECOVER || "").toLowerCase().trim();
  if (["0", "false", "no", "off"].includes(explicit)) {
    return false;
  }

  const disabled = String(process.env.DISABLE_CDP_AUTO_RECOVER || "").toLowerCase().trim();
  if (["1", "true", "yes", "on"].includes(disabled)) {
    return false;
  }

  return isLocalVersionUrl(versionUrl);
}

function isCdpConnectivityError(error) {
  const message = summarizeError(error).toLowerCase();
  return [
    "econnrefused",
    "econnreset",
    "connect refused",
    "unable to connect",
    "timed out",
    "socket hang up",
    "fetch failed",
    "network",
  ].some((part) => message.includes(part));
}

function launchCdpBrowser(options = {}) {
  const startBrowserPath = options.startBrowserScriptPath || getStartBrowserScriptPath();
  const browserPath = findBrowserExecutable(options.browserPath);

  if (!browserPath) {
    throw new Error(
      `Browser executable not found. Set BROWSER_BIN or update ${startBrowserPath}.`
    );
  }

  const versionUrl = options.versionUrl || getDefaultCdpVersionUrl();
  const env = { ...process.env };
  env.APP_URL = options.appUrl || env.APP_URL || getDefaultAppUrl();
  env.CDP_PORT = inferCdpPort(versionUrl, options.cdpPort || env.CDP_PORT);
  env.PROFILE_DIR = options.profileDir || env.PROFILE_DIR || getDefaultProfileDir();

  const args = [
    `--remote-debugging-port=${env.CDP_PORT}`,
    `--user-data-dir=${env.PROFILE_DIR}`,
    env.APP_URL,
  ];

  return new Promise((resolve, reject) => {
    let settled = false;
    let child;

    try {
      child = spawn(browserPath, args, {
        cwd: paths.rootDir,
        env,
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      });
    } catch (error) {
      reject(
        new Error(
          `Unable to launch CDP browser automatically: ${summarizeError(error)}. Run ${startBrowserPath} manually.`
        )
      );
      return;
    }

    child.once("error", (error) => {
      if (settled) {
        return;
      }
      settled = true;
      reject(
        new Error(
          `Unable to launch CDP browser automatically: ${summarizeError(error)}. Run ${startBrowserPath} manually.`
        )
      );
    });

    child.once("spawn", () => {
      if (settled) {
        return;
      }
      settled = true;
      child.unref();
      resolve({
        launcher: "direct_spawn",
        browser_path: browserPath,
        script_path: path.relative(paths.rootDir, startBrowserPath).replace(/\\/g, "/"),
        app_url: env.APP_URL,
        cdp_port: env.CDP_PORT,
        profile_dir: env.PROFILE_DIR,
      });
    });
  });
}

async function waitForCdpVersion(options = {}) {
  const versionUrl = options.versionUrl || getDefaultCdpVersionUrl();
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 45000;
  const pollMs = Number.isFinite(options.pollMs) ? options.pollMs : 1500;
  const requestTimeoutMs = Number.isFinite(options.requestTimeoutMs)
    ? options.requestTimeoutMs
    : 5000;
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      return await getJson(versionUrl, { timeoutMs: requestTimeoutMs });
    } catch (error) {
      lastError = error;
      await sleep(pollMs);
    }
  }

  throw new Error(
    `CDP endpoint ${versionUrl} did not become ready within ${timeoutMs}ms. Last error: ${summarizeError(lastError)}`
  );
}

async function ensureCdpReady(options = {}) {
  const explicitCdpUrl = getExplicitCdpUrl();
  if (explicitCdpUrl && !options.forceVersionCheck) {
    return buildDirectCdpStatus(explicitCdpUrl);
  }

  const versionUrl = options.versionUrl || getDefaultCdpVersionUrl();
  const requestTimeoutMs = Number.isFinite(options.requestTimeoutMs)
    ? options.requestTimeoutMs
    : 5000;
  const autoRecover =
    options.autoRecover === undefined
      ? shouldAutoRecoverCdp(versionUrl)
      : Boolean(options.autoRecover) && isLocalVersionUrl(versionUrl);

  try {
    const version = await getJson(versionUrl, { timeoutMs: requestTimeoutMs });
    return {
      status: "ready",
      source: "version_url",
      versionUrl,
      version,
      recovered: false,
      recovery_attempted: false,
      recovery: null,
      initial_error: null,
    };
  } catch (initialError) {
    const initialMessage = summarizeError(initialError);

    if (!autoRecover || !isCdpConnectivityError(initialError)) {
      throw new Error(`CDP endpoint ${versionUrl} is not ready: ${initialMessage}`);
    }

    let recovery = null;
    try {
      recovery = await launchCdpBrowser({
        versionUrl,
        appUrl: options.appUrl,
        cdpPort: options.cdpPort,
        profileDir: options.profileDir,
        browserPath: options.browserPath,
        startBrowserScriptPath: options.startBrowserScriptPath,
      });
    } catch (recoveryError) {
      throw new Error(
        `CDP endpoint ${versionUrl} is not reachable (${initialMessage}) and auto-recover failed: ${summarizeError(recoveryError)}`
      );
    }

    const version = await waitForCdpVersion({
      versionUrl,
      timeoutMs: Number.isFinite(options.recoveryTimeoutMs) ? options.recoveryTimeoutMs : 45000,
      pollMs: Number.isFinite(options.recoveryPollMs) ? options.recoveryPollMs : 1500,
      requestTimeoutMs,
    });

    return {
      status: "ready",
      source: "version_url",
      versionUrl,
      version,
      recovered: true,
      recovery_attempted: true,
      recovery,
      initial_error: initialMessage,
    };
  }
}

async function resolveCdpUrl(options = {}) {
  const cdpStatus = await ensureCdpReady(options);
  if (!cdpStatus.version.webSocketDebuggerUrl) {
    throw new Error(
      `CDP endpoint ${cdpStatus.versionUrl || "from CDP_URL"} does not expose webSocketDebuggerUrl`
    );
  }

  return cdpStatus.version.webSocketDebuggerUrl;
}

async function connectBrowser(options = {}) {
  const cdpStatus = await ensureCdpReady(options);
  if (!cdpStatus.version.webSocketDebuggerUrl) {
    throw new Error(
      `CDP endpoint ${cdpStatus.versionUrl || "from CDP_URL"} does not expose webSocketDebuggerUrl`
    );
  }

  const cdpUrl = cdpStatus.version.webSocketDebuggerUrl;
  const browser = await chromium.connectOverCDP(cdpUrl, {
    ignoreHTTPSErrors: true,
  });
  return { browser, cdpUrl, cdpStatus };
}

async function ensurePageAuthState(page) {
  const currentUrl = page.url() || "";
  if (currentUrl && currentUrl !== "about:blank" && currentUrl !== "data:,") {
    return { restored: false, reason: "page_already_initialized" };
  }

  const authState = readSavedAuthState(paths.authStateFile);
  if (!authState) {
    return { restored: false, reason: "missing_saved_auth_state" };
  }

  try {
    return await restoreAuthState(page, authState, {
      authStatePath: paths.authStateFile,
      settleMs: 800,
      timeoutMs: 60000,
    });
  } catch (error) {
    return {
      restored: false,
      reason: error.message || "restore_failed",
    };
  }
}

async function getOrCreatePage(browser, preferredUrlFragment = "") {
  let context = browser.contexts()[0];

  if (!context) {
    context = await browser.newContext();
  }

  const pages = context.pages();
  let page = null;

  if (preferredUrlFragment) {
    page = pages.find((candidate) =>
      candidate.url().includes(preferredUrlFragment)
    );
    if (!page) {
      page = pages.find((candidate) => candidate.url() === "about:blank");
    }
    if (!page) {
      page = await context.newPage();
    }
    await ensurePageAuthState(page);
    return page;
  }

  if (!page) {
    page = pages[0];
  }

  if (!page) {
    page = await context.newPage();
  }

  await ensurePageAuthState(page);
  return page;
}

function artifactPath(fileName) {
  ensureDir(paths.adhocNotesDir);
  return path.join(paths.adhocNotesDir, fileName);
}

module.exports = {
  paths,
  ensureDir,
  readJsonIfExists,
  writeJson,
  writeText,
  getJson,
  getDefaultCdpVersionUrl,
  ensureCdpReady,
  launchCdpBrowser,
  resolveCdpUrl,
  connectBrowser,
  ensurePageAuthState,
  getOrCreatePage,
  artifactPath,
};
