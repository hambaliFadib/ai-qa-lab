const fs = require("fs");
const path = require("path");
const { paths, ensureDir, readJsonIfExists, writeJson, writeText } = require("./workspace-paths");
const {
  parseArgs,
  safeErrorMessage,
  sanitizeFileSegment,
  timestampForFile,
  writeJsonOutput,
} = require("./qa-tool-common");
const { fetchAndWriteRange } = require("./google-sheets-fetch-range");

const PRESERVED_COLUMNS = [
  "Test Case ID",
  "Level",
  "Title",
  "Priority",
  "Automation Status",
  "Behaviour",
  "Data",
  "Steps",
  "Expected Result",
  "Actual Result",
  "Status",
  "Test Date",
  "Re-test Date",
  "Test Note",
  "Issue URL",
  "File Name",
  "Owner",
];

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeKey(value) {
  return normalize(value).toLowerCase();
}

function normalizeId(value) {
  return normalize(value).toUpperCase();
}

function detectHeaderRow(values) {
  for (let index = 0; index < values.length; index += 1) {
    const row = values[index] || [];
    const normalized = row.map(normalizeKey);
    if (normalized.includes("test case id") && normalized.includes("level") && normalized.includes("title")) {
      return index;
    }
  }

  return 0;
}

function buildHeaderMap(headerRow) {
  const map = new Map();
  for (let index = 0; index < headerRow.length; index += 1) {
    const key = normalizeKey(headerRow[index]);
    if (key && !map.has(key)) {
      map.set(key, index);
    }
  }
  return map;
}

function getCell(row, headerMap, columnName) {
  const index = headerMap.get(normalizeKey(columnName));
  if (index === undefined) {
    return "";
  }

  return normalize(row[index]);
}

function buildFields(row, headerMap) {
  const fields = {};
  for (const column of PRESERVED_COLUMNS) {
    fields[column] = getCell(row, headerMap, column);
  }
  return fields;
}

function isFeatureRow(fields) {
  const id = normalizeId(fields["Test Case ID"]);
  const level = normalizeKey(fields.Level);
  return level === "feature" || id.startsWith("FEAT-");
}

function isScenarioRow(fields) {
  const id = normalizeId(fields["Test Case ID"]);
  const level = normalizeKey(fields.Level);
  return level === "scenario" || id.startsWith("TS-");
}

function isTestCaseRow(fields) {
  const id = normalizeId(fields["Test Case ID"]);
  const level = normalizeKey(fields.Level);
  return level === "test case" || level === "testcase" || id.startsWith("TC-");
}

function normalizeStatus(value) {
  const status = normalizeKey(value);
  if (!status) {
    return "untested";
  }

  if (status === "passed" || status === "pass") {
    return "passed";
  }

  if (status === "failed" || status === "fail") {
    return "failed";
  }

  if (status === "untested" || status === "not tested" || status === "not run" || status === "todo" || status === "to do") {
    return "untested";
  }

  if (status === "retest" || status === "re-test" || status === "re test") {
    return "retest";
  }

  return "other";
}

function priorityRank(value) {
  const priority = normalizeKey(value);
  if (priority === "critical") {
    return 4;
  }
  if (priority === "high") {
    return 3;
  }
  if (priority === "medium") {
    return 2;
  }
  if (priority === "low") {
    return 1;
  }
  return 0;
}

function rankToRisk(rank) {
  if (rank >= 4) {
    return "critical";
  }
  if (rank === 3) {
    return "high";
  }
  if (rank === 2) {
    return "medium";
  }
  return "low";
}

function summarizeScenario(scenario) {
  const counts = {
    total: scenario.test_cases.length,
    passed: 0,
    failed: 0,
    untested: 0,
    retest: 0,
    blocked_other: 0,
  };
  let riskRank = priorityRank(scenario.fields.Priority);

  for (const testCase of scenario.test_cases) {
    const normalizedStatus = normalizeStatus(testCase.fields.Status);
    if (normalizedStatus === "passed") {
      counts.passed += 1;
    } else if (normalizedStatus === "failed") {
      counts.failed += 1;
    } else if (normalizedStatus === "untested") {
      counts.untested += 1;
    } else if (normalizedStatus === "retest") {
      counts.retest += 1;
    } else {
      counts.blocked_other += 1;
    }

    riskRank = Math.max(riskRank, priorityRank(testCase.fields.Priority));
  }

  let scenarioStatus = "testing";
  if (counts.failed > 0) {
    scenarioStatus = "failed";
  } else if (counts.total > 0 && counts.passed === counts.total) {
    scenarioStatus = "passed";
  } else if (counts.total === 0 || counts.untested === counts.total) {
    scenarioStatus = "untested";
  }

  scenario.counts = counts;
  scenario.scenario_status = scenarioStatus;
  scenario.risk = rankToRisk(riskRank);
  return scenario;
}

