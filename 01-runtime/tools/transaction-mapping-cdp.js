const fs = require("fs");
const path = require("path");
const {
  connectBrowser,
  getOrCreatePage,
  paths,
} = require("./cdp-utils");
const { capturePageEvidence, rowContainsText } = require("./table-evidence");
const {
  selectActiveDropdownOption,
  waitForActiveDropdown,
  normalizeText: normalizeUiText,
} = require("./ant-design-helpers");

const MODULE_URL =
  process.env.PGN_TRANSACTION_MAPPING_URL ||
  "https://dev-energy.pgn.co.id/system-setup/billing-item";
const CREATE_URL = `${MODULE_URL}/create`;
const DEFAULT_ATTACHMENT_PATH = path.join(
  paths.rootDir,
  "06-testing",
  "adhoc",
  "fixtures",
  "transaction-mapping-dummy-upload.pdf"
);

function normalizeText(text = "") {
  return String(text).replace(/\s+/g, " ").trim();
}

async function pause(page, ms = 300) {
  await page.waitForTimeout(ms);
}

async function waitForCondition(check, timeoutMs, intervalMs, errorMessage) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = await check();
    if (result) {
      return result;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(errorMessage);
}

async function gotoCreatePage(page) {
  await page.goto(CREATE_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.locator("input#name").waitFor({ timeout: 15000 });
  await pause(page, 1500);
}

async function findButton(scope, name) {
  const buttons = scope.locator("button");
  const count = await buttons.count();

  for (let index = 0; index < count; index += 1) {
    const candidate = buttons.nth(index);
    const isVisible = await candidate.isVisible().catch(() => false);
    if (!isVisible) {
      continue;
    }

    const text = normalizeText(await candidate.textContent().catch(() => ""));
    if (text === name) {
      return candidate;
    }
  }

  return null;
}

async function clickExactButton(scope, name) {
  const button = await findButton(scope, name);
  if (!button) {
    throw new Error(`Button not found: ${name}`);
  }

  await button.scrollIntoViewIfNeeded().catch(() => {});
  await pause(scope.page ? scope.page() : scope, 150).catch(() => {});

  try {
    await button.click({ timeout: 5000 });
  } catch (error) {
    await button.click({ force: true, timeout: 5000 });
  }

  return button;
}

async function maybeClickButton(scope, name) {
  const button = await findButton(scope, name);
  if (!button) {
    return false;
  }

  try {
    await button.click({ timeout: 3000 });
  } catch (error) {
    await button.click({ force: true, timeout: 3000 });
  }

  return true;
}

async function collectValidationErrors(page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll(".ant-form-item-explain-error"))
      .map((node) => node.textContent.trim())
      .filter(Boolean);
  });
}

async function getStepIndex(page) {
  return page.evaluate(() => {
    const steps = Array.from(document.querySelectorAll(".ant-steps-item"));
    return steps.findIndex((node) => node.className.includes("ant-steps-item-process"));
  });
}

async function waitForStepIndex(page, expectedIndex, timeoutMs = 10000) {
  return waitForCondition(
    async () => {
      const currentIndex = await getStepIndex(page);
      return currentIndex === expectedIndex ? currentIndex : false;
    },
    timeoutMs,
    250,
    `Wizard did not reach step index ${expectedIndex}`
  );
}

async function getSelectedText(page, inputId) {
  return page.evaluate((id) => {
    const input = document.getElementById(id);
    const wrapper = input?.closest(".ant-select");
    const selected = wrapper?.querySelector(".ant-select-selection-item");
    return selected?.textContent?.trim() || "";
  }, inputId);
}

