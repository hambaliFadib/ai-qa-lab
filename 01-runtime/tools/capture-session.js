const {
  artifactPath,
  connectBrowser,
  getOrCreatePage,
  paths,
  writeJson,
} = require("./cdp-utils");
const { APP_URL, captureAuthState } = require("./auth-session-utils");

async function main() {
  const { browser, cdpUrl, cdpStatus } = await connectBrowser();
  const page = await getOrCreatePage(browser, "pgn.co.id");
  const capture = await captureAuthState(page, {
    appUrl: APP_URL,
    authStatePath: paths.authStateFile,
    navigate: false,
  });

  const summary = {
    checked_at: new Date().toISOString(),
    app_url: APP_URL,
    cdp_url: cdpUrl,
    cdp_status: cdpStatus.recovered ? "recovered" : cdpStatus.status,
    ...capture,
  };

  const artifactFile = artifactPath("auth-session-capture.json");
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