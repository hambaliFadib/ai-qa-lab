const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { paths, ensureDir, writeJson, writeText } = require("./workspace-paths");

const ENV_CANDIDATES = [
  path.join(paths.opencodeDir, "config", "telegram-bug-reporter.local.env"),
  path.join(paths.opencodeDir, "config", "telegram-bug-reporter.env"),
  path.join(paths.rootDir, ".opencode", "config", "telegram-bug-reporter.local.env"),
  path.join(paths.rootDir, ".opencode", "config", "telegram-bug-reporter.env"),
];
const TELEGRAM_API_BASE = "https://api.telegram.org";
const MAX_MESSAGE_LENGTH = 4096;

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }

    if (key === "evidence" || key === "step") {
      const existing = args[key];
      if (Array.isArray(existing)) {
        existing.push(next);
      } else if (existing) {
        args[key] = [existing, next];
      } else {
        args[key] = [next];
      }
    } else {
      args[key] = next;
    }
    index += 1;
  }

  return args;
}

function printUsage() {
  process.stdout.write(
    [
      "Usage: node 01-runtime\\tools\\telegram-bug-reporter.js [--input <bug.json>] [options]",
      "",
      "Options:",
      "  --input <path>       Bug report JSON file",
      "  --title <text>       Bug title",
      "  --severity <level>   low | medium | high | critical",
      "  --module <name>      Module or feature name",
      "  --status <status>    new | confirmed | blocked | fixed | retest",
      "  --summary <text>     Bug summary",
      "  --step <text>        Repeatable repro step",
      "  --expected <text>    Expected result",
      "  --actual <text>      Actual result",
      "  --evidence <path>    Repeatable evidence path/link",
      "  --reporter <name>    Reporter name",
      "  --label <name>       Artifact label",
      "  --get-updates        Fetch Telegram bot updates to discover group chat_id",
      "  --send               Send to Telegram; default is dry-run only",
      "  --help               Show this help",
      "",
      "Dry-run is the default. Configure Telegram in 02-brain\\.opencode\\config\\telegram-bug-reporter.local.env or telegram-bug-reporter.env.",
    ].join("\n")
  );
  process.stdout.write("\n");
}

function parseEnvContents(contents) {
  const config = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const normalized = line.startsWith("export ") ? line.slice(7) : line;
    const equalsIndex = normalized.indexOf("=");
    if (equalsIndex <= 0) {
      continue;
    }

    const key = normalized.slice(0, equalsIndex).trim();
    let value = normalized.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    config[key] = value;
  }
  return config;
}

function readConfig() {
  for (const envFile of ENV_CANDIDATES) {
    if (!fs.existsSync(envFile)) {
      continue;
    }
    return {
      envFile,
      config: {
        ...process.env,
        ...parseEnvContents(fs.readFileSync(envFile, "utf8")),
      },
    };
  }

  return {
    envFile: ENV_CANDIDATES[0],
    config: process.env,
  };
}

function toRelativeRoot(targetPath) {
  return path.relative(paths.rootDir, targetPath).replace(/\\/g, "/");
}

function resolveInputPath(inputPath) {
  if (!inputPath) {
    return null;
  }

  const candidate = path.isAbsolute(inputPath)
    ? path.resolve(inputPath)
    : path.resolve(paths.rootDir, inputPath);
  const resolvedRoot = path.resolve(paths.rootDir);
  if (candidate !== resolvedRoot && !candidate.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error("Input path must stay inside AI-QA-LAB.");
  }
  if (!fs.existsSync(candidate)) {
    throw new Error(`Input file not found: ${toRelativeRoot(candidate)}`);
  }
  return candidate;
}

