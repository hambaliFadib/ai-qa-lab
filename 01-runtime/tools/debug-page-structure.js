const { connectBrowser, getOrCreatePage } = require("./cdp-utils");
const { capturePageEvidence } = require("./table-evidence");

const TRANSACTION_MAPPING_URL = "https://dev-energy.pgn.co.id/system-setup/billing-item";

async function main() {
  const { browser } = await connectBrowser();
  const page = await getOrCreatePage(browser, "billing-item");

  console.log("=== Navigating to Transaction Mapping ===");
  await page.goto(TRANSACTION_MAPPING_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(5000);

  const evidence = await capturePageEvidence(page, {
    includeFormFields: true,
    includeButtons: true,
    maxRowsPerTable: 8,
    maxTables: 3,
    maxDropdowns: 3,
  });

  console.log("\n=== Page Structure ===");
  console.log(
    JSON.stringify(
      {
        url: evidence.url,
        title: evidence.title,
        headings: evidence.headings,
        buttons: evidence.buttons,
        formFields: evidence.formFields,
        tableHeaders: evidence.headers,
        rowCount: evidence.rowCount,
        topRows: evidence.rows.slice(0, 5),
        errors: evidence.errors,
        visibleDropdowns: evidence.visibleDropdowns,
    visibleOptionLists: evidence.visibleOptionLists,
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

