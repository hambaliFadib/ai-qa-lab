const fs = require("fs");
const path = require("path");
const { paths, ensureDir, writeJson } = require("./workspace-paths");
const {
  parseArgs,
  requireNonEmpty,
  safeErrorMessage,
  sanitizeFileSegment,
  timestampForFile,
  writeJsonOutput,
} = require("./qa-tool-common");
const { getConfig } = require("./google-sheets-readonly-check");

const READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

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

function buildA1Range(sheetName, range) {
  if (!sheetName) {
    return range;
  }

  if (!range) {
    return quoteSheetName(sheetName);
  }

  return `${quoteSheetName(sheetName)}!${range}`;
}

async function readSheetRange({ sheet, range }) {
  const config = getConfig();
  const selectedSheet = sheet || config.defaultSheet;

  if (!requireNonEmpty(config.credentialsPath) || !fs.existsSync(config.credentialsPath)) {
    const error = new Error("GOOGLE_APPLICATION_CREDENTIALS is missing or points to a file that does not exist.");
    error.status = "READY_NO_CREDENTIALS";
    throw error;
  }

  if (!requireNonEmpty(config.spreadsheetId)) {
    const error = new Error("GOOGLE_SHEETS_SPREADSHEET_ID is missing.");
    error.status = "READY_NO_CREDENTIALS";
    throw error;
  }

  if (!requireNonEmpty(selectedSheet) || !requireNonEmpty(range)) {
    const error = new Error('Usage: node google-sheets-fetch-range.js --sheet "UI TEST - RBI" --range "A1:R1292"');
    error.status = "INVALID_ARGUMENTS";
    throw error;
  }

  const google = loadGoogleApis();
  const auth = new google.auth.GoogleAuth({
    keyFile: config.credentialsPath,
    scopes: [READONLY_SCOPE],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const requestedRange = buildA1Range(selectedSheet, range);
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: requestedRange,
    valueRenderOption: "FORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });

  const values = response.data.values || [];
  return {
    fetched_at: new Date().toISOString(),
    source: "google_sheets_values_api",
    spreadsheet_id: config.spreadsheetId,
    sheet: selectedSheet,
    range,
    requested_range: requestedRange,
    returned_range: response.data.range || null,
    major_dimension: response.data.majorDimension || "ROWS",
    row_count: values.length,
    values,
  };
}

function writeRangeArtifact(artifact) {
  const stagingDir = path.join(paths.testingDir, "spreadsheet-staging");
  const rawDir = ensureDir(path.join(stagingDir, "raw"));
  const timestamp = timestampForFile();
  const safeSheet = sanitizeFileSegment(artifact.sheet, "sheet");
  const safeRange = sanitizeFileSegment(artifact.range, "range");
  const outputPath = path.join(rawDir, `google-sheets-range-${safeSheet}-${safeRange}-${timestamp}.json`);
  const latestPath = path.join(stagingDir, "latest-range.json");

  writeJson(outputPath, artifact);
  writeJson(latestPath, {
    updated_at: artifact.fetched_at,
    source: artifact.source,
    spreadsheet_id: artifact.spreadsheet_id,
    sheet: artifact.sheet,
    range: artifact.range,
    requested_range: artifact.requested_range,
    returned_range: artifact.returned_range,
    row_count: artifact.row_count,
    path: outputPath,
  });

  return { outputPath, latestPath };
}

async function fetchAndWriteRange(options) {
  const artifact = await readSheetRange(options);
  const pathsWritten = writeRangeArtifact(artifact);
  return { artifact, ...pathsWritten };
}

async function main() {
  const args = parseArgs();
  const { artifact, outputPath, latestPath } = await fetchAndWriteRange({
    sheet: args.sheet,
    range: args.range,
  });

  writeJsonOutput({
    status: "OK",
    sheet: artifact.sheet,
    range: artifact.range,
    row_count: artifact.row_count,
    output: outputPath,
    latest: latestPath,
  });
}

if (require.main === module) {
  main().catch((error) => {
    const statusCode = error?.code || error?.response?.status || error?.statusCode || null;
    const status =
      error.status ||
      (statusCode === 403 || statusCode === 404 ? "READY_ACCESS_DENIED" : "READY_ERROR");

    writeJsonOutput({
      status,
      message:
        status === "READY_ACCESS_DENIED"
          ? "Spreadsheet range is not readable. Confirm sharing and sheet/range names."
          : safeErrorMessage(error),
      http_status: statusCode,
    });
    process.exitCode = 1;
  });
}

module.exports = {
  buildA1Range,
  readSheetRange,
  writeRangeArtifact,
  fetchAndWriteRange,
};
