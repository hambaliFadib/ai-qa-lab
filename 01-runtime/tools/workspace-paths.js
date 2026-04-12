const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..", "..");

const paths = {
  rootDir,
  workspaceRootDir: rootDir,
  workspaceHostDir: path.dirname(rootDir),
  workspaceParentDir: rootDir,
  runtimeRootDir: path.join(rootDir, "01-runtime"),
  runtimeDir: path.join(rootDir, "01-runtime", "runtime"),
  runtimeDocsDir: path.join(rootDir, "01-runtime", "runtime", "docs"),
  runtimeAccessDir: path.join(rootDir, "01-runtime", "runtime", "access"),
  runtimeAccessProbesDir: path.join(rootDir, "01-runtime", "runtime", "access", "probes"),
  runtimeCaptureDir: path.join(rootDir, "01-runtime", "runtime", "capture"),
  runtimeModulesDir: path.join(rootDir, "01-runtime", "runtime", "modules"),
  runtimeTransactionMappingDir: path.join(rootDir, "01-runtime", "runtime", "modules", "transaction-mapping"),
  runtimeTransactionMappingProbesDir: path.join(
    rootDir,
    "01-runtime",
    "runtime",
    "modules",
    "transaction-mapping",
    "probes"
  ),
  runtimeSessionDir: path.join(rootDir, "01-runtime", "runtime", "session"),
  runtimeSessionShellDir: path.join(rootDir, "01-runtime", "runtime", "session", "shell"),
  runtimeShellDir: path.join(rootDir, "01-runtime", "runtime", "shell"),
  runtimeToolsDir: path.join(rootDir, "01-runtime", "tools"),
  artifactsDir: path.join(rootDir, "01-runtime", "artifacts"),
  adhocNotesDir: path.join(rootDir, "01-runtime", "artifacts", "adhoc-notes"),
  consoleLogsDir: path.join(rootDir, "01-runtime", "artifacts", "console-logs"),
  networkArtifactsDir: path.join(rootDir, "01-runtime", "artifacts", "network"),
  screenshotsDir: path.join(rootDir, "01-runtime", "artifacts", "screenshots"),
  tracesDir: path.join(rootDir, "01-runtime", "artifacts", "traces"),
  videosDir: path.join(rootDir, "01-runtime", "artifacts", "videos"),
  manualFlowRecordsDir: path.join(rootDir, "01-runtime", "artifacts", "manual-flow-records"),
  opencodeRuntimeTempDir: path.join(rootDir, "01-runtime", "temp", "opencode-xdg"),
  opencodeXdgConfigHome: path.join(rootDir, "01-runtime", "temp", "opencode-xdg", "config"),
  opencodeXdgDataHome: path.join(rootDir, "01-runtime", "temp", "opencode-xdg", "data"),
  opencodeXdgStateHome: path.join(rootDir, "01-runtime", "temp", "opencode-xdg", "state"),
  opencodeXdgCacheHome: path.join(rootDir, "01-runtime", "temp", "opencode-xdg", "cache"),
  workspaceExternalOpencodeConfigDir: path.join(rootDir, "opencode-config-temp"),
  ledgerDir: path.join(rootDir, "02-brain", "learning-ledger"),
  ledgerBlocksDir: path.join(rootDir, "02-brain", "learning-ledger", "blocks"),
  ledgerIndexDir: path.join(rootDir, "02-brain", "learning-ledger", "index"),
  ledgerManifestDir: path.join(rootDir, "02-brain", "learning-ledger", "manifests"),
  ledgerSnapshotsDir: path.join(rootDir, "02-brain", "learning-ledger", "snapshots"),
  brainDir: path.join(rootDir, "02-brain"),
  opencodeDir: path.join(rootDir, "02-brain", ".opencode"),
  memoryDir: path.join(rootDir, "02-brain", ".opencode", "memory"),
  recallIndexPath: path.join(rootDir, "02-brain", ".opencode", "memory", "RECALL_INDEX.md"),
  userWorkingPreferencesPath: path.join(rootDir, "02-brain", ".opencode", "memory", "USER_WORKING_PREFERENCES.md"),
  promptsDir: path.join(rootDir, "02-brain", ".opencode", "prompts"),
  skillsDir: path.join(rootDir, "02-brain", ".opencode", "skills"),
  apiDiscoveryDir: path.join(rootDir, "02-brain", ".opencode", "api-discovery"),
  distilledDir: path.join(rootDir, "02-brain", "distilled-output"),
  distilledGlobalDir: path.join(rootDir, "02-brain", "distilled-output", "global"),
  distilledModulesDir: path.join(rootDir, "02-brain", "distilled-output", "per-module"),
  rawKnowledgeCatalogPath: path.join(rootDir, "02-brain", "distilled-output", "global", "raw-knowledge-catalog.md"),
  rawKnowledgeCatalogJsonPath: path.join(rootDir, "02-brain", "distilled-output", "global", "raw-knowledge-catalog.json"),
  archiveDir: path.join(rootDir, "99-archive"),
  assistantTempArchiveDir: path.join(rootDir, "99-archive", "assistant-temp"),
  authDir: path.join(rootDir, "03-auth"),
  authStateFile: path.join(rootDir, "03-auth", "state", "dev-energy-auth.json"),
  authNotesDir: path.join(rootDir, "03-auth", "notes"),
  authScreenshotsDir: path.join(rootDir, "03-auth", "screenshots"),
  chromeProfileDir: path.join(rootDir, "03-auth", "chrome-profile"),
  userDataDir: path.join(rootDir, "03-auth", "user-data"),
  knowledgeRawDir: path.join(rootDir, "04-knowledge-raw"),
  observabilityDir: path.join(rootDir, "05-observability"),
  opencodeStorageObservabilityDir: path.join(rootDir, "05-observability", "opencode-storage"),
  dbInjectionDir: path.join(rootDir, "05-observability", "db-injection"),
  dbInjectionResultsDir: path.join(rootDir, "05-observability", "db-injection", "execution-results"),
  telegramReportingDir: path.join(rootDir, "05-observability", "telegram-reporting"),
  telegramReportingOutboxDir: path.join(rootDir, "05-observability", "telegram-reporting", "outbox"),
  testingDir: path.join(rootDir, "06-testing"),
  bugReportsDir: path.join(rootDir, "06-testing", "bug-reports"),
  telegramBugReportsDir: path.join(rootDir, "06-testing", "bug-reports", "telegram"),
  testDataDir: path.join(rootDir, "06-testing", "test-data"),
  dbInjectionPlansDir: path.join(rootDir, "06-testing", "test-data", "db-injection", "plans"),
  testingSmokeDir: path.join(rootDir, "06-testing", "smoke"),
  testingExploratoryDir: path.join(rootDir, "06-testing", "exploratory"),
  testingAdhocDir: path.join(rootDir, "06-testing", "adhoc"),
  testingUatDraftDir: path.join(rootDir, "06-testing", "uat-draft"),
};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

