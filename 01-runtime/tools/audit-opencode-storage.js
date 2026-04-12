const fs = require("fs");
const path = require("path");
const { paths } = require("./workspace-paths");

function exists(targetPath) {
  return fs.existsSync(targetPath);
}

function toRelative(targetPath) {
  return path.relative(paths.rootDir, targetPath).replace(/\\/g, "/");
}

function withinProject(targetPath) {
  const resolvedRoot = path.resolve(paths.rootDir);
  const resolvedTarget = path.resolve(targetPath);
  return resolvedTarget === resolvedRoot || resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`);
}

function listExternalOpencodeLeftovers() {
  const workspaceRoot = paths.workspaceRootDir || paths.workspaceParentDir;
  if (!exists(workspaceRoot)) {
    return [];
  }

  return fs
    .readdirSync(workspaceRoot, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        (/^_tmp-xdg/i.test(entry.name) || /^opencode-config-temp$/i.test(entry.name))
    )
    .map((entry) => ({
      name: entry.name,
      path: path.join(workspaceRoot, entry.name),
    }));
}

function countFiles(rootDir) {
  if (!exists(rootDir)) {
    return 0;
  }

  let count = 0;
  const stack = [rootDir];
  while (stack.length > 0) {
    const currentDir = stack.pop();
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        count += 1;
      }
    }
  }

  return count;
}

function readLatestArchiveBatches(limit = 5) {
  if (!exists(paths.assistantTempArchiveDir)) {
    return [];
  }

  return fs
    .readdirSync(paths.assistantTempArchiveDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(paths.assistantTempArchiveDir, entry.name))
    .filter((batchDir) => exists(path.join(batchDir, "archive-manifest.json")))
    .sort()
    .reverse()
    .slice(0, limit)
    .map((batchDir) => {
      const manifestPath = path.join(batchDir, "archive-manifest.json");
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      return {
        batch: path.basename(batchDir),
        items: Array.isArray(manifest.items) ? manifest.items.length : 0,
        source_root: manifest.sourceRoot || null,
      };
    });
}

function readExternalArchiveBatches(limit = 5) {
  const externalArchiveDir = path.join(paths.assistantTempArchiveDir, "external-opencode");
  if (!exists(externalArchiveDir)) {
    return [];
  }

  return fs
    .readdirSync(externalArchiveDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(externalArchiveDir, entry.name))
    .sort()
    .reverse()
    .slice(0, limit)
    .map((batchDir) => {
      const manifestPath = path.join(batchDir, "archive-manifest.json");
      const archivedFolder = path.join(batchDir, "opencode-config-temp");
      const manifest = exists(manifestPath)
        ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
        : null;

      return {
        batch: path.basename(batchDir),
        archived_folder: toRelative(archivedFolder),
        manifest_path: exists(manifestPath) ? toRelative(manifestPath) : null,
        file_count: countFiles(archivedFolder),
        action: manifest?.action || "unknown",
      };
    });
}

function inspectOpencodeLink() {
  const rootOpencodePath = path.join(paths.rootDir, ".opencode");
  if (!exists(rootOpencodePath) || !exists(paths.opencodeDir)) {
    return {
      exists: false,
      aligned: false,
      root_path: toRelative(rootOpencodePath),
      target_path: toRelative(paths.opencodeDir),
    };
  }

  const resolvedRoot = fs.realpathSync(rootOpencodePath);
  const resolvedTarget = fs.realpathSync(paths.opencodeDir);
  return {
    exists: true,
    aligned: resolvedRoot === resolvedTarget,
    root_path: toRelative(rootOpencodePath),
    target_path: toRelative(paths.opencodeDir),
    resolved_root: resolvedRoot,
    resolved_target: resolvedTarget,
  };
}

function inspectReadyCommands() {
  const readyCommandsPath = path.join(paths.runtimeDocsDir, "READY_COMMANDS.md");
  if (!exists(readyCommandsPath)) {
    return {
      exists: false,
      uses_project_local_wrapper: false,
      direct_opencode_cmd_references: 0,
    };
  }

  const markdown = fs.readFileSync(readyCommandsPath, "utf8");
  return {
    exists: true,
    uses_project_local_wrapper: markdown.includes("opencode-local.cmd"),
    direct_opencode_cmd_references: (markdown.match(/`opencode\.cmd\b/g) || []).length,
  };
}

