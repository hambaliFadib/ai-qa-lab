const fs = require("fs");
const path = require("path");
const { paths, ensureDir, readJsonIfExists, writeJson, writeText } = require("./workspace-paths");
const {
  parseArgs,
  resolveMaybeRelative,
  safeErrorMessage,
  sanitizeFileSegment,
  timestampForFile,
  writeJsonOutput,
} = require("./qa-tool-common");
const { getConfig } = require("./google-sheets-readonly-check");

const WRITE_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const APPROVAL_PHRASE = "APPROVED BY QA";

const PROTECTED_COLUMNS = new Set(["Test Case ID", "Level", "Create Date"]);

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeColumn(value) {
  return normalize(value).toLowerCase();
}

function loadGoogleApis() {
  try {
    return require("googleapis").google;
  } catch (error) {
    const wrapped = new Error("The googleapis dependency is not installed. Run npm install from 01-runtime.");
    wrapped.cause = error;
    throw wrapped;
  }
}

function quoteSheetName(sheetName) {
  return `'${String(sheetName || "").replace(/'/g, "''")}'`;
}

function columnIndexToLetters(index) {
  let n = index + 1;
  let letters = "";
  while (n > 0) {
    const remainder = (n - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function lettersToColumnIndex(letters) {
  let index = 0;
  for (const char of String(letters || "").toUpperCase()) {
    if (char < "A" || char > "Z") {
      return null;
    }
    index = index * 26 + (char.charCodeAt(0) - 64);
  }
  return index > 0 ? index - 1 : null;
}

function a1(sheet, cell) {
  return `${quoteSheetName(sheet)}!${cell}`;
}

function readPlan(planPath) {
  const resolved = resolveMaybeRelative(planPath);
  if (!resolved || !fs.existsSync(resolved)) {
    throw new Error(`Update plan not found: ${resolved || planPath}`);
  }

  const plan = readJsonIfExists(resolved, null);
  if (!plan) {
    throw new Error(`Update plan is not valid JSON: ${resolved}`);
  }

  return {
    path: resolved,
    plan,
  };
}

function validatePlanShape(plan) {
  const errors = [];
  if (!plan.source_spreadsheet) {
    errors.push("source_spreadsheet is required");
  }
  if (!plan.spreadsheet_id) {
    errors.push("spreadsheet_id is required");
  }
  if (!Array.isArray(plan.updates) || plan.updates.length === 0) {
    errors.push("updates must contain at least one row");
  }

  for (const [index, update] of (plan.updates || []).entries()) {
    if (!update.sheet) {
      errors.push(`updates[${index}].sheet is required`);
    }
    if (!Number(update.row)) {
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
  }

  return errors;
}

function assertApproval({ execute, approvalText }) {
  if (!execute) {
    return;
  }

  if (!String(approvalText || "").includes(APPROVAL_PHRASE)) {
    throw new Error(`Execute mode requires --approval-text containing "${APPROVAL_PHRASE}".`);
  }
}

async function createSheetsClient() {
  const config = getConfig();
  if (!config.credentialsPath || !fs.existsSync(config.credentialsPath)) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS is missing or points to a file that does not exist.");
  }

  const google = loadGoogleApis();
  const auth = new google.auth.GoogleAuth({
    keyFile: config.credentialsPath,
    scopes: [WRITE_SCOPE],
  });
  return google.sheets({ version: "v4", auth });
}

async function readHeader(sheets, spreadsheetId, sheetName) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${quoteSheetName(sheetName)}!A1:ZZ1`,
    valueRenderOption: "FORMATTED_VALUE",
  });
  return response.data.values?.[0] || [];
}

function resolveColumn(update, header) {
  const rawColumn = normalize(update.column);
  const explicitLetter = /^[A-Za-z]+$/.test(rawColumn) ? rawColumn.toUpperCase() : "";

  if (explicitLetter && !header.some((cell) => normalizeColumn(cell) === normalizeColumn(rawColumn))) {
    const index = lettersToColumnIndex(explicitLetter);
    return {
      letter: explicitLetter,
      index,
      headerName: index !== null ? normalize(header[index]) : "",
      protected: PROTECTED_COLUMNS.has(normalize(header[index])),
    };
  }

  const index = header.findIndex((cell) => normalizeColumn(cell) === normalizeColumn(rawColumn));
  if (index < 0) {
    throw new Error(`Column not found in header row for sheet "${update.sheet}": ${rawColumn}`);
  }

  const headerName = normalize(header[index]);
  return {
    letter: columnIndexToLetters(index),
    index,
    headerName,
    protected: PROTECTED_COLUMNS.has(headerName),
  };
}

async function prepareUpdates({ sheets, spreadsheetId, plan, allowStructuralUpdate }) {
  const headersBySheet = new Map();
  const prepared = [];

  for (const update of plan.updates) {
    if (!headersBySheet.has(update.sheet)) {
      headersBySheet.set(update.sheet, await readHeader(sheets, spreadsheetId, update.sheet));
    }

    const header = headersBySheet.get(update.sheet);
    const column = resolveColumn(update, header);
    if (column.protected && !allowStructuralUpdate) {
      throw new Error(`Protected structural column requires --allow-structural-update: ${column.headerName || update.column}`);
    }

    const cell = `${column.letter}${Number(update.row)}`;
    prepared.push({
      ...update,
      row: Number(update.row),
      column_letter: column.letter,
      resolved_column: column.headerName || update.column,
      cell,
      range: a1(update.sheet, cell),
    });
  }

  return prepared;
}

async function verifyOldValues({ sheets, spreadsheetId, preparedUpdates }) {
  const mismatches = [];
  const verified = [];

  for (const update of preparedUpdates) {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: update.range,
      valueRenderOption: "FORMATTED_VALUE",
      dateTimeRenderOption: "FORMATTED_STRING",
    });
    const currentValue = response.data.values?.[0]?.[0] ?? "";
    const expectedOld = update.old_value ?? "";
    const matches = String(currentValue) === String(expectedOld);

    verified.push({
      sheet: update.sheet,
      row: update.row,
      cell: update.cell,
      column: update.resolved_column,
      expected_old_value: String(expectedOld),
      current_value: String(currentValue),
      matches,
    });

    if (!matches) {
      mismatches.push(verified[verified.length - 1]);
    }
  }

  return { verified, mismatches };
}

async function applyUpdates({ sheets, spreadsheetId, preparedUpdates }) {
  const data = preparedUpdates.map((update) => ({
    range: update.range,
    values: [[update.new_value ?? ""]],
  }));

  const response = await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data,
    },
  });

  return response.data;
}

function appendLog({ updates, approvalText }) {
  const logPath = path.join(paths.testingDir, "spreadsheet-governance", "testcase-update-log.md");
  ensureDir(path.dirname(logPath));
  const existing = fs.existsSync(logPath)
    ? fs.readFileSync(logPath, "utf8").trimEnd()
    : [
        "# Testcase Update Log",
        "",
        "| Date | Sheet | Row | Test Case ID | Column | Old Value | New Value | Approved By | Evidence | GitLab Issue | Notes |",
        "|---|---|---|---|---|---|---|---|---|---|---|",
      ].join("\n");
  const now = new Date().toISOString();
  const approvedBy = String(approvalText || "").replace(APPROVAL_PHRASE, "").replace(/^[-:\s]+/, "").trim() || "QA";
  const rows = updates.map((update) => {
    const cells = [
      now,
      update.sheet,
      update.row,
      update.test_case_id || "",
      update.resolved_column || update.column,
      String(update.old_value || ""),
      String(update.new_value || ""),
      approvedBy,
      update.evidence || "",
      update.gitlab_issue || "",
      update.reason || "",
    ].map((cell) => String(cell).replace(/\|/g, "\\|"));
    return `| ${cells.join(" | ")} |`;
  });

  writeText(logPath, `${existing}\n${rows.join("\n")}\n`);
  return logPath;
}

function writeRunArtifact({ mode, planPath, plan, preparedUpdates, verification, result, error }) {
  const dir = ensureDir(path.join(paths.testingDir, "spreadsheet-staging", "applied-updates"));
  const outputPath = path.join(
    dir,
    `spreadsheet-update-${mode}-${sanitizeFileSegment(path.basename(planPath), "plan")}-${timestampForFile()}.json`
  );
  const payload = {
    generated_at: new Date().toISOString(),
    mode,
    plan_path: planPath,
    spreadsheet_id: plan.spreadsheet_id,
    source_spreadsheet: plan.source_spreadsheet,
    updates: preparedUpdates,
    verification,
    result: result || null,
    error: error || null,
  };
  writeJson(outputPath, payload);
  return outputPath;
}

async function run() {
  const args = parseArgs();
  const execute = Boolean(args.execute);
  const planPath = args.plan || args._?.[0];
  const approvalText = args["approval-text"] || "";
  const allowStructuralUpdate = Boolean(args["allow-structural-update"]);

  if (!planPath) {
    throw new Error('Usage: node google-sheets-apply-approved-update.js --plan "06-testing/spreadsheet-staging/latest-update-plan.json" --dry-run');
  }

  assertApproval({ execute, approvalText });

  const { path: resolvedPlanPath, plan } = readPlan(planPath);
  const shapeErrors = validatePlanShape(plan);
  if (shapeErrors.length > 0) {
    throw new Error(`Update plan is incomplete: ${shapeErrors.join("; ")}`);
  }

  const spreadsheetId = plan.spreadsheet_id;
  const sheets = execute ? await createSheetsClient() : null;
  let preparedUpdates = plan.updates.map((update) => ({
    ...update,
    row: Number(update.row),
  }));
  let verification = {
    verified: [],
    mismatches: [],
    skipped: !execute,
    reason: execute ? "" : "dry-run does not contact Google Sheets",
  };

  if (execute) {
    preparedUpdates = await prepareUpdates({
      sheets,
      spreadsheetId,
      plan,
      allowStructuralUpdate,
    });
    verification = await verifyOldValues({
      sheets,
      spreadsheetId,
      preparedUpdates,
    });

    if (verification.mismatches.length > 0) {
      const outputPath = writeRunArtifact({
        mode: "aborted-old-value-mismatch",
        planPath: resolvedPlanPath,
        plan,
        preparedUpdates,
        verification,
        error: "Old value mismatch. No spreadsheet update was applied.",
      });
      return {
        status: "ABORTED_OLD_VALUE_MISMATCH",
        output: outputPath,
        mismatches: verification.mismatches,
      };
    }

    const result = await applyUpdates({
      sheets,
      spreadsheetId,
      preparedUpdates,
    });
    const logPath = appendLog({ updates: preparedUpdates, approvalText });
    const outputPath = writeRunArtifact({
      mode: "execute",
      planPath: resolvedPlanPath,
      plan,
      preparedUpdates,
      verification,
      result,
    });
    return {
      status: "UPDATED",
      output: outputPath,
      log: logPath,
      updated_cells: result.totalUpdatedCells || preparedUpdates.length,
    };
  }

  const outputPath = writeRunArtifact({
    mode: "dry-run",
    planPath: resolvedPlanPath,
    plan,
    preparedUpdates,
    verification,
  });
  return {
    status: "DRY_RUN",
    output: outputPath,
    updates_planned: preparedUpdates.length,
    guardrail: `No spreadsheet update was applied. Execute requires --execute and --approval-text containing "${APPROVAL_PHRASE}".`,
  };
}

if (require.main === module) {
  run()
    .then((result) => writeJsonOutput(result))
    .catch((error) => {
      writeJsonOutput({
        status: "READY_ERROR",
        message: safeErrorMessage(error),
      });
      process.exitCode = 1;
    });
}

module.exports = {
  validatePlanShape,
  prepareUpdates,
  verifyOldValues,
  run,
};
