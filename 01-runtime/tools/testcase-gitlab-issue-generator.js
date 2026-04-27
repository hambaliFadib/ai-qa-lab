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
const { extractScenarios, normalizeStatus } = require("./testcase-extract-scenarios");
const { createOrPreviewIssue } = require("./gitlab-create-issue");

const CHECK_DASH = "\u2014";

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeId(value) {
  return normalize(value).toUpperCase();
}

function latestScenarioPath() {
  return path.join(paths.testingDir, "spreadsheet-staging", "latest-testcase-scenarios.json");
}

function loadLatestScenarios() {
  const latestPath = latestScenarioPath();
  const latest = readJsonIfExists(latestPath, null);
  if (!latest) {
    throw new Error('No latest testcase scenario artifact found. Run testcase-extract-scenarios.js with --sheet and --range first.');
  }

  if (latest.scenarios) {
    return {
      extraction: latest,
      source: "latest-testcase-scenarios",
      path: latestPath,
    };
  }

  if (latest.path && fs.existsSync(latest.path)) {
    return {
      extraction: readJsonIfExists(latest.path, null),
      source: "latest-testcase-scenarios-pointer",
      path: latest.path,
    };
  }

  throw new Error(`Unsupported latest scenario artifact format: ${latestPath}`);
}

async function getScenarioExtraction(options) {
  if (options.sheet && options.range) {
    const result = await extractScenarios({
      sheet: options.sheet,
      range: options.range,
      feature: options.feature,
    });
    return {
      extraction: result.extraction,
      source: result.range_source,
      path: result.jsonPath,
    };
  }

  const latest = loadLatestScenarios();
  return latest;
}

function filterScenarios(scenarios, scenarioFilter) {
  if (!scenarioFilter) {
    return scenarios;
  }

  const wanted = normalizeId(scenarioFilter);
  return scenarios.filter((scenario) => normalizeId(scenario.scenario_id) === wanted);
}

function checklistMarker(status) {
  return normalizeStatus(status) === "passed" ? "x" : " ";
}

function displayStatus(status) {
  const normalized = normalizeStatus(status);
  if (normalized === "passed") {
    return "Passed";
  }
  if (normalized === "failed") {
    return "Failed";
  }
  if (normalized === "retest") {
    return "Retest";
  }
  if (normalized === "other") {
    return normalize(status) || "Blocked/Other";
  }
  return "Untested";
}

function issueTitle(scenario) {
  return `[${scenario.scenario_id || "UNKNOWN-SCENARIO"}] ${scenario.title || "Untitled scenario"}`;
}

function issueLabels(scenario) {
  return [
    "type::test-scenario",
    `status::${scenario.scenario_status}`,
    `risk::${scenario.risk}`,
  ];
}

function recommendedBoardColumn(scenario) {
  if (scenario.scenario_status === "failed") {
    return "Failed / Evidence Needed";
  }
  if (scenario.scenario_status === "untested") {
    return "Ready / Untested";
  }
  if (scenario.scenario_status === "passed") {
    return "Passed / Review";
  }
  return "Testing";
}

function failedTestCases(scenario) {
  return scenario.test_cases.filter((testCase) => normalizeStatus(testCase.fields.Status) === "failed");
}

function buildCurrentFindings(scenario) {
  const failedCases = failedTestCases(scenario);
  if (failedCases.length === 0) {
    return "- No failed testcase recorded in source spreadsheet.";
  }

  const lines = ["Generated from Failed test cases:"];
  for (const testCase of failedCases) {
    lines.push(
      `- Test Case: ${testCase.test_case_id || "Unknown"} - ${testCase.title || "Untitled test case"}`,
      `  - Actual Result: ${testCase.fields["Actual Result"] || "Not recorded"}`,
      `  - Test Note: ${testCase.fields["Test Note"] || "Not recorded"}`
    );
  }

  return lines.join("\n");
}

function buildEvidenceNeeded(scenario) {
  const lines = [
    "Generated based on scenario and failed/untested cases:",
    "- screenshot",
    "- screen recording if needed",
    "- actual result",
    "- data used",
    "- blocker/question",
  ];

  if (scenario.risk === "critical") {
    lines.push("- UI/API/DB evidence if critical");
  } else {
    lines.push("- UI/API/DB evidence when needed");
  }

  return lines.join("\n");
}