function makeFeature(fields, rowNumber) {
  return {
    feature_id: fields["Test Case ID"],
    title: fields.Title,
    row_number: rowNumber,
    fields,
    scenarios: [],
  };
}

function makeScenario(fields, rowNumber, feature) {
  return {
    scenario_id: fields["Test Case ID"],
    title: fields.Title,
    row_number: rowNumber,
    feature: feature
      ? {
          feature_id: feature.feature_id,
          title: feature.title,
          row_number: feature.row_number,
        }
      : null,
    fields,
    test_cases: [],
    counts: null,
    scenario_status: "untested",
    risk: "low",
  };
}

function makeImplicitScenario(rowNumber, feature) {
  const fields = {};
  for (const column of PRESERVED_COLUMNS) {
    fields[column] = "";
  }
  fields["Test Case ID"] = `UNSCENARIO-ROW-${rowNumber}`;
  fields.Level = "Scenario";
  fields.Title = "Ungrouped test cases";
  return makeScenario(fields, rowNumber, feature);
}

function makeTestCase(fields, rowNumber) {
  return {
    test_case_id: fields["Test Case ID"],
    title: fields.Title,
    row_number: rowNumber,
    fields,
  };
}

function scenarioMatchesFeature(scenario, featureFilter) {
  if (!featureFilter) {
    return true;
  }

  const filter = normalizeId(featureFilter);
  const featureId = normalizeId(scenario.feature?.feature_id);
  const featureTitle = normalizeId(scenario.feature?.title);
  return featureId === filter || featureTitle === filter;
}

function filterExtractionByFeature(extraction, featureFilter) {
  if (!featureFilter) {
    return extraction;
  }

  const scenarios = extraction.scenarios.filter((scenario) => scenarioMatchesFeature(scenario, featureFilter));
  const scenarioIds = new Set(scenarios.map((scenario) => scenario.scenario_id));
  const features = extraction.features
    .map((feature) => ({
      ...feature,
      scenarios: feature.scenarios.filter((scenario) => scenarioIds.has(scenario.scenario_id)),
    }))
    .filter((feature) => feature.scenarios.length > 0 || normalizeId(feature.feature_id) === normalizeId(featureFilter));

  return {
    ...extraction,
    feature_filter: featureFilter,
    features,
    scenarios,
  };
}

function parseRangeArtifact(rangeArtifact, options = {}) {
  const values = rangeArtifact.values || [];
  const headerIndex = detectHeaderRow(values);
  const headerRow = values[headerIndex] || [];
  const headerMap = buildHeaderMap(headerRow);
  const features = [];
  const scenarios = [];
  let currentFeature = null;
  let currentScenario = null;

  for (let rowIndex = headerIndex + 1; rowIndex < values.length; rowIndex += 1) {
    const row = values[rowIndex] || [];
    const fields = buildFields(row, headerMap);
    const hasAnyPreservedValue = PRESERVED_COLUMNS.some((column) => fields[column]);
    if (!hasAnyPreservedValue) {
      continue;
    }

    const rowNumber = rowIndex + 1;
    if (isFeatureRow(fields)) {
      currentFeature = makeFeature(fields, rowNumber);
      features.push(currentFeature);
      currentScenario = null;
      continue;
    }

    if (isScenarioRow(fields)) {
      currentScenario = summarizeScenario(makeScenario(fields, rowNumber, currentFeature));
      scenarios.push(currentScenario);
      if (currentFeature) {
        currentFeature.scenarios.push(currentScenario);
      }
      continue;
    }

    if (isTestCaseRow(fields)) {
      if (!currentScenario) {
        currentScenario = makeImplicitScenario(rowNumber, currentFeature);
        scenarios.push(currentScenario);
        if (currentFeature) {
          currentFeature.scenarios.push(currentScenario);
        }
      }

      currentScenario.test_cases.push(makeTestCase(fields, rowNumber));
      summarizeScenario(currentScenario);
    }
  }

  for (const scenario of scenarios) {
    summarizeScenario(scenario);
  }

  const extraction = {
    source: {
      spreadsheet_id: rangeArtifact.spreadsheet_id || null,
      sheet: rangeArtifact.sheet || options.sheet || null,
      range: rangeArtifact.range || options.range || null,
      requested_range: rangeArtifact.requested_range || null,
      returned_range: rangeArtifact.returned_range || null,
      raw_artifact: options.rawArtifactPath || null,
      range_fetched_at: rangeArtifact.fetched_at || null,
    },
    extracted_at: new Date().toISOString(),
    feature_filter: options.feature || null,
    header_row_number: headerIndex + 1,
    header_columns: headerRow.map(normalize),
    preserved_columns: PRESERVED_COLUMNS,
    features,
    scenarios,
    summary: summarizeExtraction(scenarios),
  };

  const filtered = filterExtractionByFeature(extraction, options.feature || "");
  return {
    ...filtered,
    summary: summarizeExtraction(filtered.scenarios),
  };
}

