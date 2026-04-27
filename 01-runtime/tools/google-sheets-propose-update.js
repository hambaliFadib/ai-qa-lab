const fs = require("fs");
const path = require("path");
const { paths, ensureDir, writeJson, writeText } = require("./workspace-paths");
const {
  parseArgs,
  readJson,
  resolveMaybeRelative,
  safeErrorMessage,
  sanitizeFileSegment,
  timestampForFile,
  writeJsonOutput,
} = require("./qa-tool-common");

const DEFAULT_SPREADSHEET_TITLE = "TEST CASE - PGN BILLING";
const DEFAULT_SPREADSHEET_ID = "1mpF5S2nwoUcy6c0FNME6iBueWTl7OxGOYCb7X2crdao";

const EXECUTION_COLUMNS = new Set([
  "Actual Result",
  "Status",
  "Test Date",
  "Re-test Date",
  "Test Note",
  "Issue URL",
  "File Name",
  "Owner",
]);

const DEFINITION_COLUMNS = new Set([
  "Title",
  "Priority",
  "Behaviour",
  "Data",
  "Steps",
  "Expected Result",
  "Automation Status",
]);

const PROTECTED_COLUMNS = new Set([
  "Test Case ID",
  "Level",
  "Create Date",
]);

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeColumn(value) {
  const wanted = normalize(value).toLowerCase();
  for (const column of [...EXECUTION_COLUMNS, ...DEFINITION_COLUMNS, ...PROTECTED_COLUMNS]) {
    if (column.toLowerCase() === wanted) {
      return column;
    }
  }
  return normalize(value);
}

function classifyColumn(column) {
  const normalized = normalizeColumn(column);
  if (EXECUTION_COLUMNS.has(normalized)) {
    return "execution_update";
  }
  if (DEFINITION_COLUMNS.has(normalized)) {
    return "testcase_definition_update";
  }
  if (PROTECTED_COLUMNS.has(normalized)) {
    return "protected_structural_update";
  }
  return "unknown_column_risk";
}

function parseMarkdownMetadata(contents) {
  const metadata = {};
  const patterns = {
    spreadsheet: /-\s*Spreadsheet\s*:\s*(.+)/i,
    sheet: /-\s*Sheet\s*:\s*(.+)/i,
    row: /-\s*Row\s*:\s*(.+)/i,
    test_case_id: /-\s*Test Case ID\s*:\s*(.+)/i,
    columns: /-\s*Column\(s\)\s*:\s*(.+)/i,
    confidence: /## Confidence\s*\r?\n\s*-\s*(.+)/i,
    risk: /## Risk\s*\r?\n\s*-\s*(.+)/i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = contents.match(pattern);
    if (match) {
      metadata[key] = normalize(match[1]);
    }
  }

  return metadata;
}

function parseMarkdownTable(contents, metadata) {
  const rows = [];
  const lines = contents.split(/\r?\n/);
  let inTable = false;
  let headers = [];

  for (const line of lines) {
    if (!line.trim().startsWith("|")) {
      if (inTable) {
        break;
      }
      continue;
    }

    const cells = line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());

    if (!inTable) {
      headers = cells.map((cell) => cell.toLowerCase());
      const hasOldNew =
        headers.includes("column") &&
        headers.some((header) => header.includes("old")) &&
        headers.some((header) => header.includes("new"));
      if (hasOldNew) {
        inTable = true;
      }
      continue;
    }

    if (cells.every((cell) => /^-+$/.test(cell.replace(/\s/g, "")))) {
      continue;
    }

    const get = (namePattern) => {
      const index = headers.findIndex((header) => namePattern.test(header));
      return index >= 0 ? cells[index] || "" : "";
    };

    const column = get(/^column$/i);
    if (!column) {
      continue;
    }

    rows.push({
      sheet: metadata.sheet || "",
      row: Number(metadata.row) || null,
      test_case_id: metadata.test_case_id || "",
      column,
      old_value: get(/old/i),
      new_value: get(/new|proposed/i),
      reason: get(/reason/i),
      evidence: "",
      confidence: metadata.confidence || "LOW",
      requires_confirmation: /confirmation|conflict|blocked/i.test(metadata.risk || contents),
      gitlab_issue: "",
    });
  }

  return rows;
}

