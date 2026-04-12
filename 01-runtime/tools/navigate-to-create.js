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

  const createButton = page.getByRole("button", { name: /create/i }).first();
  if ((await createButton.count()) > 0) {
    await createButton.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1500);
  }

  if (!page.url().includes("/create")) {
    await page.goto(`${TRANSACTION_MAPPING_URL}/create`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(1500);
  }

  const evidence = await capturePageEvidence(page, {
    includeFormFields: true,
    includeButtons: true,
    maxRowsPerTable: 5,
    maxTables: 2,
    maxDropdowns: 3,
  });

  console.log(
    JSON.stringify(
      {
        url: evidence.url,
        title: evidence.title,
        headings: evidence.headings,
        formFields: evidence.formFields,
        buttons: evidence.buttons,
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