async function selectAntOption(page, inputId, options = {}) {
  const scope = options.scope || page;
  const input = scope.locator(`#${inputId}`).first();
  await input.waitFor({ state: "attached", timeout: 10000 });

  const wrapper = input.locator(
    "xpath=ancestor::*[contains(@class, 'ant-select')][1]"
  );
  await wrapper.scrollIntoViewIfNeeded().catch(() => {});
  await pause(page, 200);

  try {
    await wrapper.click({ timeout: 5000 });
  } catch (error) {
    await wrapper.click({ force: true, timeout: 5000 });
  }

  await waitForActiveDropdown(page, {
    timeoutMs: 5000,
    pollMs: 100,
  });

  const selection = await selectActiveDropdownOption(page, {
    optionText: options.optionText || "",
    exact: options.exact !== false,
    optionIndex: options.optionIndex,
    timeoutMs: 5000,
    pollMs: 100,
  });

  const selectedText =
    (await waitForCondition(
      async () => {
        const currentValue = await getSelectedText(page, inputId);
        const normalizedCurrent = normalizeUiText(currentValue).toLowerCase();
        const normalizedExpected = normalizeUiText(selection.optionText).toLowerCase();

        if (!normalizedCurrent) {
          return false;
        }

        if (!normalizedExpected) {
          return currentValue;
        }

        const matched = options.exact === false
          ? normalizedCurrent.includes(normalizedExpected)
          : normalizedCurrent === normalizedExpected;

        return matched ? currentValue : false;
      },
      5000,
      100,
      `Selected text did not update for ${inputId}`
    ).catch(() => "")) || "";

  await pause(page, 300);

  return {
    inputId,
    optionText: selection.optionText,
    selectedText: selectedText || selection.optionText,
    availableOptions: selection.availableOptions || [],
  };
}

async function selectDate(page, inputId) {
  const input = page.locator(`#${inputId}`).first();
  await input.scrollIntoViewIfNeeded().catch(() => {});
  await input.click({ force: true, timeout: 5000 });
  await pause(page, 400);

  const pickerCell = page
    .locator(
      ".ant-picker-dropdown:visible .ant-picker-cell:not(.ant-picker-cell-disabled), .ant-picker-panel:visible .ant-picker-cell:not(.ant-picker-cell-disabled)"
    )
    .first();

  await pickerCell.click({ force: true, timeout: 5000 });
  await pause(page, 300);

  return input.inputValue();
}

async function fillStepOne(page, payload = {}) {
  const name = payload.name || `QA_Auto_${Date.now()}`;
  const description = payload.description || "QA automated create flow";

  await page.locator("input#name").fill(name);
  await pause(page, 200);
  await page.locator("textarea").first().fill(description);
  await pause(page, 300);

  const category = await selectAntOption(page, "billingItemCategory");
  const type = await selectAntOption(page, "type");
  const billType = await selectAntOption(page, "billType");
  const criteria = await selectAntOption(page, "criteria");
  const startDate = await selectDate(page, "startDate");

  return {
    name,
    description,
    category,
    type,
    billType,
    criteria,
    startDate,
  };
}

async function ensureApprovalStep(page) {
  const currentIndex = await getStepIndex(page);
  if (currentIndex === 1) {
    return;
  }

  if (currentIndex === 0) {
    await clickExactButton(page, "Next");
    await waitForStepIndex(page, 1);
    await pause(page, 500);
    return;
  }

  throw new Error(`Cannot move to Approval step from index ${currentIndex}`);
}

async function selectApprovalHierarchy(page) {
  await ensureApprovalStep(page);
  const selection = await selectAntOption(page, "apphierId");

  await waitForCondition(
    async () => {
      const text = normalizeText(await page.locator("body").textContent().catch(() => ""));
      return text.includes(selection.selectedText) ? true : false;
    },
    5000,
    200,
    "Approval hierarchy details did not render"
  );

  return selection;
}

async function ensureAttachmentStep(page) {
  const currentIndex = await getStepIndex(page);
  if (currentIndex === 2) {
    return;
  }

  if (currentIndex === 1) {
    await clickExactButton(page, "Next");
    await waitForStepIndex(page, 2);
    await pause(page, 500);
    return;
  }

  throw new Error(`Cannot move to Attachment step from index ${currentIndex}`);
}

function getModalRoot(page) {
  return page.locator("[role=\"dialog\"]").last();
}

async function openAttachmentModal(page) {
  await ensureAttachmentStep(page);
  await clickExactButton(page, "Choose File");

  const modal = getModalRoot(page);
  await modal.waitFor({ state: "visible", timeout: 8000 });
  await pause(page, 300);
  return modal;
}

