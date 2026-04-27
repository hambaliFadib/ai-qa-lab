const fs = require("fs");
const { spawnSync } = require("child_process");
const path = require("path");
const { paths, readJsonIfExists } = require("./workspace-paths");

const EXPECTED_COMMAND = [
  "cmd",
  "/c",
  ".\\01-runtime\\tools\\browser-use-local.cmd",
];

function findOnPath(command) {
  const pathEntries = (process.env.PATH || process.env.Path || "")
    .split(path.delimiter)
    .filter(Boolean);
  const extensions =
    process.platform === "win32"
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

  for (const entry of pathEntries) {
    for (const name of names) {
      const candidate = path.join(entry, name);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function commandExists(command) {
  if (process.platform === "win32") {
    const where = spawnSync("where.exe", [command], { encoding: "utf8", shell: false });
    if (where.status === 0) {
      return {
        ok: true,
        output: `${where.stdout || ""}${where.stderr || ""}`.trim(),
      };
    }

    const pathMatch = findOnPath(command);
    if (pathMatch) {
      return {
        ok: true,
        output: pathMatch,
      };
    }

    const escapedCommand = command.replace(/'/g, "''");
    const powershell = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        [
          `$cmd = Get-Command -Name '${escapedCommand}' -ErrorAction SilentlyContinue | Select-Object -First 1`,
          "if ($cmd) {",
          "  if ($cmd.Source) { $cmd.Source } elseif ($cmd.Path) { $cmd.Path } else { $cmd.Name }",
          "  exit 0",
          "}",
          "exit 1",
        ].join("; "),
      ],
      { encoding: "utf8", shell: false }
    );

    return {
      ok: powershell.status === 0,
      output: `${powershell.stdout || ""}${powershell.stderr || ""}`.trim(),
    };
  }

  const result = spawnSync("sh", ["-lc", `command -v ${command}`], {
    encoding: "utf8",
    shell: false,
  });
  return {
    ok: result.status === 0,
    output: `${result.stdout || ""}${result.stderr || ""}`.trim(),
  };
}

function sameCommand(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function hasNonEmptyEnv(name) {
  return Boolean(process.env[name] && process.env[name].trim());
}

function hasNonEmptyValue(value) {
  return Boolean(value && String(value).trim());
}

function normalizeEnvValue(value) {
  const trimmed = String(value || "").trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function readEnvFile(filePath) {
  const values = {};
  if (!fs.existsSync(filePath)) {
    return { path: filePath, present: false, values };
  }

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = normalizeEnvValue(trimmed.slice(separatorIndex + 1));
    values[key] = value;
  }

  return { path: filePath, present: true, values };
}

function readBrowserUseLocalEnv() {
  const candidates = [
    path.join(paths.opencodeDir, "config", "browser-use.local.env"),
    path.join(paths.rootDir, ".opencode", "config", "browser-use.local.env"),
  ];

  for (const candidate of candidates) {
    const profile = readEnvFile(candidate);
    if (profile.present) {
      return profile;
    }
  }

  return { path: null, present: false, values: {} };
}

function main() {
  const configPath = path.join(paths.rootDir, "opencode.json");
  const config = readJsonIfExists(configPath, {});
  const server = config.mcp?.browser_use || null;
  const uvx = commandExists("uvx");
  const command = Array.isArray(server?.command) ? server.command : [];
  const environment = server?.environment || server?.env || {};
  const configured = Boolean(server);
  const enabled = configured && server?.enabled !== false;
  const expectedCommandConfigured = sameCommand(command, EXPECTED_COMMAND);
  const hasEnvironmentKey = Boolean(server?.environment);
  const hasLegacyEnvKey = Boolean(server?.env);
  const configProviderKeys = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"].filter(
    (name) => Object.prototype.hasOwnProperty.call(environment, name)
  );
  const localEnvProfile = readBrowserUseLocalEnv();
  const processProviderKeys = {
    OPENAI_API_KEY: hasNonEmptyEnv("OPENAI_API_KEY"),
    ANTHROPIC_API_KEY: hasNonEmptyEnv("ANTHROPIC_API_KEY"),
  };
  const localProfileProviderKeys = {
    OPENAI_API_KEY: hasNonEmptyValue(localEnvProfile.values.OPENAI_API_KEY),
    ANTHROPIC_API_KEY: hasNonEmptyValue(localEnvProfile.values.ANTHROPIC_API_KEY),
  };
  const providerKeys = {
    OPENAI_API_KEY: processProviderKeys.OPENAI_API_KEY || localProfileProviderKeys.OPENAI_API_KEY,
    ANTHROPIC_API_KEY:
      processProviderKeys.ANTHROPIC_API_KEY || localProfileProviderKeys.ANTHROPIC_API_KEY,
  };
  const providerKeyAvailable = providerKeys.OPENAI_API_KEY || providerKeys.ANTHROPIC_API_KEY;
  const openaiBaseUrl =
    process.env.OPENAI_BASE_URL ||
    process.env.OPENAI_API_BASE ||
    localEnvProfile.values.OPENAI_BASE_URL ||
    localEnvProfile.values.OPENAI_API_BASE ||
    null;
  const openaiCompatibleProxy =
    Boolean(providerKeys.OPENAI_API_KEY && openaiBaseUrl) &&
    !/^https:\/\/api\.openai\.com\/?/.test(openaiBaseUrl);
  const preferredLitellmRouteReady =
    openaiCompatibleProxy && /^http:\/\/127\.0\.0\.1:4000\/v1\/?$/.test(openaiBaseUrl);
  const providerRoute = providerKeys.ANTHROPIC_API_KEY
    ? "anthropic"
    : openaiCompatibleProxy
      ? "openai-compatible-proxy"
      : providerKeys.OPENAI_API_KEY
        ? "openai-default-endpoint"
        : "none";
  const providerKeySources = {
    OPENAI_API_KEY: processProviderKeys.OPENAI_API_KEY
      ? "process_environment"
      : localProfileProviderKeys.OPENAI_API_KEY
        ? "browser-use.local.env"
        : null,
    ANTHROPIC_API_KEY: processProviderKeys.ANTHROPIC_API_KEY
      ? "process_environment"
      : localProfileProviderKeys.ANTHROPIC_API_KEY
        ? "browser-use.local.env"
        : null,
  };

  let status = "READY_CONFIGURED";
  if (
    !configured ||
    !enabled ||
    !uvx.ok ||
    !expectedCommandConfigured ||
    !hasEnvironmentKey ||
    hasLegacyEnvKey ||
    configProviderKeys.length > 0
  ) {
    status = "NEEDS_SETUP";
  } else if (!providerKeyAvailable) {
    status = "READY_NO_PROVIDER_KEY";
  }

  const report = {
    checked_at: new Date().toISOString(),
    status,
    mcp_server: "browser_use",
    configured,
    enabled,
    command,
    expected_command: EXPECTED_COMMAND,
    expected_command_configured: expectedCommandConfigured,
    uvx_available: uvx.ok,
    uvx_location: uvx.output || null,
    provider_key_available: providerKeyAvailable,
    provider_keys: providerKeys,
    provider_key_sources: providerKeySources,
    openai_base_url: openaiBaseUrl,
    openai_compatible_proxy: openaiCompatibleProxy,
    preferred_litellm_route_ready: preferredLitellmRouteReady,
    provider_route: providerRoute,
    expected_litellm_model_alias: openaiCompatibleProxy ? "browser-use-glm-5" : null,
    process_provider_keys: processProviderKeys,
    local_profile_present: localEnvProfile.present,
    local_profile_path: localEnvProfile.path,
    local_profile_provider_keys: localProfileProviderKeys,
    config_environment_key: hasEnvironmentKey ? "environment" : hasLegacyEnvKey ? "env" : null,
    config_contains_provider_keys: configProviderKeys.length > 0,
    config_provider_key_names: configProviderKeys,
    headless_default: environment.BROWSER_USE_HEADLESS || "false",
    notes: [
      "Browser Use local MCP requires OPENAI_API_KEY or ANTHROPIC_API_KEY in the Browser Use process environment.",
      "For LiteLLM routing, set OPENAI_API_KEY to the LiteLLM master key and OPENAI_BASE_URL to the local proxy URL.",
      "Do not store provider API keys in opencode.json.",
      "Use opencode.json environment only for safe non-secret defaults such as BROWSER_USE_HEADLESS=false.",
      "01-runtime/tools/browser-use-local.cmd loads 02-brain/.opencode/config/browser-use.local.env only for the Browser Use MCP process.",
      "opencode-local.cmd loads 02-brain/.opencode/config/opencode-provider.local.env only for OpenCode/Engineer provider env.",
      "BROWSER_USE_HEADLESS defaults to false for local QA so browser behavior remains observable.",
    ],
    architecture: {
      primary_browser_executor: "browser_use",
      fallback_evidence_recovery: "playwright_cdp",
      readonly_validator: "oracle_readonly",
      controlled_injection: "oracle_testdata",
    },
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (status !== "READY_CONFIGURED") {
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
}
