const {
  runSpecialCharacterEdgeCase,
  connectBrowser,
  openTransactionMappingPage,
} = require("../../../tools/transaction-mapping-cdp");
const { artifactPath, writeJson } = require("../../../tools/cdp-utils");

async function main() {
  const { browser } = await connectBrowser();
  const page = await openTransactionMappingPage(browser);

  const edgeCase = await runSpecialCharacterEdgeCase(page);
  const output = {
    checked_at: new Date().toISOString(),
    overall_success: edgeCase.passed !== false,
    cases: [
      {
        case: "edge_special_characters",
        ...edgeCase,
      },
    ],
  };

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);

  try {
    writeJson(artifactPath("transaction-mapping-edge-suite.json"), output);
  } catch (writeError) {
    process.stderr.write(`Artifact write failed: ${writeError.message}\n`);
  }

  process.exit(output.overall_success ? 0 : 1);
}

main().catch((error) => {
  const output = {
    checked_at: new Date().toISOString(),
    overall_success: false,
    error: error.message,
  };

  process.stderr.write(`${error.stack || error.message}\n`);

  try {
    writeJson(artifactPath("transaction-mapping-edge-suite-error.json"), output);
  } catch (writeError) {
    process.stderr.write(`Artifact write failed: ${writeError.message}\n`);
  }

  process.exit(1);
});
