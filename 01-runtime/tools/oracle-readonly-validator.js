const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");
const { paths, ensureDir, writeJson, writeText } = require("./workspace-paths");

const QUERY_LIBRARY_DIR = path.join(paths.observabilityDir, "db-validation", "queries");
const QUERY_RESULTS_DIR = path.join(paths.observabilityDir, "db-validation", "query-results");
const JDBC_RUNNER_SOURCE = path.join(paths.runtimeToolsDir, "OracleReadonlyJdbcRunner.java");
const ENV_CANDIDATES = [
  path.join(paths.opencodeDir, "config", "oracle-readonly.local.env"),
  path.join(paths.rootDir, ".opencode", "config", "oracle-readonly.local.env"),
];
const METADATA_SCHEMAS = new Set(["SYS", "SYSTEM"]);
const REQUIRED_FIELDS = [
  "ORACLE_HOST",
  "ORACLE_PORT",
  "ORACLE_USERNAME",
  "ORACLE_PASSWORD",
  "ORACLE_SCHEMA_ALLOWLIST",
];
const FORBIDDEN_PATTERNS = [
  { regex: /\binsert\b/i, reason: "INSERT is not allowed" },
  { regex: /\bupdate\b/i, reason: "UPDATE is not allowed" },
  { regex: /\bdelete\b/i, reason: "DELETE is not allowed" },
  { regex: /\bmerge\b/i, reason: "MERGE is not allowed" },
  { regex: /\btruncate\b/i, reason: "TRUNCATE is not allowed" },
  { regex: /\balter\b/i, reason: "ALTER is not allowed" },
  { regex: /\bdrop\b/i, reason: "DROP is not allowed" },
  { regex: /\bcreate\b/i, reason: "CREATE is not allowed" },
  { regex: /\breplace\b/i, reason: "REPLACE is not allowed" },
  { regex: /\bgrant\b/i, reason: "GRANT is not allowed" },
  { regex: /\brevoke\b/i, reason: "REVOKE is not allowed" },
  { regex: /\bcommit\b/i, reason: "COMMIT is not allowed" },
  { regex: /\brollback\b/i, reason: "ROLLBACK is not allowed" },
  { regex: /\bsavepoint\b/i, reason: "SAVEPOINT is not allowed" },
  { regex: /\block\s+table\b/i, reason: "LOCK TABLE is not allowed" },
  { regex: /\bfor\s+update\b/i, reason: "SELECT FOR UPDATE is not allowed" },
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

    if (key === "bind") {
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
      "Usage: node 01-runtime\\tools\\oracle-readonly-validator.js (--query-file <path> | --sql <select>) [options]",
      "",
      "Options:",
      "  --query-file <path>   Query template path under 05-observability/db-validation/queries/",
      "  --sql <text>          Inline SELECT or WITH query",
      "  --bind <KEY=VALUE>    Repeatable bind helper for PowerShell-friendly usage",
      "  --binds <json>        Inline JSON bind object, e.g. {\"KEYWORD\":\"TRANSACTION\"}",
      "  --binds-file <path>   JSON file containing bind values",
      "  --label <name>        Output label used for saved artifacts",
      "  --rows <n>            Max rows to return and save (default: 100)",
      "  --out <path>          Optional output path under 05-observability/db-validation/query-results/",
      "  --dry-run             Validate config and SQL safety without connecting to Oracle",
      "  --help                Show this help",
      "",
      "Examples:",
      "  node 01-runtime\\tools\\oracle-readonly-validator.js --sql \"select 1 as ok from dual\" --label smoke",
      "  node 01-runtime\\tools\\oracle-readonly-validator.js --query-file shared\\01-find-tables-by-keyword.sql --bind KEYWORD=TRANSACTION --bind OWNER_FILTER=PGNBILL --label table-discovery",
      "",
      "This runner always enforces read-only Oracle validation. Unsafe SQL is classified as forbidden DB action.",
    ].join("\n")
  );
  process.stdout.write("\n");
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

function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "y";
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
    ? ` Checked but still incomplete: ${seenFiles.map((filePath) => path.relative(paths.rootDir, filePath).replace(/\\/g, "/")).join(", ")}`
    : " No candidate env file was found.";

  throw new Error(
    "Oracle read-only config is incomplete. Fill 02-brain/.opencode/config/oracle-readonly.local.env (or the root .opencode fallback) before running validation." + suffix
  );
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

