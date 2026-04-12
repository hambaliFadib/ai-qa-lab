const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  paths,
  ensureDir,
  writeJson,
  writeText,
} = require("./workspace-paths");

const ENV_CANDIDATES = [
  path.join(paths.opencodeDir, "config", "oracle-readonly.local.env"),
  path.join(paths.rootDir, ".opencode", "config", "oracle-readonly.local.env"),
];
const REQUIRED_FIELDS = [
  "ORACLE_HOST",
  "ORACLE_PORT",
  "ORACLE_USERNAME",
  "ORACLE_PASSWORD",
  "ORACLE_SCHEMA_ALLOWLIST",
];
const JDBC_RUNNER_SOURCE = path.join(paths.runtimeToolsDir, "OracleTestdataDmlJdbcRunner.java");
const DEFAULT_MAX_AFFECTED_ROWS = 20;
const COMMIT_CONFIRMATION = "TESTDATA_DML_COMMIT";
const DEFAULT_ALLOWED_OPERATIONS = new Set(["insert"]);
const OPTIONAL_OPERATION_FLAGS = {
  update: "allow-update",
  merge: "allow-merge",
  delete: "allow-delete",
};
const FORBIDDEN_PATTERNS = [
  { regex: /\btruncate\b/i, reason: "TRUNCATE is not allowed" },
  { regex: /\balter\b/i, reason: "ALTER is not allowed" },
  { regex: /\bdrop\b/i, reason: "DROP is not allowed" },
  { regex: /\bcreate\b/i, reason: "CREATE is not allowed" },
  { regex: /\breplace\b/i, reason: "REPLACE is not allowed" },
  { regex: /\bgrant\b/i, reason: "GRANT is not allowed" },
  { regex: /\brevoke\b/i, reason: "REVOKE is not allowed" },
  { regex: /\bcommit\b/i, reason: "COMMIT is not allowed inside plans" },
  { regex: /\brollback\b/i, reason: "ROLLBACK is not allowed inside plans" },
  { regex: /\bsavepoint\b/i, reason: "SAVEPOINT is not allowed" },
  { regex: /\block\s+table\b/i, reason: "LOCK TABLE is not allowed" },
  { regex: /\bbegin\b/i, reason: "BEGIN blocks are not allowed" },
  { regex: /\bdeclare\b/i, reason: "DECLARE blocks are not allowed" },
  { regex: /\bexecute\b/i, reason: "EXECUTE is not allowed" },
  { regex: /\bexec\b/i, reason: "EXEC is not allowed" },
  { regex: /\bcall\b/i, reason: "CALL is not allowed" },
  { regex: /\bdbms_[a-z0-9_]+\b/i, reason: "DBMS packages are not allowed" },
  { regex: /\butl_[a-z0-9_]+\b/i, reason: "UTL packages are not allowed" },
];

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

    args[key] = next;
    index += 1;
  }

  return args;
}

function printUsage() {
  process.stdout.write(
    [
      "Usage: node 01-runtime\\tools\\oracle-testdata-injector.js --plan <plan.json> [options]",
      "",
      "Options:",
      "  --plan <path>                  Plan under 06-testing/test-data/db-injection/plans/",
      "  --apply                        Execute DML in a transaction; rolls back unless --commit is provided",
      "  --commit                       Persist the executed DML; requires both confirmation tokens",
      "  --confirm <plan-token>         Must equal plan.confirmation_token when --commit is used",
      "  --confirm-commit <token>       Must equal TESTDATA_DML_COMMIT when --commit is used",
      "  --allow-update                 Permit UPDATE statements already allowed by the plan",
      "  --allow-merge                  Permit MERGE statements already allowed by the plan",
      "  --allow-delete                 Permit DELETE statements already allowed by the plan",
      "  --max-affected <n>             Runtime max affected rows per statement",
      "  --label <name>                 Output label for execution evidence",
      "  --help                         Show this help",
      "",
      "Dry-run is the default and never connects to Oracle.",
      "Persistent commit is intentionally explicit to avoid accidental DB changes.",
    ].join("\n")
  );
  process.stdout.write("\n");
}

