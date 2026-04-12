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
const injectorPath = path.join(rootDir, "01-runtime", "tools", "oracle-testdata-injector.js");
const planDir = path.join(rootDir, "06-testing", "test-data", "db-injection", "plans");
const resultsDir = path.join(rootDir, "05-observability", "db-injection", "execution-results");

function toPosixRelative(targetPath) {
  return path.relative(rootDir, targetPath).replace(/\\/g, "/");
}

function listPlans() {
  if (!fs.existsSync(planDir)) {
    return [];
  }

  return fs
    .readdirSync(planDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => entry.name)
    .sort();
}

function runInjector(args) {
  const result = spawnSync(process.execPath, [injectorPath, ...args], {
    cwd: path.join(rootDir, "01-runtime", "runtime"),
    env: process.env,
    encoding: "utf8",
    timeout: 120000,
  });

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "Oracle test-data injector failed").trim());
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

export function createOracleTestdataMcpServer() {
  const server = new McpServer({
    name: "oracle_testdata",
    version: "1.0.0",
  });

  server.tool(
    "server_status",
    "Show guarded Oracle test-data DML status and available saved plans.",
    {},
    async () => toolText("Oracle Test-Data MCP Status", {
      mode: "guarded-testdata-dml",
      injector: toPosixRelative(injectorPath),
      plan_dir: toPosixRelative(planDir),
      results_dir: toPosixRelative(resultsDir),
      plan_count: listPlans().length,
      plans: listPlans(),
      commit_gate: "--apply --commit --confirm <plan-token> --confirm-commit TESTDATA_DML_COMMIT",
      default_behavior: "dry-run only; --apply without --commit rolls back",
    })
  );

  server.tool(
    "validate_plan",
    "Validate a saved DB test-data injection plan without connecting to Oracle or changing data.",
    {
      plan: z.string().min(1),
      allow_update: z.boolean().optional(),
      allow_merge: z.boolean().optional(),
      allow_delete: z.boolean().optional(),
      max_affected: z.number().int().min(1).max(1000).optional(),
      label: z.string().optional(),
    },
    async ({ plan, allow_update, allow_merge, allow_delete, max_affected, label }) => {
      const args = ["--plan", plan];
      if (allow_update) args.push("--allow-update");
      if (allow_merge) args.push("--allow-merge");
      if (allow_delete) args.push("--allow-delete");
      if (max_affected) args.push("--max-affected", String(max_affected));
      if (label) args.push("--label", label);
      return toolText("Oracle Test-Data Plan Validation", runInjector(args));
    }
  );

  server.tool(
    "execute_plan",
    "Execute a saved DB test-data injection plan. Defaults to rollback unless commit and both confirmation tokens are provided.",
    {
      plan: z.string().min(1),
      commit: z.boolean().optional(),
      confirm: z.string().optional(),
      confirm_commit: z.string().optional(),
      allow_update: z.boolean().optional(),
      allow_merge: z.boolean().optional(),
      allow_delete: z.boolean().optional(),
      max_affected: z.number().int().min(1).max(1000).optional(),
      label: z.string().optional(),
    },
    async ({ plan, commit, confirm, confirm_commit, allow_update, allow_merge, allow_delete, max_affected, label }) => {
      const args = ["--plan", plan, "--apply"];
      if (commit) args.push("--commit");
      if (confirm) args.push("--confirm", confirm);
      if (confirm_commit) args.push("--confirm-commit", confirm_commit);
      if (allow_update) args.push("--allow-update");
      if (allow_merge) args.push("--allow-merge");
      if (allow_delete) args.push("--allow-delete");
      if (max_affected) args.push("--max-affected", String(max_affected));
      if (label) args.push("--label", label);
      return toolText("Oracle Test-Data Plan Execution", runInjector(args));
    }
  );

  return server;
}

export async function startOracleTestdataMcpServer() {
  const server = createOracleTestdataMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startOracleTestdataMcpServer().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
