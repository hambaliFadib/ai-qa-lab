const {
  connectBrowser,
  getOrCreatePage,
  artifactPath,
  writeJson,
  writeText,
} = require("./cdp-utils");

const APP_URL = process.env.APP_URL || "https://dev-energy.pgn.co.id";
const TRANSACTION_MAPPING_URL = `${APP_URL}/system-setup/billing-item`;

async function main() {
  const { browser, cdpUrl } = await connectBrowser();
  const page = await getOrCreatePage(browser, "pgn.co.id");

  page.setDefaultTimeout(60000);

  // Navigate to Transaction Mapping list
  await page.goto(TRANSACTION_MAPPING_URL, {
    waitUntil: "networkidle",
    timeout: 60000,
  });

  await page.waitForTimeout(3000);

  // Capture the page state
  const result = {
    checked_at: new Date().toISOString(),
    cdp_url: cdpUrl,
    current_url: page.url(),
    title: await page.title(),
  };

  // Get the list content
  let listContent = "";
  try {
    // Try to get table rows
    const rows = await page.$$("table tbody tr");
    result.table_rows_count = rows.length;
    listContent = `Found ${rows.length} rows in the table\n`;
  } catch (e) {
    result.table_error = e.message;
    listContent = `Table not found: ${e.message}\n`;
  }

  // Try to get visible text from the list
  try {
    const bodyContent = await page.evaluate(() => document.body.innerText);
    result.page_text_sample = bodyContent.substring(0, 1000);
    listContent += `Page content sample:\n${bodyContent.substring(0, 1000)}\n`;
  } catch (e) {
    result.text_error = e.message;
  }

  // Check for "test QA Auto" which was the created item
  const hasCreatedItem = await page.evaluate(() => {
    return document.body.innerText.includes("test QA Auto");
  });
  result.has_created_item = hasCreatedItem;
  
  // Take screenshot
  const screenshotPath = artifactPath("transaction-mapping-list-check.png");
  await page.screenshot({ path: screenshotPath });
  result.screenshot = screenshotPath;

  writeJson(artifactPath("transaction-mapping-list-check.json"), result);
  
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`\nPersistence check: ${hasCreatedItem ? "FOUND" : "NOT FOUND"}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});