const {
  connectBrowser,
  openTransactionMappingPage,
  runPositiveCreateAndVerify,
} = require("./transaction-mapping-cdp");

async function main() {
  const { browser } = await connectBrowser();
  const page = await openTransactionMappingPage(browser);

  const result = await runPositiveCreateAndVerify(page);
  console.log(
    JSON.stringify(
      {
        success: result.success,
        base: result.base,
        approval: result.approval,
        attachment: result.attachment,
        submit: result.submit,
        verification: result.verification,
        apiSummary: result.apiSummary,
      },
      null,
      2
    )
  );

  await browser.close();
  process.exit(result.success ? 0 : 1);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