function readJsonIfExists(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function writeFileViaTempCopy(filePath, contents, encoding = "utf8") {
  const tempFilePath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`
  );

  try {
    fs.writeFileSync(tempFilePath, contents, encoding);
    fs.copyFileSync(tempFilePath, filePath);
  } finally {
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        // Best effort cleanup only.
      }
    }
  }
}

function writeFileWithPowerShell(filePath, contents, encoding = "utf8") {
  const bytes = Buffer.from(String(contents), encoding);
  const encodedBytes = bytes.toString("base64");
  const escapedPath = String(filePath).replace(/'/g, "''");
  const command = [
    `$path = '${escapedPath}'`,
    `$bytes = [Convert]::FromBase64String('${encodedBytes}')`,
    `[System.IO.File]::WriteAllBytes($path, $bytes)`,
  ].join("; ");

  const result = spawnSync("C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe", ["-NoProfile", "-Command", command], {
    stdio: "pipe",
    encoding: "utf8",
  });

  if (result.status !== 0) {
    const detail = (result.error?.message || result.stderr || result.stdout || "PowerShell fallback failed").trim();
    throw new Error(detail);
  }
}

function writeFileWithRetry(filePath, contents, encoding = "utf8") {
  ensureDir(path.dirname(filePath));

  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      fs.writeFileSync(filePath, contents, encoding);
      return;
    } catch (error) {
      lastError = error;
      const isRetryable = error && (error.code === "EPERM" || error.code === "EBUSY");
      if (!isRetryable) {
        throw error;
      }
      sleepSync(150 * (attempt + 1));
    }
  }

  if (lastError && (lastError.code === "EPERM" || lastError.code === "EBUSY")) {
    try {
      writeFileViaTempCopy(filePath, contents, encoding);
      return;
    } catch (tempCopyError) {
      lastError = tempCopyError;
    }
  }

  if (
    process.platform === "win32" &&
    lastError &&
    (lastError.code === "EPERM" || lastError.code === "EBUSY")
  ) {
    writeFileWithPowerShell(filePath, contents, encoding);
    return;
  }

  throw lastError;
}

function writeJson(filePath, data) {
  writeFileWithRetry(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeText(filePath, text) {
  writeFileWithRetry(filePath, text, "utf8");
}

module.exports = {
  paths,
  ensureDir,
  readJsonIfExists,
  writeJson,
  writeText,
};