function toRelativeRoot(targetPath) {
  return path.relative(paths.rootDir, targetPath).replace(/\\/g, "/");
}

function withinRoot(targetPath, rootPath) {
  const resolvedRoot = path.resolve(rootPath);
  const resolvedTarget = path.resolve(targetPath);
  return resolvedTarget === resolvedRoot || resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`);
}

function resolvePlanPath(planArg) {
  if (!planArg) {
    throw new Error("Provide --plan <plan.json>.");
  }

  const candidate = path.isAbsolute(planArg)
    ? path.resolve(planArg)
    : path.resolve(paths.dbInjectionPlansDir, planArg);

  if (!withinRoot(candidate, paths.dbInjectionPlansDir)) {
    throw new Error("Plan path must stay inside 06-testing/test-data/db-injection/plans/.");
  }

  if (!fs.existsSync(candidate)) {
    throw new Error(`Plan file not found: ${toRelativeRoot(candidate)}`);
  }

  return candidate;
}

function parseEnvContents(contents) {
  const config = {};
  const lines = contents.split(/\r?\n/);

  for (const rawLine of lines) {
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

function hasConnectionTarget(config) {
  return Boolean(config.ORACLE_SERVICE_NAME || config.ORACLE_SID || config.ORACLE_TNS_ALIAS);
}

function findConfigSource() {
  const seenFiles = [];

  for (const filePath of ENV_CANDIDATES) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    seenFiles.push(filePath);
    const fileConfig = parseEnvContents(fs.readFileSync(filePath, "utf8"));
    const merged = {
      ...process.env,
      ...fileConfig,
    };

    const missing = REQUIRED_FIELDS.filter((field) => !String(merged[field] || "").trim());
    if (missing.length === 0 && hasConnectionTarget(merged)) {
      return {
        config: merged,
        envFile: filePath,
      };
    }
  }

  const suffix = seenFiles.length > 0
    ? ` Checked but still incomplete: ${seenFiles.map(toRelativeRoot).join(", ")}`
    : " No candidate env file was found.";

  throw new Error(`Oracle test-data config is incomplete. Fill 02-brain/.opencode/config/oracle-readonly.local.env first.${suffix}`);
}

function parseAllowlist(rawValue) {
  return new Set(
    String(rawValue || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => value.replace(/^"|"$/g, "").toUpperCase())
  );
}

function buildJdbcUrl(config) {
  if (config.ORACLE_JDBC_URL) {
    return String(config.ORACLE_JDBC_URL).trim();
  }

  if (config.ORACLE_TNS_ALIAS) {
    return `jdbc:oracle:thin:@${config.ORACLE_TNS_ALIAS}`;
  }

  const host = String(config.ORACLE_HOST || "").trim();
  const port = String(config.ORACLE_PORT || "1521").trim();
  const protocol = String(config.ORACLE_PROTOCOL || "tcp").trim().toLowerCase();

  if (config.ORACLE_SID && !config.ORACLE_SERVICE_NAME) {
    const sid = String(config.ORACLE_SID).trim();
    return `jdbc:oracle:thin:@${host}:${port}:${sid}`;
  }

  const serviceName = String(config.ORACLE_SERVICE_NAME || "").trim();
  const prefix = protocol === "tcps" ? "jdbc:oracle:thin:@tcps://" : "jdbc:oracle:thin:@//";
  return `${prefix}${host}:${port}/${serviceName}`;
}

function findFirstJarUnder(rootDir) {
  if (!rootDir || !fs.existsSync(rootDir)) {
    return null;
  }

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      const nested = findFirstJarUnder(fullPath);
      if (nested) {
        return nested;
      }
      continue;
    }

    if (/^ojdbc.*\.jar$/i.test(entry.name)) {
      return fullPath;
    }
  }

  return null;
}

function resolveJdbcJarPath(config) {
  const explicitPath = String(config.ORACLE_JDBC_JAR || "").trim();
  if (explicitPath) {
    const resolvedExplicit = path.isAbsolute(explicitPath)
      ? explicitPath
      : path.resolve(paths.rootDir, explicitPath);
    if (fs.existsSync(resolvedExplicit)) {
      return resolvedExplicit;
    }
  }

  const userProfile = process.env.USERPROFILE || "";
  const appData = process.env.APPDATA || "";
  for (const candidate of [
    path.join(userProfile, "Downloads", "ojdbc11.jar"),
    path.join(userProfile, "Downloads", "ojdbc8.jar"),
  ]) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const dbeaverDriverRoot = path.join(appData, "DBeaverData", "drivers", "maven", "maven-central", "com.oracle.database.jdbc");
  return findFirstJarUnder(dbeaverDriverRoot);
}

function stripCommentsAndLiterals(sql) {
  return String(sql)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--.*$/gm, " ")
    .replace(/'(?:''|[^'])*'/g, "''");
}

function normalizeSql(sql) {
  return stripCommentsAndLiterals(sql)
    .replace(/;\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function detectOperation(normalizedSql) {
  const lowered = normalizedSql.toLowerCase();
  if (lowered.startsWith("insert ")) {
    return "insert";
  }
  if (lowered.startsWith("update ")) {
    return "update";
  }
  if (lowered.startsWith("merge ")) {
    return "merge";
  }
  if (lowered.startsWith("delete ")) {
    return "delete";
  }
  throw new Error("Only INSERT, UPDATE, MERGE, or DELETE test-data DML is allowed.");
}

function extractTarget(sql, operation) {
  const objectPattern = '"?[A-Za-z][A-Za-z0-9_$#]*"?';
  const patterns = {
    insert: new RegExp(`^\\s*insert\\s+into\\s+(${objectPattern})\\s*\\.\\s*(${objectPattern})\\b`, "i"),
    update: new RegExp(`^\\s*update\\s+(${objectPattern})\\s*\\.\\s*(${objectPattern})\\b`, "i"),
    merge: new RegExp(`^\\s*merge\\s+into\\s+(${objectPattern})\\s*\\.\\s*(${objectPattern})\\b`, "i"),
    delete: new RegExp(`^\\s*delete\\s+from\\s+(${objectPattern})\\s*\\.\\s*(${objectPattern})\\b`, "i"),
  };

  const match = String(sql).match(patterns[operation]);
  if (!match) {
    throw new Error(`${operation.toUpperCase()} target must be owner-qualified, e.g. PGNBILL.TABLE_NAME.`);
  }

  return {
    owner: match[1].replace(/"/g, "").toUpperCase(),
    object: match[2].replace(/"/g, "").toUpperCase(),
  };
}

function readBindPlaceholders(sql) {
  return Array.from(new Set(
    [...String(sql).matchAll(/:([A-Za-z][A-Za-z0-9_$#]*)\b/g)].map((match) => match[1])
  ));
}

function assertPlanStatement(statement, plan, schemaAllowlist, cliAllowedOperations) {
  const sql = String(statement.sql || "");
  const normalized = normalizeSql(sql);
  if (!normalized) {
    throw new Error(`Statement ${statement.id || "(unnamed)"} has empty SQL.`);
  }

  if (normalized.includes(";")) {
    throw new Error(`Statement ${statement.id || "(unnamed)"} contains multiple SQL statements.`);
  }

  const lowered = normalized.toLowerCase();
  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.regex.test(lowered)) {
      throw new Error(`Statement ${statement.id || "(unnamed)"} is forbidden: ${rule.reason}.`);
    }
  }

  const operation = detectOperation(normalized);
  if (!cliAllowedOperations.has(operation)) {
    throw new Error(`Statement ${statement.id || "(unnamed)"} uses ${operation.toUpperCase()}, but it is not enabled by the plan and CLI flags.`);
  }

  const target = extractTarget(sql, operation);
  if (!schemaAllowlist.has(target.owner)) {
    throw new Error(`Statement ${statement.id || "(unnamed)"} targets schema '${target.owner}', outside ORACLE_SCHEMA_ALLOWLIST.`);
  }

  if (plan.owner && String(plan.owner).trim().toUpperCase() !== target.owner) {
    throw new Error(`Statement ${statement.id || "(unnamed)"} targets '${target.owner}', but plan.owner is '${plan.owner}'.`);
  }

  if ((operation === "update" || operation === "delete") && !/\bwhere\b/i.test(normalized)) {
    throw new Error(`${operation.toUpperCase()} statement ${statement.id || "(unnamed)"} must include a WHERE clause.`);
  }

  if (operation === "insert" && /\binsert\s+into[\s\S]+\bselect\b/i.test(normalized)) {
    throw new Error(`INSERT ... SELECT is not allowed for statement ${statement.id || "(unnamed)"}; use narrow VALUES binds instead.`);
  }

  const binds = statement.binds || {};
  if (Array.isArray(binds) || typeof binds !== "object") {
    throw new Error(`Statement ${statement.id || "(unnamed)"} binds must be a JSON object.`);
  }

  const placeholders = readBindPlaceholders(sql);
  if (placeholders.length === 0) {
    throw new Error(`Statement ${statement.id || "(unnamed)"} must use named bind placeholders.`);
  }

  const bindKeys = new Set(Object.keys(binds).map((key) => key.toUpperCase()));
  const missingBinds = placeholders.filter((name) => !bindKeys.has(name.toUpperCase()));
  if (missingBinds.length > 0) {
    throw new Error(`Statement ${statement.id || "(unnamed)"} is missing bind values: ${missingBinds.join(", ")}.`);
  }

  return {
    id: statement.id || `${operation}-${target.owner}-${target.object}`,
    operation,
    target,
    sql,
    sql_sha256: sha256(sql),
    bind_count: Object.keys(binds).length,
  };
}

function buildAllowedOperations(plan, args) {
  const planAllowed = new Set(
    (Array.isArray(plan.allowed_operations) ? plan.allowed_operations : [...DEFAULT_ALLOWED_OPERATIONS])
      .map((value) => String(value).trim().toLowerCase())
      .filter(Boolean)
  );

  const allowed = new Set();
  for (const operation of DEFAULT_ALLOWED_OPERATIONS) {
    if (planAllowed.has(operation)) {
      allowed.add(operation);
    }
  }

  for (const [operation, flag] of Object.entries(OPTIONAL_OPERATION_FLAGS)) {
    if (planAllowed.has(operation) && args[flag]) {
      allowed.add(operation);
    }
  }

  return allowed;
}

function readPlan(planPath) {
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  if (plan.version !== "oracle-testdata-plan-v1") {
    throw new Error("Plan version must be oracle-testdata-plan-v1.");
  }
  if (!Array.isArray(plan.statements) || plan.statements.length === 0) {
    throw new Error("Plan must contain at least one DML statement.");
  }
  if (!plan.confirmation_token) {
    throw new Error("Plan must define confirmation_token.");
  }
  return plan;
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function slugify(value) {
  return String(value || "testdata-plan")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "testdata-plan";
}

function buildTimestamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function resolveOutputPath(label) {
  ensureDir(paths.dbInjectionResultsDir);
  return path.join(paths.dbInjectionResultsDir, `${buildTimestamp()}--${label}.json`);
}

function escapePropertiesComponent(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/([=:#!])/g, "\\$1");
}

function base64(value) {
  return Buffer.from(String(value), "utf8").toString("base64");
}

function writeRequestProperties(requestPath, plan, args, maxAffectedRows) {
  const lines = [
    `commit=${args.commit ? "true" : "false"}`,
    `maxAffectedRows=${maxAffectedRows}`,
    `statement.count=${plan.statements.length}`,
  ];

  plan.statements.forEach((statement, index) => {
    const prefix = `statement.${index + 1}.`;
    lines.push(`${prefix}id=${escapePropertiesComponent(statement.id || `statement-${index + 1}`)}`);
    lines.push(`${prefix}sql.base64=${base64(statement.sql)}`);
    for (const [key, value] of Object.entries(statement.binds || {})) {
      lines.push(`${prefix}bind.${escapePropertiesComponent(key)}=${base64(value)}`);
    }
  });

  fs.writeFileSync(requestPath, `${lines.join("\n")}\n`, "utf8");
}

function executePlanWithJdbc(config, plan, args, maxAffectedRows) {
  const jdbcJarPath = resolveJdbcJarPath(config);
  if (!jdbcJarPath) {
    throw new Error("No ojdbc jar was found. Set ORACLE_JDBC_JAR or install the Oracle JDBC driver used by the read-only validator.");
  }

  if (!fs.existsSync(JDBC_RUNNER_SOURCE)) {
    throw new Error(`Oracle test-data JDBC runner source is missing: ${toRelativeRoot(JDBC_RUNNER_SOURCE)}`);
  }

  const tempRoot = path.join(paths.runtimeRootDir, "temp", "oracle-testdata");
  ensureDir(tempRoot);
  const requestDir = fs.mkdtempSync(path.join(tempRoot, "request-"));
  const requestPath = path.join(requestDir, "request.properties");

  try {
    writeRequestProperties(requestPath, plan, args, maxAffectedRows);
    const env = {
      ...process.env,
      ORACLE_JDBC_URL: buildJdbcUrl(config),
      ORACLE_JDBC_USER: String(config.ORACLE_USERNAME || ""),
      ORACLE_JDBC_PASSWORD: String(config.ORACLE_PASSWORD || ""),
    };

    const startedAt = Date.now();
    const result = spawnSync(
      "java",
      ["--class-path", jdbcJarPath, JDBC_RUNNER_SOURCE, requestPath],
      {
        cwd: paths.runtimeRootDir,
        env,
        encoding: "utf8",
        timeout: 120000,
      }
    );

    if (result.status !== 0) {
      const detail = (result.stderr || result.stdout || "Oracle test-data DML runner failed").trim();
      throw new Error(detail);
    }

    return {
      driver_mode: "jdbc",
      duration_ms: Date.now() - startedAt,
      result: JSON.parse(String(result.stdout || "{}").trim()),
    };
  } finally {
    fs.rmSync(requestDir, { recursive: true, force: true });
  }
}

function redactBinds(binds) {
  const redacted = {};
  for (const [key, value] of Object.entries(binds || {})) {
    if (/pass|secret|token|credential/i.test(key)) {
      redacted[key] = "***";
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

function buildMarkdown(payload) {
  const lines = [
    "# Oracle Test-Data Injection Result",
    "",
    `- Executed At: ${payload.executed_at}`,
    `- Label: ${payload.label}`,
    `- Mode: ${payload.mode}`,
    `- Committed: ${payload.committed}`,
    `- Plan: ${payload.plan.path}`,
    `- Plan Hash: ${payload.plan.sha256}`,
    `- Env File: ${payload.env_file}`,
    `- Schema Allowlist: ${payload.schema_allowlist.join(", ")}`,
    `- Max Affected Rows: ${payload.max_affected_rows}`,
    "",
    "## Statements",
    "",
  ];

  for (const statement of payload.statements) {
    lines.push(`- ${statement.id} | ${statement.operation} | ${statement.target.owner}.${statement.target.object} | ${statement.sql_sha256}`);
  }

  lines.push("", "## Execution", "", "```json", JSON.stringify(payload.execution || {}, null, 2), "```");
  return `${lines.join("\n")}\n`;
}

function validateCommitGates(args, plan) {
  if (!args.commit) {
    return;
  }

  if (!args.apply) {
    throw new Error("--commit requires --apply.");
  }

  if (args.confirm !== plan.confirmation_token) {
    throw new Error("Persistent commit requires --confirm to match plan.confirmation_token.");
  }

  if (args["confirm-commit"] !== COMMIT_CONFIRMATION) {
    throw new Error(`Persistent commit requires --confirm-commit ${COMMIT_CONFIRMATION}.`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const planPath = resolvePlanPath(args.plan);
  const plan = readPlan(planPath);
  validateCommitGates(args, plan);

  const { config, envFile } = findConfigSource();
  const schemaAllowlist = parseAllowlist(config.ORACLE_SCHEMA_ALLOWLIST);
  if (schemaAllowlist.size === 0) {
    throw new Error("ORACLE_SCHEMA_ALLOWLIST must contain at least one schema.");
  }

  const allowedOperations = buildAllowedOperations(plan, args);
  const statements = plan.statements.map((statement) =>
    assertPlanStatement(statement, plan, schemaAllowlist, allowedOperations)
  );
  const maxAffectedRows = Number.parseInt(String(args["max-affected"] || plan.max_affected_rows || DEFAULT_MAX_AFFECTED_ROWS), 10);
  if (!Number.isFinite(maxAffectedRows) || maxAffectedRows <= 0) {
    throw new Error("--max-affected or plan.max_affected_rows must be a positive integer.");
  }

  const label = slugify(args.label || `${plan.module || "db"}-${path.basename(planPath, path.extname(planPath))}`);
  const outputPath = resolveOutputPath(label);
  const markdownPath = outputPath.replace(/\.json$/i, ".md");
  const mode = args.apply ? (args.commit ? "apply_commit" : "apply_rollback") : "dry_run";

  let execution = {
    connected: false,
    committed: false,
    statements: [],
  };

  if (args.apply) {
    execution = executePlanWithJdbc(config, plan, args, maxAffectedRows);
  }

  const payload = {
    executed_at: new Date().toISOString(),
    label,
    mode,
    committed: Boolean(args.apply && args.commit),
    env_file: toRelativeRoot(envFile),
    schema_allowlist: [...schemaAllowlist],
    max_affected_rows: maxAffectedRows,
    plan: {
      path: toRelativeRoot(planPath),
      sha256: sha256(fs.readFileSync(planPath, "utf8")),
      module: plan.module || null,
      purpose: plan.purpose || null,
      confirmation_token_present: Boolean(plan.confirmation_token),
    },
    allowed_operations: [...allowedOperations],
    statements: statements.map((statement, index) => ({
      ...statement,
      binds: redactBinds(plan.statements[index].binds || {}),
    })),
    verification: Array.isArray(plan.verification) ? plan.verification : [],
    cleanup_note: plan.cleanup_note || null,
    execution,
  };

  writeJson(outputPath, payload);
  writeText(markdownPath, buildMarkdown(payload));

  process.stdout.write(
    `${JSON.stringify({
      label: payload.label,
      mode: payload.mode,
      committed: payload.committed,
      output_json: toRelativeRoot(outputPath),
      output_markdown: toRelativeRoot(markdownPath),
      statements: payload.statements.map((statement) => ({
        id: statement.id,
        operation: statement.operation,
        target: `${statement.target.owner}.${statement.target.object}`,
      })),
      execution: payload.execution,
      next_commit_gate: payload.mode === "dry_run"
        ? "Run with --apply for rollback-mode execution, or with --apply --commit plus both confirmations for persistent test-data injection."
        : null,
    }, null, 2)}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
