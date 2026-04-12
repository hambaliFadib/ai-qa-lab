const { connectBrowser, getOrCreatePage } = require("./cdp-utils");
const { capturePageEvidence } = require("./table-evidence");

const TRANSACTION_MAPPING_URL = "https://dev-energy.pgn.co.id/system-setup/billing-item";

async function main() {
  const { browser } = await connectBrowser();
  const page = await getOrCreatePage(browser, "billing-item");

  await page.goto(TRANSACTION_MAPPING_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(3000);

  const evidence = await capturePageEvidence(page, {
    includeFormFields: false,
    includeButtons: true,
    maxRowsPerTable: 5,
    maxTables: 3,
    maxDropdowns: 3,
  });

  const createButtons = (evidence.buttons || []).filter((button) =>
    /create/i.test(button.text || "")
  );

  console.log(
    JSON.stringify(
      {
        url: evidence.url,
        title: evidence.title,
        headings: evidence.headings,
        createButtons,
        allButtons: evidence.buttons,
        visibleOverlays: evidence.visibleOverlays,
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
