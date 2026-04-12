const {
  connectBrowser,
  getOrCreatePage,
  artifactPath,
  writeJson,
} = require("./cdp-utils");

const APP_URL = process.env.APP_URL || "https://dev-energy.pgn.co.id";

async function main() {
  const { browser, cdpUrl } = await connectBrowser();
  const page = await getOrCreatePage(browser, "pgn.co.id");

  page.setDefaultTimeout(60000);
  await page.goto(APP_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(3000);

  const result = {
    checked_at: new Date().toISOString(),
    cdp_url: cdpUrl,
    current_url: page.url(),
    title: await page.title(),
  };

  writeJson(artifactPath("attach-and-open.json"), result);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
