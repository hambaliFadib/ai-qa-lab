const fs = require("fs");
const path = require("path");
const { paths, ensureDir, writeText } = require("./workspace-paths");

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveRawArtifactPath(inputPath) {
  const stagingDir = path.join(paths.testingDir, "design-reference-staging");
  const latestPointerPath = path.join(stagingDir, "latest-figma-node.json");
  const candidate = inputPath
    ? path.resolve(process.cwd(), inputPath)
    : latestPointerPath;

  if (!fs.existsSync(candidate)) {
    throw new Error(`Input file not found: ${candidate}`);
  }

  const parsed = readJson(candidate);
  if (parsed && parsed.response && parsed.file_key && parsed.node_id) {
    return {
      artifactPath: candidate,
      artifact: parsed,
    };
  }

  if (parsed && parsed.path) {
    const rawArtifactPath = path.resolve(path.dirname(candidate), parsed.path);
    if (!fs.existsSync(rawArtifactPath)) {
      throw new Error(`Latest raw artifact not found: ${rawArtifactPath}`);
    }

    return {
      artifactPath: rawArtifactPath,
      artifact: readJson(rawArtifactPath),
    };
  }

  throw new Error(`Unsupported Figma node JSON format: ${candidate}`);
}

function getNodeDocument(artifact) {
  const payload = artifact.response || {};
  const normalizedEntry = payload.nodes?.[artifact.node_id];
  if (normalizedEntry && normalizedEntry.document) {
    return normalizedEntry.document;
  }

  const rawEntry = payload.nodes?.[artifact.node_id_input];
  if (rawEntry && rawEntry.document) {
    return rawEntry.document;
  }

  const firstEntry = Object.values(payload.nodes || {}).find((entry) => entry && entry.document);
  return firstEntry ? firstEntry.document : null;
}

function isVisible(node) {
  return !node || node.visible !== false;
}

function formatNodeLabel(node) {
  const name = (node?.name || "").trim() || "Unnamed";
  const type = (node?.type || "UNKNOWN").trim();
  return `${name} [${type}]`;
}

function collectVisibleTextNodes(node, bucket) {
  if (!node || !isVisible(node)) {
    return;
  }

  if (node.type === "TEXT" && String(node.characters || "").trim()) {
    bucket.push(String(node.characters || "").trim());
  }

  for (const child of node.children || []) {
    collectVisibleTextNodes(child, bucket);
  }
}

function collectHierarchy(node, bucket, depth = 0, limit = 60) {
  if (!node || !isVisible(node) || bucket.length >= limit) {
    return;
  }

  bucket.push(`${"  ".repeat(depth)}${formatNodeLabel(node)}`);
  for (const child of node.children || []) {
    if (bucket.length >= limit) {
      break;
    }
    collectHierarchy(child, bucket, depth + 1, limit);
  }
}

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function pushUnique(bucket, value) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return;
  }

  if (!bucket.includes(normalized)) {
    bucket.push(normalized);
  }
}

function isFieldLike(value) {
  return /\b(name|email|password|phone|search|date|address|amount|qty|quantity|description|remark|remarks|notes?|select|dropdown|field|input|username|role|status|code|number)\b/i.test(
    value
  );
}

function isActionLike(value) {
  return /\b(save|submit|cancel|back|next|continue|close|ok|confirm|apply|delete|edit|add|create|search|filter|download|upload|approve|reject|view|send)\b/i.test(
    value
  );
}

function collectCandidates(node, fields, actions) {
  if (!node || !isVisible(node)) {
    return;
  }

  const name = normalizeWhitespace(node.name || "");
  const characters = normalizeWhitespace(node.characters || "");
  const combined = [name, characters].filter(Boolean).join(" | ");

  if (combined && (isFieldLike(combined) || /\b(input|textbox|dropdown|select|textarea)\b/i.test(combined))) {
    pushUnique(fields, combined);
  }

  if (
    combined &&
    (isActionLike(combined) || /\b(button|btn)\b/i.test(combined))
  ) {
    pushUnique(actions, combined);
  }

  for (const child of node.children || []) {
    collectCandidates(child, fields, actions);
  }
}