async function uploadAttachment(page, options = {}) {
  const filePath = options.filePath || DEFAULT_ATTACHMENT_PATH;
  if (!fs.existsSync(filePath)) {
    throw new Error(`Attachment fixture not found: ${filePath}`);
  }

  const modal = await openAttachmentModal(page);
  const category = await selectAntOption(page, "category", { scope: modal });
  const fileInput = modal.locator("input[type=file]").first();
  await fileInput.setInputFiles(filePath);
  await pause(page, 600);

  const fileName = path.basename(filePath);

  await waitForCondition(
    async () => {
      const text = normalizeText(await modal.textContent().catch(() => ""));
      return text.includes(fileName) ? true : false;
    },
    5000,
    200,
    `Uploaded file name did not appear in modal: ${fileName}`
  );

  await clickExactButton(modal, "Save");

  await waitForCondition(
    async () => {
      try {
        return (await modal.isVisible()) ? false : true;
      } catch (error) {
        return true;
      }
    },
    8000,
    200,
    "Attachment modal did not close"
  );

  await waitForCondition(
    async () => {
      const text = normalizeText(await page.locator("body").textContent().catch(() => ""));
      return text.includes(fileName) ? true : false;
    },
    8000,
    250,
    `Uploaded file row did not appear in attachment table: ${fileName}`
  );

  return {
    categorySelected: category.selectedText || category.optionText,
    fileName,
    filePath,
  };
}