function buildTestCaseChecklist(scenario) {
  if (!scenario.test_cases.length) {
    return "- [ ] No test cases grouped under this scenario.";
  }

  return scenario.test_cases
    .map((testCase) => {
      const id = testCase.test_case_id || "UNKNOWN-TC";
      const title = testCase.title || "Untitled test case";
      const status = displayStatus(testCase.fields.Status);
      return `- [${checklistMarker(testCase.fields.Status)}] ${id} ${CHECK_DASH} ${title} ${CHECK_DASH} ${status}`;
    })
    .join("\n");
}

function buildIssueDescription({ extraction, scenario }) {
  const sheet = extraction.source?.sheet || "Unknown sheet";
  const featureId = scenario.feature?.feature_id || extraction.feature_filter || "Unknown feature";
  const featureTitle = scenario.feature?.title || "";
  const featureLine = `${featureId}${featureTitle ? ` - ${featureTitle}` : ""}`;
  const scenarioLine = `${scenario.scenario_id || "Unknown scenario"} - ${scenario.title || "Untitled scenario"}`;
  const counts = scenario.counts || {
    total: 0,
    passed: 0,
    failed: 0,
    untested: 0,
    retest: 0,
    blocked_other: 0,
  };

  return `## Source
TEST CASE - PGN BILLING / ${sheet}

## Feature
${featureLine}

## Scenario
${scenarioLine}

## Status Summary
- Scenario Status: ${scenario.scenario_status}
- Risk: ${scenario.risk}
- Total Test Cases: ${counts.total}
- Passed: ${counts.passed}
- Failed: ${counts.failed}
- Untested: ${counts.untested}
- Retest: ${counts.retest}
- Blocked/Other: ${counts.blocked_other}

## Test Cases
${buildTestCaseChecklist(scenario)}

## Current Findings
${buildCurrentFindings(scenario)}

## Evidence Needed
${buildEvidenceNeeded(scenario)}

## Execution Notes
Actual Result:
Evidence:
Blocker:
Question:

## Guardrail
This issue is generated from controlled testcase source.
It is not a final bug report.
Failed test cases require latest evidence before final bug classification.
MoM/BPMN/Figma conflicts must go to Needs Confirmation.
`;
}

function writeIssueMarkdown({ scenario, title, labels, description }) {
  const dir = ensureDir(path.join(paths.testingDir, "gitlab-staging", "testcase-issues"));
  const outputPath = path.join(
    dir,
    `testcase-issue-${sanitizeFileSegment(scenario.scenario_id || title, "scenario")}-${timestampForFile()}.md`
  );

  const markdown = `# ${title}

Labels: ${labels.join(", ")}

${description}`;
  writeText(outputPath, markdown);
  return outputPath;
}

function writeDescriptionFile({ scenario, description }) {
  const dir = ensureDir(path.join(paths.testingDir, "gitlab-staging", "testcase-issues"));
  const outputPath = path.join(
    dir,
    `testcase-issue-description-${sanitizeFileSegment(scenario.scenario_id || "scenario")}-${timestampForFile()}.md`
  );
  writeText(outputPath, description);
  return outputPath;
}

