const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const RUNTIME_ROOT = path.resolve(__dirname, "..");
const ACTIVE_MODULE_PATH = path.join(RUNTIME_ROOT, "docs", "ACTIVE_MODULE.md");

const MODE_ALIASES = {
  happy: "happy",
  smoke: "happy",
  positive: "happy",
  negative: "negative",
  edge: "edge",
  full: "full",
  regression: "full",
};

const MODULE_REGISTRY = [
  {
    key: "transaction-mapping",
    displayName: "Transaction Mapping",
    aliases: ["transaction mapping"],
    modes: {
      happy: path.join("transaction-mapping", "happy-path.js"),
      negative: path.join("transaction-mapping", "negative-suite.js"),
      edge: path.join("transaction-mapping", "edge-suite.js"),
      full: path.join("transaction-mapping", "full-suite.js"),
    },
  },
];

function printHelp() {
  process.stdout.write(
    [
      "Active Module Regression Runner",
      "",
      "Usage:",
      "  node modules/run-active-module-regression.js --mode <happy|negative|edge|full> [--dry-run]",
      "",
      "Examples:",
      "  node modules/run-active-module-regression.js --mode happy",
      "  node modules/run-active-module-regression.js --mode negative",
      "  node modules/run-active-module-regression.js --mode edge",
      "  node modules/run-active-module-regression.js --mode full",
      "  node modules/run-active-module-regression.js --mode full --dry-run",
      "",
      "Behavior:",
      "  - reads docs/ACTIVE_MODULE.md as the source of truth",
      "  - resolves the active module to a registered suite script",
      "  - runs the selected suite from runtime/modules/",
    ].join("\n") + "\n"
  );
}

function parseArgs(argv) {
  const args = {
    mode: "full",
    dryRun: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--help" || value === "-h") {
      args.help = true;
      continue;
    }

    if (value === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (value === "--mode") {
      args.mode = argv[index + 1] || "";
      index += 1;
      continue;
    }
  }

  return args;
}

function normalizeModuleName(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function readActiveModule() {
  const markdown = fs.readFileSync(ACTIVE_MODULE_PATH, "utf8");
  const match = markdown.match(/^- Module:\s*(.+)$/m);

  if (!match) {
    throw new Error(`Unable to find '- Module:' in ${ACTIVE_MODULE_PATH}`);
  }

  const moduleName = match[1].trim();
  return {
    moduleName,
    normalizedName: normalizeModuleName(moduleName),
    markdown,
  };
}

function resolveModuleConfig(activeModule) {
  const match = MODULE_REGISTRY.find((candidate) => {
    const aliases = [candidate.displayName, ...(candidate.aliases || [])].map(
      normalizeModuleName
    );
    return aliases.includes(activeModule.normalizedName);
  });

  if (!match) {
    throw new Error(
      `No regression registry entry for active module '${activeModule.moduleName}'`
    );
  }

  return match;
}

function resolveMode(requestedMode) {
  const normalizedMode = String(requestedMode || "")
    .toLowerCase()
    .trim();
  const mode = MODE_ALIASES[normalizedMode];

  if (!mode) {
    throw new Error(
      `Unknown mode '${requestedMode}'. Use happy, negative, edge, or full.`
    );
  }

  return mode;
}

function runResolvedScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: RUNTIME_ROOT,
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Suite terminated by signal ${signal}`));
        return;
      }

      resolve(code ?? 1);
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const activeModule = readActiveModule();
  const moduleConfig = resolveModuleConfig(activeModule);
  const mode = resolveMode(args.mode);
  const scriptName = moduleConfig.modes[mode];

  if (!scriptName) {
    throw new Error(
      `Mode '${mode}' is not configured for '${moduleConfig.displayName}'`
    );
  }

  const scriptPath = path.join(__dirname, scriptName);
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Resolved suite script not found: ${scriptPath}`);
  }

  const resolution = {
    active_module: activeModule.moduleName,
    module_key: moduleConfig.key,
    mode,
    script: scriptName,
    script_path: scriptPath,
    runtime_dir: RUNTIME_ROOT,
    modules_dir: __dirname,
  };

  if (args.dryRun) {
    process.stdout.write(`${JSON.stringify(resolution, null, 2)}\n`);
    process.exit(0);
  }

  process.stdout.write(`${JSON.stringify(resolution, null, 2)}\n`);
  const exitCode = await runResolvedScript(scriptPath);
  process.exit(exitCode);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});