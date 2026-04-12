const fs = require("fs");
const path = require("path");
const {
  paths,
  ensureDir,
  writeJson,
} = require("./workspace-paths");

function parseArgs(argv) {
  return {
    apply: argv.includes("--apply"),
    dryRun: !argv.includes("--apply"),
  };
}

function exists(targetPath) {
  return fs.existsSync(targetPath);
}

function withinRoot(targetPath, rootPath) {
  const resolvedRoot = path.resolve(rootPath);
  const resolvedTarget = path.resolve(targetPath);
  return resolvedTarget === resolvedRoot || resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`);
}

function nowStamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourcePath = paths.workspaceExternalOpencodeConfigDir;
  const workspaceRoot = paths.workspaceRootDir || paths.workspaceParentDir;

  if (!exists(sourcePath)) {
    process.stdout.write(`${JSON.stringify({
      status: "skipped",
      reason: "Source folder does not exist.",
      source: sourcePath,
    }, null, 2)}\n`);
    return;
  }

  if (!withinRoot(sourcePath, workspaceRoot)) {
    throw new Error("Refusing to archive a source path outside the AI-QA-LAB workspace root.");
  }

  const archiveRoot = path.join(paths.assistantTempArchiveDir, "external-opencode", nowStamp());
  const destinationPath = path.join(archiveRoot, path.basename(sourcePath));

  if (!withinRoot(destinationPath, paths.rootDir)) {
    throw new Error("Refusing to archive outside AI-QA-LAB.");
  }

  const manifest = {
    prepared_at: new Date().toISOString(),
    dry_run: args.dryRun,
    source_path: sourcePath,
    destination_path: destinationPath,
    source_exists: exists(sourcePath),
    destination_exists: exists(destinationPath),
    action: args.apply ? "move" : "plan_only",
    safety_checks: {
      source_within_workspace: withinRoot(sourcePath, workspaceRoot),
      destination_within_project: withinRoot(destinationPath, paths.rootDir),
    },
    next_step: args.apply
      ? "Verify the archived folder contents before deleting any additional leftovers."
      : "Review the plan, then rerun with --apply to move the external folder into AI-QA-LAB/99-archive/assistant-temp/external-opencode/.",
  };

  if (args.apply) {
    ensureDir(archiveRoot);
    fs.renameSync(sourcePath, destinationPath);
    manifest.destination_exists = exists(destinationPath);
    manifest.source_exists = exists(sourcePath);
    writeJson(path.join(archiveRoot, "archive-manifest.json"), manifest);
  }

  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}

main();
