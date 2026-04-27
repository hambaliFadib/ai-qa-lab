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

function hasNonEmptyValue(value) {
  return Boolean(value && String(value).trim());
}

function readLocalProfile() {
  const candidates = [
    path.join(paths.opencodeDir, "config", "figma-rest-readonly.local.env"),
    path.join(paths.rootDir, ".opencode", "config", "figma-rest-readonly.local.env"),
  ];

  for (const candidate of candidates) {
    const profile = readEnvFile(candidate);
    if (profile.present) {
      return profile;
    }
  }

  return { path: candidates[0], present: false, values: {} };
}

function main() {
  const localProfile = readLocalProfile();
  const configDirExists = fs.existsSync(path.join(paths.opencodeDir, "config"));
  const stagingDirExists = fs.existsSync(path.join(paths.testingDir, "design-reference-staging"));
  const setupDocExists = fs.existsSync(
    path.join(paths.opencodeDir, "config", "figma-rest-readonly-setup.md")
  );
  const processToken = hasNonEmptyValue(process.env.FIGMA_TOKEN);
  const localToken = hasNonEmptyValue(localProfile.values.FIGMA_TOKEN);
  const tokenAvailable = processToken || localToken;

  let status = "READY_CONFIGURED";
  if (!configDirExists || !stagingDirExists || !setupDocExists) {
    status = "NEEDS_SETUP";
  } else if (!tokenAvailable) {
    status = "READY_NO_TOKEN";
  }

  const report = {
    checked_at: new Date().toISOString(),
    status,
    fallback: "figma_rest_readonly",
    token_available: tokenAvailable,
    token_source: processToken ? "process_environment" : localToken ? "figma-rest-readonly.local.env" : null,
    local_profile_present: localProfile.present,
    local_profile_path: localProfile.path,
    config_dir_exists: configDirExists,
    staging_dir_exists: stagingDirExists,
    setup_doc_exists: setupDocExists,
    notes: [
      "This check only validates local read-only setup readiness and does not call Figma.",
      "Use FIGMA_TOKEN in process env or 02-brain/.opencode/config/figma-rest-readonly.local.env.",
      "Do not commit Figma tokens or other secrets to the repository.",
      "Figma REST fallback remains read-only evidence extraction only.",
      "Design mismatch still defaults to needs_design_confirmation until stronger confirmed evidence exists.",
    ],
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
