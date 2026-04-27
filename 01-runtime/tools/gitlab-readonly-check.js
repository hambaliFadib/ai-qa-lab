const {
  loadConfig,
  requireNonEmpty,
  safeErrorMessage,
  writeJsonOutput,
} = require("./qa-tool-common");

const ENV_FILE = "gitlab.local.env";
const REQUIRED_KEYS = ["GITLAB_URL", "GITLAB_PROJECT_ID", "GITLAB_TOKEN"];

function normalizeGitLabUrl(value) {
  const baseUrl = String(value || "https://gitlab.com").trim() || "https://gitlab.com";
  try {
    const parsed = new URL(baseUrl);
    parsed.username = "";
    parsed.password = "";
    return parsed.toString().replace(/\/+$/, "");
  } catch (error) {
    return baseUrl.replace(/\/+$/, "");
  }
}

function getGitLabConfig() {
  const config = loadConfig(ENV_FILE, REQUIRED_KEYS);
  return {
    ...config,
    gitlabUrl: normalizeGitLabUrl(config.values.GITLAB_URL),
    projectId: config.values.GITLAB_PROJECT_ID || "",
    token: config.values.GITLAB_TOKEN || "",
  };
}

function buildProjectUrl(config, suffix = "") {
  return `${config.gitlabUrl}/api/v4/projects/${encodeURIComponent(config.projectId)}${suffix}`;
}

async function gitlabRequest(config, method, url, body = null) {
  const headers = {
    Accept: "application/json",
    "PRIVATE-TOKEN": config.token,
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      parsed = { raw: text };
    }
  }

  if (!response.ok) {
    const error = new Error(`GitLab API request failed with HTTP ${response.status}.`);
    error.statusCode = response.status;
    error.body = parsed;
    throw error;
  }

  return parsed || {};
}

async function getProject(config) {
  return gitlabRequest(config, "GET", buildProjectUrl(config));
}

async function getLabels(config) {
  return gitlabRequest(config, "GET", buildProjectUrl(config, "/labels?per_page=100"));
}

function baseReport(config) {
  return {
    checked_at: new Date().toISOString(),
    local_profile_present: config.localProfile.present,
    local_profile_path: config.localProfile.path,
    gitlab_url: config.gitlabUrl,
    project_id_configured: requireNonEmpty(config.projectId),
    token_configured: requireNonEmpty(config.token),
    notes: [
      "Token value is never printed.",
      "Use a GitLab token with api scope in the ignored local env file.",
      "Issue creation remains dry-run unless a command explicitly includes --execute.",
    ],
  };
}

async function main() {
  const config = getGitLabConfig();
  const report = baseReport(config);

  if (!requireNonEmpty(config.token) || !requireNonEmpty(config.projectId)) {
    writeJsonOutput({
      status: "READY_NO_TOKEN",
      message: "GITLAB_TOKEN or GITLAB_PROJECT_ID is missing.",
      ...report,
    });
    process.exitCode = 1;
    return;
  }

  try {
    const project = await getProject(config);
    const labels = await getLabels(config);
    writeJsonOutput({
      status: "READY_CONFIGURED",
      project: {
        id: project.id,
        path_with_namespace: project.path_with_namespace,
        web_url: project.web_url,
      },
      labels_count: Array.isArray(labels) ? labels.length : 0,
      ...report,
    });
  } catch (error) {
    const statusCode = error?.statusCode || null;
    const status = statusCode === 401 || statusCode === 403 || statusCode === 404 ? "READY_ACCESS_DENIED" : "READY_ERROR";
    writeJsonOutput({
      status,
      message:
        status === "READY_ACCESS_DENIED"
          ? "GitLab project is not readable with the configured token and project id."
          : safeErrorMessage(error),
      http_status: statusCode,
      ...report,
    });
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    writeJsonOutput({
      status: "READY_ERROR",
      message: safeErrorMessage(error),
    });
    process.exitCode = 1;
  });
}

module.exports = {
  getGitLabConfig,
  buildProjectUrl,
  gitlabRequest,
  getProject,
  getLabels,
};
