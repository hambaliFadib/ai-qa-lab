const fs = require("fs");
const path = require("path");
const { paths } = require("./workspace-paths");

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

function readLocalProfile(fileName) {
  const candidates = [
    path.join(paths.opencodeDir, "config", fileName),
    path.join(paths.rootDir, ".opencode", "config", fileName),
  ];

  for (const candidate of candidates) {
    const profile = readEnvFile(candidate);
    if (profile.present) {
      return profile;
    }
  }

  return { path: candidates[0], present: false, values: {} };
}

function loadConfig(fileName, keys) {
  const localProfile = readLocalProfile(fileName);
  const values = { ...localProfile.values };

  for (const key of keys) {
    const processValue = normalizeEnvValue(process.env[key] || "");
    if (processValue) {
      values[key] = processValue;
    }
  }

  return { localProfile, values };
}

function parseArgs(argv = process.argv.slice(2)) {
  const args = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }

    const withoutPrefix = token.slice(2);
    const equalsIndex = withoutPrefix.indexOf("=");
    if (equalsIndex >= 0) {
      const key = withoutPrefix.slice(0, equalsIndex);
      args[key] = withoutPrefix.slice(equalsIndex + 1);
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[withoutPrefix] = true;
      continue;
    }

    args[withoutPrefix] = next;
    index += 1;
  }

  return args;
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function sanitizeFileSegment(value, fallback = "unknown") {
  const sanitized = String(value || "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return (sanitized || fallback).slice(0, 90);
}

function writeJsonOutput(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function safeErrorMessage(error) {
  const message = String(error?.message || error || "Unknown error").replace(/\s+/g, " ").trim();
  return message || "Unknown error";
}

function requireNonEmpty(value) {
  return Boolean(value && String(value).trim());
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveMaybeRelative(filePath) {
  if (!filePath) {
    return "";
  }

  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

module.exports = {
  normalizeEnvValue,
  readEnvFile,
  readLocalProfile,
  loadConfig,
  parseArgs,
  timestampForFile,
  sanitizeFileSegment,
  writeJsonOutput,
  safeErrorMessage,
  requireNonEmpty,
  readJson,
  resolveMaybeRelative,
};
