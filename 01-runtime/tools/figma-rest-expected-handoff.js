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

function resolveSummaryPath(inputPath) {
  const stagingDir = path.join(paths.testingDir, "design-reference-staging");
  return inputPath
    ? path.resolve(process.cwd(), inputPath)
    : path.join(stagingDir, "latest-figma-summary.md");
}

function readSummaryMetadata(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Summary file not found: ${filePath}`);
  }

  const contents = fs.readFileSync(filePath, "utf8");
  const match = contents.match(/<!-- figma-summary-metadata\s*([\s\S]*?)\s*-->/);
  if (!match) {
    throw new Error(`Summary metadata block not found in: ${filePath}`);
  }

  return {
    contents,
    metadata: JSON.parse(match[1]),
  };
}

function toBulletSection(items, fallback) {
  if (!items || items.length === 0) {
    return `- ${fallback}`;
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function inferExpectedVisibleElements(metadata) {
  const items = [];
  for (const child of metadata.immediate_children || []) {
    if (!items.includes(child)) {
      items.push(child);
    }
  }

  for (const text of metadata.visible_text_nodes || []) {
    if (items.length >= 15) {
      break;
    }
    if (!items.includes(text)) {
      items.push(text);
    }
  }

  return items;
}

function inferExpectedStates(metadata) {
  const stateSignals = [];
  const combined = [
    ...(metadata.visible_text_nodes || []),
    ...(metadata.candidate_actions || []),
    ...(metadata.candidate_fields || []),
    ...(metadata.hierarchy_lines || []),
  ];

  for (const item of combined) {
    const normalized = String(item || "").trim();
    if (!normalized) {
      continue;
    }

    if (/\b(error|invalid|warning)\b/i.test(normalized)) {
      stateSignals.push(`Potential validation or error cue visible in design extract: ${normalized}`);
    } else if (/\b(success|done|completed)\b/i.test(normalized)) {
      stateSignals.push(`Potential success-state cue visible in design extract: ${normalized}`);
    } else if (/\b(disabled|inactive|readonly|read only)\b/i.test(normalized)) {
      stateSignals.push(`Possible disabled or restricted state cue visible in design extract: ${normalized}`);
    } else if (/\b(selected|active|default)\b/i.test(normalized)) {
      stateSignals.push(`Possible active or default-state cue visible in design extract: ${normalized}`);
    }

    if (stateSignals.length >= 8) {
      break;
    }
  }

  return Array.from(new Set(stateSignals));
}

function buildExpectedMarkdown(metadata, summaryPath) {
  const expectedVisibleElements = inferExpectedVisibleElements(metadata);
  const expectedStates = inferExpectedStates(metadata);
  const generatedAt = new Date().toISOString();
  const metadataBlock = `<!-- figma-expected-metadata\n${JSON.stringify(
    {
      source: "figma_rest_expected_handoff_v1",
      generated_at: generatedAt,
      summary_path: summaryPath,
      file_key: metadata.file_key,
      node_id: metadata.node_id,
      node_name: metadata.node_name,
      node_type: metadata.node_type,
    },
    null,
    2
  )}\n-->\n`;

  return `${metadataBlock}# Figma Expected Handoff

## Source

- File key: ${metadata.file_key}
- Node ID: ${metadata.node_id}
- Node name: ${metadata.node_name}
- Node type: ${metadata.node_type}
- Summary source: ${summaryPath}

## Design Confidence

- Level: MEDIUM
- Reason: REST node fetched successfully, but latest or approved design status is not confirmed.
- Freshness / Approval Evidence: Not confirmed from REST node extraction alone.
- Business Rule Alignment: Not yet compared with MoM or BPMN.
- Role / State / Data Match: Not yet verified against the target role, runtime state, or data condition.
- Confidence Impact: Use as provisional design evidence only. Any material mismatch must go to Needs Confirmation before bug language.

## Expected Visible Elements

${toBulletSection(expectedVisibleElements, "Use the summary artifact to confirm visible elements manually.")}

## Expected Fields

${toBulletSection(metadata.candidate_fields, "No clear field candidates detected from the extracted node.")}

## Expected Actions / Buttons

${toBulletSection(metadata.candidate_actions, "No clear action candidates detected from the extracted node.")}

## Expected States

${toBulletSection(expectedStates, "No explicit state cues were extracted from the current node.")}

## Unknowns / Assumptions

- Design freshness and approval status are still unknown.
- Business-rule alignment with MoM or BPMN has not been checked yet.
- Role, permission, environment, and data-state fit are not confirmed from design extraction alone.
- Hidden variants, responsive states, and conditional states may exist outside the fetched node.

## Needs Confirmation Before Bug

- Confirm the design is current or approved for the tested scope.
- Compare the design expectation against MoM or BPMN before treating it as business truth.
- Compare the design expectation against Browser Use UI actual for the same role, data, and environment.
- Compare against existing testcase coverage before deciding what is missing.
- Keep any mismatch as Needs Confirmation first unless design confidence and business confirmation become strong enough.

## Suggested Next Compare

- Compare with MoM or BPMN
- Compare with UI actual via Browser Use
- Compare with existing testcase sheet
`;
}

function writeFailure(status, message, extra = {}) {
  process.stdout.write(
    `${JSON.stringify({ status, message, ...extra }, null, 2)}\n`
  );
  process.exitCode = 1;
}

function main() {
  const summaryPath = resolveSummaryPath(process.argv[2]);
  const { metadata } = readSummaryMetadata(summaryPath);
  const stagingDir = path.join(paths.testingDir, "design-reference-staging");
  const expectedDir = ensureDir(path.join(stagingDir, "expected"));
  const latestPath = path.join(stagingDir, "latest-figma-expected.md");
  const timestamp = timestampForFile();
  const safeNodeName = sanitizeFileSegment(metadata.node_name || metadata.node_id, "figma-node");
  const outputPath = path.join(
    expectedDir,
    `figma-expected-${safeNodeName}-${timestamp}.md`
  );

  const markdown = buildExpectedMarkdown(metadata, summaryPath);
  writeText(outputPath, markdown);
  writeText(latestPath, markdown);

  process.stdout.write(
    `${JSON.stringify(
      {
        status: "OK",
        handoff: outputPath,
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
  writeFailure("INVALID_SUMMARY", error.stack || error.message);
}
