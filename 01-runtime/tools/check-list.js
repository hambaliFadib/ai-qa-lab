const { connectBrowser, getOrCreatePage } = require("./cdp-utils");
const { capturePrimaryTable, rowContainsText } = require("./table-evidence");

async function main() {
  const { browser } = await connectBrowser();
  const page = await getOrCreatePage(browser, "check-list");

  // Navigate to Transaction Mapping list
  console.log("=== Navigate to Transaction Mapping List ===");
  await page.goto("https://dev-energy.pgn.co.id/system-setup/billing-item", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(5000);
  console.log("URL:", page.url());

  // Get the table rows
  console.log("\n=== Transaction Mapping List ===");
  const tableState = await capturePrimaryTable(page, { maxRowsPerTable: 8 });
  const rows = tableState.rows;

  console.log("\nRows:");
  rows.forEach((row, i) => {
    const values = Object.values(row);
    if (values.length > 1) {
      console.log(`Row ${i+1}: ${values.join(' | ')}`);
    }
  });

  // Check for any recently created items
  console.log("\n=== Looking for recent items ===");
  const recentItems = rows.filter((row) => rowContainsText(row, "Apr 2026"));
  console.log(`Found ${recentItems.length} items from April 2026`);

  console.log("\n=== List View Complete ===");
  await browser.close();
}

main().catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
