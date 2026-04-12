const { connectBrowser, getOrCreatePage } = require("./cdp-utils");
const { capturePageEvidence } = require("./table-evidence");
const {
  gotoCreatePage,
  fillStepOne,
} = require("./transaction-mapping-cdp");

async function main() {
  const { browser } = await connectBrowser();
  const page = await getOrCreatePage(browser, "billing-item");

  await gotoCreatePage(page);
  const beforeFill = await capturePageEvidence(page, {
    includeFormFields: true,
    includeButtons: true,
    maxRowsPerTable: 3,
    maxTables: 2,
    maxDropdowns: 3,
  });

  const filled = await fillStepOne(page, {
    description: "Explorer flow snapshot",
  });

  const afterFill = await capturePageEvidence(page, {
    includeFormFields: true,
    includeButtons: true,
    maxRowsPerTable: 3,
    maxTables: 2,
    maxDropdowns: 3,
  });

  const nextButton = page.getByRole("button", { name: /^Next$/i }).first();
  if ((await nextButton.count()) > 0) {
    await nextButton.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1500);
  }

  const afterNext = await capturePageEvidence(page, {
    includeFormFields: true,
    includeButtons: true,
    maxRowsPerTable: 3,
    maxTables: 2,
    maxDropdowns: 3,
  });

  console.log(
    JSON.stringify(
      {
        filled,
        beforeFill: {
          url: beforeFill.url,
          formFields: beforeFill.formFields,
          buttons: beforeFill.buttons,
        },
        afterFill: {
          url: afterFill.url,
          formFields: afterFill.formFields,
          buttons: afterFill.buttons,
          errors: afterFill.errors,
        },
        afterNext: {
          url: afterNext.url,
          headings: afterNext.headings,
          formFields: afterNext.formFields,
          buttons: afterNext.buttons,
          errors: afterNext.errors,
          visibleOverlays: afterNext.visibleOverlays,
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
