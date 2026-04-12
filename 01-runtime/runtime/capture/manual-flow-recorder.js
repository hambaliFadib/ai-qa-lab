const fs = require("fs");
const path = require("path");
const readline = require("readline");

const {
  paths,
  ensureDir,
  writeJson,
  writeText,
  connectBrowser,
} = require("../../tools/cdp-utils");
const { capturePageEvidence } = require("../../tools/table-evidence");

function parseArgs(argv) {
  const args = {
    page: "dev-energy.pgn.co.id",
    label: "manual-create-flow",
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--help" || value === "-h") {
      args.help = true;
    } else if (value === "--page" && argv[i + 1]) {
      args.page = argv[i + 1];
      i += 1;
    } else if (value === "--label" && argv[i + 1]) {
      args.label = argv[i + 1];
      i += 1;
    }
  }

  return args;
}

function printHelp() {
  console.log(`Manual Flow Recorder\n\nUsage:\n  node capture/manual-flow-recorder.js [--page <url-fragment>] [--label <session-label>]\n\nExamples:\n  node capture/manual-flow-recorder.js\n  node capture/manual-flow-recorder.js --page billing-item --label transaction-mapping-create\n\nBehavior:\n  - attach to the existing CDP browser\n  - record DOM actions, navigation, validation, and relevant API activity\n  - save screenshots and structured output automatically\n  - stop when you press Enter in this terminal\n`);
}

function slugify(value) {
  return String(value || "session")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "session";
}

function nowStamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function truncate(value, max = 160) {
  if (value === undefined || value === null) {
    return "";
  }
  const text = String(value).replace(/\s+/g, " ").trim();
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 3)}...`;
}

function readModuleHint() {
  const activeModulePath = path.join(paths.runtimeDocsDir, "ACTIVE_MODULE.md");
  if (!fs.existsSync(activeModulePath)) {
    return "";
  }

  const lines = fs
    .readFileSync(activeModulePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return truncate(lines.slice(0, 6).join(" | "), 300);
}

function installDomRecorder() {
  if (window.__qaFlowRecorderInstalled || typeof window.__qaFlowRecordEvent !== "function") {
    return;
  }

  const clean = (value, max = 160) => {
    if (value === undefined || value === null) {
      return "";
    }
    const text = String(value).replace(/\s+/g, " ").trim();
    return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
  };

  const pickElement = (target) => {
    const node = target && target.nodeType === Node.TEXT_NODE ? target.parentElement : target;
    if (!(node instanceof Element)) {
      return null;
    }

    return (
      node.closest(
        "button, a, input, textarea, select, [role='button'], .ant-btn, .ant-select, .ant-select-selector, .ant-picker, .ant-picker-input, .ant-radio-wrapper, .ant-checkbox-wrapper, label"
      ) || node
    );
  };

  const readValue = (element) => {
    if (!element) {
      return "";
    }

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      return clean(element.value || "", 120);
    }

    const nestedInput = element.querySelector("input, textarea, select");
    if (nestedInput && "value" in nestedInput) {
      return clean(nestedInput.value || "", 120);
    }

    const selected = element.querySelector(".ant-select-selection-item, .ant-picker-input input");
    if (selected) {
      return clean(selected.textContent || selected.value || "", 120);
    }

    return "";
  };

  const buildSelector = (element) => {
    if (!element) {
      return "";
    }

    if (element.id) {
      return `#${element.id}`;
    }

    const parts = [];
    let current = element;
    let depth = 0;
    while (current && current.nodeType === Node.ELEMENT_NODE && depth < 4) {
      let part = current.tagName.toLowerCase();
      if (current.classList && current.classList.length > 0) {
        part += `.${Array.from(current.classList).slice(0, 2).join(".")}`;
      }
      parts.unshift(part);
      current = current.parentElement;
      depth += 1;
    }

    return parts.join(" > ");
  };

  const summarize = (element) => {
    const textSource =
      element.getAttribute("aria-label") ||
      element.getAttribute("placeholder") ||
      element.textContent ||
      element.value ||
      "";

    return {
      tag: (element.tagName || "").toLowerCase(),
      type: clean(element.getAttribute("type") || "", 40),
      id: clean(element.id || "", 80),
      name: clean(element.getAttribute("name") || "", 80),
      role: clean(element.getAttribute("role") || "", 40),
      placeholder: clean(element.getAttribute("placeholder") || "", 80),
      selector: clean(buildSelector(element), 200),
      text: clean(textSource, 160),
      value: readValue(element),
      className: clean(element.className || "", 160),
      url: window.location.href,
      title: clean(document.title || "", 120),
    };
  };

  const send = (eventType, target, extra = {}) => {
    const element = pickElement(target);
    if (!element) {
      return;
    }

    try {
      window.__qaFlowRecordEvent({
        eventType,
        timestamp: new Date().toISOString(),
        ...summarize(element),
        ...extra,
      });
    } catch (error) {
      // Ignore recorder callback failures inside the page.
    }
  };

  document.addEventListener(
    "click",
    (event) => {
      send("click", event.target);
    },
    true
  );

  document.addEventListener(
    "change",
    (event) => {
      send("change", event.target);
    },
    true
  );

  document.addEventListener(
    "submit",
    (event) => {
      send("submit", event.target);
    },
    true
  );

  window.addEventListener(
    "beforeunload",
    () => {
      try {
        window.__qaFlowRecordEvent({
          eventType: "beforeunload",
          timestamp: new Date().toISOString(),
          url: window.location.href,
          title: clean(document.title || "", 120),
        });
      } catch (error) {
        // Ignore recorder callback failures inside the page.
      }
    },
    true
  );

  window.__qaFlowRecorderInstalled = true;
}