function summarizeExtraction(scenarios) {
  const summary = {
    scenario_count: scenarios.length,
    test_case_count: 0,
    by_status: {
      failed: 0,
      passed: 0,
      untested: 0,
      testing: 0,
    },
    by_risk: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
  };

  for (const scenario of scenarios) {
    summary.test_case_count += scenario.test_cases.length;
    summary.by_status[scenario.scenario_status] = (summary.by_status[scenario.scenario_status] || 0) + 1;
    summary.by_risk[scenario.risk] = (summary.by_risk[scenario.risk] || 0) + 1;
  }

  return summary;
}

function latestRangeArtifactPath() {
  return path.join(paths.testingDir, "spreadsheet-staging", "latest-range.json");
}

function readRangeArtifactFromPointer(pointerPath) {
  const pointer = readJsonIfExists(pointerPath, null);
  if (!pointer) {
    return null;
  }

  if (pointer.values) {
    return { artifact: pointer, artifactPath: pointerPath };
  }

  if (pointer.path && fs.existsSync(pointer.path)) {
    return { artifact: readJsonIfExists(pointer.path, null), artifactPath: pointer.path };
  }

  return null;
}

function latestRangeMatches(artifact, options = {}) {
  if (!artifact) {
    return false;
  }

  const sheetMatches = !options.sheet || normalizeKey(artifact.sheet) === normalizeKey(options.sheet);
  const rangeMatches = !options.range || normalizeKey(artifact.range) === normalizeKey(options.range);
  return sheetMatches && rangeMatches;
}

async function getRangeArtifact(options = {}) {
  const latest = readRangeArtifactFromPointer(latestRangeArtifactPath());
  if (latest && latestRangeMatches(latest.artifact, options)) {
    return {
      artifact: latest.artifact,
      artifactPath: latest.artifactPath,
      source: "latest_range_artifact",
    };
  }

  if (options.sheet && options.range) {
    const fetched = await fetchAndWriteRange({ sheet: options.sheet, range: options.range });
    return {
      artifact: fetched.artifact,
      artifactPath: fetched.outputPath,
      source: "google_sheets_api",
    };
  }

  throw new Error('No matching latest range artifact found. Run with --sheet "UI TEST - RBI" --range "A1:R1292" first.');
}

function escapeTableCell(value) {
  return normalize(value).replace(/\|/g, "\\|");
}

function statusCheckmark(status) {
  return normalizeStatus(status) === "passed" ? "x" : " ";
}

