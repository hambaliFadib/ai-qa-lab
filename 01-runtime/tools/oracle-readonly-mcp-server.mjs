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
const runtimeDir = path.join(rootDir, "01-runtime");
const validatorPath = path.join(runtimeDir, "tools", "oracle-readonly-validator.js");
const queryLibraryDir = path.join(rootDir, "05-observability", "db-validation", "queries");
const envCandidates = [
  path.join(rootDir, "02-brain", ".opencode", "config", "oracle-readonly.local.env"),
  path.join(rootDir, ".opencode", "config", "oracle-readonly.local.env"),
];
const excludedQueryTemplates = new Set([
  "shared/03-minimum-readonly-grants.sql",
]);

function toPosixRelative(targetPath) {
  return path.relative(rootDir, targetPath).replace(/\\/g, "/");
}

function listQueryTemplates(currentDir = queryLibraryDir) {
  const results = [];
  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listQueryTemplates(fullPath));
      continue;
    }

    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".sql") {
      continue;
    }

    const relative = toPosixRelative(fullPath).replace(/^05-observability\/db-validation\/queries\//, "");
    if (excludedQueryTemplates.has(relative)) {
      continue;
    }

    results.push(relative);
  }

  return results.sort();
}

function getEnvFileInfo() {
  for (const filePath of envCandidates) {
    if (fs.existsSync(filePath)) {
      return {
        envFile: toPosixRelative(filePath),
        exists: true,
      };
    }
  }

  return {
    envFile: toPosixRelative(envCandidates[0]),
    exists: false,
  };
}

function parseJsonOutput(stdout) {
  const trimmed = String(stdout || "").trim();
  if (!trimmed) {
    throw new Error("Oracle validator returned no JSON output.");
  }

  return JSON.parse(trimmed);
}

function normalizeBinds(binds = {}) {
  const normalized = {};
  for (const [key, value] of Object.entries(binds)) {
    if (value === undefined || value === null) {
      continue;
    }
    normalized[String(key)] = String(value);
  }
  return normalized;
}

function buildValidatorArgs({ sql, queryFile, binds = {}, label, rows }) {
  const args = [validatorPath];

  if (sql && queryFile) {
    throw new Error("Provide either sql or queryFile, not both.");
  }

  if (!sql && !queryFile) {
    throw new Error("Provide sql or queryFile.");
  }

  if (sql) {
    args.push("--sql", sql);
  }

  if (queryFile) {
    args.push("--query-file", queryFile);
  }

  for (const [key, value] of Object.entries(normalizeBinds(binds))) {
    args.push("--bind", `${key}=${value}`);
  }

  if (label) {
    args.push("--label", label);
  }

  if (rows) {
    args.push("--rows", String(rows));
  }

  return args;
}

function runValidator(request) {
  const args = buildValidatorArgs(request);
  const result = spawnSync(process.execPath, args, {
    cwd: runtimeDir,
    env: process.env,
    encoding: "utf8",
    timeout: 120000,
  });

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "Oracle validator failed").trim();
    throw new Error(detail);
  }

  const summary = parseJsonOutput(result.stdout);
  const payload = summary.output_json
    ? JSON.parse(fs.readFileSync(path.join(rootDir, summary.output_json), "utf8"))
    : null;

  return { summary, payload };
}

function summarizePayload(summary, payload) {
  if (!payload) {
    return summary;
  }

  return {
    label: payload.label,
    env_file: payload.env_file,
    driver_mode: payload.driver_mode,
    connection_mode: payload.connection_mode,
    schema_allowlist: payload.schema_allowlist,
    query_source: payload.query_source,
    output_json: summary.output_json,
    output_markdown: summary.output_markdown,
    rows_returned: payload.rows_returned,
    columns: payload.columns,
    preview_rows: Array.isArray(payload.rows) ? payload.rows.slice(0, 10) : [],
  };
}

function toolText(title, body) {
  return {
    content: [{
      type: "text",
      text: `${title}\n\n${JSON.stringify(body, null, 2)}`,
    }],
  };
}

export function createOracleReadonlyMcpServer() {
  const envInfo = getEnvFileInfo();
  const server = new McpServer({
    name: "oracle_readonly",
    version: "1.0.0",
  });

  server.tool(
    "server_status",
    "Show Oracle MCP read-only server status, env source, and available query templates.",
    {},
    async () => toolText("Oracle Read-Only MCP Status", {
      mode: "read-only",
      validator_backend: toPosixRelative(validatorPath),
      env_file: envInfo.envFile,
      env_file_exists: envInfo.exists,
      query_template_count: listQueryTemplates().length,
      query_templates: listQueryTemplates(),
    })
  );

  server.tool(
    "find_objects_by_keyword",
    "Search Oracle tables, views, and columns by keyword using a safe read-only query template.",
    {
      keyword: z.string().min(1),
      owner_filter: z.string().optional(),
      label: z.string().optional(),
      rows: z.number().int().min(1).max(500).optional(),
    },
    async ({ keyword, owner_filter, label, rows }) => {
      const { summary, payload } = runValidator({
        queryFile: "shared/01-find-tables-by-keyword.sql",
        binds: {
          KEYWORD: keyword,
          OWNER_FILTER: owner_filter || "PGNBILL",
        },
        label: label || `find-${keyword}`,
        rows: rows || 100,
      });

      return toolText("Oracle Read-Only Object Search", summarizePayload(summary, payload));
    }
  );

  server.tool(
    "describe_table",
    "Describe columns and constraints for a specific Oracle table or view using a safe read-only query template.",
    {
      owner: z.string().min(1),
      table_name: z.string().min(1),
      label: z.string().optional(),
      rows: z.number().int().min(1).max(1000).optional(),
    },
    async ({ owner, table_name, label, rows }) => {
      const { summary, payload } = runValidator({
        queryFile: "shared/02-describe-table-columns.sql",
        binds: {
          OWNER: owner,
          TABLE_NAME: table_name,
        },
        label: label || `describe-${owner}-${table_name}`,
        rows: rows || 500,
      });

      return toolText("Oracle Read-Only Table Description", summarizePayload(summary, payload));
    }
  );

  server.tool(
    "run_query_template",
    "Run a query template from 05-observability/db-validation/queries/ with bind values. Only read-only templates are allowed.",
    {
      query_file: z.string().min(1),
      binds: z.record(z.string(), z.string()).optional(),
      label: z.string().optional(),
      rows: z.number().int().min(1).max(1000).optional(),
    },
    async ({ query_file, binds, label, rows }) => {
      const { summary, payload } = runValidator({
        queryFile: query_file,
        binds: binds || {},
        label: label || `template-${path.basename(query_file, path.extname(query_file))}`,
        rows: rows || 200,
      });

      return toolText("Oracle Read-Only Query Template Result", summarizePayload(summary, payload));
    }
  );

  server.tool(
    "run_readonly_sql",
    "Run an ad-hoc Oracle SELECT or WITH query. The underlying validator blocks non-read-only SQL and out-of-scope schemas.",
    {
      sql: z.string().min(1),
      binds: z.record(z.string(), z.string()).optional(),
      label: z.string().optional(),
      rows: z.number().int().min(1).max(1000).optional(),
    },
    async ({ sql, binds, label, rows }) => {
      const { summary, payload } = runValidator({
        sql,
        binds: binds || {},
        label: label || "ad-hoc-readonly-query",
        rows: rows || 200,
      });

      return toolText("Oracle Read-Only SQL Result", summarizePayload(summary, payload));
    }
  );

  return server;
}

export async function startOracleReadonlyMcpServer() {
  const server = createOracleReadonlyMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startOracleReadonlyMcpServer().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