function normalizeUpdate(update, defaults = {}) {
  const column = normalizeColumn(update.column || update.column_name || update.target_column);
  const risk = classifyColumn(column);
  return {
    sheet: normalize(update.sheet || defaults.sheet),
    row: Number(update.row || update.row_number || defaults.row) || null,
    test_case_id: normalize(update.test_case_id || update.testCaseId || defaults.test_case_id),
    column,
    old_value: update.old_value !== undefined ? String(update.old_value) : String(update.oldValue || ""),
    new_value: update.new_value !== undefined ? String(update.new_value) : String(update.newValue || update.proposed_new_value || ""),
    reason: normalize(update.reason || defaults.reason),
    evidence: normalize(update.evidence || defaults.evidence),
    confidence: normalize(update.confidence || defaults.confidence || "LOW").toUpperCase(),
    requires_confirmation: Boolean(update.requires_confirmation ?? update.requiresConfirmation ?? risk !== "execution_update"),
    gitlab_issue: normalize(update.gitlab_issue || update.gitlabIssue || defaults.gitlab_issue),
    risk,
  };
}

function buildPlanFromJson(input) {
  const rawUpdates = input.updates || input.proposed_updates || input.proposedUpdates || [];
  const defaults = {
    sheet: input.sheet || input.target_sheet || input.target?.sheet,
    row: input.row || input.target_row || input.target?.row,
    test_case_id: input.test_case_id || input.target?.test_case_id,
    reason: input.reason || input.reason_for_update,
    evidence: input.evidence,
    confidence: input.confidence,
    gitlab_issue: input.gitlab_issue,
  };

  return {
    source_spreadsheet: input.source_spreadsheet || input.spreadsheet || DEFAULT_SPREADSHEET_TITLE,
    spreadsheet_id: input.spreadsheet_id || DEFAULT_SPREADSHEET_ID,
    generated_from: "json_candidate",
    reason_for_update: input.reason_for_update || input.reason || "",
    evidence_sources: input.evidence_sources || input.evidence || {},
    approval_status: input.approval_status || "APPROVAL_REQUIRED",
    approved_by: input.approved_by || "",
    updates: rawUpdates.map((update) => normalizeUpdate(update, defaults)),
  };
}

function buildPlanFromMarkdown(contents) {
  const metadata = parseMarkdownMetadata(contents);
  const updates = parseMarkdownTable(contents, metadata).map((update) => normalizeUpdate(update, metadata));
  return {
    source_spreadsheet: metadata.spreadsheet || DEFAULT_SPREADSHEET_TITLE,
    spreadsheet_id: DEFAULT_SPREADSHEET_ID,
    generated_from: "markdown_candidate",
    reason_for_update: "",
    evidence_sources: {
      raw_candidate: "Markdown candidate input retained in source artifact.",
    },
    approval_status: "APPROVAL_REQUIRED",
    approved_by: "",
    updates,
  };
}

function readCandidate(inputPath) {
  const resolved = resolveMaybeRelative(inputPath);
  if (!resolved || !fs.existsSync(resolved)) {
    throw new Error(`Input candidate not found: ${resolved || inputPath}`);
  }

  const contents = fs.readFileSync(resolved, "utf8");
  if (/\.json$/i.test(resolved)) {
    return {
      path: resolved,
      plan: buildPlanFromJson(readJson(resolved)),
      raw: contents,
    };
  }

  try {
    return {
      path: resolved,
      plan: buildPlanFromJson(JSON.parse(contents)),
      raw: contents,
    };
  } catch (error) {
    return {
      path: resolved,
      plan: buildPlanFromMarkdown(contents),
      raw: contents,
    };
  }
}

function validatePlan(plan) {
  const errors = [];
  if (!plan.source_spreadsheet) {
    errors.push("source_spreadsheet is required");
  }
  if (!plan.spreadsheet_id) {
    errors.push("spreadsheet_id is required");
  }
  if (!Array.isArray(plan.updates) || plan.updates.length === 0) {
    errors.push("at least one proposed update is required");
  }

  for (const [index, update] of (plan.updates || []).entries()) {
    if (!update.sheet) {
      errors.push(`updates[${index}].sheet is required`);
    }
    if (!update.row) {
      errors.push(`updates[${index}].row is required`);
    }
    if (!update.column) {
      errors.push(`updates[${index}].column is required`);
    }
    if (update.old_value === undefined) {
      errors.push(`updates[${index}].old_value is required`);
    }
    if (update.new_value === undefined) {
      errors.push(`updates[${index}].new_value is required`);
    }
    if (!update.reason) {
      errors.push(`updates[${index}].reason is required`);
    }
    if (!update.evidence) {
      errors.push(`updates[${index}].evidence is required`);
    }
    if (!update.confidence) {
      errors.push(`updates[${index}].confidence is required`);
    }
  }

  return errors;
}

