const fs = require("fs");
const net = require("net");
const path = require("path");
const { spawnSync } = require("child_process");
const { paths, readJsonIfExists } = require("./workspace-paths");

function checkPortOpen(port, host = "127.0.0.1", timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (result) => {
      if (settled) {
        return;
      }

      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, host);
  });
}

function runBrowserUseCheck() {
  const result = spawnSync(process.execPath, [path.join(paths.runtimeToolsDir, "browser-use-mcp-check.js")], {
    cwd: paths.rootDir,
    encoding: "utf8",
  });

  if (result.status !== 0 && !result.stdout) {
    return false;
  }

  try {
    const parsed = JSON.parse(result.stdout || "{}");
    return parsed.status === "READY_CONFIGURED";
  } catch (error) {
    return false;
  }
}

function findOnPath(command) {
  const entries = (process.env.PATH || process.env.Path || "")
    .split(path.delimiter)
    .filter(Boolean);
  const extensions = process.platform === "win32"
    ? (process.env.PATHEXT || ".COM;.EXE;.BAT;.CMD").split(";").filter(Boolean)
    : [""];
  const names = path.extname(command)
    ? [command]
    : Array.from(
        new Set([
          command,
          ...extensions.map((extension) => `${command}${extension.toLowerCase()}`),
          ...extensions.map((extension) => `${command}${extension.toUpperCase()}`),
        ])
      );

  for (const entry of entries) {
    for (const name of names) {
      const candidate = path.join(entry, name);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function runOpenCodeCheck() {
  const wrapperPath = path.join(paths.runtimeToolsDir, "opencode-local.cmd");
  if (!fs.existsSync(wrapperPath)) {
    return false;
  }

  const fallbackCandidates = [
    findOnPath("opencode.cmd"),
    process.env.APPDATA ? path.join(process.env.APPDATA, "npm", "opencode.cmd") : null,
    process.env.USERPROFILE
      ? path.join(process.env.USERPROFILE, "AppData", "Roaming", "npm", "opencode.cmd")
      : null,
  ].filter(Boolean);

  return fallbackCandidates.some((candidate) => fs.existsSync(candidate));
}

function readOracleStatus() {
  const config = readJsonIfExists(path.join(paths.rootDir, "opencode.json"), {});
  const readonly = config.mcp?.oracle_readonly;
  const testdata = config.mcp?.oracle_testdata;

  if (readonly?.enabled && testdata?.enabled) {
    return "OK";
  }

  if (readonly || testdata) {
    return "CONFIGURED";
  }

  return "MISSING";
}

async function runFalidDoctor() {
  const litellm = (await checkPortOpen(4000)) ? "OK" : "FAIL";
  const browserUse = runBrowserUseCheck() ? "OK" : "FAIL";
  const opencode = runOpenCodeCheck() ? "OK" : "FAIL";
  const oracle = readOracleStatus();

  return {
    litellm,
    browser_use: browserUse,
    opencode,
    oracle,
  };
}

async function main() {
  const report = await runFalidDoctor();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  runFalidDoctor,
};