function readBugReport(args) {
  const inputPath = resolveInputPath(args.input);
  const fromFile = inputPath ? JSON.parse(fs.readFileSync(inputPath, "utf8")) : {};
  const steps = args.step
    ? Array.isArray(args.step) ? args.step : [args.step]
    : fromFile.steps || [];
  const evidence = args.evidence
    ? Array.isArray(args.evidence) ? args.evidence : [args.evidence]
    : fromFile.evidence || [];

  return {
    input_path: inputPath,
    title: args.title || fromFile.title || "Untitled bug",
    severity: args.severity || fromFile.severity || "medium",
    module: args.module || fromFile.module || "unspecified",
    status: args.status || fromFile.status || "new",
    summary: args.summary || fromFile.summary || "",
    steps,
    expected: args.expected || fromFile.expected || "",
    actual: args.actual || fromFile.actual || "",
    evidence,
    environment: args.environment || fromFile.environment || "dev-energy",
    reporter: args.reporter || fromFile.reporter || "Engineer",
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatLines(title, items) {
  const normalized = Array.isArray(items) ? items.filter(Boolean) : [];
  if (normalized.length === 0) {
    return [`<b>${escapeHtml(title)}</b>: -`];
  }

  return [
    `<b>${escapeHtml(title)}</b>:`,
    ...normalized.map((item, index) => `${index + 1}. ${escapeHtml(item)}`),
  ];
}

function buildMessage(config, report) {
  const prefix = config.TELEGRAM_REPORT_PREFIX || "[PGN Billing QA]";
  const lines = [
    `<b>${escapeHtml(prefix)} Bug Report</b>`,
    "",
    `<b>Title</b>: ${escapeHtml(report.title)}`,
    `<b>Severity</b>: ${escapeHtml(report.severity)}`,
    `<b>Status</b>: ${escapeHtml(report.status)}`,
    `<b>Module</b>: ${escapeHtml(report.module)}`,
    `<b>Environment</b>: ${escapeHtml(report.environment)}`,
    `<b>Reporter</b>: ${escapeHtml(report.reporter)}`,
    "",
    `<b>Summary</b>: ${escapeHtml(report.summary || "-")}`,
    "",
    ...formatLines("Steps", report.steps),
    "",
    `<b>Expected</b>: ${escapeHtml(report.expected || "-")}`,
    `<b>Actual</b>: ${escapeHtml(report.actual || "-")}`,
    "",
    ...formatLines("Evidence", report.evidence),
  ];

  const message = lines.join("\n").trim();
  if (message.length > MAX_MESSAGE_LENGTH) {
    return `${message.slice(0, MAX_MESSAGE_LENGTH - 120)}\n\n[truncated: see local artifact for full bug report]`;
  }
  return message;
}

function slugify(value) {
  return String(value || "telegram-bug-report")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "telegram-bug-report";
}

function buildTimestamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function maskToken(token) {
  if (!token) {
    return null;
  }
  const value = String(token);
  return value.length <= 8 ? "***" : `${value.slice(0, 4)}...${value.slice(-4)}`;
}

async function sendTelegramMessage(config, message) {
  const token = String(config.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = String(config.TELEGRAM_CHAT_ID || "").trim();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is required for --send.");
  }
  if (!chatId) {
    throw new Error("TELEGRAM_CHAT_ID is required for --send.");
  }

  const body = {
    chat_id: chatId,
    text: message,
    parse_mode: config.TELEGRAM_PARSE_MODE || "HTML",
    disable_web_page_preview: true,
  };
  if (config.TELEGRAM_THREAD_ID) {
    body.message_thread_id = Number(config.TELEGRAM_THREAD_ID);
  }

  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (error) {
    parsed = { raw: responseText };
  }

  if (!response.ok || parsed.ok === false) {
    throw new Error(`Telegram sendMessage failed: HTTP ${response.status} ${JSON.stringify(parsed)}`);
  }

  return parsed;
}

async function getTelegramUpdates(config) {
  const token = String(config.TELEGRAM_BOT_TOKEN || "").trim();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is required for --get-updates.");
  }

  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/getUpdates`, {
    method: "GET",
  });
  const responseText = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (error) {
    parsed = { raw: responseText };
  }

  if (!response.ok || parsed.ok === false) {
    throw new Error(`Telegram getUpdates failed: HTTP ${response.status} ${JSON.stringify(parsed)}`);
  }

  return parsed;
}

function summarizeUpdates(updates) {
  const chats = new Map();
  for (const update of updates?.result || []) {
    const message = update.message || update.channel_post || update.edited_message || update.edited_channel_post;
    const chat = message?.chat;
    if (!chat?.id) {
      continue;
    }
    chats.set(String(chat.id), {
      chat_id: chat.id,
      type: chat.type || null,
      title: chat.title || null,
      username: chat.username || null,
      message_thread_id: message.message_thread_id || null,
      last_update_id: update.update_id,
    });
  }
  return [...chats.values()];
}

function buildMarkdownArtifact(payload) {
  return [
    "# Telegram Bug Report",
    "",
    `- Created At: ${payload.created_at}`,
    `- Mode: ${payload.mode}`,
    `- Sent: ${payload.sent}`,
    `- Env File: ${payload.telegram.env_file}`,
    `- Chat Configured: ${payload.telegram.chat_configured}`,
    `- Token Configured: ${payload.telegram.token_configured}`,
    `- Message Hash: ${payload.message_sha256}`,
    "",
    "## Message",
    "",
    "```html",
    payload.message,
    "```",
    "",
    "## Telegram Response",
    "",
    "```json",
    JSON.stringify(payload.telegram_response || {}, null, 2),
    "```",
  ].join("\n") + "\n";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const { envFile, config } = readConfig();
  if (args["get-updates"]) {
    const updates = await getTelegramUpdates(config);
    const label = slugify(args.label || "telegram-get-updates");
    const outputPath = path.join(paths.telegramReportingOutboxDir, `${buildTimestamp()}--${label}.json`);
    ensureDir(paths.telegramReportingOutboxDir);
    const payload = {
      created_at: new Date().toISOString(),
      mode: "get_updates",
      sent: false,
      telegram: {
        env_file: toRelativeRoot(envFile),
        token_configured: Boolean(config.TELEGRAM_BOT_TOKEN),
        token_preview: maskToken(config.TELEGRAM_BOT_TOKEN),
      },
      discovered_chats: summarizeUpdates(updates),
      raw_update_count: Array.isArray(updates.result) ? updates.result.length : 0,
    };
    writeJson(outputPath, payload);
    process.stdout.write(
      `${JSON.stringify({
        mode: payload.mode,
        output_json: toRelativeRoot(outputPath),
        discovered_chats: payload.discovered_chats,
        raw_update_count: payload.raw_update_count,
      }, null, 2)}\n`
    );
    return;
  }

  const report = readBugReport(args);
  const message = buildMessage(config, report);
  const send = Boolean(args.send);
  const label = slugify(args.label || report.title);
  const outputPath = path.join(paths.telegramReportingOutboxDir, `${buildTimestamp()}--${label}.json`);
  ensureDir(paths.telegramReportingOutboxDir);

  let telegramResponse = null;
  if (send) {
    telegramResponse = await sendTelegramMessage(config, message);
  }

  const payload = {
    created_at: new Date().toISOString(),
    mode: send ? "send" : "dry_run",
    sent: send,
    bug_report: {
      ...report,
      input_path: report.input_path ? toRelativeRoot(report.input_path) : null,
    },
    telegram: {
      env_file: toRelativeRoot(envFile),
      chat_configured: Boolean(config.TELEGRAM_CHAT_ID),
      thread_configured: Boolean(config.TELEGRAM_THREAD_ID),
      token_configured: Boolean(config.TELEGRAM_BOT_TOKEN),
      token_preview: maskToken(config.TELEGRAM_BOT_TOKEN),
    },
    message,
    message_sha256: sha256(message),
    telegram_response: telegramResponse,
  };

  writeJson(outputPath, payload);
  writeText(outputPath.replace(/\.json$/i, ".md"), buildMarkdownArtifact(payload));

  process.stdout.write(
    `${JSON.stringify({
      mode: payload.mode,
      sent: payload.sent,
      output_json: toRelativeRoot(outputPath),
      output_markdown: toRelativeRoot(outputPath.replace(/\.json$/i, ".md")),
      telegram_configured: {
        token: payload.telegram.token_configured,
        chat: payload.telegram.chat_configured,
        thread: payload.telegram.thread_configured,
      },
      message_sha256: payload.message_sha256,
      telegram_message_id: telegramResponse?.result?.message_id || null,
    }, null, 2)}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
