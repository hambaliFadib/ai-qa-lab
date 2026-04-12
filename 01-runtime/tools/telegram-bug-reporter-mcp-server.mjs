import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const reporterPath = path.join(rootDir, "01-runtime", "tools", "telegram-bug-reporter.js");
const configCandidates = [
  path.join(rootDir, "02-brain", ".opencode", "config", "telegram-bug-reporter.local.env"),
  path.join(rootDir, "02-brain", ".opencode", "config", "telegram-bug-reporter.env"),
  path.join(rootDir, ".opencode", "config", "telegram-bug-reporter.local.env"),
  path.join(rootDir, ".opencode", "config", "telegram-bug-reporter.env"),
];
const outboxDir = path.join(rootDir, "05-observability", "telegram-reporting", "outbox");
const templateDir = path.join(rootDir, "06-testing", "bug-reports", "telegram");

function toPosixRelative(targetPath) {
  return path.relative(rootDir, targetPath).replace(/\\/g, "/");
}

function listTemplates() {
  if (!fs.existsSync(templateDir)) {
    return [];
  }
  return fs
    .readdirSync(templateDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => entry.name)
    .sort();
}

function getConfigPath() {
  return configCandidates.find((candidate) => fs.existsSync(candidate)) || configCandidates[0];
}

function runReporter(args) {
  const result = spawnSync(process.execPath, [reporterPath, ...args], {
    cwd: rootDir,
    env: process.env,
    encoding: "utf8",
    timeout: 120000,
  });

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "Telegram bug reporter failed").trim());
  }

  return JSON.parse(String(result.stdout || "{}").trim());
}

function toolText(title, body) {
  return {
    content: [
      {
        type: "text",
        text: `${title}\n\n${JSON.stringify(body, null, 2)}`,
      },
    ],
  };
}

export function createTelegramBugReporterMcpServer() {
  const server = new McpServer({
    name: "telegram_bug_reporter",
    version: "1.0.0",
  });

  server.tool(
    "server_status",
    "Show Telegram bug reporter status, config presence, and available bug report templates.",
    {},
    async () => toolText("Telegram Bug Reporter Status", {
      mode: "dry-run-default",
      reporter: toPosixRelative(reporterPath),
      config_path: toPosixRelative(getConfigPath()),
      config_candidates: configCandidates.map(toPosixRelative),
      config_exists: fs.existsSync(getConfigPath()),
      outbox_dir: toPosixRelative(outboxDir),
      template_dir: toPosixRelative(templateDir),
      templates: listTemplates(),
      send_gate: "send=true or CLI --send is required before calling Telegram API",
      chat_discovery: "Use discover_chats after adding the bot to the group and sending one message in that group.",
    })
  );

  server.tool(
    "discover_chats",
    "Fetch Telegram bot updates to discover group chat_id and optional topic thread id.",
    {
      label: z.string().optional(),
    },
    async ({ label }) => {
      const args = ["--get-updates"];
      if (label) args.push("--label", label);
      return toolText("Telegram Chat Discovery", runReporter(args));
    }
  );

  server.tool(
    "report_bug",
    "Create a Telegram-formatted bug report artifact and optionally send it to the configured Telegram group.",
    {
      input: z.string().optional(),
      title: z.string().optional(),
      severity: z.string().optional(),
      module: z.string().optional(),
      status: z.string().optional(),
      summary: z.string().optional(),
      steps: z.array(z.string()).optional(),
      expected: z.string().optional(),
      actual: z.string().optional(),
      evidence: z.array(z.string()).optional(),
      reporter: z.string().optional(),
      environment: z.string().optional(),
      label: z.string().optional(),
      send: z.boolean().optional(),
    },
    async ({ input, title, severity, module, status, summary, steps, expected, actual, evidence, reporter, environment, label, send }) => {
      const args = [];
      if (input) args.push("--input", input);
      if (title) args.push("--title", title);
      if (severity) args.push("--severity", severity);
      if (module) args.push("--module", module);
      if (status) args.push("--status", status);
      if (summary) args.push("--summary", summary);
      if (expected) args.push("--expected", expected);
      if (actual) args.push("--actual", actual);
      if (reporter) args.push("--reporter", reporter);
      if (environment) args.push("--environment", environment);
      if (label) args.push("--label", label);
      for (const step of steps || []) args.push("--step", step);
      for (const item of evidence || []) args.push("--evidence", item);
      if (send) args.push("--send");
      return toolText("Telegram Bug Report", runReporter(args));
    }
  );

  return server;
}

export async function startTelegramBugReporterMcpServer() {
  const server = createTelegramBugReporterMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startTelegramBugReporterMcpServer().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
