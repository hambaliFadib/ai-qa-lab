const {
  runPositiveCreateAndVerify,
  runEmptyRequiredValidation,
  runOnlyNameValidation,
  runMissingApprovalValidation,
  runSpecialCharacterEdgeCase,
  connectBrowser,
  openTransactionMappingPage,
} = require("../../../tools/transaction-mapping-cdp");
const { artifactPath, writeJson } = require("../../../tools/cdp-utils");

async function main() {
  const { browser } = await connectBrowser();
  const page = await openTransactionMappingPage(browser);

  const cases = [];

  const emptyRequired = await runEmptyRequiredValidation(page);
  cases.push({
    case: "negative_empty_required_step_one",
    ...emptyRequired,
  });

  const onlyName = await runOnlyNameValidation(page);
  cases.push({
    case: "negative_only_name_step_one",
    ...onlyName,
  });

  const missingApproval = await runMissingApprovalValidation(page);
  cases.push({
    case: "negative_missing_approval_step_two",
    ...missingApproval,
  });

  const specialChars = await runSpecialCharacterEdgeCase(page);
  cases.push({
    case: "edge_special_characters",
    ...specialChars,
  });

  const positive = await runPositiveCreateAndVerify(page, {
    payload: {
      description: "QA automated full-suite positive flow",
    },
  });
  cases.push({
    case: "positive_create_and_verify",
    success: positive.success,
    name: positive.base.name,
    approval: positive.approval.selectedText,
    attachment: positive.attachment.fileName,
    final_url: positive.submit.finalUrl,
    post_submit_url: positive.submit.postSubmitUrl,
    verification: positive.verification,
    api_summary: positive.apiSummary,
  });

  const overallSuccess = cases.every((item) => item.passed !== false && item.success !== false);
  const output = {
    checked_at: new Date().toISOString(),
    overall_success: overallSuccess,
    cases,
  };

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);

  try {
    writeJson(artifactPath("transaction-mapping-full-suite.json"), output);
  } catch (writeError) {
    process.stderr.write(`Artifact write failed: ${writeError.message}\n`);
  }

  process.exit(overallSuccess ? 0 : 1);
}

main().catch((error) => {
  const output = {
    checked_at: new Date().toISOString(),
    overall_success: false,
    error: error.message,
  };

  process.stderr.write(`${error.stack || error.message}\n`);

  try {
    writeJson(artifactPath("transaction-mapping-full-suite-error.json"), output);
  } catch (writeError) {
    process.stderr.write(`Artifact write failed: ${writeError.message}\n`);
  }

  process.exit(1);
});