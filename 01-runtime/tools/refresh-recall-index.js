const fs = require("fs");
const path = require("path");
const {
  paths,
  ensureDir,
  readJsonIfExists,
  writeJson,
  writeText,
} = require("./workspace-paths");

const MEMORY_FILES = {
  currentMission: path.join(paths.memoryDir, "CURRENT_MISSION.md"),
  userPreferences: paths.userWorkingPreferencesPath,
  learnedFlow: path.join(paths.memoryDir, "LEARNED_FLOW.md"),
  bugPatterns: path.join(paths.memoryDir, "BUG_PATTERNS.md"),
  nextActions: path.join(paths.memoryDir, "NEXT_ACTIONS.md"),
  autoLearning: path.join(paths.memoryDir, "AUTO_LEARNING_LOG.md"),
};

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    return "";
  }

  return fs.readFileSync(filePath, "utf8");
}

function normalizeLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function stripMarkdown(line) {
  return line
    .replace(/^[-*]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/^#+\s*/, "")
    .trim();
}

function takeBullets(text, limit = 5) {
  const lines = normalizeLines(text);
  const bullets = lines
    .filter((line) => /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line))
    .map(stripMarkdown)
    .filter(Boolean);

  if (bullets.length > 0) {
    return bullets.slice(0, limit);
  }

  return lines
    .filter((line) => !line.startsWith("#"))
    .map(stripMarkdown)
    .filter(Boolean)
    .slice(0, limit);
}

