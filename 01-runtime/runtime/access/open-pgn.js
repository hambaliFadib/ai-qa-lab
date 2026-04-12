const {
  artifactPath,
  connectBrowser,
  getOrCreatePage,
  writeJson,
} = require("../../tools/cdp-utils");

const APP_URL = process.env.APP_URL || "https://dev-energy.pgn.co.id";

async function main() {
  const { browser, cdpUrl, cdpStatus } = await connectBrowser();
  const page = await getOrCreatePage(browser, "pgn.co.id");

  page.setDefaultTimeout(60000);
  await page.goto(APP_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(3000);

  const snapshot = await page.evaluate(() => ({
    title: document.title,
    url: window.location.href,
    hasSidebar: Boolean(document.querySelector("aside, [class*='sidebar']")),
    hasHeader: Boolean(document.querySelector("header, [class*='topbar'], [class*='header']")),
    textSample: document.body.innerText.slice(0, 280),
  }));

  const result = {
    checked_at: new Date().toISOString(),
    cdp_url: cdpUrl,
    cdp_status: {
      status: cdpStatus.recovered ? "recovered" : cdpStatus.status,
      source: cdpStatus.source,
      version_url: cdpStatus.versionUrl,
      recovery_attempted: cdpStatus.recovery_attempted,
      recovered: cdpStatus.recovered,
      initial_error: cdpStatus.initial_error,
      recovery: cdpStatus.recovery,
    },
    app_url: APP_URL,
    snapshot,
  };

  const artifactFile = artifactPath("open-pgn-result.json");
  result.artifact_path = artifactFile;

  try {
    writeJson(artifactFile, result);
  } catch (error) {
    result.artifact_write_warning = error.message || String(error);
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});