const fs = require("fs");
const path = require("path");

const { paths, ensureDir, writeJson } = require("./workspace-paths");

function parseArgs(argv) {
  return {
    dryRun: argv.includes("--dry-run"),
  };
}

function nowStamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function uniqueDestination(baseDir, name) {
  let candidate = path.join(baseDir, name);
  if (!fs.existsSync(candidate)) {
    return candidate;
  }

  let index = 1;
  while (fs.existsSync(`${candidate}-${index}`)) {
    index += 1;
  }
  return `${candidate}-${index}`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceRoot = paths.workspaceRootDir || paths.workspaceParentDir;
  const tempEntries = fs
    .readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => /^_tmp-xdg/i.test(entry.name));

  if (tempEntries.length === 0) {
    console.log("No _tmp-xdg temp directories found.");
    return;
  }

  const archiveBatchDir = path.join(paths.assistantTempArchiveDir, nowStamp());
  const manifest = {
    archivedAt: new Date().toISOString(),
    sourceRoot,
    archiveBatchDir,
    dryRun: args.dryRun,
    items: [],
  };

  if (!args.dryRun) {
    ensureDir(archiveBatchDir);
  }

  for (const entry of tempEntries) {
    const sourcePath = path.join(sourceRoot, entry.name);
    const destinationPath = uniqueDestination(archiveBatchDir, entry.name);
    const manifestItem = {
      name: entry.name,
      sourcePath,
      destinationPath,
      moved: !args.dryRun,
    };

    if (!args.dryRun) {
      fs.renameSync(sourcePath, destinationPath);
    }

    manifest.items.push(manifestItem);
  }

  if (!args.dryRun) {
    writeJson(path.join(archiveBatchDir, "archive-manifest.json"), manifest);
  }

  console.log(args.dryRun ? "Dry run only. No temp directories were moved." : "Archived temp directories:");
  manifest.items.forEach((item) => {
    console.log(`- ${item.name} -> ${item.destinationPath}`);
  });
  if (!args.dryRun) {
    console.log(`Manifest: ${path.join(archiveBatchDir, "archive-manifest.json")}`);
  }
}

main();
