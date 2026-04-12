const {
  artifactPath,
  connectBrowser,
  getOrCreatePage,
  paths,
  writeJson,
} = require("./cdp-utils");
const { APP_URL, readSavedAuthState, restoreAuthState } = require("./auth-session-utils");

async function main() {
  const authState = readSavedAuthState(paths.authStateFile);
  const { browser, cdpUrl, cdpStatus } = await connectBrowser();
  const page = await getOrCreatePage(browser, "pgn.co.id");
  const restore = await restoreAuthState(page, authState, {
    appUrl: APP_URL,
    authStatePath: paths.authStateFile,
  });

  const summary = {
    checked_at: new Date().toISOString(),
    app_url: APP_URL,
    cdp_url: cdpUrl,
    cdp_status: cdpStatus.recovered ? "recovered" : cdpStatus.status,
    saved_auth_state: paths.authStateFile,
    ...restore,
  };

  const artifactFile = artifactPath("auth-session-restore.json");
  summary.artifact_path = artifactFile;

  try {
    writeJson(artifactFile, summary);
  } catch (error) {
    summary.artifact_write_warning = error.message || String(error);
  }

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  setImmediate(() => process.exit(0));
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});