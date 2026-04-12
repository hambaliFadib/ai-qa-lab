const path = require("path");
const { paths } = require("./workspace-paths");

const commands = {
  open: {
    script: path.join(paths.runtimeAccessDir, "open-pgn.js"),
    cwd: paths.runtimeDir,
    description: "Open PGN app through CDP browser after auto-validating CDP",
  },
  access: {
    script: path.join(paths.runtimeAccessDir, "cdp-connect.js"),
    cwd: paths.runtimeDir,
    description: "Validate app shell and session health after CDP auto-check",
  },
  "check-auth": {
    script: path.join(paths.runtimeToolsDir, "check-auth-session.js"),
    cwd: paths.rootDir,
    description: "Check whether the attached browser is authenticated, needs manual login, or is waiting for OTP",
  },
  "capture-session": {
    script: path.join(paths.runtimeToolsDir, "capture-session.js"),
    cwd: paths.rootDir,
    description: "Capture the current authenticated browser session into 03-auth/state/dev-energy-auth.json",
  },
  "restore-session": {
    script: path.join(paths.runtimeToolsDir, "restore-session.js"),
    cwd: paths.rootDir,
    description: "Restore the saved auth state into the attached browser session",
  },
  "create-transaction-mapping": {
    script: path.join(paths.runtimeTransactionMappingDir, "happy-path.js"),
    cwd: paths.runtimeDir,
    description: "Run the current transaction mapping positive suite",
  },
  regression: {
    script: path.join(paths.runtimeModulesDir, "run-active-module-regression.js"),
    cwd: paths.runtimeDir,
    description: "Run the active-module regression runner with mode arguments",
  },
  "record-manual": {
    script: path.join(paths.runtimeCaptureDir, "manual-flow-recorder.js"),
    cwd: paths.runtimeDir,
    description: "Record a manual UI flow against the attached browser session",
  },
  "check-cdp": {
    script: path.join(paths.runtimeToolsDir, "check-cdp.js"),
    cwd: paths.rootDir,
    description: "Validate CDP endpoint and auto-recover browser when 9222 is down",
  },
  "ensure-cdp": {
    script: path.join(paths.runtimeToolsDir, "check-cdp.js"),
    cwd: paths.rootDir,
    description: "Alias for check-cdp before Playwright or runtime access",
  },
  "oracle-validate": {
    script: path.join(paths.runtimeToolsDir, "oracle-readonly-validator.js"),
    cwd: paths.rootDir,
    description: "Run Oracle read-only validation against a safe query or query template",
  },
};

function printUsage() {
  const lines = [
    "Usage: node ..\\tools\\run-pgn.js <command> [args]",
    "",
    "Available commands:",
  ];

  for (const [name, config] of Object.entries(commands)) {
    lines.push(`  ${name.padEnd(26, " ")} ${config.description}`);
  }

  lines.push("", "Examples:");
  lines.push("  node ..\\tools\\run-pgn.js check-cdp");
  lines.push("  node ..\\tools\\run-pgn.js check-auth");
  lines.push("  node ..\\tools\\run-pgn.js capture-session");
  lines.push("  node ..\\tools\\run-pgn.js open");
  lines.push("  node ..\\tools\\run-pgn.js regression --mode full --dry-run");
  lines.push("  node ..\\tools\\run-pgn.js oracle-validate --sql \"select 1 as ok from dual\" --label smoke");
  lines.push("  node ..\\tools\\run-pgn.js oracle-validate --query-file shared\\01-find-tables-by-keyword.sql --bind KEYWORD=TRANSACTION --bind OWNER_FILTER=PGNBILL --label table-discovery");

  process.stdout.write(`${lines.join("\n")}\n`);
}

function runInProcess(target, extraArgs) {
  const resolvedScript = require.resolve(target.script);

  delete require.cache[resolvedScript];
  process.chdir(target.cwd);
  process.argv = [process.execPath, target.script, ...extraArgs];
  require(resolvedScript);
}

function main() {
  const command = process.argv[2];
  const extraArgs = process.argv.slice(3);

  if (!command || !commands[command]) {
    printUsage();
    process.exitCode = command ? 1 : 0;
    return;
  }

  try {
    runInProcess(commands[command], extraArgs);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

main();