function buildMarkdown(extraction) {
  const lines = [
    "# Testcase Scenario Extraction",
    "",
    "## Source",
    "",
    `- Spreadsheet ID: ${extraction.source.spreadsheet_id || "Unknown"}`,
    `- Sheet: ${extraction.source.sheet || "Unknown"}`,
    `- Range: ${extraction.source.range || "Unknown"}`,
    `- Feature filter: ${extraction.feature_filter || "None"}`,
    `- Extracted at: ${extraction.extracted_at}`,
    "",
    "## Summary",
    "",
    `- Scenarios: ${extraction.summary.scenario_count}`,
    `- Test cases: ${extraction.summary.test_case_count}`,
    `- Failed scenarios: ${extraction.summary.by_status.failed || 0}`,
    `- Passed scenarios: ${extraction.summary.by_status.passed || 0}`,
    `- Untested scenarios: ${extraction.summary.by_status.untested || 0}`,
    `- Testing scenarios: ${extraction.summary.by_status.testing || 0}`,
    "",
  ];

  for (const scenario of extraction.scenarios) {
    const featureLabel = scenario.feature
      ? `${scenario.feature.feature_id} - ${scenario.feature.title || "Untitled feature"}`
      : "Unassigned";

    lines.push(
      `## ${scenario.scenario_id || "UNKNOWN-SCENARIO"} - ${scenario.title || "Untitled scenario"}`,
      "",
      `- Feature: ${featureLabel}`,
      `- Scenario Status: ${scenario.scenario_status}`,
      `- Risk: ${scenario.risk}`,
      `- Total Test Cases: ${scenario.counts.total}`,
      `- Passed: ${scenario.counts.passed}`,
      `- Failed: ${scenario.counts.failed}`,
      `- Untested: ${scenario.counts.untested}`,
      `- Retest: ${scenario.counts.retest}`,
      `- Blocked/Other: ${scenario.counts.blocked_other}`,
      "",
      "| Done | Test Case ID | Title | Priority | Status | Owner |",
      "| --- | --- | --- | --- | --- | --- |"
    );

    if (scenario.test_cases.length === 0) {
      lines.push("|  |  | No test cases grouped under this scenario. |  |  |  |");
    } else {
      for (const testCase of scenario.test_cases) {
        lines.push(
          `| [${statusCheckmark(testCase.fields.Status)}] | ${escapeTableCell(testCase.test_case_id)} | ${escapeTableCell(testCase.title)} | ${escapeTableCell(testCase.fields.Priority)} | ${escapeTableCell(testCase.fields.Status || "Untested")} | ${escapeTableCell(testCase.fields.Owner)} |`
        );
      }
    }

    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function writeExtractionArtifacts(extraction) {
  const stagingDir = path.join(paths.testingDir, "spreadsheet-staging");
  const scenariosDir = ensureDir(path.join(stagingDir, "scenarios"));
  const timestamp = timestampForFile();
  const safeSheet = sanitizeFileSegment(extraction.source.sheet || "sheet");
  const jsonPath = path.join(scenariosDir, `testcase-scenarios-${safeSheet}-${timestamp}.json`);
  const markdownPath = path.join(scenariosDir, `testcase-scenarios-${safeSheet}-${timestamp}.md`);
  const latestJsonPath = path.join(stagingDir, "latest-testcase-scenarios.json");
  const latestMarkdownPath = path.join(stagingDir, "latest-testcase-scenarios.md");
  const markdown = buildMarkdown(extraction);
  const payload = {
    ...extraction,
    artifact_path: jsonPath,
    markdown_path: markdownPath,
  };

  writeJson(jsonPath, payload);
  writeText(markdownPath, markdown);
  writeJson(latestJsonPath, payload);
  writeText(latestMarkdownPath, markdown);

  return {
    jsonPath,
    markdownPath,
    latestJsonPath,
    latestMarkdownPath,
  };
}

async function extractScenarios(options = {}) {
  const range = await getRangeArtifact(options);
  const extraction = parseRangeArtifact(range.artifact, {
    ...options,
    rawArtifactPath: range.artifactPath,
  });
  const pathsWritten = writeExtractionArtifacts(extraction);
  return {
    extraction,
    range_source: range.source,
    ...pathsWritten,
  };
}

async function main() {
  const args = parseArgs();
  const result = await extractScenarios({
    sheet: args.sheet,
    range: args.range,
    feature: args.feature,
  });

  writeJsonOutput({
    status: "OK",
    range_source: result.range_source,
    sheet: result.extraction.source.sheet,
    range: result.extraction.source.range,
    feature: result.extraction.feature_filter,
    scenario_count: result.extraction.summary.scenario_count,
    test_case_count: result.extraction.summary.test_case_count,
    output_json: result.jsonPath,
    output_md: result.markdownPath,
    latest_json: result.latestJsonPath,
    latest_md: result.latestMarkdownPath,
  });
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
  PRESERVED_COLUMNS,
  normalizeStatus,
  parseRangeArtifact,
  buildMarkdown,
  writeExtractionArtifacts,
  extractScenarios,
};