function buildConnectString(config) {
  if (config.ORACLE_TNS_ALIAS) {
    return config.ORACLE_TNS_ALIAS;
  }

  const protocol = String(config.ORACLE_PROTOCOL || "tcp").trim().toUpperCase();
  const host = String(config.ORACLE_HOST || "").trim();
  const port = String(config.ORACLE_PORT || "1521").trim();

  if (config.ORACLE_SID && !config.ORACLE_SERVICE_NAME) {
    const sid = String(config.ORACLE_SID).trim();
    return `(DESCRIPTION=(ADDRESS=(PROTOCOL=${protocol})(HOST=${host})(PORT=${port}))(CONNECT_DATA=(SID=${sid})))`;
  }

  const serviceName = String(config.ORACLE_SERVICE_NAME || "").trim();
  return `(DESCRIPTION=(ADDRESS=(PROTOCOL=${protocol})(HOST=${host})(PORT=${port}))(CONNECT_DATA=(SERVICE_NAME=${serviceName})))`;
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

function resolveWalletPath(config, envFile) {
  if (!normalizeBoolean(config.ORACLE_USE_WALLET)) {
    return null;
  }

  const rawWalletPath = String(config.ORACLE_WALLET_PATH || "").trim();
  if (!rawWalletPath) {
    throw new Error("ORACLE_USE_WALLET is true but ORACLE_WALLET_PATH is empty.");
  }

  if (path.isAbsolute(rawWalletPath)) {
    return rawWalletPath;
  }

  const envDir = path.dirname(envFile);
  const candidateFromEnvDir = path.resolve(envDir, rawWalletPath);
  if (fs.existsSync(candidateFromEnvDir)) {
    return candidateFromEnvDir;
  }

  return path.resolve(paths.rootDir, rawWalletPath);
}

function resolveQueryFile(fileArg) {
  const candidatePath = path.isAbsolute(fileArg)
    ? path.resolve(fileArg)
    : path.resolve(QUERY_LIBRARY_DIR, fileArg);
  const normalizedBase = path.resolve(QUERY_LIBRARY_DIR);
  const normalizedCandidate = candidatePath;

  if (
    normalizedCandidate !== normalizedBase &&
    !normalizedCandidate.startsWith(`${normalizedBase}${path.sep}`)
  ) {
    throw new Error("Query file must stay inside 05-observability/db-validation/queries/.");
  }

  if (!fs.existsSync(normalizedCandidate)) {
    throw new Error(`Query file not found: ${path.relative(paths.rootDir, normalizedCandidate).replace(/\\/g, "/")}`);
  }

  return normalizedCandidate;
}

function readSqlSource(args) {
  if (args["query-file"] && args.sql) {
    throw new Error("Use either --query-file or --sql, not both.");
  }

  if (!args["query-file"] && !args.sql) {
    throw new Error("Provide --query-file or --sql.");
  }

  if (args["query-file"]) {
    const filePath = resolveQueryFile(args["query-file"]);
    return {
      type: "query-file",
      filePath,
      sql: fs.readFileSync(filePath, "utf8"),
    };
  }

  return {
    type: "inline-sql",
    sql: String(args.sql),
  };
}

function readJsonFile(jsonPath) {
  return JSON.parse(fs.readFileSync(jsonPath, "utf8"));
}

function readBinds(args) {
  if ((args.binds && args["binds-file"]) || (args.bind && args.binds) || (args.bind && args["binds-file"])) {
    throw new Error("Use only one bind input style: --bind, --binds, or --binds-file.");
  }

  let value = {};
  if (args.binds) {
    value = JSON.parse(String(args.binds));
  } else if (args["binds-file"]) {
    const bindFilePath = path.isAbsolute(args["binds-file"])
      ? path.resolve(args["binds-file"])
      : path.resolve(paths.rootDir, args["binds-file"]);
    value = readJsonFile(bindFilePath);
  } else if (args.bind) {
    const entries = Array.isArray(args.bind) ? args.bind : [args.bind];
    value = {};
    for (const entry of entries) {
      const equalsIndex = String(entry).indexOf("=");
      if (equalsIndex <= 0) {
        throw new Error("Each --bind entry must use KEY=VALUE format.");
      }

      const key = String(entry).slice(0, equalsIndex).trim();
      const rawValue = String(entry).slice(equalsIndex + 1);
      if (!key) {
        throw new Error("Bind key cannot be empty.");
      }

      value[key] = rawValue;
    }
  }

  if (Array.isArray(value) || typeof value !== "object" || value === null) {
    throw new Error("Bind values must be a JSON object.");
  }

  return value;
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

function assertReadOnlySql(sql, schemaAllowlist) {
  const normalized = normalizeSql(sql);
  if (!normalized) {
    throw new Error("SQL is empty after normalization.");
  }

  if (normalized.includes(";")) {
    throw new Error("Multiple SQL statements are not allowed.");
  }

  const normalizedLower = normalized.toLowerCase();
  const startsReadOnly = normalizedLower.startsWith("select ") || normalizedLower.startsWith("with ");
  if (!startsReadOnly) {
    throw new Error("Only SELECT or WITH queries are allowed.");
  }

  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.regex.test(normalizedLower)) {
      throw new Error(`Forbidden DB action: ${rule.reason}.`);
    }
  }

  const qualifiedObjectMatches = [...stripCommentsAndLiterals(sql).matchAll(/\b(?:from|join)\s+("?[A-Za-z][A-Za-z0-9_$#]*"?)\s*\.\s*("?[A-Za-z][A-Za-z0-9_$#]*"?)/gi)];
  for (const match of qualifiedObjectMatches) {
    const owner = String(match[1] || "").replace(/"/g, "").toUpperCase();
    if (schemaAllowlist.has(owner) || METADATA_SCHEMAS.has(owner)) {
      continue;
    }

    throw new Error(`Forbidden DB action: schema '${owner}' is outside ORACLE_SCHEMA_ALLOWLIST.`);
  }
}

function slugify(value) {
  return String(value || "query")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "query";
}

function toRelativeRoot(targetPath) {
  return path.relative(paths.rootDir, targetPath).replace(/\\/g, "/");
}

function buildTimestamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function buildLabel(args, sqlSource) {
  if (args.label) {
    return slugify(args.label);
  }

  if (sqlSource.filePath) {
    return slugify(path.basename(sqlSource.filePath, path.extname(sqlSource.filePath)));
  }

  return "ad-hoc-select";
}

function resolveOutputPath(args, label) {
  ensureDir(QUERY_RESULTS_DIR);

  if (!args.out) {
    return path.join(QUERY_RESULTS_DIR, `${buildTimestamp()}--${label}.json`);
  }

  const rawPath = String(args.out);
  const candidatePath = path.isAbsolute(rawPath)
    ? path.resolve(rawPath)
    : path.resolve(QUERY_RESULTS_DIR, rawPath);
  const normalizedBase = path.resolve(QUERY_RESULTS_DIR);

  if (
    candidatePath !== normalizedBase &&
    !candidatePath.startsWith(`${normalizedBase}${path.sep}`)
  ) {
    throw new Error("Output path must stay inside 05-observability/db-validation/query-results/.");
  }

  if (!candidatePath.toLowerCase().endsWith(".json")) {
    return `${candidatePath}.json`;
  }

  return candidatePath;
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function buildMarkdownReport(resultPayload) {
  const lines = [
    "# Oracle Read-Only Validation Result",
    "",
    `- Executed At: ${resultPayload.executed_at}`,
    `- Label: ${resultPayload.label}`,
    `- Env File: ${resultPayload.env_file}`,
    `- Query Source: ${resultPayload.query_source.type}`,
    `- Driver Mode: ${resultPayload.driver_mode}`,
    `- Connection Mode: ${resultPayload.connection_mode}`,
    `- Schema Allowlist: ${resultPayload.schema_allowlist.join(", ") || "(empty)"}`,
    `- Max Rows: ${resultPayload.max_rows}`,
    `- Rows Returned: ${resultPayload.rows_returned}`,
    `- Duration Ms: ${resultPayload.duration_ms}`,
    "",
    "## SQL",
    "",
    "```sql",
    resultPayload.sql,
    "```",
    "",
    "## Columns",
    "",
    resultPayload.columns.length > 0
      ? resultPayload.columns.map((column) => `- ${column}`).join("\n")
      : "- (no columns returned)",
    "",
    "## Preview",
    "",
    "```json",
    JSON.stringify(resultPayload.rows.slice(0, 10), null, 2),
    "```",
  ];

  if (resultPayload.query_source.path) {
    lines.splice(6, 0, `- Query File: ${resultPayload.query_source.path}`);
  }

  if (Object.keys(resultPayload.binds).length > 0) {
    lines.push("", "## Binds", "", "```json", JSON.stringify(resultPayload.binds, null, 2), "```");
  }

  return `${lines.join("\n")}\n`;
}

function escapePropertiesComponent(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/([=:#!])/g, "\\$1");
}

function findFirstJarUnder(rootDir) {
  if (!rootDir || !fs.existsSync(rootDir)) {
    return null;
  }

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
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
  const candidates = [
    path.join(userProfile, "Downloads", "ojdbc11.jar"),
    path.join(userProfile, "Downloads", "ojdbc8.jar"),
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const dbeaverDriverRoot = path.join(appData, "DBeaverData", "drivers", "maven", "maven-central", "com.oracle.database.jdbc");
  return findFirstJarUnder(dbeaverDriverRoot);
}

function shouldUseJdbcFallback(error, config) {
  if (String(config.ORACLE_RUNNER_MODE || "").trim().toLowerCase() === "jdbc") {
    return true;
  }

  if (normalizeBoolean(config.ORACLE_FORCE_JDBC)) {
    return true;
  }

  return /NJS-116/i.test(String(error && error.message ? error.message : error));
}

function executeWithJdbcFallback(config, sql, binds, maxRows) {
  const jdbcJarPath = resolveJdbcJarPath(config);
  if (!jdbcJarPath) {
    throw new Error("Oracle JDBC fallback is needed, but no ojdbc jar was found. Set ORACLE_JDBC_JAR or place ojdbc11.jar where DBeaver or the local config can reference it.");
  }

  if (!fs.existsSync(JDBC_RUNNER_SOURCE)) {
    throw new Error(`Oracle JDBC runner source is missing: ${toRelativeRoot(JDBC_RUNNER_SOURCE)}`);
  }

  const tempRoot = path.join(paths.runtimeRootDir, "temp", "oracle-jdbc");
  ensureDir(tempRoot);
  const requestDir = fs.mkdtempSync(path.join(tempRoot, "request-"));
  const sqlPath = path.join(requestDir, "query.sql");
  const bindsPath = path.join(requestDir, "binds.properties");

  fs.writeFileSync(sqlPath, sql, "utf8");
  const bindLines = Object.entries(binds).map(([key, value]) => `${escapePropertiesComponent(key)}=${escapePropertiesComponent(value)}`);
  fs.writeFileSync(bindsPath, `${bindLines.join("\n")}\n`, "utf8");

  const env = {
    ...process.env,
    ORACLE_JDBC_URL: buildJdbcUrl(config),
    ORACLE_JDBC_USER: String(config.ORACLE_USERNAME || ""),
    ORACLE_JDBC_PASSWORD: String(config.ORACLE_PASSWORD || ""),
    ORACLE_JDBC_MAX_ROWS: String(maxRows),
  };

  const startedAt = Date.now();
  const result = spawnSync(
    "java",
    ["--class-path", jdbcJarPath, JDBC_RUNNER_SOURCE, sqlPath, bindsPath],
    {
      cwd: paths.runtimeRootDir,
      env,
      encoding: "utf8",
      timeout: 120000,
    }
  );

  try {
    if (result.status !== 0) {
      const detail = (result.stderr || result.stdout || "Oracle JDBC fallback failed").trim();
      throw new Error(detail);
    }

    const parsed = JSON.parse(String(result.stdout || "{}").trim());
    const columns = Array.isArray(parsed.columns) ? parsed.columns : [];
    const rows = Array.isArray(parsed.rows) ? parsed.rows : [];
    return {
      driverMode: "jdbc",
      durationMs: Date.now() - startedAt,
      metaData: columns.map((name) => ({ name })),
      rows,
    };
  } finally {
    fs.rmSync(requestDir, { recursive: true, force: true });
  }
}

async function executeReadOnlyQuery(config, sql, binds, maxRows) {
  const nodeConnectionConfig = {
    user: config.ORACLE_USERNAME,
    password: config.ORACLE_PASSWORD,
    connectString: buildConnectString(config),
  };

  if (normalizeBoolean(config.ORACLE_USE_WALLET)) {
    const walletPath = resolveWalletPath(config, config.__envFile || ENV_CANDIDATES[0]);
    nodeConnectionConfig.walletLocation = walletPath;
    if (config.ORACLE_WALLET_PASSWORD) {
      nodeConnectionConfig.walletPassword = config.ORACLE_WALLET_PASSWORD;
    }
  }

  if (String(config.ORACLE_RUNNER_MODE || "").trim().toLowerCase() === "jdbc" || normalizeBoolean(config.ORACLE_FORCE_JDBC)) {
    return executeWithJdbcFallback(config, sql, binds, maxRows);
  }

  let oracledb;
  try {
    oracledb = require("oracledb");
  } catch (error) {
    return executeWithJdbcFallback(config, sql, binds, maxRows);
  }

  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

  let connection;
  const startedAt = Date.now();
  try {
    connection = await oracledb.getConnection(nodeConnectionConfig);
    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      maxRows,
      fetchArraySize: Math.min(maxRows, 200),
    });

    return {
      driverMode: "node-thin",
      durationMs: Date.now() - startedAt,
      metaData: Array.isArray(result.metaData) ? result.metaData : [],
      rows: Array.isArray(result.rows) ? result.rows : [],
    };
  } catch (error) {
    if (shouldUseJdbcFallback(error, config)) {
      return executeWithJdbcFallback(config, sql, binds, maxRows);
    }
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const sqlSource = readSqlSource(args);
  const binds = readBinds(args);
  const maxRows = Number.parseInt(String(args.rows || "100"), 10);
  if (!Number.isFinite(maxRows) || maxRows <= 0) {
    throw new Error("--rows must be a positive integer.");
  }

  const { config, envFile } = findConfigSource();
  config.__envFile = envFile;
  const schemaAllowlist = parseAllowlist(config.ORACLE_SCHEMA_ALLOWLIST);
  if (schemaAllowlist.size === 0) {
    throw new Error("ORACLE_SCHEMA_ALLOWLIST must contain at least one schema.");
  }

  assertReadOnlySql(sqlSource.sql, schemaAllowlist);

  const label = buildLabel(args, sqlSource);
  const summary = {
    label,
    env_file: toRelativeRoot(envFile),
    query_source: sqlSource.filePath ? toRelativeRoot(sqlSource.filePath) : "inline-sql",
    schema_allowlist: [...schemaAllowlist],
    dry_run: normalizeBoolean(args["dry-run"]),
  };

  if (normalizeBoolean(args["dry-run"])) {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    return;
  }

  const outputPath = resolveOutputPath(args, label);
  const markdownPath = outputPath.replace(/\.json$/i, ".md");
  const result = await executeReadOnlyQuery(config, sqlSource.sql, binds, maxRows);

  const payload = {
    executed_at: new Date().toISOString(),
    label,
    env_file: toRelativeRoot(envFile),
    profile_name: config.ORACLE_PROFILE_NAME || null,
    driver_mode: result.driverMode,
    connection_mode: config.ORACLE_CONNECTION_MODE || (config.ORACLE_SERVICE_NAME ? "service_name" : config.ORACLE_SID ? "sid" : "tns"),
    schema_allowlist: [...schemaAllowlist],
    max_rows: maxRows,
    duration_ms: result.durationMs,
    query_source: {
      type: sqlSource.type,
      path: sqlSource.filePath ? toRelativeRoot(sqlSource.filePath) : null,
    },
    sql: sqlSource.sql,
    sql_sha256: sha256(sqlSource.sql),
    binds,
    columns: result.metaData.map((column) => column.name),
    rows_returned: result.rows.length,
    rows: result.rows,
  };

  writeJson(outputPath, payload);
  writeText(markdownPath, buildMarkdownReport(payload));

  process.stdout.write(
    `${JSON.stringify({
      label: payload.label,
      env_file: payload.env_file,
      driver_mode: payload.driver_mode,
      output_json: toRelativeRoot(outputPath),
      output_markdown: toRelativeRoot(markdownPath),
      rows_returned: payload.rows_returned,
      columns: payload.columns,
    }, null, 2)}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});


