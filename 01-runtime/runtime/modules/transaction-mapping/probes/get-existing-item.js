const { connectBrowser, getOrCreatePage } = require("../../../../tools/cdp-utils");
const {
  capturePageEvidence,
  projectRow,
  TRANSACTION_MAPPING_ROW_FIELDS,
} = require("../../../../tools/table-evidence");
const { findHeaderIndex } = require("../../../../tools/dom-observation");

async function main() {
  const { browser } = await connectBrowser();
  const page = await getOrCreatePage(browser, "get-existing");

  console.log("=== Get existing item to understand structure ===\n");

  await page.goto("https://dev-energy.pgn.co.id/system-setup/billing-item", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(3000);

  const tableState = await capturePageEvidence(page, {
    includeFormFields: false,
    includeButtons: true,
    maxRowsPerTable: 10,
    maxTables: 3,
    maxDropdowns: 3,
  });
  const firstItemData = tableState.rows[0]
    ? projectRow(tableState.rows[0], TRANSACTION_MAPPING_ROW_FIELDS)
    : null;

  console.log("First item data:", JSON.stringify(firstItemData, null, 2));
  console.log("\n=== Opening first row action/detail ===\n");

  const firstRowInfo = tableState.sampledRows[0];
  const actionIndex = findHeaderIndex(tableState.headers, [/^ACTION$/i]);
  const editResult = {
    found: Boolean(firstRowInfo),
    clicked: false,
    actionIndex,
  };

  if (firstRowInfo) {
    const row = page.locator("table tbody tr").nth(firstRowInfo.row_index);
    const actionCell = actionIndex >= 0 ? row.locator("td").nth(actionIndex) : row.locator("td").last();
    const actionCandidates = actionCell.locator("a[href], button, [role=button]");
    const candidateCount = await actionCandidates.count();
    editResult.actionCount = candidateCount;

    for (let index = 0; index < candidateCount; index += 1) {
      const candidate = actionCandidates.nth(index);
      const href = (await candidate.getAttribute("href").catch(() => "")) || "";
      const title = (await candidate.getAttribute("title").catch(() => "")) || "";
      const aria = (await candidate.getAttribute("aria-label").catch(() => "")) || "";
      const text = ((await candidate.innerText().catch(() => "")) || "").replace(/\s+/g, " ").trim();
      if (candidateCount === 1 || /\/view\b/i.test(href) || /view|detail/i.test(`${title} ${aria} ${text}`)) {
        await candidate.click({ timeout: 10000 }).catch(() => {});
        editResult.clicked = true;
        editResult.href = href;
        break;
      }
    }
  }

  console.log("Edit click result:", JSON.stringify(editResult));
  await page.waitForTimeout(3000);

  const detailState = await capturePageEvidence(page, {
    includeFormFields: true,
    includeButtons: true,
    maxRowsPerTable: 5,
    maxTables: 2,
    maxDropdowns: 3,
  });

  console.log("\n=== Detail DOM Summary ===");
  console.log(
    JSON.stringify(
      {
        url: detailState.url,
        title: detailState.title,
        headings: detailState.headings,
        formFields: detailState.formFields,
        buttons: detailState.buttons,
        tableHeaders: detailState.headers,
        rowCount: detailState.rowCount,
        rows: detailState.rows,
        visibleDropdowns: detailState.visibleDropdowns,
        visibleOverlays: detailState.visibleOverlays,
      },
      null,
      2
    )
  );

  await browser.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