function buildBulkSummaryMarkdown(summary) {
  const lines = [
    "# GitLab Testcase Issue Preview",
    "",
    `Generated at: ${summary.generated_at}`,
    `Mode: ${summary.mode}`,
    `Source artifact: ${summary.source_artifact || "Unknown"}`,
    `Total scenarios: ${summary.total_scenarios}`,
    "",
    "| Scenario | Status | Risk | Labels | Board Column | Output | Issue URL |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];

  for (const item of summary.issues) {
    lines.push(
      `| ${item.scenario_id} | ${item.scenario_status} | ${item.risk} | ${item.labels.join(", ")} | ${item.recommended_board_column} | ${item.output || ""} | ${item.issue_url || ""} |`
    );
  }

  lines.push(
    "",
    "## Guardrail",
    "",
    "- Dry-run does not create GitLab issues.",
    "- Execute mode requires explicit `--execute`.",
    "- Spreadsheet Issue URL is not updated by this generator."
  );

  return `${lines.join("\n")}\n`;
}

function writeBulkSummary(summary) {
  const stagingDir = ensureDir(path.join(paths.testingDir, "gitlab-staging"));
  const jsonPath = path.join(stagingDir, "latest-bulk-issue-preview.json");
  const markdownPath = path.join(stagingDir, "latest-bulk-issue-preview.md");
  writeJson(jsonPath, summary);
  writeText(markdownPath, buildBulkSummaryMarkdown(summary));
  return { jsonPath, markdownPath };
}

function writeCreatedIssueMap(items) {
  const stagingDir = ensureDir(path.join(paths.testingDir, "gitlab-staging"));
  const jsonPath = path.join(stagingDir, "latest-created-issue-map.json");
  const markdownPath = path.join(stagingDir, "latest-created-issue-map.md");
  const payload = {
    generated_at: new Date().toISOString(),
    issues: items.map((item) => ({
      scenario_id: item.scenario_id,
      title: item.title,
      issue_url: item.issue_url,
      gitlab_iid: item.gitlab_iid,
      gitlab_id: item.gitlab_id,
    })),
  };
  const lines = [
    "# Created GitLab Issue Map",
    "",
    `Generated at: ${payload.generated_at}`,
    "",
    "| Scenario | GitLab IID | Issue URL |",
    "| --- | --- | --- |",
    ...payload.issues.map((item) => `| ${item.scenario_id} | ${item.gitlab_iid || ""} | ${item.issue_url || ""} |`),
    "",
  ];

  writeJson(jsonPath, payload);
  writeText(markdownPath, lines.join("\n"));
  return { jsonPath, markdownPath };
}

async function generateIssues(options = {}) {
  const execute = Boolean(options.execute);
  const extractionInfo = await getScenarioExtraction(options);
  const selectedScenarios = filterScenarios(extractionInfo.extraction.scenarios || [], options.scenario);

  if (selectedScenarios.length === 0) {
    throw new Error(options.scenario ? `Scenario not found: ${options.scenario}` : "No scenarios found to generate GitLab issues.");
  }

  const issues = [];
  const createdItems = [];

  for (const scenario of selectedScenarios) {
    const title = issueTitle(scenario);
    const labels = issueLabels(scenario);
    const description = buildIssueDescription({
      extraction: extractionInfo.extraction,
      scenario,
    });
    const issueMarkdownPath = writeIssueMarkdown({ scenario, title, labels, description });
    const descriptionPath = writeDescriptionFile({ scenario, description });
    const result = await createOrPreviewIssue({
      title,
      descriptionFile: descriptionPath,
      labels,
      execute,
      source: {
        generator: "testcase-gitlab-issue-generator",
        extraction_artifact: extractionInfo.path,
        scenario_id: scenario.scenario_id,
      },
    });

    const issueUrl = result.issue?.web_url || result.issue?.url || null;
    const item = {
      scenario_id: scenario.scenario_id,
      title,
      scenario_status: scenario.scenario_status,
      risk: scenario.risk,
      labels,
      recommended_board_column: recommendedBoardColumn(scenario),
      issue_markdown: issueMarkdownPath,
      description_file: descriptionPath,
      output: result.outputPath,
      mode: result.mode,
      issue_url: issueUrl,
      gitlab_iid: result.issue?.iid || null,
      gitlab_id: result.issue?.id || null,
    };
    issues.push(item);

    if (execute) {
      createdItems.push(item);
    }
  }

  const summary = {
    generated_at: new Date().toISOString(),
    mode: execute ? "execute" : "dry-run",
    source: extractionInfo.source,
    source_artifact: extractionInfo.path,
    sheet: extractionInfo.extraction.source?.sheet || null,
    range: extractionInfo.extraction.source?.range || null,
    feature: extractionInfo.extraction.feature_filter || null,
    scenario_filter: options.scenario || null,
    total_scenarios: issues.length,
    issues,
    guardrail: "Default mode is dry-run. Direct GitLab creation requires explicit --execute.",
  };
  const summaryPaths = writeBulkSummary(summary);
  const createdMapPaths = execute ? writeCreatedIssueMap(createdItems) : null;

  return {
    summary,
    summaryPaths,
    createdMapPaths,
  };
}

async function main() {
  const args = parseArgs();
  const result = await generateIssues({
    sheet: args.sheet,
    range: args.range,
    feature: args.feature,
    scenario: args.scenario,
    execute: Boolean(args.execute),
  });

  writeJsonOutput({
    status: result.summary.mode === "execute" ? "CREATED" : "DRY_RUN",
    mode: result.summary.mode,
    total_scenarios: result.summary.total_scenarios,
    preview_json: result.summaryPaths.jsonPath,
    preview_md: result.summaryPaths.markdownPath,
    created_issue_map_json: result.createdMapPaths?.jsonPath || null,
    created_issue_map_md: result.createdMapPaths?.markdownPath || null,
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
  buildIssueDescription,
  generateIssues,
};
