const { connectBrowser, getOrCreatePage } = require("./cdp-utils");
const { capturePageEvidence } = require("./table-evidence");

async function main() {
  const { browser } = await connectBrowser();
  const page = await getOrCreatePage(browser, "billing-item");

  const consoleMessages = [];
  const errorMessages = [];

  page.on("console", (message) => {
    consoleMessages.push({
      type: message.type(),
      text: message.text(),
      timestamp: new Date().toISOString(),
    });
  });

  page.on("pageerror", (error) => {
    errorMessages.push(`Page Error: ${error.message}`);
  });

  await page.reload({
    waitUntil: "domcontentloaded",
    timeout: 60000,
  }).catch(() => {});
  await page.waitForTimeout(2500);

  const evidence = await capturePageEvidence(page, {
    includeFormFields: false,
    includeButtons: true,
    maxRowsPerTable: 5,
    maxTables: 3,
    maxDropdowns: 3,
  });

  console.log(
    JSON.stringify(
      {
        currentUrl: page.url(),
        title: await page.title().catch(() => ""),
        consoleMessages,
        errorMessages,
        visibleOverlays: evidence.visibleOverlays,
        errors: evidence.errors,
      },
      null,
      2
    )
  );

  await browser.close();
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
