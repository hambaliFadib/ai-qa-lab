const { connectBrowser, getOrCreatePage } = require("./cdp-utils");
const { capturePageEvidence } = require("./table-evidence");

const TRANSACTION_MAPPING_URL = "https://dev-energy.pgn.co.id/system-setup/billing-item";

function summarizeEvidence(evidence = {}) {
  return {
    url: evidence.url,
    title: evidence.title,
    headings: evidence.headings,
    buttons: evidence.buttons,
    errors: evidence.errors,
    tableHeaders: evidence.headers,
    rowCount: evidence.rowCount,
    topRows: evidence.rows?.slice(0, 5) || [],
    visibleDropdowns: evidence.visibleDropdowns,
    visibleOptionLists: evidence.visibleOptionLists,
    visibleOverlays: evidence.visibleOverlays,
  };
}

async function main() {
  const { browser } = await connectBrowser();
  const page = await getOrCreatePage(browser, "billing-item");

  await page.goto(TRANSACTION_MAPPING_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(3000);

  const listEvidence = await capturePageEvidence(page, {
    includeFormFields: false,
    includeButtons: true,
    maxRowsPerTable: 8,
    maxTables: 3,
    maxDropdowns: 3,
  });

  const createButtons = (listEvidence.buttons || []).filter((button) =>
    /create/i.test(button.text || "")
  );

  await page.goto(`${TRANSACTION_MAPPING_URL}/create`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2000);

  const createEvidence = await capturePageEvidence(page, {
    includeFormFields: true,
    includeButtons: true,
    maxRowsPerTable: 5,
    maxTables: 2,
    maxDropdowns: 3,
  });

  console.log(
    JSON.stringify(
      {
        listPage: summarizeEvidence(listEvidence),
        createButtons,
        createPage: summarizeEvidence(createEvidence),
        createFormFields: createEvidence.formFields,
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