function takeHeadings(text, limit = 5) {
  return normalizeLines(text)
    .filter((line) => /^##\s+/.test(line))
    .map(stripMarkdown)
    .slice(-limit)
    .reverse();
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function readActiveAgents() {
  const agentsDir = path.join(paths.opencodeDir, "agents");
  if (!fs.existsSync(agentsDir)) {
    return [];
  }

  return fs
    .readdirSync(agentsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".md")
    .map((entry) => path.basename(entry.name, ".md"))
    .sort();
}

function readEnabledMcpServers() {
  const config = readJsonIfExists(path.join(paths.rootDir, "opencode.json"), {});
  const servers = config.mcp || {};

  return Object.entries(servers)
    .filter(([, value]) => value && value.enabled !== false)
    .map(([name, value]) => ({
      name,
      type: value.type || "unknown",
      command: Array.isArray(value.command) ? value.command.join(" ") : "",
      timeout: value.timeout || null,
    }));
}

function buildRecallIndex(state) {
  const mcpNames = state.mcpServers.map((server) => server.name).join(", ") || "none";
  const latestLedger = state.latestLedger
    ? [
        `- Latest block: ${state.latestLedger.latest_block?.id || "unknown"}`,
        `- Latest hash: ${state.latestLedger.latest_hash || "unknown"}`,
        `- Total blocks: ${state.latestLedger.block_count || 0}`,
      ].join("\n")
    : "- No ledger block recorded yet.";

  const section = (title, items) => {
    const normalized = items && items.length > 0 ? items : ["none yet"];
    return `## ${title}\n${normalized.map((item) => `- ${item}`).join("\n")}\n`;
  };

  return [
    "# RECALL INDEX",
    "",
    `- Updated: ${state.generatedAt}`,
    "- Primary agent: Engineer",
    `- Active agents: ${state.activeAgents.join(", ") || "none"}`,
    `- Enabled MCP servers: ${mcpNames}`,
    "",
    section("User Working Preferences", state.userPreferences),
    section("Current Mission", state.currentMission),
    section("Reusable Flow Knowledge", state.learnedFlow),
    section("Bug And Infra Patterns", state.bugPatterns),
    section("High Signal Learning", state.autoLearningHeadings),
    section("Current Next Actions", state.nextActions),
    "## Latest Ledger",
    latestLedger,
    "",
    "## Preferred Evidence Order",
    "- Runtime state and recall index",
    "- Module pack and extracted business flow",
    "- Manual flow record",
    "- Relevant MoM source for business or approval rules",
    "- QA standards by smallest relevant domain",
    "- Playwright MCP or CDP runtime evidence",
    "- Oracle read-only validation when persistence or schema proof is needed",
    "",
  ].join("\n");
}

function buildGlobalBrainSnapshot(existingSnapshot, state) {
  const defaultModules = existingSnapshot.modules || {};
  const defaultPatterns = existingSnapshot.global_patterns || [];

  return {
    ...existingSnapshot,
    version: existingSnapshot.version || "learning-ledger-v1",
    generated_at: state.generatedAt,
    primary_agent: "engineer",
    current_mode: "engineer",
    active_agents: state.activeAgents,
    active_module: existingSnapshot.active_module || "transaction-mapping",
    core_runtime: {
      context_handoff: "01-runtime/runtime/docs/CONTEXT_HANDOFF.md",
      active_module: "01-runtime/runtime/docs/ACTIVE_MODULE.md",
      last_run_summary: "01-runtime/runtime/docs/LAST_RUN_SUMMARY.md",
      blockers: "01-runtime/runtime/docs/BLOCKERS.md",
    },
    reference_knowledge: {
      ...(existingSnapshot.reference_knowledge || {}),
      raw_knowledge_catalog: "02-brain/distilled-output/global/raw-knowledge-catalog.md",
      qa_standards_routing: "02-brain/distilled-output/global/qa-standards-routing.md",
      qa_standards_raw: "04-knowledge-raw/QA_STANDARDS",
      mom_raw: "04-knowledge-raw/MOM",
      business_flow_summary: "02-brain/distilled-output/global/business-flow-summary.md",
    },
    testing_infrastructure: {
      playwright_mcp: {
        enabled: state.mcpServers.some((server) => server.name === "playwright_cdp"),
        server_name: "playwright_cdp",
        command_path: "01-runtime/tools/playwright-mcp-server.mjs",
      },
      oracle_mcp: {
        enabled: state.mcpServers.some((server) => server.name === "oracle_readonly"),
        server_name: "oracle_readonly",
        command_path: "01-runtime/tools/oracle-readonly-mcp-server.mjs",
      },
      runtime_regression: "01-runtime/runtime/modules/run-active-module-regression.js",
    },
    interaction_learning: {
      recall_index: "02-brain/.opencode/memory/RECALL_INDEX.md",
      user_preferences: "02-brain/.opencode/memory/USER_WORKING_PREFERENCES.md",
      auto_refresh_after_ledger_append: true,
      latest_ledger_block: state.latestLedger?.latest_block?.id || null,
    },
    business_source_priority: [
      "02-brain/distilled-output/global/raw-knowledge-catalog.md",
      "02-brain/distilled-output/per-module/<module>/business-flow.md",
      "01-runtime/artifacts/adhoc-notes/manual-flow-record-latest.md",
      "04-knowledge-raw/MOM",
      "04-knowledge-raw/BPMN_BISPRO on-demand extraction only",
      "04-knowledge-raw/QA_STANDARDS smallest relevant domain only",
      "05-observability/db-validation for safe read-only validation",
    ],
    modules: defaultModules,
    global_patterns: unique([
      ...defaultPatterns,
      ...state.userPreferences.slice(0, 4),
      ...state.learnedFlow.slice(0, 4),
      "Engineer is the only active QA operating role.",
      "Use MoM when app behavior or business rules are under discussion.",
      "Use Playwright MCP for precise UI interaction before falling back to ad-hoc scripts.",
      "Refresh recall memory after each ledger append.",
    ]),
  };
}

function refreshRecallIndex() {
  ensureDir(paths.memoryDir);
  ensureDir(paths.ledgerSnapshotsDir);

  const generatedAt = new Date().toISOString();
  const currentMission = takeBullets(readText(MEMORY_FILES.currentMission), 6);
  const userPreferences = takeBullets(readText(MEMORY_FILES.userPreferences), 8);
  const learnedFlow = takeBullets(readText(MEMORY_FILES.learnedFlow), 8);
  const bugPatterns = takeBullets(readText(MEMORY_FILES.bugPatterns), 8);
  const nextActions = takeBullets(readText(MEMORY_FILES.nextActions), 8);
  const autoLearningHeadings = takeHeadings(readText(MEMORY_FILES.autoLearning), 6);
  const activeAgents = readActiveAgents();
  const mcpServers = readEnabledMcpServers();
  const latestLedger = readJsonIfExists(path.join(paths.ledgerIndexDir, "latest.json"), null);
  const existingSnapshot = readJsonIfExists(
    path.join(paths.ledgerSnapshotsDir, "global-brain.json"),
    {}
  );

  const state = {
    generatedAt,
    currentMission,
    userPreferences,
    learnedFlow,
    bugPatterns,
    nextActions,
    autoLearningHeadings,
    activeAgents,
    mcpServers,
    latestLedger,
  };

  const recallIndex = buildRecallIndex(state);
  const globalBrainSnapshot = buildGlobalBrainSnapshot(existingSnapshot, state);
  const warnings = [];

  try {
    writeText(paths.recallIndexPath, recallIndex);
  } catch (error) {
    warnings.push(`recall_index_write_failed: ${error.message}`);
  }

  try {
    writeJson(path.join(paths.ledgerSnapshotsDir, "global-brain.json"), globalBrainSnapshot);
  } catch (error) {
    warnings.push(`global_brain_write_failed: ${error.message}`);
  }

  return {
    recall_index: path.relative(paths.rootDir, paths.recallIndexPath).replace(/\\/g, "/"),
    global_brain_snapshot: "02-brain/learning-ledger/snapshots/global-brain.json",
    primary_agent: globalBrainSnapshot.primary_agent,
    active_agents: globalBrainSnapshot.active_agents,
    mcp_servers: state.mcpServers.map((server) => server.name),
    latest_ledger_block: latestLedger?.latest_block?.id || null,
    warnings,
  };
}

if (require.main === module) {
  try {
    process.stdout.write(`${JSON.stringify(refreshRecallIndex(), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  refreshRecallIndex,
};
