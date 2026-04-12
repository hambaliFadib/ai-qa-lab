const {
  connectBrowser,
  getOrCreatePage,
  artifactPath,
  writeJson,
} = require("./cdp-utils");
const { capturePageEvidence, rowContainsText } = require("./table-evidence");

async function main() {
  const { browser, cdpUrl } = await connectBrowser();
  const page = await getOrCreatePage(browser, "pgn.co.id");

  page.setDefaultTimeout(30000);

  // Get current page state
  const result = {
    checked_at: new Date().toISOString(),
    cdp_url: cdpUrl,
  };

  // Wait a bit for any dynamic content
  await page.waitForTimeout(2000);

  const evidence = await capturePageEvidence(page, {
    includeFormFields: true,
    includeButtons: true,
    maxRowsPerTable: 10,
    maxTables: 3,
    maxDropdowns: 3,
  });

  result.current_url = evidence.url;
  result.title = evidence.title;
  result.headings = evidence.headings;
  result.errors = evidence.errors;
  result.form_fields = evidence.formFields;
  result.buttons = evidence.buttons;
  result.table_headers = evidence.headers;
  result.table_rows_count = evidence.rowCount;
  result.top_rows = evidence.rows.slice(0, 5);
  result.visible_dropdowns = evidence.visibleDropdowns;
  result.visible_option_lists = evidence.visibleOptionLists;
  result.visible_overlays = evidence.visibleOverlays;
  result.has_created_item = evidence.rows.some((row) => rowContainsText(row, "test QA Auto"));

  // Take screenshot
  const screenshotPath = artifactPath("current-page-check.png");
  await page.screenshot({ path: screenshotPath });
  result.screenshot = screenshotPath;

  writeJson(artifactPath("current-page-check.json"), result);
  
  console.log(JSON.stringify(result, null, 2));
  console.log(`\nPersistence check: ${result.has_created_item ? "FOUND - Created item 'test QA Auto' exists!" : "NOT FOUND"}`);
  console.log(`Current URL: ${result.current_url}`);

  await browser.close();
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});

