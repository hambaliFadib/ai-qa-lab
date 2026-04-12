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

  const before = await capturePageEvidence(page, {
    includeFormFields: false,
    includeButtons: true,
    maxRowsPerTable: 5,
    maxTables: 3,
    maxDropdowns: 3,
  });

  const trigger = page.locator(".ant-dropdown-trigger").first();
  if ((await trigger.count()) > 0) {
    await trigger.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
  }

  const after = await capturePageEvidence(page, {
    includeFormFields: false,
    includeButtons: true,
    maxRowsPerTable: 5,
    maxTables: 3,
    maxDropdowns: 3,
  });

  console.log(
    JSON.stringify(
      {
        before: {
          url: before.url,
          buttons: before.buttons,
          visibleOverlays: before.visibleOverlays,
        },
        after: {
          url: after.url,
          buttons: after.buttons,
          visibleDropdowns: after.visibleDropdowns,
          visibleOptionLists: after.visibleOptionLists,
          visibleOverlays: after.visibleOverlays,
        },
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

