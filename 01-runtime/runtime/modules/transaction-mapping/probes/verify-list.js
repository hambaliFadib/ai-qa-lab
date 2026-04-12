const {
  connectBrowser,
  getOrCreatePage,
  artifactPath,
  writeJson,
} = require("../../../../tools/cdp-utils");
const { capturePageEvidence, rowContainsText } = require("../../../../tools/table-evidence");

async function main() {
  const { browser } = await connectBrowser();
  const page = await getOrCreatePage(browser, "verify-list");

  await page.goto("https://dev-energy.pgn.co.id/system-setup/billing-item", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(3000);

  const tableState = await capturePageEvidence(page, {
    includeFormFields: false,
    includeButtons: true,
    maxRowsPerTable: 5,
    maxTables: 3,
    maxDropdowns: 3,
  });
  const rows = {
    found: tableState.rowCount > 0,
    url: tableState.url,
    title: tableState.title,
    headings: tableState.headings,
    headers: tableState.headers,
    rowCount: tableState.rowCount,
    rows: tableState.rows.map((row) => ({
      values: row,
      cells: Object.values(row).join(" | "),
    })),
    visibleDropdowns: tableState.visibleDropdowns,
    visibleOverlays: tableState.visibleOverlays,
  };

  console.log("=== Transaction Mapping List ===");
  console.log(JSON.stringify(rows, null, 2));

  const hasOurItem = tableState.rows.some((row) => rowContainsText(row, "QA_v8"));
  console.log(`\nFound QA_v8 item: ${hasOurItem}`);

  try {
    writeJson(artifactPath("transaction-mapping-probe-verify-list.json"), rows);
  } catch (error) {
    console.error(`Artifact write failed: ${error.message}`);
  }

  await browser.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
