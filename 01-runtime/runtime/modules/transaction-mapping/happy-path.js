const {
  runPositiveCreateAndVerify,
  connectBrowser,
  openTransactionMappingPage,
} = require("../../../tools/transaction-mapping-cdp");
const { artifactPath, writeJson } = require("../../../tools/cdp-utils");

async function main() {
  const { browser } = await connectBrowser();
  const page = await openTransactionMappingPage(browser);

  const result = await runPositiveCreateAndVerify(page);
  const output = {
    checked_at: new Date().toISOString(),
    success: result.success,
    name: result.base.name,
    approval: result.approval.selectedText,
    attachment: result.attachment.fileName,
    final_url: result.submit.finalUrl,
    verification: result.verification,
    api_summary: result.apiSummary,
  };

  writeJson(artifactPath("transaction-mapping-happy-path.json"), output);
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  process.exit(result.success ? 0 : 1);
}

main().catch((error) => {
  const output = {
    checked_at: new Date().toISOString(),
    success: false,
    error: error.message,
  };
  writeJson(artifactPath("transaction-mapping-happy-path-error.json"), output);
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});