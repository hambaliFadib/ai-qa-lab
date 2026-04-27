const fs = require("fs");
const https = require("https");
const path = require("path");
const { paths, ensureDir, writeJson } = require("./workspace-paths");

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

function getFigmaToken() {
  const localProfile = readLocalProfile();
  const processToken = normalizeEnvValue(process.env.FIGMA_TOKEN || "");
  const localToken = normalizeEnvValue(localProfile.values.FIGMA_TOKEN || "");

  if (processToken) {
    return {
      token: processToken,
      source: "process_environment",
      local_profile_path: localProfile.path,
    };
  }

  if (localToken) {
    return {
      token: localToken,
      source: "figma-rest-readonly.local.env",
      local_profile_path: localProfile.path,
    };
  }

  return {
    token: "",
    source: null,
    local_profile_path: localProfile.path,
  };
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

  return (sanitized || fallback).slice(0, 80);
}

function parseFigmaUrl(input) {
  let url;
  try {
    url = new URL(input);
  } catch (error) {
    return {
      ok: false,
      status: "INVALID_FIGMA_URL",
      message: "Figma URL is invalid.",
    };
  }

  const match = url.pathname.match(/^\/(?:design|file|proto)\/([^/]+)/i);
  const fileKey = match ? match[1] : "";
  const rawNodeId = normalizeEnvValue(url.searchParams.get("node-id") || "");
  const nodeId = rawNodeId ? rawNodeId.replace(/-/g, ":") : "";

  if (!fileKey) {
    return {
      ok: false,
      status: "INVALID_FIGMA_URL",
      message: "Figma URL must include a file key such as /design/<FILE_KEY>/...",
    };
  }

  if (!rawNodeId || !nodeId) {
    return {
      ok: false,
      status: "INVALID_FIGMA_URL",
      message: "Figma URL must include a node-id query parameter.",
    };
  }

  return {
    ok: true,
    sourceUrl: url.toString(),
    fileKey,
    rawNodeId,
    nodeId,
  };
}

function requestJson(url, headers) {
  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: "GET",
        headers,
        timeout: 30000,
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          let parsedBody = null;

          if (body) {
            try {
              parsedBody = JSON.parse(body);
            } catch (error) {
              parsedBody = { raw: body };
            }
          }

          if (response.statusCode < 200 || response.statusCode >= 300) {
            const error = new Error(`Figma REST request failed with HTTP ${response.statusCode}.`);
            error.statusCode = response.statusCode;
            error.body = parsedBody;
            reject(error);
            return;
          }

          resolve(parsedBody || {});
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error("Figma REST request timed out."));
    });
    request.on("error", reject);
    request.end();
  });
}

function getNodeDocument(payload, nodeId, rawNodeId) {
  if (!payload || !payload.nodes || typeof payload.nodes !== "object") {
    return null;
  }

  const normalizedEntry = payload.nodes[nodeId];
  if (normalizedEntry && normalizedEntry.document) {
    return normalizedEntry.document;
  }

  const rawEntry = payload.nodes[rawNodeId];
  if (rawEntry && rawEntry.document) {
    return rawEntry.document;
  }

  const firstEntry = Object.values(payload.nodes).find((entry) => entry && entry.document);
  return firstEntry ? firstEntry.document : null;
}

function writeFailure(status, message, extra = {}) {
  process.stdout.write(
    `${JSON.stringify({ status, message, ...extra }, null, 2)}\n`
  );
  process.exitCode = 1;
}

async function main() {
  const figmaUrl = process.argv[2];
  if (!figmaUrl) {
    writeFailure("INVALID_FIGMA_URL", 'Usage: node figma-rest-fetch-node.js "<FIGMA_URL>"');
    return;
  }

  const parsedUrl = parseFigmaUrl(figmaUrl);
  if (!parsedUrl.ok) {
    writeFailure(parsedUrl.status, parsedUrl.message);
    return;
  }

  const tokenInfo = getFigmaToken();
  if (!tokenInfo.token) {
    writeFailure("READY_NO_TOKEN", "FIGMA_TOKEN is not configured in process env or ignored local env file.", {
      file_key: parsedUrl.fileKey,
      node_id: parsedUrl.nodeId,
      local_env_path: tokenInfo.local_profile_path,
    });
    return;
  }

  const endpoint = `https://api.figma.com/v1/files/${encodeURIComponent(parsedUrl.fileKey)}/nodes?ids=${encodeURIComponent(parsedUrl.nodeId)}`;
  let payload;
  try {
    payload = await requestJson(endpoint, {
      "X-Figma-Token": tokenInfo.token,
      Accept: "application/json",
    });
  } catch (error) {
    writeFailure("FETCH_FAILED", error.message, {
      file_key: parsedUrl.fileKey,
      node_id: parsedUrl.nodeId,
      http_status: error.statusCode || null,
    });
    return;
  }

  const nodeDocument = getNodeDocument(payload, parsedUrl.nodeId, parsedUrl.rawNodeId);
  const nodeName = nodeDocument?.name || null;
  const nodeType = nodeDocument?.type || null;
  const timestamp = timestampForFile();
  const safeFileKey = sanitizeFileSegment(parsedUrl.fileKey);
  const safeNodeId = sanitizeFileSegment(parsedUrl.nodeId.replace(/:/g, "-"));
  const stagingDir = path.join(paths.testingDir, "design-reference-staging");
  const rawDir = ensureDir(path.join(stagingDir, "raw"));
  const outputPath = path.join(
    rawDir,
    `figma-node-${safeFileKey}-${safeNodeId}-${timestamp}.json`
  );
  const latestPath = path.join(stagingDir, "latest-figma-node.json");

  const artifact = {
    fetched_at: new Date().toISOString(),
    source_url: parsedUrl.sourceUrl,
    source: "figma_rest_nodes_api",
    file_key: parsedUrl.fileKey,
    node_id: parsedUrl.nodeId,
    node_id_input: parsedUrl.rawNodeId,
    token_source: tokenInfo.source,
    response: payload,
  };

  const latestPointer = {
    updated_at: artifact.fetched_at,
    source_url: parsedUrl.sourceUrl,
    file_key: parsedUrl.fileKey,
    node_id: parsedUrl.nodeId,
    node_name: nodeName,
    node_type: nodeType,
    path: outputPath,
  };

  writeJson(outputPath, artifact);
  writeJson(latestPath, latestPointer);

  process.stdout.write(
    `${JSON.stringify(
      {
        status: "OK",
        file_key: parsedUrl.fileKey,
        node_id: parsedUrl.nodeId,
        node_name: nodeName,
        node_type: nodeType,
        output: outputPath,
        latest: latestPath,
      },
      null,
      2
    )}\n`
  );
}

main().catch((error) => {
  writeFailure("FETCH_FAILED", error.stack || error.message);
});
