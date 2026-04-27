const fs = require("fs");
const path = require("path");
const { paths, ensureDir, writeJson } = require("./workspace-paths");
const {
  parseArgs,
  requireNonEmpty,
  resolveMaybeRelative,
  safeErrorMessage,
  sanitizeFileSegment,
  timestampForFile,
  writeJsonOutput,
} = require("./qa-tool-common");
const { getGitLabConfig, buildProjectUrl, gitlabRequest } = require("./gitlab-readonly-check");

function parseLabels(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildIssuePayload({ title, description, labels }) {
  return {
    title,
    description,
    labels: parseLabels(labels).join(","),
  };
}

function dryRunDir() {
  return ensureDir(path.join(paths.testingDir, "gitlab-staging", "dry-run"));
}

function createdDir() {
  return ensureDir(path.join(paths.testingDir, "gitlab-staging", "created"));
}

function previewFileName(title, prefix) {
  return `${prefix}-${sanitizeFileSegment(title, "issue")}-${timestampForFile()}.json`;
}

function writeDryRunPreview({ title, descriptionFile, labels, payload, source }) {
  const outputPath = path.join(dryRunDir(), previewFileName(title, "gitlab-issue-dry-run"));
  const preview = {
    generated_at: new Date().toISOString(),
    mode: "dry-run",
    source: source || null,
    title,
    description_file: descriptionFile || null,
    labels: parseLabels(labels),
    request: payload,
    guardrail: "No GitLab issue was created. Re-run with --execute only after explicit approval.",
  };
  writeJson(outputPath, preview);
  return { outputPath, preview };
}

async function executeIssueCreate({ title, descriptionFile, labels, payload, source }) {
  const config = getGitLabConfig();
  if (!requireNonEmpty(config.token) || !requireNonEmpty(config.projectId)) {
    const error = new Error("GITLAB_TOKEN or GITLAB_PROJECT_ID is missing.");
    error.status = "READY_NO_TOKEN";
    throw error;
  }

  const issue = await gitlabRequest(config, "POST", buildProjectUrl(config, "/issues"), payload);
  const outputPath = path.join(createdDir(), previewFileName(title, "gitlab-issue-created"));
  writeJson(outputPath, {
    created_at: new Date().toISOString(),
    mode: "execute",
    source: source || null,
    title,
    description_file: descriptionFile || null,
    labels: parseLabels(labels),
    response: issue,
  });

  return {
    outputPath,
    issue,
  };
}

async function createOrPreviewIssue(options) {
  const title = String(options.title || "").trim();
  const descriptionFile = options.descriptionFile ? resolveMaybeRelative(options.descriptionFile) : "";
  const description = options.description !== undefined
    ? String(options.description || "")
    : descriptionFile
      ? fs.readFileSync(descriptionFile, "utf8")
      : "";
  const labels = parseLabels(options.labels);
  const execute = Boolean(options.execute);

  if (!title) {
    throw new Error("Issue title is required.");
  }

  if (!description) {
    throw new Error("Issue description or --description-file is required.");
  }

  const payload = buildIssuePayload({ title, description, labels });
  if (!execute) {
    const dryRun = writeDryRunPreview({
      title,
      descriptionFile,
      labels,
      payload,
      source: options.source,
    });
    return {
      mode: "dry-run",
      title,
      labels,
      outputPath: dryRun.outputPath,
      issue: null,
    };
  }

  const created = await executeIssueCreate({
    title,
    descriptionFile,
    labels,
    payload,
    source: options.source,
  });
  return {
    mode: "execute",
    title,
    labels,
    outputPath: created.outputPath,
    issue: created.issue,
  };
}

async function main() {
  const args = parseArgs();
  const execute = Boolean(args.execute);
  const result = await createOrPreviewIssue({
    title: args.title,
    descriptionFile: args["description-file"],
    labels: args.labels,
    execute,
    source: "gitlab-create-issue-cli",
  });

  if (result.mode === "execute") {
    writeJsonOutput({
      status: "CREATED",
      issue_url: result.issue.web_url || result.issue.url || null,
      output: result.outputPath,
    });
    return;
  }

  writeJsonOutput({
    status: "DRY_RUN",
    output: result.outputPath,
  });
}

if (require.main === module) {
  main().catch((error) => {
    writeJsonOutput({
      status: error.status || "READY_ERROR",
      message: safeErrorMessage(error),
      http_status: error.statusCode || null,
    });
    process.exitCode = 1;
  });
}

module.exports = {
  parseLabels,
  buildIssuePayload,
  createOrPreviewIssue,
};