function buildMarkdown(plan, validationErrors) {
  const lines = [
    "# Testcase Update Plan",
    "",
    "## Source Spreadsheet",
    `- ${plan.source_spreadsheet}`,
    "",
    "## Target Spreadsheet ID",
    `- ${plan.spreadsheet_id}`,
    "",
    "## Approval Status",
    `- ${plan.approval_status || "APPROVAL_REQUIRED"}`,
    "",
    "## Proposed Updates",
    "",
    "| Row | Test Case ID | Sheet | Column | Old Value | New Value | Reason | Evidence | Confidence | Risk | Requires Confirmation |",
    "|---|---|---|---|---|---|---|---|---|---|---|",
  ];

  for (const update of plan.updates || []) {
    lines.push(
      `| ${update.row || ""} | ${update.test_case_id || ""} | ${update.sheet || ""} | ${update.column || ""} | ${String(update.old_value || "").replace(/\|/g, "\\|")} | ${String(update.new_value || "").replace(/\|/g, "\\|")} | ${String(update.reason || "").replace(/\|/g, "\\|")} | ${String(update.evidence || "").replace(/\|/g, "\\|")} | ${update.confidence || ""} | ${update.risk || ""} | ${update.requires_confirmation ? "Yes" : "No"} |`
    );
  }

  lines.push(
    "",
    "## QA Approval",
    "- [ ] Approved",
    "- [ ] Rejected",
    "- [ ] Revise",
    "",
    "## Write Command",
    "Generated only after approval.",
    "",
    "```powershell",
    "node 01-runtime/tools/google-sheets-apply-approved-update.js --plan \"06-testing/spreadsheet-staging/latest-update-plan.json\" --dry-run",
    "```",
    "",
    "## Validation",
    validationErrors.length === 0 ? "- Plan is structurally ready for QA review." : "- Plan requires revision before apply tool can run."
  );

  for (const error of validationErrors) {
    lines.push(`- ${error}`);
  }

  return `${lines.join("\n")}\n`;
}

function writePlan(plan, sourcePath) {
  const stagingDir = path.join(paths.testingDir, "spreadsheet-staging");
  const plansDir = ensureDir(path.join(stagingDir, "update-plans"));
  const timestamp = timestampForFile();
  const baseName = sanitizeFileSegment(path.basename(sourcePath || "candidate"), "candidate");
  const jsonPath = path.join(plansDir, `testcase-update-plan-${baseName}-${timestamp}.json`);
  const markdownPath = path.join(plansDir, `testcase-update-plan-${baseName}-${timestamp}.md`);
  const latestJsonPath = path.join(stagingDir, "latest-update-plan.json");
  const latestMarkdownPath = path.join(stagingDir, "latest-update-plan.md");
  const validationErrors = validatePlan(plan);
  const payload = {
    ...plan,
    generated_at: new Date().toISOString(),
    source_candidate: sourcePath,
    validation_errors: validationErrors,
    write_guardrail: "No spreadsheet write is performed by this tool. QA approval and apply-approved-update are required.",
  };
  const markdown = buildMarkdown(payload, validationErrors);

  writeJson(jsonPath, payload);
  writeText(markdownPath, markdown);
  writeJson(latestJsonPath, payload);
  writeText(latestMarkdownPath, markdown);

  return {
    jsonPath,
    markdownPath,
    latestJsonPath,
    latestMarkdownPath,
    validationErrors,
  };
}

function main() {
  const args = parseArgs();
  const inputPath = args.input || args.candidate || args._?.[0];
  if (!inputPath) {
    throw new Error('Usage: node google-sheets-propose-update.js --input "<candidate.json|candidate.md>"');
  }

  const candidate = readCandidate(inputPath);
  const output = writePlan(candidate.plan, candidate.path);
  writeJsonOutput({
    status: output.validationErrors.length === 0 ? "PLAN_READY_FOR_QA_REVIEW" : "PLAN_NEEDS_REVISION",
    output_json: output.jsonPath,
    output_md: output.markdownPath,
    latest_json: output.latestJsonPath,
    latest_md: output.latestMarkdownPath,
    validation_errors: output.validationErrors,
  });
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    writeJsonOutput({
      status: "READY_ERROR",
      message: safeErrorMessage(error),
    });
    process.exitCode = 1;
  }
}

module.exports = {
  buildPlanFromJson,
  buildPlanFromMarkdown,
  validatePlan,
  writePlan,
};
