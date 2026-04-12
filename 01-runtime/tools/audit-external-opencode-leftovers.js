const fs = require("fs");
const path = require("path");
const { paths, ensureDir, writeJson, writeText } = require("./workspace-paths");

function toRelativeRoot(targetPath) {
  return path.relative(paths.rootDir, targetPath).replace(/\\/g, "/");
}

function toWorkspaceRelative(targetPath) {
  return path.relative(paths.workspaceRootDir || paths.workspaceParentDir, targetPath).replace(/\\/g, "/");
}

function exists(targetPath) {
  return fs.existsSync(targetPath);
}

function collectFiles(rootDir) {
  if (!exists(rootDir)) {
    return [];
  }

  const files = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      const stats = fs.statSync(fullPath);
      files.push({
        path: fullPath,
        name: entry.name,
        extension: path.extname(entry.name).toLowerCase() || "(none)",
        size: stats.size,
        modified_at: stats.mtime.toISOString(),
      });
    }
  }

  return files;
}

function summarizeExtensions(files) {
  const counts = new Map();
  for (const file of files) {
    counts.set(file.extension, (counts.get(file.extension) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([extension, count]) => ({ extension, count }));
}

function findIndicators(files) {
  const indicators = {
    has_database: false,
    has_logs: false,
    has_lock_state: false,
    has_credentials_like_files: false,
    package_bootstrap_only: false,
  };

  for (const file of files) {
    const normalized = file.path.replace(/\\/g, "/").toLowerCase();
    if (/\.(db|sqlite|sqlite3|db-shm|db-wal)$/.test(file.name.toLowerCase())) {
      indicators.has_database = true;
    }
    if (normalized.includes("/log/") || /\.log$/i.test(file.name)) {
      indicators.has_logs = true;
    }
    if (normalized.includes("/locks/") || /lock/i.test(file.name)) {
      indicators.has_lock_state = true;
    }
    if (/\.env$/i.test(file.name) || /credential|secret|token|wallet/i.test(file.name)) {
      indicators.has_credentials_like_files = true;
    }
  }

  indicators.package_bootstrap_only =
    files.length > 0 &&
    files.every((file) => ["package.json", ".gitignore", "package-lock.json", "bun.lock"].includes(file.name));

  return indicators;
}

function classifyFolder(folderPath, files) {
  if (!exists(folderPath)) {
    return {
      status: "missing",
      reason: "Folder does not exist.",
    };
  }

  if (files.length === 0) {
    return {
      status: "archive_candidate",
      reason: "Folder exists but is empty.",
    };
  }

  const indicators = findIndicators(files);
  if (indicators.package_bootstrap_only) {
    return {
      status: "archive_candidate",
      reason: "Folder only contains bootstrap package metadata and no active DB/log/lock state.",
    };
  }

  return {
    status: "review_before_archive",
    reason: "Folder contains runtime-like contents and should be manually reviewed before archiving.",
  };
}

function buildMarkdown(payload) {
  const lines = [
    "# External OpenCode Leftover Audit",
    "",
    `- Checked At: ${payload.checked_at}`,
    `- Workspace Root: ${payload.workspace_root}`,
    `- External Folder: ${payload.external_folder.workspace_relative}`,
    `- Exists: ${payload.external_folder.exists}`,
    `- File Count: ${payload.external_folder.file_count}`,
    `- Size MB: ${payload.external_folder.size_mb}`,
    `- Classification: ${payload.classification.status}`,
    `- Reason: ${payload.classification.reason}`,
    "",
    "## Indicators",
    "",
    `- Has Database: ${payload.indicators.has_database}`,
    `- Has Logs: ${payload.indicators.has_logs}`,
    `- Has Lock State: ${payload.indicators.has_lock_state}`,
    `- Has Credentials-Like Files: ${payload.indicators.has_credentials_like_files}`,
    `- Package Bootstrap Only: ${payload.indicators.package_bootstrap_only}`,
    "",
    "## Extension Summary",
    "",
    payload.extension_summary.length > 0
      ? payload.extension_summary.map((entry) => `- ${entry.extension}: ${entry.count}`).join("\n")
      : "- (no files)",
    "",
    "## Most Recent Files",
    "",
    payload.most_recent_files.length > 0
      ? payload.most_recent_files
          .map((file) => `- ${file.workspace_relative} | ${file.modified_at} | ${file.size_bytes} bytes`)
          .join("\n")
      : "- (no files)",
    "",
    "## Safe Cleanup Plan",
    "",
    "1. Keep using `01-runtime/tools/opencode-local.cmd` for all future OpenCode runs.",
    "2. Re-run `node 01-runtime/tools/audit-opencode-storage.js` and this audit before any cleanup.",
    "3. If classification remains `archive_candidate`, archive the folder into `99-archive/assistant-temp/external-opencode/` using the dry-run-first archive script.",
    "4. Only delete the original external folder after the archive exists and its contents are verified.",
  ];

  return `${lines.join("\n")}\n`;
}

function main() {
  const folderPath = paths.workspaceExternalOpencodeConfigDir;
  ensureDir(paths.opencodeStorageObservabilityDir);

  const files = collectFiles(folderPath);
  const sizeBytes = files.reduce((sum, file) => sum + file.size, 0);
  const classification = classifyFolder(folderPath, files);
  const indicators = findIndicators(files);

  const payload = {
    checked_at: new Date().toISOString(),
    workspace_root: paths.workspaceRootDir || paths.workspaceParentDir,
    external_folder: {
      absolute_path: folderPath,
      workspace_relative: toWorkspaceRelative(folderPath),
      exists: exists(folderPath),
      file_count: files.length,
      size_mb: Math.round((sizeBytes / (1024 * 1024)) * 100) / 100,
    },
    classification,
    indicators,
    extension_summary: summarizeExtensions(files),
    most_recent_files: files
      .slice()
      .sort((left, right) => new Date(right.modified_at) - new Date(left.modified_at))
      .slice(0, 20)
      .map((file) => ({
        workspace_relative: toWorkspaceRelative(file.path),
        modified_at: file.modified_at,
        size_bytes: file.size,
      })),
  };

  const baseName = "external-opencode-leftover-audit";
  const jsonPath = path.join(paths.opencodeStorageObservabilityDir, `${baseName}.json`);
  const markdownPath = path.join(paths.opencodeStorageObservabilityDir, `${baseName}.md`);
  writeJson(jsonPath, payload);
  writeText(markdownPath, buildMarkdown(payload));

  process.stdout.write(
    `${JSON.stringify({
      classification: payload.classification,
      output_json: toRelativeRoot(jsonPath),
      output_markdown: toRelativeRoot(markdownPath),
      external_folder: payload.external_folder,
    }, null, 2)}\n`
  );
}

main();
