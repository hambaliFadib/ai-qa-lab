const { connectBrowser, getOrCreatePage } = require("./cdp-utils");
const { capturePageEvidence } = require("./table-evidence");
const {
  gotoCreatePage,
  fillStepOne,
  collectValidationErrors,
} = require("./transaction-mapping-cdp");

async function main() {
  const { browser } = await connectBrowser();
  const page = await getOrCreatePage(browser, "billing-item");

  await gotoCreatePage(page);
  const filled = await fillStepOne(page, {
    description: "Debug save snapshot",
  });

  const evidence = await capturePageEvidence(page, {
    includeFormFields: true,
    includeButtons: true,
    maxRowsPerTable: 3,
    maxTables: 2,
    maxDropdowns: 3,
  });
  const validationErrors = await collectValidationErrors(page);

  console.log(
    JSON.stringify(
      {
        filled,
        url: evidence.url,
        buttons: evidence.buttons,
        formFields: evidence.formFields,
        validationErrors,
        visibleOverlays: evidence.visibleOverlays,
      },
      null,
      2
    )
  );

  await browser.close();
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