async function submitAndConfirm(page) {
  await clickExactButton(page, "Submit");
  await pause(page, 1000);
  await maybeClickButton(page, "Confirm");
  await pause(page, 1500);
  await maybeClickButton(page, "OK");

  const postSubmitUrl = await waitForCondition(
    async () => {
      const url = page.url();
      return !url.includes("/create") ? url : false;
    },
    20000,
    300,
    "Did not leave Transaction Mapping create form after submit"
  );

  if (!postSubmitUrl.includes(MODULE_URL)) {
    await page.goto(MODULE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  }

  await pause(page, 2000);
  return {
    postSubmitUrl,
    finalUrl: page.url(),
  };
}

async function verifyCreatedRow(page, name) {
  if (!page.url().includes(MODULE_URL) || page.url().includes("/create")) {
    await page.goto(MODULE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await pause(page, 2000);
  }

  const evidence = await capturePageEvidence(page, {
    includeFormFields: false,
    includeButtons: true,
    maxRowsPerTable: 20,
    maxTables: 3,
    maxDropdowns: 3,
  });
  const matchedRow = evidence.rows.find((row) => rowContainsText(row, name)) || null;

  return {
    found: Boolean(matchedRow),
    url: evidence.url,
    title: evidence.title,
    headings: evidence.headings,
    headers: evidence.headers,
    row: matchedRow || null,
    rowCount: evidence.rowCount,
    topRows: evidence.rows.slice(0, 5),
    visibleDropdowns: evidence.visibleDropdowns,
    visibleOptionLists: evidence.visibleOptionLists,
    visibleOverlays: evidence.visibleOverlays,
  };
}

function attachBillingItemApiCollector(page) {
  const calls = [];
  const handler = (response) => {
    const url = response.url();
    if (!url.includes("/rbi/v1/dbs/api/billingitem/")) {
      return;
    }

    calls.push({
      timestamp: new Date().toISOString(),
      method: response.request().method(),
      status: response.status(),
      url,
    });
  };

  page.on("response", handler);

  return {
    calls,
    stop() {
      page.off("response", handler);
    },
  };
}

async function runPositiveCreateAndVerify(page, options = {}) {
  const collector = attachBillingItemApiCollector(page);

  try {
    await gotoCreatePage(page);
    const base = await fillStepOne(page, options.payload);
    const approval = await selectApprovalHierarchy(page);
    await ensureAttachmentStep(page);
    const attachment = await uploadAttachment(page, {
      filePath: options.filePath || DEFAULT_ATTACHMENT_PATH,
    });
    const submit = await submitAndConfirm(page);
    const verification = await verifyCreatedRow(page, base.name);

    const apiSummary = collector.calls.filter((call) => {
      return (
        call.url.includes("validate-create") ||
        call.url.endsWith("/create") ||
        call.url.includes("attachment-upload") ||
        call.url.includes("approval-hierarchies-detail")
      );
    });

    return {
      success: verification.found,
      base,
      approval,
      attachment,
      submit,
      verification,
      apiSummary,
    };
  } finally {
    collector.stop();
  }
}

const STEP_ONE_REQUIRED_ERRORS = [
  "Please input your Category!",
  "Please input your Type!",
  "Please input your Name!",
  "Please input your Bill Type!",
  "Please input your Criteria!",
  "Please input your Start Date!",
  "Please input your Description!",
];

const STEP_ONE_REQUIRED_ERRORS_WITHOUT_NAME = STEP_ONE_REQUIRED_ERRORS.filter(
  (message) => message !== "Please input your Name!"
);

function matchesExpectedErrors(errors, expectedErrors) {
  const normalizedActual = errors.map((item) => normalizeText(item)).sort();
  const normalizedExpected = expectedErrors.map((item) => normalizeText(item)).sort();

  return (
    normalizedActual.length === normalizedExpected.length &&
    normalizedExpected.every((item, index) => item === normalizedActual[index])
  );
}

async function runEmptyRequiredValidation(page) {
  await gotoCreatePage(page);
  await clickExactButton(page, "Next");
  await pause(page, 500);
  const errors = await collectValidationErrors(page);

  return {
    passed: matchesExpectedErrors(errors, STEP_ONE_REQUIRED_ERRORS),
    expectedErrors: STEP_ONE_REQUIRED_ERRORS,
    errors,
  };
}

async function runOnlyNameValidation(page) {
  await gotoCreatePage(page);
  const name = `QA_NameOnly_${Date.now()}`;
  await page.locator("input#name").fill(name);
  await pause(page, 200);
  await clickExactButton(page, "Next");
  await pause(page, 500);
  const errors = await collectValidationErrors(page);

  return {
    passed: matchesExpectedErrors(errors, STEP_ONE_REQUIRED_ERRORS_WITHOUT_NAME),
    name,
    expectedErrors: STEP_ONE_REQUIRED_ERRORS_WITHOUT_NAME,
    errors,
  };
}

async function runMissingApprovalValidation(page) {
  await gotoCreatePage(page);
  const base = await fillStepOne(page, {
    description: "QA automated approval validation flow",
  });
  await ensureApprovalStep(page);
  await clickExactButton(page, "Next");
  await pause(page, 500);
  const errors = await collectValidationErrors(page);
  const expectedErrors = ["Please input your Approval Hierarchy!"];

  return {
    passed: matchesExpectedErrors(errors, expectedErrors),
    name: base.name,
    expectedErrors,
    errors,
  };
}

async function runSpecialCharacterEdgeCase(page) {
  await gotoCreatePage(page);
  const payload = "<script>alert(1)</script>";
  let dialogTriggered = false;

  const dialogHandler = async (dialog) => {
    dialogTriggered = true;
    await dialog.dismiss().catch(() => {});
  };

  page.on("dialog", dialogHandler);

  try {
    await page.locator("input#name").fill(payload);
    await pause(page, 200);
    await clickExactButton(page, "Next");
    await pause(page, 500);
    const storedValue = await page.locator("input#name").inputValue();
    const errors = await collectValidationErrors(page);

    return {
      passed:
        !dialogTriggered &&
        storedValue === payload &&
        matchesExpectedErrors(errors, STEP_ONE_REQUIRED_ERRORS_WITHOUT_NAME),
      dialogTriggered,
      storedValue,
      expectedErrors: STEP_ONE_REQUIRED_ERRORS_WITHOUT_NAME,
      errors,
    };
  } finally {
    page.off("dialog", dialogHandler);
  }
}

async function openTransactionMappingPage(browser) {
  const page = await getOrCreatePage(browser, "billing-item");
  page.setDefaultTimeout(30000);
  return page;
}

module.exports = {
  MODULE_URL,
  CREATE_URL,
  DEFAULT_ATTACHMENT_PATH,
  connectBrowser,
  openTransactionMappingPage,
  gotoCreatePage,
  getStepIndex,
  collectValidationErrors,
  fillStepOne,
  selectApprovalHierarchy,
  ensureAttachmentStep,
  uploadAttachment,
  submitAndConfirm,
  verifyCreatedRow,
  runPositiveCreateAndVerify,
  runEmptyRequiredValidation,
  runOnlyNameValidation,
  runMissingApprovalValidation,
  runSpecialCharacterEdgeCase,
};

