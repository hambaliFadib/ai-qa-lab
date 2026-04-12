const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..", "..");

const paths = {
  rootDir,
  runtimeRootDir: path.join(rootDir, "01-runtime"),
  runtimeDir: path.join(rootDir, "01-runtime", "runtime"),
  runtimeToolsDir: path.join(rootDir, "01-runtime", "tools"),
  artifactsDir: path.join(rootDir, "01-runtime", "artifacts"),
  adhocNotesDir: path.join(rootDir, "01-runtime", "artifacts", "adhoc-notes"),
  consoleLogsDir: path.join(rootDir, "01-runtime", "artifacts", "console-logs"),
  networkArtifactsDir: path.join(rootDir, "01-runtime", "artifacts", "network"),
  ledgerDir: path.join(rootDir, "02-brain", "learning-ledger"),
  ledgerBlocksDir: path.join(rootDir, "02-brain", "learning-ledger", "blocks"),
  ledgerIndexDir: path.join(rootDir, "02-brain", "learning-ledger", "index"),
  ledgerManifestDir: path.join(rootDir, "02-brain", "learning-ledger", "manifests"),
  ledgerSnapshotsDir: path.join(rootDir, "02-brain", "learning-ledger", "snapshots"),
  brainDir: path.join(rootDir, "02-brain"),
  opencodeDir: path.join(rootDir, "02-brain", ".opencode"),
  memoryDir: path.join(rootDir, "02-brain", ".opencode", "memory"),
  promptsDir: path.join(rootDir, "02-brain", ".opencode", "prompts"),
  skillsDir: path.join(rootDir, "02-brain", ".opencode", "skills"),
  apiDiscoveryDir: path.join(rootDir, "02-brain", ".opencode", "api-discovery"),
  distilledDir: path.join(rootDir, "02-brain", "distilled-output"),
  distilledGlobalDir: path.join(rootDir, "02-brain", "distilled-output", "global"),
  distilledModulesDir: path.join(rootDir, "02-brain", "distilled-output", "per-module"),
  authDir: path.join(rootDir, "03-auth"),
  authStateFile: path.join(rootDir, "03-auth", "state", "dev-energy-auth.json"),
  chromeProfileDir: path.join(rootDir, "03-auth", "chrome-profile"),
  userDataDir: path.join(rootDir, "03-auth", "user-data"),
  knowledgeRawDir: path.join(rootDir, "04-knowledge-raw"),
  observabilityDir: path.join(rootDir, "05-observability"),
  testingDir: path.join(rootDir, "06-testing"),
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

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeText(filePath, text) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, text, "utf8");
}

module.exports = {
  paths,
  ensureDir,
  readJsonIfExists,
  writeJson,
  writeText,
};