function inspectProjectLocalStorage() {
  const homes = {
    config_home: paths.opencodeXdgConfigHome,
    data_home: paths.opencodeXdgDataHome,
    state_home: paths.opencodeXdgStateHome,
    cache_home: paths.opencodeXdgCacheHome,
  };

  const entries = {};
  for (const [key, value] of Object.entries(homes)) {
    entries[key] = {
      path: toRelative(value),
      exists: exists(value),
      inside_project: withinProject(value),
    };
  }

  return entries;
}

function main() {
  const wrapperPath = path.join(paths.runtimeToolsDir, "opencode-local.cmd");
  const opencodeLink = inspectOpencodeLink();
  const readyCommands = inspectReadyCommands();
  const projectLocalStorage = inspectProjectLocalStorage();
  const externalLeftovers = listExternalOpencodeLeftovers();
  const archiveBatches = readLatestArchiveBatches();
  const externalArchiveBatches = readExternalArchiveBatches();

  const findings = [];

  if (!opencodeLink.exists || !opencodeLink.aligned) {
    findings.push({
      severity: "high",
      code: "opencode_brain_link_misaligned",
      message: "Project .opencode path is missing or no longer aligned to 02-brain/.opencode.",
    });
  }

  if (!exists(wrapperPath)) {
    findings.push({
      severity: "high",
      code: "missing_project_local_wrapper",
      message: "Project-local OpenCode wrapper is missing.",
    });
  }

  const missingLocalHomes = Object.entries(projectLocalStorage)
    .filter(([, value]) => !value.exists || !value.inside_project)
    .map(([key]) => key);
  if (missingLocalHomes.length > 0) {
    findings.push({
      severity: "medium",
      code: "project_local_storage_incomplete",
      message: `Project-local OpenCode storage homes are incomplete: ${missingLocalHomes.join(", ")}.`,
    });
  }

  if (!readyCommands.uses_project_local_wrapper || readyCommands.direct_opencode_cmd_references > 0) {
    findings.push({
      severity: "medium",
      code: "ready_commands_not_enforcing_local_wrapper",
      message: "READY_COMMANDS.md still allows direct opencode.cmd usage instead of the project-local wrapper.",
    });
  }

  if (externalLeftovers.length > 0) {
    findings.push({
      severity: "warning",
      code: "historical_external_storage_detected",
      message: "Historical OpenCode temp/config folders still exist at the AI-QA-LAB root outside the prepared archive/runtime structure.",
    });
  }

  const policyCompliant =
    opencodeLink.exists &&
    opencodeLink.aligned &&
    exists(wrapperPath) &&
    Object.values(projectLocalStorage).every((entry) => entry.exists && entry.inside_project) &&
    readyCommands.uses_project_local_wrapper &&
    readyCommands.direct_opencode_cmd_references === 0;

  const payload = {
    checked_at: new Date().toISOString(),
    policy_compliant: policyCompliant,
    opencode_brain_link: opencodeLink,
    wrapper: {
      path: toRelative(wrapperPath),
      exists: exists(wrapperPath),
    },
    project_local_storage: projectLocalStorage,
    ready_commands: readyCommands,
    external_leftovers: externalLeftovers.map((entry) => ({
      name: entry.name,
      path: entry.path,
    })),
    archived_batches: archiveBatches,
    external_archived_batches: externalArchiveBatches,
    findings,
    recommendation: policyCompliant
      ? "Future OpenCode runs should use 01-runtime/tools/opencode-local.cmd so runtime storage stays inside the project."
      : "Fix the blocking findings before relying on OpenCode project-local storage policy.",
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

main();
