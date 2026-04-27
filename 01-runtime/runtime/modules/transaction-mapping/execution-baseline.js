const path = require("path");
const {
  MODULE_URL,
  CREATE_URL,
  connectBrowser,
  openTransactionMappingPage,
  gotoCreatePage,
  runPositiveCreateAndVerify,
  runEmptyRequiredValidation,
  runSpecialCharacterEdgeCase,
} = require("../../../tools/transaction-mapping-cdp");
const { capturePageEvidence } = require("../../../tools/table-evidence");
const { artifactPath, writeJson } = require("../../../tools/cdp-utils");
const {
  CLASSIFICATIONS,
  STATUS,
  buildCaseResult,
  classifyError,
} = require("../shared/qa-classification");
const { createNetworkObserver } = require("../shared/network-observer");
const {
  loadSelectorRegistry,
  recordSelectorObservation,
  resolveModuleRegistryPath,
} = require("../shared/selector-registry");

const MODULE_DIR = __dirname;
const PROFILE_PATH = path.join(MODULE_DIR, "execution-profile.json");
const SELECTOR_REGISTRY_PATH = resolveModuleRegistryPath(MODULE_DIR);
const PROFILE = require(PROFILE_PATH);

const MODE_SCOPES = {
  listSmoke: ["listSmoke"],
  createSmoke: ["listSmoke", "createSmoke"],
  smoke: ["listSmoke", "createSmoke"],
  happy: ["listSmoke", "createSmoke", "happyPath"],
  edge: ["listSmoke", "edgeCase"],
  full: ["listSmoke", "createSmoke", "edgeCase", "happyPath"],
};

function parseArgs(argv) {
  const args = {
    mode: "full",
    dryRun: false,
    noSubmit: false,
    label: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (value === "--no-submit") {
      args.noSubmit = true;
      continue;
    }
    if (value === "--mode") {
      args.mode = argv[index + 1] || args.mode;
      index += 1;
      continue;
    }
    if (value === "--label") {
      args.label = argv[index + 1] || "";
      index += 1;
    }
  }

  return args;
}

function normalizeMode(mode) {
  const normalized = String(mode || "full").trim();
  if (MODE_SCOPES[normalized]) {
    return normalized;
  }
  const lower = normalized.toLowerCase();
  if (lower === "list-smoke" || lower === "list") {
    return "listSmoke";
  }
  if (lower === "create-smoke" || lower === "create") {
    return "createSmoke";
  }
  if (lower === "baseline" || lower === "flow") {
    return "full";
  }
  if (MODE_SCOPES[lower]) {
    return lower;
  }
  throw new Error(`Unknown Transaction Mapping execution mode: ${mode}`);
}

function buildEmptySection(id, title) {
  return {
    id,
    title,
    status: STATUS.SKIPPED,
    classification: CLASSIFICATIONS.NEEDS_MANUAL_REVIEW,
    classification_reason: "Not selected for this execution mode.",
    expected: null,
    actual: null,
    evidence: {},
    network: null,
    error: null,
  };
}

function buildInitialResult(args, mode, scopes) {
  return {
    schema_version: "ai-qa-lab.flow-execution-result.v1",
    checked_at: new Date().toISOString(),
    module: {
      key: PROFILE.module_key,
      name: PROFILE.module_name,
      entry_path: PROFILE.page_entry.menu_path,
      list_url: PROFILE.page_entry.list_url,
      create_url: PROFILE.page_entry.create_url,
    },
    mode,
    selected_scopes: scopes,
    safety: {
      safe_submit_allowed_by_profile: PROFILE.safety.safe_submit_allowed_by_profile,
      no_submit: args.noSubmit,
      safe_submit_reason: PROFILE.safety.safe_submit_reason,
    },
    summary: {
      overall_status: STATUS.SKIPPED,
      passed: 0,
      failed: 0,
      blocked: 0,
      skipped: 0,
      classifications: {},
      safe_stop_triggered: false,
    },
    results: {
      listSmoke: buildEmptySection("listSmoke", "List smoke"),
      createSmoke: buildEmptySection("createSmoke", "Create form validation smoke"),
      happyPath: buildEmptySection("happyPath", "Minimal happy path"),
      edgeCase: buildEmptySection("edgeCase", "Controlled edge case"),
    },
    notes: [],
  };
}

function summarizeResult(result) {
  const sections = Object.values(result.results);
  result.summary = {
    overall_status: sections.some((item) => item.status === STATUS.FAILED)
      ? STATUS.FAILED
      : sections.some((item) => item.status === STATUS.BLOCKED)
        ? STATUS.BLOCKED
        : sections.some((item) => item.status === STATUS.PASSED)
          ? STATUS.PASSED
          : STATUS.SKIPPED,
    passed: sections.filter((item) => item.status === STATUS.PASSED).length,
    failed: sections.filter((item) => item.status === STATUS.FAILED).length,
    blocked: sections.filter((item) => item.status === STATUS.BLOCKED).length,
    skipped: sections.filter((item) => item.status === STATUS.SKIPPED).length,
    classifications: sections.reduce((acc, item) => {
      if (item.classification) {
        acc[item.classification] = (acc[item.classification] || 0) + 1;
      }
      return acc;
    }, {}),
    safe_stop_triggered: result.summary.safe_stop_triggered,
  };
}

