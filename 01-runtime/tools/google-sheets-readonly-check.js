const fs = require("fs");
const path = require("path");
const { paths } = require("./workspace-paths");
const {
  loadConfig,
  requireNonEmpty,
  resolveMaybeRelative,
  safeErrorMessage,
  writeJsonOutput,
} = require("./qa-tool-common");

const ENV_FILE = "google-sheets-readonly.local.env";
const REQUIRED_KEYS = [
  "GOOGLE_APPLICATION_CREDENTIALS",
  "GOOGLE_SHEETS_SPREADSHEET_ID",
  "GOOGLE_SHEETS_DEFAULT_SHEET",
];
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

function getConfig() {
  const config = loadConfig(ENV_FILE, REQUIRED_KEYS);
  const credentialsPath = resolveMaybeRelative(config.values.GOOGLE_APPLICATION_CREDENTIALS);

  return {
    ...config,
    credentialsPath,
    spreadsheetId: config.values.GOOGLE_SHEETS_SPREADSHEET_ID || "",
    defaultSheet: config.values.GOOGLE_SHEETS_DEFAULT_SHEET || "",
  };
}

async function readSpreadsheetMetadata({ credentialsPath, spreadsheetId }) {
  const google = loadGoogleApis();
  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: [READONLY_SCOPE],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "spreadsheetId,properties.title,sheets.properties(title,sheetId,gridProperties(rowCount,columnCount))",
  });

  return response.data;
}

function baseReport(config) {
  return {
    checked_at: new Date().toISOString(),
    local_profile_present: config.localProfile.present,
    local_profile_path: config.localProfile.path,
    credentials_path_configured: requireNonEmpty(config.values.GOOGLE_APPLICATION_CREDENTIALS),
    credentials_file_exists: requireNonEmpty(config.credentialsPath) && fs.existsSync(config.credentialsPath),
    spreadsheet_id_configured: requireNonEmpty(config.spreadsheetId),
    default_sheet: config.defaultSheet || null,
    strategy: "google_sheets_api_service_account_readonly",
    notes: [
      "Credentials are read from process env or the ignored local env file.",
      "Service account JSON content is never printed.",
      "Share the spreadsheet to the service account email with Viewer permission.",
    ],
  };
}

async function main() {
  const config = getConfig();
  const report = baseReport(config);

  if (
    !config.localProfile.present &&
    !requireNonEmpty(process.env.GOOGLE_APPLICATION_CREDENTIALS) &&
    !requireNonEmpty(process.env.GOOGLE_SHEETS_SPREADSHEET_ID)
  ) {
    writeJsonOutput({
      status: "READY_NO_CREDENTIALS",
      message: "Google Sheets read-only env file or process env is not configured.",
      ...report,
    });
    process.exitCode = 1;
    return;
  }

  if (!requireNonEmpty(config.credentialsPath) || !fs.existsSync(config.credentialsPath)) {
    writeJsonOutput({
      status: "READY_NO_CREDENTIALS",
      message: "GOOGLE_APPLICATION_CREDENTIALS is missing or points to a file that does not exist.",
      ...report,
    });
    process.exitCode = 1;
    return;
  }

  if (!requireNonEmpty(config.spreadsheetId)) {
    writeJsonOutput({
      status: "READY_NO_CREDENTIALS",
      message: "GOOGLE_SHEETS_SPREADSHEET_ID is missing.",
      ...report,
    });
    process.exitCode = 1;
    return;
  }

  try {
    const metadata = await readSpreadsheetMetadata(config);
    writeJsonOutput({
      status: "READY_CONFIGURED",
      spreadsheet_id: metadata.spreadsheetId,
      spreadsheet_title: metadata.properties?.title || null,
      sheets: (metadata.sheets || []).map((sheet) => ({
        title: sheet.properties?.title || null,
        sheet_id: sheet.properties?.sheetId ?? null,
        rows: sheet.properties?.gridProperties?.rowCount ?? null,
        columns: sheet.properties?.gridProperties?.columnCount ?? null,
      })),
      ...report,
    });
  } catch (error) {
    const statusCode = error?.code || error?.response?.status || error?.statusCode || null;
    const status = statusCode === 403 || statusCode === 404 ? "READY_ACCESS_DENIED" : "READY_ERROR";
    writeJsonOutput({
      status,
      message:
        status === "READY_ACCESS_DENIED"
          ? "Spreadsheet is not readable. Confirm it is shared to the service account with Viewer permission."
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
  ENV_FILE,
  REQUIRED_KEYS,
  getConfig,
  readSpreadsheetMetadata,
};