function toBulletList(items, fallback) {
  if (!items || items.length === 0) {
    return [`- ${fallback}`];
  }

  return items.map((item) => `- ${item}`);
}

function buildSummaryMarkdown(metadata) {
  const metadataBlock = `<!-- figma-summary-metadata\n${JSON.stringify(metadata, null, 2)}\n-->\n`;

  return `${metadataBlock}# Figma Node Summary

## Source

- Raw artifact: ${metadata.raw_artifact}
- Figma URL: ${metadata.source_url || "Unknown"}
- File key: ${metadata.file_key}
- Node ID: ${metadata.node_id}
- Node name: ${metadata.node_name}
- Node type: ${metadata.node_type}
- Generated at: ${metadata.generated_at}

## Immediate Children

${toBulletList(metadata.immediate_children, "No immediate children found.").join("\n")}

## Visible Text Nodes

${toBulletList(metadata.visible_text_nodes, "No visible text nodes found.").join("\n")}

## Hierarchy Snapshot

${toBulletList(metadata.hierarchy_lines, "No visible hierarchy captured.").join("\n")}

## Candidate Fields

${toBulletList(metadata.candidate_fields, "No clear field candidates detected from the node structure.").join("\n")}

## Candidate Buttons / Actions

${toBulletList(metadata.candidate_actions, "No clear action candidates detected from the node structure.").join("\n")}

## Notes

- This is design evidence only.
- The summary is structural and may miss hidden states, variants, or business-rule context.
- Do not treat this summary as confirmed product truth without UI and business confirmation.
`;
}

function writeFailure(status, message, extra = {}) {
  process.stdout.write(
    `${JSON.stringify({ status, message, ...extra }, null, 2)}\n`
  );
  process.exitCode = 1;
}

function main() {
  const { artifactPath, artifact } = resolveRawArtifactPath(process.argv[2]);
  const node = getNodeDocument(artifact);
  if (!node) {
    writeFailure("INVALID_ARTIFACT", "Figma node document was not found in the fetched artifact.", {
      input: artifactPath,
    });
    return;
  }

  const stagingDir = path.join(paths.testingDir, "design-reference-staging");
  const summariesDir = ensureDir(path.join(stagingDir, "summaries"));
  const latestPath = path.join(stagingDir, "latest-figma-summary.md");
  const visibleTextNodes = [];
  const hierarchyLines = [];
  const candidateFields = [];
  const candidateActions = [];

  collectVisibleTextNodes(node, visibleTextNodes);
  collectHierarchy(node, hierarchyLines);
  collectCandidates(node, candidateFields, candidateActions);

  const immediateChildren = (node.children || [])
    .filter(isVisible)
    .slice(0, 20)
    .map((child) => formatNodeLabel(child));

  const dedupedVisibleTextNodes = Array.from(new Set(visibleTextNodes)).slice(0, 50);
  const dedupedHierarchyLines = Array.from(new Set(hierarchyLines)).slice(0, 60);
  const timestamp = timestampForFile();
  const safeNodeName = sanitizeFileSegment(node.name || artifact.node_id, "figma-node");
  const summaryPath = path.join(
    summariesDir,
    `figma-summary-${safeNodeName}-${timestamp}.md`
  );

  const metadata = {
    source: "figma_rest_summary_v1",
    generated_at: new Date().toISOString(),
    raw_artifact: artifactPath,
    source_url: artifact.source_url || null,
    file_key: artifact.file_key,
    node_id: artifact.node_id,
    node_name: node.name || "Unnamed",
    node_type: node.type || "UNKNOWN",
    immediate_children: immediateChildren,
    visible_text_nodes: dedupedVisibleTextNodes,
    hierarchy_lines: dedupedHierarchyLines,
    candidate_fields: candidateFields.slice(0, 20),
    candidate_actions: candidateActions.slice(0, 20),
  };

  const markdown = buildSummaryMarkdown(metadata);
  writeText(summaryPath, markdown);
  writeText(latestPath, markdown);

  process.stdout.write(
    `${JSON.stringify(
      {
        status: "OK",
        summary: summaryPath,
        latest: latestPath,
      },
      null,
      2
    )}\n`
  );
}

try {
  main();
} catch (error) {
  writeFailure("INVALID_ARTIFACT", error.stack || error.message);
}
