const fs = require("fs");
const path = require("path");
const {
  paths,
  ensureDir,
  writeJson,
  writeText,
} = require("./workspace-paths");

const GROUPS = [
  {
    key: "app_testing_standards",
    label: "App Testing Standards",
    relativeDir: "APP_TESTING_STANDARDS",
    preferredUse: "Use first for PGN Billing-specific rules before generic QA standards.",
  },
  {
    key: "mom",
    label: "MoM",
    relativeDir: "MOM",
    preferredUse: "Use for business rules, approval logic, validation expectations, and workshop decisions.",
  },
  {
    key: "bpmn_reviewed",
    label: "BPMN Reviewed",
    relativeDir: "BPMN_BISPRO/Reviewed",
    preferredUse: "Use on demand after distilled flow and MoM are still insufficient.",
  },
  {
    key: "bpmn_ready_to_review",
    label: "BPMN Ready To Review",
    relativeDir: "BPMN_BISPRO/Ready To Review",
    preferredUse: "Use only when the reviewed BPMN set does not cover the module yet.",
  },
  {
    key: "bpmn_revise",
    label: "BPMN Revise",
    relativeDir: "BPMN_BISPRO/Revise",
    preferredUse: "Treat as lower-confidence raw flow input until a reviewed version exists.",
  },
  {
    key: "qa_ui",
    label: "QA Standards UI",
    relativeDir: "QA_STANDARDS/UI",
    preferredUse: "Use for UI behavior, usability expectations, and presentation-layer validation.",
  },
  {
    key: "qa_api",
    label: "QA Standards API",
    relativeDir: "QA_STANDARDS/API",
    preferredUse: "Use for endpoint behavior, status codes, payload validation, and contract checks.",
  },
  {
    key: "qa_automation",
    label: "QA Standards Automation",
    relativeDir: "QA_STANDARDS/AUTOMATION",
    preferredUse: "Use for selector strategy, retries, waits, focus, wrappers, and automation discipline.",
  },
  {
    key: "qa_test_data",
    label: "QA Standards Test Data",
    relativeDir: "QA_STANDARDS/TEST_DATA",
    preferredUse: "Use for test data coverage, seeding rules, and data quality expectations.",
  },
];

function exists(targetPath) {
  return fs.existsSync(targetPath);
}

function toRelative(targetPath) {
  return path.relative(paths.rootDir, targetPath).replace(/\\/g, "/");
}

function walkFiles(rootDir) {
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
      if (!entry.isFile()) {
        continue;
      }

      const stats = fs.statSync(fullPath);
      files.push({
        name: entry.name,
        relative_path: toRelative(fullPath),
        extension: path.extname(entry.name).toLowerCase() || "(none)",
        size_bytes: stats.size,
        modified_at: stats.mtime.toISOString(),
      });
    }
  }

  return files.sort((left, right) => left.relative_path.localeCompare(right.relative_path));
}

function summarizeGroups() {
  return GROUPS.map((group) => {
    const dirPath = path.join(paths.knowledgeRawDir, ...group.relativeDir.split("/"));
    const files = walkFiles(dirPath);
    return {
      ...group,
      root_path: toRelative(dirPath),
      file_count: files.length,
      files,
    };
  });
}

function buildMarkdown(payload) {
  const lines = [
    "# Raw Knowledge Catalog",
    "",
    `- Generated: ${payload.generated_at}`,
    `- Workspace Root: ${payload.workspace_root}`,
    `- Raw Knowledge Root: ${payload.raw_knowledge_root}`,
    `- Total Files: ${payload.total_files}`,
    "",
    "Use this catalog to discover the full raw source inventory before opening any raw folder broadly.",
    "Engineer should still read only the smallest relevant raw source for the active question.",
    "",
    "## Group Summary",
    "",
  ];

  for (const group of payload.groups) {
    lines.push(`- ${group.label}: ${group.file_count} files`);
    lines.push(`  Path: ${group.root_path}`);
    lines.push(`  Preferred Use: ${group.preferredUse}`);
  }

  lines.push("", "## Detailed Inventory", "");

  for (const group of payload.groups) {
    lines.push(`### ${group.label}`);
    lines.push("");
    lines.push(`- Path: ${group.root_path}`);
    lines.push(`- Preferred Use: ${group.preferredUse}`);
    lines.push(`- File Count: ${group.file_count}`);
    lines.push("");
    if (group.files.length === 0) {
      lines.push("- (no files)");
      lines.push("");
      continue;
    }

    for (const file of group.files) {
      lines.push(`- ${file.relative_path} | ${file.modified_at} | ${file.size_bytes} bytes`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function main() {
  ensureDir(paths.distilledGlobalDir);
  const groups = summarizeGroups();
  const payload = {
    generated_at: new Date().toISOString(),
    workspace_root: toRelative(paths.rootDir) || ".",
    raw_knowledge_root: toRelative(paths.knowledgeRawDir),
    total_files: groups.reduce((sum, group) => sum + group.file_count, 0),
    groups,
  };

  writeJson(paths.rawKnowledgeCatalogJsonPath, payload);
  writeText(paths.rawKnowledgeCatalogPath, buildMarkdown(payload));

  process.stdout.write(
    `${JSON.stringify({
      markdown: toRelative(paths.rawKnowledgeCatalogPath),
      json: toRelative(paths.rawKnowledgeCatalogJsonPath),
      total_files: payload.total_files,
      groups: groups.map((group) => ({
        key: group.key,
        files: group.file_count,
      })),
    }, null, 2)}\n`
  );
}

main();
