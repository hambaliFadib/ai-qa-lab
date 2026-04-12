const { connectBrowser, getOrCreatePage } = require("./cdp-utils");
const { capturePageEvidence, rowContainsText } = require("./table-evidence");

const TRANSACTION_MAPPING_URL = "https://dev-energy.pgn.co.id/system-setup/billing-item";
const CREATED_ITEM_NEEDLE = "test QA Auto";

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
    includeFormFields: false,
    includeButtons: true,
    maxRowsPerTable: 10,
    maxTables: 3,
    maxDropdowns: 3,
  });

  const matchingRows = evidence.rows.filter((row) => rowContainsText(row, CREATED_ITEM_NEEDLE));

  console.log("\n=== Persistence Check ===");
  console.log(
    JSON.stringify(
      {
        url: evidence.url,
        title: evidence.title,
        headings: evidence.headings,
        headers: evidence.headers,
        rowCount: evidence.rowCount,
        topRows: evidence.rows.slice(0, 5),
        hasCreatedItem: matchingRows.length > 0,
        matchingRows,
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