async function withNetwork(page, name, callback) {
  const observer = createNetworkObserver(page, {
    name,
    urlContains: PROFILE.network_observation.url_contains,
  });

  try {
    const value = await callback();
    return {
      value,
      network: observer.summary(),
    };
  } finally {
    observer.stop();
  }
}

async function runListSmoke(page, selectorRegistry) {
  const registry = selectorRegistry || loadSelectorRegistry(SELECTOR_REGISTRY_PATH);
  const createCandidates = registry.selectors.list.create_button.candidates || [];

  await page.goto(PROFILE.page_entry.list_url || MODULE_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(1500);

  const evidence = await capturePageEvidence(page, {
    includeFormFields: false,
    includeButtons: true,
    maxRowsPerTable: 10,
    maxTables: 3,
  });

  let createButtonFound = false;
  let matchedSelector = null;
  for (const selector of createCandidates) {
    const count = await page.locator(selector).count().catch(() => 0);
    if (count > 0) {
      createButtonFound = true;
      matchedSelector = selector;
      break;
    }
  }

  recordSelectorObservation(SELECTOR_REGISTRY_PATH, "list.create_button", {
    ok: createButtonFound,
    note: matchedSelector || "No create button candidate matched during list smoke.",
  });

  const hasTableEvidence =
    (evidence.tables && evidence.tables.length > 0) ||
    (evidence.headers && evidence.headers.length > 0) ||
    evidence.rowCount > 0;
  const passed = createButtonFound || hasTableEvidence;

  return buildCaseResult({
    id: "listSmoke",
    title: "Transaction Mapping list smoke",
    phase: "listSmoke",
    status: passed ? STATUS.PASSED : STATUS.FAILED,
    productBugEvidence: !passed,
    reason: passed
      ? "List page exposed either create action or table evidence."
      : "List page did not expose expected create/table evidence.",
    expected: "List page reachable with create action or table evidence.",
    actual: {
      url: evidence.url,
      title: evidence.title,
      create_button_found: createButtonFound,
      matched_selector: matchedSelector,
      row_count: evidence.rowCount,
      headers: evidence.headers,
    },
    evidence: {
      headings: evidence.headings,
      buttons: evidence.buttons,
      top_rows: evidence.rows?.slice(0, 5) || [],
    },
  });
}

async function runCreateSmoke(page) {
  const validation = await runEmptyRequiredValidation(page);
  return buildCaseResult({
    id: "createSmoke",
    title: "Create form required-field smoke",
    phase: "createSmoke",
    status: validation.passed ? STATUS.PASSED : STATUS.FAILED,
    expectedValidation: true,
    reason: validation.passed
      ? "Required-field validation matched the Transaction Mapping execution profile."
      : "Required-field validation did not match the Transaction Mapping execution profile.",
    expected: validation.expectedErrors,
    actual: validation.errors,
    evidence: validation,
  });
}

async function runHappyPath(page, args) {
  if (args.noSubmit || !PROFILE.safety.safe_submit_allowed_by_profile) {
    return buildCaseResult({
      id: "happyPath",
      title: "Minimal happy path",
      phase: "happyPath",
      status: STATUS.BLOCKED,
      classification: CLASSIFICATIONS.NEEDS_MANUAL_REVIEW,
      classificationReason: "Happy path submit was stopped by execution safety settings.",
      expected: "Safe profile or explicit submit permission.",
      actual: {
        no_submit: args.noSubmit,
        safe_submit_allowed_by_profile: PROFILE.safety.safe_submit_allowed_by_profile,
      },
    });
  }

  const positive = await runPositiveCreateAndVerify(page, {
    payload: {
      description: "QA flow-aware execution baseline happy path",
    },
  });

  return buildCaseResult({
    id: "happyPath",
    title: "Minimal happy path create and verify",
    phase: "happyPath",
    status: positive.success ? STATUS.PASSED : STATUS.FAILED,
    productBugEvidence: !positive.success,
    reason: positive.success
      ? "Created row was verified in the Transaction Mapping list."
      : "Create flow completed but row verification did not prove persistence.",
    expected: "Create flow submits and created row appears in list.",
    actual: {
      name: positive.base.name,
      approval: positive.approval.selectedText,
      attachment: positive.attachment.fileName,
      final_url: positive.submit.finalUrl,
      verification_found: positive.verification.found,
    },
    evidence: {
      verification: positive.verification,
      api_summary: positive.apiSummary,
    },
  });
}

async function runEdgeCase(page) {
  const edge = await runSpecialCharacterEdgeCase(page);
  return buildCaseResult({
    id: "edgeCase",
    title: "Special-character create form edge case",
    phase: "edgeCase",
    status: edge.passed ? STATUS.PASSED : STATUS.FAILED,
    expectedValidation: edge.passed,
    productBugEvidence: !edge.passed && edge.dialogTriggered,
    reason: edge.passed
      ? "Script-like input did not execute and required-field validation remained intact."
      : "Special-character behavior needs review; dialog or validation mismatch was observed.",
    expected: {
      no_dialog: true,
      required_errors: edge.expectedErrors,
    },
    actual: {
      dialog_triggered: edge.dialogTriggered,
      stored_value: edge.storedValue,
      errors: edge.errors,
    },
    evidence: edge,
  });
}

function skippedBecauseSafeStop(phase) {
  return buildCaseResult({
    id: phase,
    title: `${phase} skipped by safe stop`,
    phase,
    status: STATUS.SKIPPED,
    classification: CLASSIFICATIONS.NEEDS_MANUAL_REVIEW,
    classificationReason: "Earlier smoke phase failed or was blocked; downstream mutation was skipped.",
  });
}

async function runSelectedScope(scope, page, args, selectorRegistry) {
  if (scope === "listSmoke") {
    return withNetwork(page, scope, async () => runListSmoke(page, selectorRegistry));
  }
  if (scope === "createSmoke") {
    return withNetwork(page, scope, async () => runCreateSmoke(page));
  }
  if (scope === "happyPath") {
    return withNetwork(page, scope, async () => runHappyPath(page, args));
  }
  if (scope === "edgeCase") {
    return withNetwork(page, scope, async () => runEdgeCase(page));
  }
  throw new Error(`Unknown scope: ${scope}`);
}

function shouldSafeStop(result, scope) {
  if (scope === "listSmoke" && PROFILE.safety.stop_if_list_smoke_fails) {
    return result.status !== STATUS.PASSED;
  }
  if (scope === "createSmoke" && PROFILE.safety.stop_if_create_smoke_fails) {
    return result.status !== STATUS.PASSED;
  }
  return false;
}

function writeExecutionResult(result, label = "") {
  const suffix = label ? `-${label}` : "";
  const filePath = artifactPath(`transaction-mapping-execution-baseline${suffix}.json`);
  writeJson(filePath, result);
  return filePath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = normalizeMode(args.mode);
  const scopes = MODE_SCOPES[mode];
  const result = buildInitialResult(args, mode, scopes);

  if (args.dryRun) {
    for (const scope of scopes) {
      result.results[scope] = {
        ...result.results[scope],
        classification_reason: "Dry run selected this scope but did not execute browser/app actions.",
      };
    }
    summarizeResult(result);
    result.notes.push("Dry run only. No browser, app, DB, or Telegram action was executed.");
    result.profile_path = path.relative(process.cwd(), PROFILE_PATH);
    result.selector_registry_path = path.relative(process.cwd(), SELECTOR_REGISTRY_PATH);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  const selectorRegistry = loadSelectorRegistry(SELECTOR_REGISTRY_PATH);
  const { browser } = await connectBrowser();
  const page = await openTransactionMappingPage(browser);

  let safeStop = false;
  for (const scope of scopes) {
    if (safeStop) {
      result.results[scope] = skippedBecauseSafeStop(scope);
      continue;
    }

    try {
      const { value, network } = await runSelectedScope(scope, page, args, selectorRegistry);
      result.results[scope] = {
        ...value,
        network,
      };
      if (shouldSafeStop(value, scope)) {
        safeStop = true;
        result.summary.safe_stop_triggered = true;
      }
    } catch (error) {
      const classification = classifyError(error);
      result.results[scope] = buildCaseResult({
        id: scope,
        title: `${scope} execution failed`,
        phase: scope,
        status: STATUS.BLOCKED,
        classification: classification.classification,
        classificationReason: classification.reason,
        expected: "Flow-aware execution reaches a classifiable product state.",
        actual: "Execution stopped before product behavior could be proven.",
        error,
      });
      safeStop = true;
      result.summary.safe_stop_triggered = true;
    }
  }

  summarizeResult(result);
  const outputPath = writeExecutionResult(result, args.label || mode);
  result.output_path = path.relative(process.cwd(), outputPath);

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(result.summary.overall_status === STATUS.PASSED ? 0 : 1);
}

main().catch((error) => {
  const classification = classifyError(error);
  const output = {
    schema_version: "ai-qa-lab.flow-execution-result.v1",
    checked_at: new Date().toISOString(),
    module: {
      key: PROFILE.module_key,
      name: PROFILE.module_name,
    },
    summary: {
      overall_status: STATUS.BLOCKED,
      classifications: {
        [classification.classification]: 1,
      },
      safe_stop_triggered: true,
    },
    error: {
      message: error.message,
      classification: classification.classification,
      classification_reason: classification.reason,
    },
  };

  try {
    writeJson(artifactPath("transaction-mapping-execution-baseline-error.json"), output);
  } catch (writeError) {
    process.stderr.write(`Artifact write failed: ${writeError.message}\n`);
  }

  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