async function summarizePage(page) {
  try {
    const evidence = await capturePageEvidence(page, {
      includeFormFields: true,
      includeButtons: true,
      maxRowsPerTable: 5,
      maxTables: 3,
      maxDropdowns: 3,
      maxOptionLists: 5,
    });

    return {
      ...evidence.summary,
      heading: evidence.headings?.[0] || "",
      formFields: evidence.formFields || [],
      tableHeaders: evidence.headers || [],
      rowCount: evidence.rowCount || 0,
      topRows: evidence.rows?.slice(0, 5) || [],
      visibleDropdowns: evidence.visibleDropdowns || [],
      visibleOptionLists: evidence.visibleOptionLists || [],
      visibleOverlays: evidence.visibleOverlays || [],
    };
  } catch (error) {
    return {
      url: page.url(),
      title: "",
      heading: "",
      errors: [`Failed to summarize page: ${error.message}`],
      formFields: [],
      tables: [],
      tableHeaders: [],
      rowCount: 0,
      topRows: [],
      visibleDropdowns: [],
      visibleOptionLists: [],
      visibleOverlays: [],
    };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const startedAt = new Date();
  const sessionId = `${slugify(args.label)}-${nowStamp(startedAt)}`;
  const sessionDir = path.join(paths.manualFlowRecordsDir, sessionId);
  const screenshotsDir = path.join(sessionDir, "screenshots");
  const sessionJsonPath = path.join(sessionDir, "record.json");
  const sessionMdPath = path.join(sessionDir, "record.md");
  const latestJsonPath = path.join(paths.adhocNotesDir, "manual-flow-record-latest.json");
  const latestMdPath = path.join(paths.adhocNotesDir, "manual-flow-record-latest.md");

  ensureDir(sessionDir);
  ensureDir(screenshotsDir);

  const record = {
    sessionId,
    label: args.label,
    pageFragment: args.page,
    moduleHint: readModuleHint(),
    startedAt: startedAt.toISOString(),
    stoppedAt: null,
    events: [],
    network: [],
    requestFailures: [],
    console: [],
    pageErrors: [],
    checkpoints: [],
    initialState: null,
    finalState: null,
    files: {
      sessionDir,
      sessionJsonPath,
      sessionMdPath,
      latestJsonPath,
      latestMdPath,
    },
  };

  let eventCounter = 0;
  let screenshotCounter = 0;
  let browser;
  let context;
  let activePage;

  const relevantNetwork = (url, resourceType) => {
    if (!url || !url.includes("pgn.co.id")) {
      return false;
    }
    return resourceType === "document" || url.includes("/api/") || url.includes("/rbi/") || url.includes("/dbs/");
  };

  const nextEventId = () => {
    eventCounter += 1;
    return eventCounter;
  };

  const nextScreenshotName = (label) => {
    screenshotCounter += 1;
    const fileName = `${String(screenshotCounter).padStart(3, "0")}-${slugify(label)}.png`;
    return path.join(screenshotsDir, fileName);
  };

  const appendEvent = (type, payload = {}) => {
    const entry = {
      id: nextEventId(),
      type,
      at: new Date().toISOString(),
      ...payload,
    };
    record.events.push(entry);
    return entry;
  };

  const saveArtifacts = () => {
    writeJson(sessionJsonPath, record);
  };

  const buildMarkdown = () => {
    const finalErrors = (record.finalState?.errors || []).map((error) => `- ${error}`).join("\n") || "- none";
    const finalTableHeaders =
      (record.finalState?.tableHeaders || []).map((header) => `- ${header}`).join("\n") || "- none";
    const latestDropdownOptions =
      record.checkpoints
        .slice()
        .reverse()
        .flatMap((checkpoint) => [
          ...(checkpoint.state?.visibleOptionLists || []),
          ...(checkpoint.state?.visibleDropdowns || []),
        ])
        .find((dropdown) => Array.isArray(dropdown.options) && dropdown.options.length > 0)?.options || [];
    const dropdownOptionsMarkdown =
      latestDropdownOptions.map((option) => `- ${option}`).join("\n") || "- none";
    const checkpoints = record.checkpoints
      .slice(0, 12)
      .map((checkpoint) => {
        const screenshot = checkpoint.screenshot ? ` (${checkpoint.screenshot})` : "";
        return `- ${checkpoint.at} | ${checkpoint.label}${screenshot}`;
      })
      .join("\n") || "- none";
    const recentEvents = record.events
      .slice(-20)
      .map((event) => `- ${event.at} | ${event.type} | ${truncate(event.text || event.url || event.message || event.selector || "", 140)}`)
      .join("\n") || "- none";
    const apiCalls = record.network
      .slice(-20)
      .map((event) => `- ${event.at} | ${event.method} ${event.status} | ${event.url}`)
      .join("\n") || "- none";

    return `# Manual Flow Record\n\n- Session: ${record.sessionId}\n- Label: ${record.label}\n- Module Hint: ${record.moduleHint || "unknown"}\n- Started: ${record.startedAt}\n- Stopped: ${record.stoppedAt || "in-progress"}\n- Page Fragment: ${record.pageFragment}\n- Final URL: ${record.finalState?.url || record.initialState?.url || "unknown"}\n\n## Final Errors\n${finalErrors}\n\n## Final Table Headers\n${finalTableHeaders}\n\n## Latest Visible Dropdown Options\n${dropdownOptionsMarkdown}\n\n## Checkpoints\n${checkpoints}\n\n## Recent Events\n${recentEvents}\n\n## Relevant API Calls\n${apiCalls}\n`;
  };

  const flushOutputs = () => {
    saveArtifacts();
    const markdown = buildMarkdown();
    writeText(sessionMdPath, markdown);
    writeJson(latestJsonPath, record);
    writeText(latestMdPath, markdown);
  };

  const captureCheckpoint = async (page, label, reason = "checkpoint") => {
    if (!page || page.isClosed()) {
      return;
    }

    const state = await summarizePage(page);
    const screenshotPath = nextScreenshotName(label);
    try {
      await page.screenshot({ path: screenshotPath, fullPage: true });
    } catch (error) {
      appendEvent("screenshot-failed", { message: error.message, label, url: page.url() });
    }

    record.checkpoints.push({
      at: new Date().toISOString(),
      label,
      reason,
      screenshot: path.relative(sessionDir, screenshotPath),
      state,
    });
    flushOutputs();
  };

  const scheduleCheckpoint = (page, label, reason, delayMs = 1200) => {
    setTimeout(() => {
      captureCheckpoint(page, label, reason).catch((error) => {
        appendEvent("checkpoint-failed", { label, message: error.message, url: page.url() });
        flushOutputs();
      });
    }, delayMs);
  };

  const attachToPage = async (page, pageLabel = "page") => {
    if (!page || page.__qaManualFlowAttached) {
      return;
    }

    page.__qaManualFlowAttached = true;
    activePage = page;

    page.on("framenavigated", (frame) => {
      if (frame !== page.mainFrame()) {
        return;
      }
      appendEvent("navigate", { url: frame.url(), pageLabel });
      flushOutputs();
      scheduleCheckpoint(page, "navigate", "navigation", 400);
    });

    page.on("domcontentloaded", () => {
      appendEvent("domcontentloaded", { url: page.url(), pageLabel });
      flushOutputs();
    });

    page.on("response", async (response) => {
      const request = response.request();
      const url = response.url();
      const resourceType = request.resourceType();
      if (!relevantNetwork(url, resourceType)) {
        return;
      }

      const networkEntry = {
        at: new Date().toISOString(),
        method: request.method(),
        status: response.status(),
        resourceType,
        url,
      };
      record.network.push(networkEntry);
      if (response.status() >= 400) {
        appendEvent("network-error", networkEntry);
        scheduleCheckpoint(page, `network-${response.status()}`, "network-error", 300);
      }
      flushOutputs();
    });

    page.on("requestfailed", (request) => {
      const url = request.url();
      const resourceType = request.resourceType();
      if (!relevantNetwork(url, resourceType)) {
        return;
      }

      const failure = {
        at: new Date().toISOString(),
        method: request.method(),
        resourceType,
        url,
        errorText: request.failure()?.errorText || "request failed",
      };
      record.requestFailures.push(failure);
      appendEvent("request-failed", failure);
      flushOutputs();
    });

    page.on("console", (message) => {
      if (!["warning", "error"].includes(message.type())) {
        return;
      }
      const entry = {
        at: new Date().toISOString(),
        level: message.type(),
        text: truncate(message.text(), 300),
        url: page.url(),
      };
      record.console.push(entry);
      appendEvent("console", entry);
      flushOutputs();
    });

    page.on("pageerror", (error) => {
      const entry = {
        at: new Date().toISOString(),
        message: truncate(error.message, 300),
        url: page.url(),
      };
      record.pageErrors.push(entry);
      appendEvent("page-error", entry);
      flushOutputs();
    });

    try {
      await page.evaluate(installDomRecorder);
    } catch (error) {
      appendEvent("inject-failed", { message: error.message, url: page.url(), pageLabel });
      flushOutputs();
    }
  };

  const waitForEnter = (question) =>
    new Promise((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question(question, () => {
        rl.close();
        resolve();
      });
    });

  try {
    ({ browser } = await connectBrowser());
    context =
      browser.contexts().find((candidate) =>
        candidate.pages().some((page) => page.url().includes(args.page))
      ) || browser.contexts()[0];

    if (!context) {
      throw new Error("No browser context available from the attached CDP session.");
    }

    await context.exposeBinding("__qaFlowRecordEvent", async ({ page }, payload) => {
      activePage = page || activePage;
      appendEvent("dom", payload || {});
      flushOutputs();

      const text = `${payload?.text || ""} ${payload?.selector || ""}`.toLowerCase();
      if (payload?.eventType === "click" && /(create|save|submit|approval|date|criteria|type|category)/.test(text)) {
        scheduleCheckpoint(activePage, `dom-${payload.eventType}-${payload.text || payload.selector || payload.tag}`, "dom-event", 900);
      }
    });
    await context.addInitScript(installDomRecorder);

    activePage =
      context.pages().find((page) => page.url().includes(args.page)) ||
      context.pages()[context.pages().length - 1];

    if (!activePage) {
      throw new Error(`No page found for fragment "${args.page}". Open the app in the attached browser first.`);
    }

    await attachToPage(activePage, "initial-page");
    context.on("page", (page) => {
      attachToPage(page, "new-page").catch((error) => {
        appendEvent("attach-page-failed", { message: error.message, url: page.url() });
        flushOutputs();
      });
    });

    record.initialState = await summarizePage(activePage);
    appendEvent("recording-started", {
      url: activePage.url(),
      title: record.initialState.title,
      heading: record.initialState.heading,
      moduleHint: record.moduleHint,
    });
    await captureCheckpoint(activePage, "start", "recording-started");

    console.log("=== Manual Flow Recorder ===");
    console.log(`Session: ${sessionId}`);
    console.log(`Page target: ${args.page}`);
    console.log(`Current URL: ${activePage.url()}`);
    console.log(`Artifacts: ${sessionDir}`);
    console.log("Run the create flow manually in the attached browser.");
    console.log("Press Enter in this terminal when the flow is finished.\n");

    await waitForEnter("Press Enter to stop the recorder after you finish the flow... ");

    if (activePage && !activePage.isClosed()) {
      record.finalState = await summarizePage(activePage);
      await captureCheckpoint(activePage, "final", "recording-stopped");
    }
    record.stoppedAt = new Date().toISOString();
    appendEvent("recording-stopped", {
      url: activePage && !activePage.isClosed() ? activePage.url() : "page-closed",
      finalErrors: (record.finalState?.errors || []).length,
    });
    flushOutputs();

    console.log("\nRecorder finished.");
    console.log(`Latest summary: ${latestMdPath}`);
    console.log(`Session record: ${sessionJsonPath}`);
  } catch (error) {
    appendEvent("recording-error", { message: error.message });
    record.stoppedAt = new Date().toISOString();
    flushOutputs();
    console.error(`Recorder failed: ${error.message}`);
    process.exitCode = 1;
  }
}

main();


