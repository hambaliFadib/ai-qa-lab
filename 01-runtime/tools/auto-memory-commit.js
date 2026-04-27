const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { paths, ensureDir, writeJson, writeText } = require("./workspace-paths");

// Conservative by design:
// - hot memory updates are applied only from a structured payload
// - ledger append happens only when durable signals are present or explicitly forced
// - historical ledger blocks are never edited; append-learning-block.js owns append + recall refresh
// - spreadsheet testcase writes are hot memory by default; durable ledger is reserved for reusable mapping or testcase-pack improvements
// - Figma design mismatch work is hot memory by default; durable ledger is reserved for confirmed design rules or stable design-to-UI mappings
// - LOW-confidence design or unconfirmed needs_design_confirmation output must never become durable ledger truth
// - Diagnosis output is hot memory by default; provisional diagnosis or possible_defect_candidate must not become durable ledger truth
// - Confirmation question reports are hot memory by default; durable ledger is allowed only after stakeholder answers are confirmed, evidence-backed, and reusable
// - External source registration, MoM extraction, BPMN extraction, and source reconciliation are hot memory/staging by default unless confirmed, evidence-backed, high-confidence, reusable, and conflict-resolved
// - Raw ISQA notes, ISQA extraction, testcase update candidates, and spreadsheet update plans are staging/hot memory until QA review, evidence backing, and approval gates pass
const HOT_TARGETS = {
  context_handoff: path.join(paths.runtimeDocsDir, "CONTEXT_HANDOFF.md"),
  runtime_handoff: path.join(paths.runtimeDocsDir, "CONTEXT_HANDOFF.md"),
  next_actions: path.join(paths.memoryDir, "NEXT_ACTIONS.md"),
  last_run_summary: path.join(paths.runtimeDocsDir, "LAST_RUN_SUMMARY.md"),
  blockers: path.join(paths.runtimeDocsDir, "BLOCKERS.md"),
  session_summary: path.join(paths.memoryDir, "SESSION_SUMMARY.md"),
  auto_learning_log: path.join(paths.memoryDir, "AUTO_LEARNING_LOG.md"),
  decision_quality_log: path.join(paths.memoryDir, "DECISION_QUALITY_LOG.md"),
  learned_flow: path.join(paths.memoryDir, "LEARNED_FLOW.md"),
  bug_patterns: path.join(paths.memoryDir, "BUG_PATTERNS.md"),
  user_working_preferences: paths.userWorkingPreferencesPath,
};

const DURABLE_TYPES = new Set([
  "module_knowledge_change",
  "bug_pattern",
  "learned_flow",
  "user_preference",
  "rca",
  "db_validation",
  "controlled_testdata",
  "browser_orchestration",
  "challenge_policy",
  "confidence_policy",
  "decision_policy",
  "release_decision_policy",
  "release_decision",
  "memory_policy",
]);

const DURABLE_FILE_PATTERNS = [
  /^AI-QA-LAB.*UPGRADE.*\.md$/i,
  /01-runtime\/runtime\/modules\//i,
  /01-runtime\/tools\//i,
  /02-brain\/distilled-output\/global\//i,
  /02-brain\/distilled-output\/per-module\//i,
  /02-brain\/\.opencode\/memory\/(LEARNED_FLOW|BUG_PATTERNS|USER_WORKING_PREFERENCES|CHALLENGE_PATTERNS|DECISION_PATTERNS)\.md$/i,
  /02-brain\/\.opencode\/agents\/engineer\.md$/i,
  /02-brain\/\.opencode\/skills\//i,
  /02-brain\/\.opencode\/prompts\//i,
  /02-brain\/\.opencode\/config\//i,
  /01-runtime\/runtime\/docs\/AUTO_MEMORY_MODEL\.md$/i,
  /05-observability\/db-validation\//i,
  /05-observability\/db-injection\//i,
  /06-testing\/test-data\/db-injection\/plans\//i,
];

const DURABLE_KEYWORDS = [
  /\bmodule knowledge\b/i,
  /\bbug pattern\b/i,
  /\blearned flow\b/i,
  /\buser preference\b/i,
  /\broot cause\b/i,
  /\bRCA\b/i,
  /\bDB validation\b/i,
  /\bOracle\b/i,
  /\bcontrolled test[- ]?data\b/i,
  /\bBrowser Use\b/i,
  /\bPlaywright\b/i,
  /\bCDP\b/i,
  /\bexecution maturity\b/i,
  /\bclassification standard\b/i,
  /\bselector registry\b/i,
  /\bflow-aware\b/i,
  /\bskill\b/i,
  /\borchestration\b/i,
  /\bupgrade\b/i,
  /\bchallenge\b/i,
  /\bconfidence gate\b/i,
  /\bDecision Engine\b/i,
  /\brelease decision\b/i,
  /\bgo\/no-go\b/i,
  /\bproduction readiness\b/i,
  /\bdesign confidence\b/i,
  /\bconfirmation question\b/i,
  /\bstakeholder answer\b/i,
  /\bQA approval\b/i,
  /\bapproved update log\b/i,
  /\breusable\b/i,
];

const TRIVIAL_KEYWORDS = [
  /\bnavigation only\b/i,
  /\bstatus only\b/i,
  /\brepeated summary\b/i,
  /\bunchanged rerun\b/i,
  /\brecap only\b/i,
  /\btrivial\b/i,
];

const RCA_OUTPUT_TYPES = new Set([
  "rca",
  "bug_rca",
  "bug_analysis",
  "bug_classification",
  "root_cause",
  "root_cause_analysis",
  "severity",
  "incident_rca",
]);

const NON_RCA_POLICY_TYPES = new Set([
  "challenge_policy",
  "confidence_policy",
  "decision_policy",
  "release_decision_policy",
  "memory_policy",
  "browser_orchestration",
  "module_knowledge_change",
]);

const RELEASE_DECISION_OUTPUT_TYPES = new Set([
  "release_decision",
  "go_no_go",
  "go_nogo",
  "production_readiness",
  "deployment_safety",
  "release_readiness",
]);

const RELEASE_DECISION_VALUES = new Set([
  "RELEASE_READY",
  "RELEASE_READY_WITH_CAVEAT",
  "RELEASE_HOLD",
  "RELEASE_REJECT",
  "DECISION_NOT_POSSIBLE",
]);

const DIAGNOSIS_PROVISIONAL_CLASSIFICATIONS = new Set([
  "design_outdated_candidate",
  "implementation_gap_candidate",
  "role_based_visibility_candidate",
  "data_dependent_visibility_candidate",
  "mode_dependent_behavior",
  "business_rule_missing",
  "needs_design_confirmation",
  "needs_business_confirmation",
  "needs_runtime_condition_validation",
  "possible_defect_candidate",
  "not_a_bug_expected_behavior",
]);

const CONFIRMATION_QUESTION_PATTERNS = [
  /\bConfirmation Question Report\b/i,
  /\bConfirmation Question Engine\b/i,
  /\bStakeholder Question Packs\b/i,
  /\bMeeting Agenda Draft\b/i,
  /\bNeeds Confirmation\b/i,
];

const BLOCKING_SOURCE_CONFIDENCE = new Set([
  "LOW",
  "UNKNOWN",
  "CONFLICTED",
  "STALE",
]);

const EXTERNAL_SOURCE_PATTERNS = [
  /\bExternal Reference Intake\b/i,
  /\bMoM Extraction Summary\b/i,
  /\bBPMN Extraction Summary\b/i,
  /\bSource Reconciliation Report\b/i,
  /\bsource confidence\b/i,
  /\bcandidate_business_rule\b/i,
  /\bcandidate business rule\b/i,
  /\bcandidate_flow\b/i,
  /\bcandidate flow\b/i,
  /\bneeds_business_confirmation\b/i,
  /\bunresolved conflict\b/i,
  /\bbusiness_conflict_candidate\b/i,
  /\bOneDrive MoM\b/i,
  /\bCamunda BPMN\b/i,
];

const ISQA_GOVERNANCE_PATTERNS = [
  /\bISQA\b/i,
  /\bISQA Governance\b/i,
  /\bQA governance\b/i,
  /\bgovernance reference\b/i,
  /\bconference material\b/i,
  /\bqa principle\b/i,
  /\bisqa_governance\b/i,
  /\bisqa_extraction\b/i,
];

const SPREADSHEET_UPDATE_PATTERNS = [
  /\bTestcase Update Candidate\b/i,
  /\bSpreadsheet Write Plan\b/i,
  /\bSpreadsheet Write Approval\b/i,
  /\btestcase_update_candidate\b/i,
  /\bspreadsheet_update_plan\b/i,
  /\bspreadsheet update\b/i,
  /\bExpected Result change\b/i,
  /\bSteps change\b/i,
  /\bAPPROVED BY QA\b/i,
];

const NON_RELEASE_DECISION_TYPES = new Set([
  "challenge_policy",
  "confidence_policy",
  "decision_policy",
  "release_decision_policy",
  "memory_policy",
  "browser_orchestration",
  "module_knowledge_change",
]);

const INCOMPLETE_RCA_PATTERNS = [
  /\bevidence not sufficient\b/i,
  /\binsufficient evidence\b/i,
  /\bmissing cross[- ]layer\b/i,
  /\bwithout sufficient cross[- ]layer evidence\b/i,
  /\bnot enough proof\b/i,
  /\bprovisional analysis\b/i,
  /\binvestigation plan\b/i,
  /\bnot RCA\b/i,
  /\bdo not append\b.*\bledger\b/i,
  /\bconfidence\b\s*:\s*low\b/i,
];

const UNDER_EVIDENCED_RELEASE_PATTERNS = [
  /\bevidence not sufficient\b/i,
  /\binsufficient evidence\b/i,
  /\bincomplete evidence\b/i,
  /\bmissing evidence\b/i,
  /\bnot enough proof\b/i,
  /\bprovisional\b/i,
  /\bdecision not possible\b/i,
  /\bcannot responsibly\b/i,
  /\bscope (?:is )?(?:undefined|unclear)\b/i,
  /\baccess (?:is )?unavailable\b/i,
  /\bpersistence (?:is )?unverified\b/i,
  /\bbusiness invariant (?:is )?ambiguous\b/i,
  /\bmaterial(?:ly)? conflicts?\b/i,
  /\bconfidence\b\s*:\s*low\b/i,
];

const PROVISIONAL_OUTPUT_PATTERNS = [
  /\bprovisional analysis\b/i,
  /\bprovisional classification\b/i,
  /\bprovisional output\b/i,
  /\btemporary status\b/i,
  /\bneeds investigation\b/i,
  /\bneeds manual review\b/i,
  /\bcandidate product issue\b/i,
  /\bpossible automation false positive\b/i,
  /\bpossible environment issue\b/i,
  /\bpossible expected behavior\b/i,
  /\bambiguous\b/i,
  /\bconfidence\b\s*:\s*low\b/i,
];

const EVIDENCE_BACKED_OUTCOME_TYPES = new Set([
  "rca",
  "bug_rca",
  "bug_analysis",
  "bug_classification",
  "root_cause",
  "root_cause_analysis",
  "severity",
  "incident_rca",
  "release_decision",
  "go_no_go",
  "go_nogo",
  "production_readiness",
  "deployment_safety",
  "release_readiness",
]);

const CROSS_LAYER_EVIDENCE_PATTERNS = [
  /\b(UI|DOM|screenshot|Browser Use|Playwright|CDP|reproduc(?:e|ed|ible|ibility)|observable behavior)\b/i,
  /\b(API|network|endpoint|request|response|HTTP|status code|payload|failed call|missing call)\b/i,
  /\b(DB|database|Oracle|read[- ]?only|persisted|absent|mismatch(?:ed)?|schema clarified|schema)\b/i,
  /\b(logs?|console|session|token|auth|role|policy|VPN)\b/i,
];

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (token === "--force-durable") {
      args.forceDurable = true;
      continue;
    }

    if (token === "--force-trivial") {
      args.forceTrivial = true;
      continue;
    }

    if (token.startsWith("--")) {
      args[token.slice(2)] = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

function readTextIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return "";
  }

  return fs.readFileSync(filePath, "utf8");
}

function normalizePathForMatch(filePath) {
  return String(filePath || "").replace(/\\/g, "/");
}

function normalizeLines(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => normalizeLines(item))
      .filter(Boolean);
  }

  if (typeof value === "object") {
    return Object.entries(value).map(([key, entry]) => `${key}: ${String(entry).trim()}`);
  }

  return String(value)
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
}

function flattenText(value) {
  if (!value) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map(flattenText).join("\n");
  }

  if (typeof value === "object") {
    return Object.values(value).map(flattenText).join("\n");
  }

  return String(value);
}

function normalizeBoolean(value) {
  if (value === true || value === false) {
    return value;
  }

  if (typeof value === "string") {
    if (/^(true|yes|sufficient|complete)$/i.test(value.trim())) {
      return true;
    }

    if (/^(false|no|insufficient|incomplete)$/i.test(value.trim())) {
      return false;
    }
  }

  return null;
}

function readPayload(inputPath) {
  if (!inputPath) {
    throw new Error("Usage: node auto-memory-commit.js --input <turn-payload.json> [--dry-run]");
  }

  const payload = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  if (!payload.summary && !payload.hot_updates) {
    throw new Error("Payload must include `summary` or `hot_updates`.");
  }

  return payload;
}

function collectFileRefs(payload) {
  return unique([
    ...normalizeLines(payload.changed_files),
    ...normalizeLines(payload.files),
    ...normalizeLines(payload.evidence_refs),
  ].map(normalizePathForMatch));
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function isRcaLikePayload(payload, text) {
  const type = String(payload.type || "").toLowerCase().replace(/[-\s]+/g, "_");
  if (NON_RCA_POLICY_TYPES.has(type)) {
    return false;
  }

  if (RCA_OUTPUT_TYPES.has(type)) {
    return true;
  }

  const hint = flattenText({
    classification_hint: payload.classification_hint,
    analysis_mode: payload.analysis_mode,
    requested_output: payload.requested_output,
  });

  if (/\b(rca|root cause|bug classification|severity)\b/i.test(hint)) {
    return true;
  }

  return (
    /\bRoot Cause\s*:/i.test(text) ||
    /\bType\s*:\s*Product Bug\b/i.test(text) ||
    /\bSeverity\s*:\s*P[0-4]\b/i.test(text) ||
    /\bProvisional Analysis\b.*\bFinal RCA\b/is.test(text)
  );
}

function hasCrossLayerEvidence(payload, files) {
  if (normalizeBoolean(payload.evidence_sufficient) === true) {
    return true;
  }

  if (normalizeBoolean(payload.cross_layer_evidence) === true) {
    return true;
  }

  const evidenceText = flattenText({
    evidence: payload.evidence,
    evidence_refs: payload.evidence_refs,
    evidence_layers: payload.evidence_layers,
    ui_evidence: payload.ui_evidence,
    api_evidence: payload.api_evidence,
    network_evidence: payload.network_evidence,
    db_evidence: payload.db_evidence,
    log_evidence: payload.log_evidence,
    session_evidence: payload.session_evidence,
    details: payload.details,
    derived_updates: payload.derived_updates,
  });

  return CROSS_LAYER_EVIDENCE_PATTERNS.some((pattern) => pattern.test(evidenceText)) ||
    files.some((filePath) => CROSS_LAYER_EVIDENCE_PATTERNS.some((pattern) => pattern.test(filePath)));
}

function detectIncompleteRcaLedgerBlock(payload, text, files) {
  if (!isRcaLikePayload(payload, text)) {
    return { blocked: false, signals: [] };
  }

  const signals = [];

  if (normalizeBoolean(payload.evidence_sufficient) === false) {
    signals.push("RCA evidence marked insufficient");
  }

  if (normalizeBoolean(payload.cross_layer_evidence) === false) {
    signals.push("RCA cross-layer evidence marked missing");
  }

  for (const pattern of INCOMPLETE_RCA_PATTERNS) {
    if (pattern.test(text)) {
      signals.push(`incomplete RCA marker: ${pattern.source}`);
    }
  }

  if (!hasCrossLayerEvidence(payload, files)) {
    signals.push("missing cited UI/API/DB/log/session evidence");
  }

  return {
    blocked: signals.length > 0,
    signals,
  };
}

function normalizeType(value) {
  return String(value || "").toLowerCase().replace(/[-\s]+/g, "_");
}

function extractReleaseDecision(payload, text) {
  const explicit = String(payload.decision || payload.release_decision || "").trim().toUpperCase();
  if (RELEASE_DECISION_VALUES.has(explicit)) {
    return explicit;
  }

  const match = String(text || "").match(
    /\b(?:Decision|Release Decision)\s*:\s*(RELEASE_READY_WITH_CAVEAT|RELEASE_READY|RELEASE_HOLD|RELEASE_REJECT|DECISION_NOT_POSSIBLE)\b/i
  );
  if (match) {
    return match[1].toUpperCase();
  }

  for (const value of RELEASE_DECISION_VALUES) {
    if (new RegExp(`\\b${value}\\b`, "i").test(text)) {
      return value;
    }
  }

  return null;
}

function extractConfidence(payload, text) {
  const explicit = String(payload.confidence || "").trim().toUpperCase();
  if (/^(HIGH|MEDIUM|LOW)$/.test(explicit)) {
    return explicit;
  }

  const match = String(text || "").match(/\bConfidence\s*:\s*(HIGH|MEDIUM|LOW)\b/i);
  return match ? match[1].toUpperCase() : null;
}

function extractSelfAuditResult(payload, text) {
  const explicit = String(payload.self_audit_result || "").trim().toUpperCase();
  if (/^(PASS|WARNING|FAIL)$/.test(explicit)) {
    return explicit;
  }

  const match = String(text || "").match(/\bSelf-Audit Result\s*:\s*(PASS|WARNING|FAIL)\b/i);
  return match ? match[1].toUpperCase() : null;
}

function extractDecisionScore(payload, text) {
  const explicit = payload.decision_score;
  if (typeof explicit === "number" && Number.isFinite(explicit)) {
    return explicit;
  }

  if (typeof explicit === "string") {
    const trimmed = explicit.trim().toUpperCase();
    if (trimmed === "INCOMPLETE") {
      return "INCOMPLETE";
    }

    if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }
  }

  const incompleteMatch = String(text || "").match(/\bDecision Score\s*:\s*INCOMPLETE\b/i);
  if (incompleteMatch) {
    return "INCOMPLETE";
  }

  const numericMatch = String(text || "").match(/\bDecision Score\s*:\s*(\d+(?:\.\d+)?)\b/i);
  return numericMatch ? Number(numericMatch[1]) : null;
}

function extractDesignConfidence(payload, text) {
  const explicit = payload.design_confidence;
  if (typeof explicit === "string" && /^(HIGH|MEDIUM|LOW)$/i.test(explicit.trim())) {
    return explicit.trim().toUpperCase();
  }

  if (explicit && typeof explicit === "object") {
    const level = String(explicit.level || "").trim().toUpperCase();
    if (/^(HIGH|MEDIUM|LOW)$/.test(level)) {
      return level;
    }
  }

  const flat = String(text || "");
  const sectionMatch = flat.match(/\bDesign Confidence\b[\s\S]{0,200}?\bLevel\s*:\s*(HIGH|MEDIUM|LOW)\b/i);
  if (sectionMatch) {
    return sectionMatch[1].toUpperCase();
  }

  const directMatch = flat.match(/\bDesign Confidence\s*:\s*(HIGH|MEDIUM|LOW)\b/i);
  return directMatch ? directMatch[1].toUpperCase() : null;
}

function extractSourceConfidence(payload, text) {
  const explicit = payload.source_confidence || payload.sourceConfidence;

  if (typeof explicit === "string") {
    const level = explicit.trim().toUpperCase();
    if (/^(CONTROLLED|HIGH|MEDIUM|LOW|UNKNOWN|CONFLICTED|STALE)$/.test(level)) {
      return level;
    }
  }

  if (explicit && typeof explicit === "object") {
    const level = String(explicit.level || "").trim().toUpperCase();
    if (/^(CONTROLLED|HIGH|MEDIUM|LOW|UNKNOWN|CONFLICTED|STALE)$/.test(level)) {
      return level;
    }
  }

  const match = String(text || "").match(/\bSource Confidence\s*:\s*(CONTROLLED|HIGH|MEDIUM|LOW|UNKNOWN|CONFLICTED|STALE)\b/i);
  return match ? match[1].toUpperCase() : null;
}

function extractClassification(payload, text) {
  const explicit = String(payload.classification || "").trim().toLowerCase();
  if (explicit) {
    return explicit;
  }

  const match = String(text || "").match(/\bclassification\s*:\s*([a-z_]+)\b/i);
  return match ? match[1].trim().toLowerCase() : null;
}

function extractConfirmed(payload, text) {
  const explicit = normalizeBoolean(payload.confirmed);
  if (explicit !== null) {
    return explicit;
  }

  const match = String(text || "").match(/\bconfirmed\s*:\s*(true|false|yes|no|complete|incomplete)\b/i);
  return match ? normalizeBoolean(match[1]) : null;
}

function extractQaApproval(payload, text) {
  for (const value of [
    payload.qa_approval,
    payload.qa_approved,
    payload.approved_by_qa,
    payload.spreadsheet_update_approved,
    payload.memory_promotion_approved,
  ]) {
    const explicit = normalizeBoolean(value);
    if (explicit !== null) {
      return explicit;
    }
  }

  const approvalText = flattenText({
    approval_status: payload.approval_status,
    approval_text: payload.approval_text,
    approved_by: payload.approved_by,
    qa_approval_text: payload.qa_approval_text,
    notes: payload.notes,
  });

  if (/\bAPPROVED BY QA\b/i.test(approvalText) || /\bQA Approval\s*:\s*(approved|yes|true)\b/i.test(text)) {
    return true;
  }

  if (/\bQA Approval\s*:\s*(rejected|no|false|missing|required)\b/i.test(text) || /\bAPPROVAL_REQUIRED\b/i.test(approvalText)) {
    return false;
  }

  return null;
}

function isReleaseDecisionLikePayload(payload, text) {
  const type = normalizeType(payload.type);
  if (NON_RELEASE_DECISION_TYPES.has(type) || /\bpolicy\b/.test(type)) {
    return false;
  }

  if (RELEASE_DECISION_OUTPUT_TYPES.has(type)) {
    return true;
  }

  const hint = flattenText({
    decision: payload.decision,
    release_decision: payload.release_decision,
    requested_output: payload.requested_output,
    analysis_mode: payload.analysis_mode,
    classification_hint: payload.classification_hint,
  });

  if (/\b(release readiness|release decision|go\/no-go|go no-go|go-no-go|production readiness|deployment safety|safe to release)\b/i.test(hint)) {
    return true;
  }

  return Boolean(extractReleaseDecision(payload, text));
}

function hasReleaseDecisionEvidence(payload, files) {
  if (normalizeBoolean(payload.release_evidence_backed) === true) {
    return true;
  }

  if (normalizeBoolean(payload.evidence_sufficient) === true) {
    return true;
  }

  const coverageText = flattenText({
    evidence: payload.evidence,
    evidence_refs: payload.evidence_refs,
    evidence_layers: payload.evidence_layers,
    evidence_coverage: payload.evidence_coverage,
    ui_evidence: payload.ui_evidence,
    api_evidence: payload.api_evidence,
    network_evidence: payload.network_evidence,
    db_evidence: payload.db_evidence,
    business_evidence: payload.business_evidence,
    blocker_evidence: payload.blocker_evidence,
    details: payload.details,
    derived_updates: payload.derived_updates,
  });

  const layerSignals = [
    /\b(UI|functional|Browser Use|manual confirmation|screenshot|DOM|Playwright|CDP)\b/i,
    /\b(API|network|endpoint|request|response|payload|contract)\b/i,
    /\b(DB|database|Oracle|persistence|persisted|status transition|saved|submitted|approved|generated|invoice|billing|rating|export)\b/i,
    /\b(MoM|BPMN|business rule|business invariant|module pack|app-specific standard|approval rule)\b/i,
    /\b(blocker|caveat|environment|automation|VPN|auth|role|session|test data)\b/i,
  ].filter((pattern) => pattern.test(coverageText)).length;

  return layerSignals >= 2 ||
    files.some((filePath) => /05-observability|02-brain\/distilled-output|01-runtime\/artifacts|06-testing/i.test(filePath));
}

function detectUnderEvidencedReleaseDecision(payload, text, files) {
  if (!isReleaseDecisionLikePayload(payload, text)) {
    return { blocked: false, signals: [] };
  }

  const signals = [];
  const decision = extractReleaseDecision(payload, text);
  const confidence = extractConfidence(payload, text);

  if (normalizeBoolean(payload.release_evidence_backed) === false) {
    signals.push("release evidence marked not backed");
  }

  if (normalizeBoolean(payload.evidence_sufficient) === false) {
    signals.push("release evidence marked insufficient");
  }

  if (normalizeBoolean(payload.provisional) === true) {
    signals.push("release decision marked provisional");
  }

  if (decision === "DECISION_NOT_POSSIBLE") {
    signals.push("decision not possible is not durable final release truth");
  }

  if (confidence === "LOW") {
    signals.push("LOW confidence release decision");
  }

  for (const pattern of UNDER_EVIDENCED_RELEASE_PATTERNS) {
    if (pattern.test(text)) {
      signals.push(`under-evidenced release marker: ${pattern.source}`);
    }
  }

  if (!hasReleaseDecisionEvidence(payload, files)) {
    signals.push("missing scoped evidence coverage for release decision");
  }

  if (
    (decision === "RELEASE_READY" || decision === "RELEASE_READY_WITH_CAVEAT") &&
    confidence !== "HIGH" &&
    confidence !== "MEDIUM"
  ) {
    signals.push("release-ready output without HIGH or MEDIUM confidence");
  }

  return {
    blocked: signals.length > 0,
    signals,
  };
}

function isEvidenceBackedOutcomePayload(payload, text) {
  const type = normalizeType(payload.type);
  if (EVIDENCE_BACKED_OUTCOME_TYPES.has(type)) {
    return true;
  }

  if (/\b(rca|root cause|bug classification|severity|release decision|go\/no-go|go no-go|production readiness|deployment safety|safe to release)\b/i.test(text)) {
    return true;
  }

  return Boolean(payload.decision || payload.release_decision);
}

function detectProvisionalLedgerBlock(payload, text) {
  const signals = [];
  const outcomeLike = isEvidenceBackedOutcomePayload(payload, text);

  if (normalizeBoolean(payload.provisional) === true) {
    signals.push("output marked provisional");
  }

  if (normalizeBoolean(payload.evidence_backed) === false) {
    signals.push("output marked not evidence-backed");
  }

  if (!outcomeLike) {
    return {
      blocked: signals.length > 0,
      signals,
    };
  }

  for (const pattern of PROVISIONAL_OUTPUT_PATTERNS) {
    if (pattern.test(text)) {
      signals.push(`provisional output marker: ${pattern.source}`);
    }
  }

  return {
    blocked: signals.length > 0,
    signals,
  };
}

function detectUnsafeDecisionScoreBlock(payload, text) {
  const signals = [];
  const score = extractDecisionScore(payload, text);
  const selfAuditResult = extractSelfAuditResult(payload, text);

  if (score === "INCOMPLETE") {
    signals.push("decision score incomplete");
  }

  if (typeof score === "number" && score < 75) {
    signals.push(`decision score below threshold: ${score}`);
  }

  if (selfAuditResult === "FAIL") {
    signals.push("self-audit result FAIL");
  }

  return {
    blocked: signals.length > 0,
    signals,
  };
}

function detectUnsafeDesignConfidenceLedgerBlock(payload, text) {
  const signals = [];
  const designConfidence = extractDesignConfidence(payload, text);
  const classification = extractClassification(payload, text);
  const confirmed = extractConfirmed(payload, text);
  const evidenceBacked = normalizeBoolean(payload.evidence_backed);

  if (!designConfidence && classification !== "needs_design_confirmation") {
    return {
      blocked: false,
      signals,
    };
  }

  if (designConfidence === "LOW") {
    signals.push("LOW design confidence cannot become durable ledger truth");
  }

  if (designConfidence && evidenceBacked !== true) {
    signals.push("design-confidence payload requires evidence_backed=true for durable ledger");
  }

  if (designConfidence && confirmed !== true) {
    signals.push("design-confidence payload requires confirmed=true for durable ledger");
  }

  if (classification === "needs_design_confirmation" && confirmed !== true) {
    signals.push("needs_design_confirmation cannot become durable ledger truth before confirmation");
  }

  return {
    blocked: signals.length > 0,
    signals,
  };
}

function detectUnsafeDiagnosisLedgerBlock(payload, text) {
  const signals = [];
  const type = normalizeType(payload.type);
  const classification = extractClassification(payload, text);
  const confirmed = extractConfirmed(payload, text);
  const evidenceBacked = normalizeBoolean(payload.evidence_backed);
  const diagnosisLike = type.includes("diagnosis") ||
    /\bDiagnosis Engine Report\b/i.test(text) ||
    DIAGNOSIS_PROVISIONAL_CLASSIFICATIONS.has(classification);

  if (!diagnosisLike) {
    return {
      blocked: false,
      signals,
    };
  }

  if (evidenceBacked !== true) {
    signals.push("diagnosis output requires evidence_backed=true for durable ledger");
  }

  if (confirmed !== true) {
    signals.push("diagnosis output requires confirmed=true for durable ledger");
  }

  if (classification === "possible_defect_candidate") {
    signals.push("possible_defect_candidate cannot become durable bug learning before confirmation");
  }

  if (
    classification &&
    DIAGNOSIS_PROVISIONAL_CLASSIFICATIONS.has(classification) &&
    confirmed !== true
  ) {
    signals.push(`${classification} remains provisional until confirmed`);
  }

  return {
    blocked: signals.length > 0,
    signals,
  };
}

function detectUnsafeConfirmationQuestionLedgerBlock(payload, text) {
  const signals = [];
  const type = normalizeType(payload.type);
  const confirmationLike = type.includes("confirmation_question") ||
    type.includes("stakeholder_confirmation") ||
    CONFIRMATION_QUESTION_PATTERNS.some((pattern) => pattern.test(text));

  if (!confirmationLike) {
    return {
      blocked: false,
      signals,
    };
  }

  const confirmed = extractConfirmed(payload, text);
  const evidenceBacked = normalizeBoolean(payload.evidence_backed);
  const stakeholderAnswersReceived = normalizeBoolean(
    payload.stakeholder_answers_received || payload.answers_received
  );
  const reusableRuleProduced = normalizeBoolean(
    payload.reusable_rule_produced || payload.reusable_confirmed_rule
  );

  if (
    stakeholderAnswersReceived === true &&
    confirmed === true &&
    evidenceBacked === true &&
    reusableRuleProduced === true
  ) {
    return {
      blocked: false,
      signals,
    };
  }

  signals.push("confirmation questions require stakeholder answers before durable ledger");

  if (stakeholderAnswersReceived !== true) {
    signals.push("stakeholder answers not received");
  }

  if (confirmed !== true) {
    signals.push("confirmation output requires confirmed=true for durable ledger");
  }

  if (evidenceBacked !== true) {
    signals.push("confirmation output requires evidence_backed=true for durable ledger");
  }

  if (reusableRuleProduced !== true) {
    signals.push("confirmation output requires a reusable confirmed rule or pattern");
  }

  return {
    blocked: signals.length > 0,
    signals,
  };
}

function detectUnsafeExternalSourceLedgerBlock(payload, text) {
  const signals = [];
  const type = normalizeType(payload.type);
  const sourceConfidence = extractSourceConfidence(payload, text);
  const confirmed = extractConfirmed(payload, text);
  const evidenceBacked = normalizeBoolean(payload.evidence_backed);
  const conflictResolved = normalizeBoolean(payload.conflict_resolved);
  const reusableRuleProduced = normalizeBoolean(
    payload.reusable_rule_produced || payload.reusable_confirmed_rule
  );
  const controlledConfirmation = normalizeBoolean(
    payload.controlled_confirmation || payload.stakeholder_confirmation
  );
  const externalSourceLike = type.includes("external_reference") ||
    type.includes("mom_extraction") ||
    type.includes("bpmn_extraction") ||
    type.includes("source_reconciliation") ||
    EXTERNAL_SOURCE_PATTERNS.some((pattern) => pattern.test(text));

  if (!externalSourceLike) {
    return {
      blocked: false,
      signals,
    };
  }

  const confidenceAllowsDurable = sourceConfidence === "HIGH" ||
    sourceConfidence === "CONTROLLED" ||
    controlledConfirmation === true;

  const durableAllowed = confidenceAllowsDurable &&
    confirmed === true &&
    evidenceBacked === true &&
    reusableRuleProduced === true &&
    conflictResolved !== false &&
    !/\b(candidate_business_rule|candidate business rule|candidate_flow|candidate flow|needs_business_confirmation|unresolved conflict|business_conflict_candidate)\b/i.test(text);

  if (durableAllowed) {
    return {
      blocked: false,
      signals,
    };
  }

  if (!sourceConfidence) {
    signals.push("source confidence missing");
  } else if (BLOCKING_SOURCE_CONFIDENCE.has(sourceConfidence)) {
    signals.push(`blocking source confidence: ${sourceConfidence}`);
  } else if (sourceConfidence === "MEDIUM" && controlledConfirmation !== true) {
    signals.push("MEDIUM source confidence requires controlled or stakeholder confirmation for durable ledger");
  }

  if (confirmed !== true) {
    signals.push("external source claim requires confirmed=true");
  }

  if (evidenceBacked !== true) {
    signals.push("external source claim requires evidence_backed=true");
  }

  if (reusableRuleProduced !== true) {
    signals.push("external source claim requires reusable confirmed rule or pattern");
  }

  if (conflictResolved === false || /\bunresolved conflict\b/i.test(text)) {
    signals.push("unresolved source conflict");
  }

  if (/\bcandidate_business_rule\b|\bcandidate business rule\b/i.test(text)) {
    signals.push("candidate business rule is not durable truth");
  }

  if (/\bcandidate_flow\b|\bcandidate flow\b/i.test(text)) {
    signals.push("candidate flow is not durable truth");
  }

  if (/\bneeds_business_confirmation\b/i.test(text)) {
    signals.push("needs_business_confirmation is unresolved");
  }

  if (/\bbusiness_conflict_candidate\b/i.test(text)) {
    signals.push("business_conflict_candidate is unresolved");
  }

  return {
    blocked: signals.length > 0,
    signals,
  };
}

function detectUnsafeIsqaLedgerBlock(payload, text) {
  const signals = [];
  const type = normalizeType(payload.type);
  const isqaLike = type.includes("isqa") ||
    ISQA_GOVERNANCE_PATTERNS.some((pattern) => pattern.test(text));

  if (!isqaLike) {
    return {
      blocked: false,
      signals,
    };
  }

  const reviewed = normalizeBoolean(payload.reviewed || payload.qa_reviewed);
  const qaApproval = extractQaApproval(payload, text);
  const confirmed = extractConfirmed(payload, text);
  const evidenceBacked = normalizeBoolean(payload.evidence_backed);
  const reusableRuleProduced = normalizeBoolean(
    payload.reusable_rule_produced || payload.reusable_confirmed_rule
  );

  if (
    reviewed === true &&
    qaApproval === true &&
    confirmed === true &&
    evidenceBacked === true &&
    reusableRuleProduced === true
  ) {
    return {
      blocked: false,
      signals,
    };
  }

  if (reviewed !== true) {
    signals.push("ISQA extraction requires QA review before durable ledger");
  }

  if (qaApproval !== true) {
    signals.push("ISQA governance rule requires QA approval before durable ledger");
  }

  if (confirmed !== true) {
    signals.push("ISQA governance rule requires confirmed=true");
  }

  if (evidenceBacked !== true) {
    signals.push("ISQA governance rule requires evidence_backed=true");
  }

  if (reusableRuleProduced !== true) {
    signals.push("ISQA governance rule requires reusable confirmed rule or pattern");
  }

  if (/\bPGN business behavior\b|\bproject-specific business truth\b/i.test(text)) {
    signals.push("ISQA must not become project-specific business truth");
  }

  return {
    blocked: signals.length > 0,
    signals,
  };
}

function detectUnsafeSpreadsheetUpdateLedgerBlock(payload, text) {
  const signals = [];
  const type = normalizeType(payload.type);
  const spreadsheetUpdateLike = type.includes("testcase_update") ||
    type.includes("spreadsheet_update") ||
    type.includes("spreadsheet_write") ||
    SPREADSHEET_UPDATE_PATTERNS.some((pattern) => pattern.test(text));

  if (!spreadsheetUpdateLike) {
    return {
      blocked: false,
      signals,
    };
  }

  const qaApproval = extractQaApproval(payload, text);
  const confirmed = extractConfirmed(payload, text);
  const evidenceBacked = normalizeBoolean(payload.evidence_backed);
  const conflictResolved = normalizeBoolean(payload.conflict_resolved);
  const reusableRuleProduced = normalizeBoolean(
    payload.reusable_rule_produced || payload.reusable_confirmed_rule || payload.operational_memory_allowed
  );
  const sourceConfidence = extractSourceConfidence(payload, text);
  const controlledConfirmation = normalizeBoolean(
    payload.controlled_confirmation || payload.stakeholder_confirmation || payload.qa_approval
  );
  const confidenceAllowsDurable = sourceConfidence === "HIGH" ||
    sourceConfidence === "CONTROLLED" ||
    controlledConfirmation === true ||
    qaApproval === true;

  const durableAllowed = qaApproval === true &&
    confirmed === true &&
    evidenceBacked === true &&
    reusableRuleProduced === true &&
    confidenceAllowsDurable &&
    conflictResolved !== false &&
    !/\b(needs_confirmation|blocked_due_conflict|testcase_update_candidate unresolved|APPROVAL_REQUIRED)\b/i.test(text);

  if (durableAllowed) {
    return {
      blocked: false,
      signals,
    };
  }

  if (qaApproval !== true) {
    signals.push("spreadsheet update requires QA approval before durable ledger");
  }

  if (confirmed !== true) {
    signals.push("spreadsheet update learning requires confirmed=true");
  }

  if (evidenceBacked !== true) {
    signals.push("spreadsheet update learning requires evidence_backed=true");
  }

  if (reusableRuleProduced !== true) {
    signals.push("spreadsheet update learning requires reusable rule or approved operational memory flag");
  }

  if (!confidenceAllowsDurable) {
    signals.push("spreadsheet update learning requires HIGH/CONTROLLED source confidence or controlled confirmation");
  }

  if (conflictResolved === false || /\b(needs_confirmation|blocked_due_conflict|unresolved conflict)\b/i.test(text)) {
    signals.push("spreadsheet update conflict is unresolved");
  }

  if (/\btestcase_update_candidate\b|\bTestcase Update Candidate\b/i.test(text)) {
    signals.push("testcase update candidate is staging-only until approved");
  }

  if (/\bSpreadsheet Write Plan\b|\bspreadsheet_update_plan\b|\bAPPROVAL_REQUIRED\b/i.test(text)) {
    signals.push("spreadsheet write plan without approval is staging-only");
  }

  return {
    blocked: signals.length > 0,
    signals,
  };
}

function buildDecisionQualityLogLines(payload) {
  const text = flattenText({
    summary: payload.summary,
    details: payload.details,
    derived_updates: payload.derived_updates,
    notes: payload.notes,
    decision: payload.decision,
    release_decision: payload.release_decision,
    confidence: payload.confidence,
    self_audit_result: payload.self_audit_result,
    decision_score: payload.decision_score,
  });

  const score = extractDecisionScore(payload, text);
  const selfAuditResult = extractSelfAuditResult(payload, text);
  const outcomeLike = isEvidenceBackedOutcomePayload(payload, text);
  const weakPatterns = unique(normalizeLines(
    payload.weak_decision_patterns ||
    payload.decision_quality_patterns ||
    payload.self_audit_warnings
  ));

  if (!outcomeLike && score === null && !selfAuditResult && weakPatterns.length === 0) {
    return [];
  }

  const decision = String(payload.decision || payload.release_decision || payload.conclusion || "").trim();
  const confidence = extractConfidence(payload, text);
  const lines = [
    `Type: ${normalizeType(payload.type || "decision_quality")}`,
  ];

  if (decision) {
    lines.push(`Decision: ${decision}`);
  }

  if (confidence) {
    lines.push(`Confidence: ${confidence}`);
  }

  if (selfAuditResult) {
    lines.push(`Self-Audit Result: ${selfAuditResult}`);
  }

  if (score !== null) {
    lines.push(`Decision Score: ${score}`);
  }

  if (payload.summary) {
    lines.push(`Summary: ${String(payload.summary).trim()}`);
  }

  if (weakPatterns.length > 0) {
    lines.push(`Weak Patterns: ${weakPatterns.join("; ")}`);
  }

  return lines;
}

function classifyTurn(payload, args) {
  // The classifier intentionally favors "trivial" unless reusable knowledge is visible.
  // Use --force-durable only when the caller deliberately wants a manual durable checkpoint.
  if (args.forceDurable && args.forceTrivial) {
    throw new Error("Use only one of --force-durable or --force-trivial.");
  }

  const durableSignals = [];
  const trivialSignals = [];
  const files = collectFileRefs(payload);
  const text = flattenText({
    type: payload.type,
    summary: payload.summary,
    details: payload.details,
    derived_updates: payload.derived_updates,
    notes: payload.notes,
    classification: payload.classification,
    classification_hint: payload.classification_hint,
    analysis_mode: payload.analysis_mode,
    requested_output: payload.requested_output,
    confidence: payload.confidence,
    source_confidence: payload.source_confidence,
    design_confidence: payload.design_confidence,
    qa_approval: payload.qa_approval,
    approval_status: payload.approval_status,
    reviewed: payload.reviewed,
    qa_reviewed: payload.qa_reviewed,
    conflict_resolved: payload.conflict_resolved,
    self_audit_result: payload.self_audit_result,
    decision_score: payload.decision_score,
    evidence: payload.evidence,
    evidence_sufficient: payload.evidence_sufficient,
    cross_layer_evidence: payload.cross_layer_evidence,
  });

  if (args.forceDurable || payload.durable_delta === true) {
    durableSignals.push("explicit durable flag");
  }

  if (args.forceTrivial || payload.durable_delta === false || payload.trivial === true) {
    trivialSignals.push("explicit trivial flag");
  }

  if (payload.type && DURABLE_TYPES.has(String(payload.type))) {
    durableSignals.push(`durable type: ${payload.type}`);
  }

  if (
    payload.type &&
    /\b(upgrade|automation|orchestration|policy|memory|knowledge|validation|testdata|rca|bug|flow)\b/i.test(
      String(payload.type).replace(/[-_]+/g, " ")
    )
  ) {
    durableSignals.push(`durable type pattern: ${payload.type}`);
  }

  for (const filePath of files) {
    if (DURABLE_FILE_PATTERNS.some((pattern) => pattern.test(filePath))) {
      durableSignals.push(`durable file: ${filePath}`);
    }
  }

  for (const pattern of DURABLE_KEYWORDS) {
    if (pattern.test(text)) {
      durableSignals.push(`keyword: ${pattern.source}`);
    }
  }

  for (const pattern of TRIVIAL_KEYWORDS) {
    if (pattern.test(text)) {
      trivialSignals.push(`keyword: ${pattern.source}`);
    }
  }

  const rcaGuard = detectIncompleteRcaLedgerBlock(payload, text, files);
  if (rcaGuard.blocked) {
    return {
      classification: "trivial",
      durableSignals,
      trivialSignals: [
        ...trivialSignals,
        ...rcaGuard.signals.map((signal) => `ledger blocked: ${signal}`),
      ],
      ledgerBlockedSignals: rcaGuard.signals,
    };
  }

  const releaseGuard = detectUnderEvidencedReleaseDecision(payload, text, files);
  if (releaseGuard.blocked) {
    return {
      classification: "trivial",
      durableSignals,
      trivialSignals: [
        ...trivialSignals,
        ...releaseGuard.signals.map((signal) => `ledger blocked: ${signal}`),
      ],
      ledgerBlockedSignals: releaseGuard.signals,
    };
  }

  const provisionalGuard = detectProvisionalLedgerBlock(payload, text);
  if (provisionalGuard.blocked) {
    return {
      classification: "trivial",
      durableSignals,
      trivialSignals: [
        ...trivialSignals,
        ...provisionalGuard.signals.map((signal) => `ledger blocked: ${signal}`),
      ],
      ledgerBlockedSignals: provisionalGuard.signals,
    };
  }

  const unsafeScoreGuard = detectUnsafeDecisionScoreBlock(payload, text);
  if (unsafeScoreGuard.blocked) {
    return {
      classification: "trivial",
      durableSignals,
      trivialSignals: [
        ...trivialSignals,
        ...unsafeScoreGuard.signals.map((signal) => `ledger blocked: ${signal}`),
      ],
      ledgerBlockedSignals: unsafeScoreGuard.signals,
    };
  }

  const confirmationQuestionGuard = detectUnsafeConfirmationQuestionLedgerBlock(payload, text);
  if (confirmationQuestionGuard.blocked) {
    return {
      classification: "trivial",
      durableSignals,
      trivialSignals: [
        ...trivialSignals,
        ...confirmationQuestionGuard.signals.map((signal) => `ledger blocked: ${signal}`),
      ],
      ledgerBlockedSignals: confirmationQuestionGuard.signals,
    };
  }

  const externalSourceGuard = detectUnsafeExternalSourceLedgerBlock(payload, text);
  if (externalSourceGuard.blocked) {
    return {
      classification: "trivial",
      durableSignals,
      trivialSignals: [
        ...trivialSignals,
        ...externalSourceGuard.signals.map((signal) => `ledger blocked: ${signal}`),
      ],
      ledgerBlockedSignals: externalSourceGuard.signals,
    };
  }

  const isqaGuard = detectUnsafeIsqaLedgerBlock(payload, text);
  if (isqaGuard.blocked) {
    return {
      classification: "trivial",
      durableSignals,
      trivialSignals: [
        ...trivialSignals,
        ...isqaGuard.signals.map((signal) => `ledger blocked: ${signal}`),
      ],
      ledgerBlockedSignals: isqaGuard.signals,
    };
  }

  const spreadsheetUpdateGuard = detectUnsafeSpreadsheetUpdateLedgerBlock(payload, text);
  if (spreadsheetUpdateGuard.blocked) {
    return {
      classification: "trivial",
      durableSignals,
      trivialSignals: [
        ...trivialSignals,
        ...spreadsheetUpdateGuard.signals.map((signal) => `ledger blocked: ${signal}`),
      ],
      ledgerBlockedSignals: spreadsheetUpdateGuard.signals,
    };
  }

  const designConfidenceGuard = detectUnsafeDesignConfidenceLedgerBlock(payload, text);
  if (designConfidenceGuard.blocked) {
    return {
      classification: "trivial",
      durableSignals,
      trivialSignals: [
        ...trivialSignals,
        ...designConfidenceGuard.signals.map((signal) => `ledger blocked: ${signal}`),
      ],
      ledgerBlockedSignals: designConfidenceGuard.signals,
    };
  }

  const diagnosisGuard = detectUnsafeDiagnosisLedgerBlock(payload, text);
  if (diagnosisGuard.blocked) {
    return {
      classification: "trivial",
      durableSignals,
      trivialSignals: [
        ...trivialSignals,
        ...diagnosisGuard.signals.map((signal) => `ledger blocked: ${signal}`),
      ],
      ledgerBlockedSignals: diagnosisGuard.signals,
    };
  }

  if (durableSignals.length > 0 && !args.forceTrivial) {
    return {
      classification: "durable",
      durableSignals,
      trivialSignals,
      ledgerBlockedSignals: [],
    };
  }

  return {
    classification: "trivial",
    durableSignals,
    trivialSignals,
    ledgerBlockedSignals: [],
  };
}

function buildHotUpdates(payload) {
  const hotUpdates = payload.hot_updates || {};
  const updates = [];
  const hasUpdateKey = (key) => updates.some((update) => update.key === key);

  for (const [key, targetPath] of Object.entries(HOT_TARGETS)) {
    const lines = normalizeLines(hotUpdates[key]);
    if (lines.length > 0) {
      updates.push({ key, targetPath, lines });
    }
  }

  if (updates.length === 0 && payload.summary) {
    updates.push({
      key: "session_summary",
      targetPath: HOT_TARGETS.session_summary,
      lines: [payload.summary],
    });
  }

  if (payload.next_actions && !hasUpdateKey("next_actions")) {
    updates.push({
      key: "next_actions",
      targetPath: HOT_TARGETS.next_actions,
      lines: normalizeLines(payload.next_actions),
    });
  }

  if (payload.operational_state_changed && payload.summary && !hasUpdateKey("last_run_summary")) {
    updates.push({
      key: "last_run_summary",
      targetPath: HOT_TARGETS.last_run_summary,
      lines: normalizeLines(payload.last_run_summary || payload.summary),
    });
  }

  if (payload.blocker_state_changed && !hasUpdateKey("blockers")) {
    updates.push({
      key: "blockers",
      targetPath: HOT_TARGETS.blockers,
      lines: normalizeLines(payload.blockers || payload.summary),
    });
  }

  if (!hasUpdateKey("decision_quality_log")) {
    const decisionQualityLines = buildDecisionQualityLogLines(payload);
    if (decisionQualityLines.length > 0) {
      updates.push({
        key: "decision_quality_log",
        targetPath: HOT_TARGETS.decision_quality_log,
        lines: decisionQualityLines,
      });
    }
  }

  return updates.filter((update) => update.lines.length > 0);
}

function appendHotUpdate(update, timestamp) {
  ensureDir(path.dirname(update.targetPath));
  const existing = readTextIfExists(update.targetPath).trimEnd();
  const section = [
    "",
    "",
    `## Auto Memory - ${timestamp}`,
    "",
    ...update.lines.map((line) => `- ${line}`),
    "",
  ].join("\n");

  writeText(update.targetPath, `${existing}${section}`);
}

function buildLedgerPayload(payload, classification) {
  if (classification !== "durable") {
    return null;
  }

  const flatText = flattenText(payload);
  const designConfidence = extractDesignConfidence(payload, flatText);
  const sourceConfidence = extractSourceConfidence(payload, flatText);
  const confirmed = extractConfirmed(payload, flatText);
  const qaApproval = extractQaApproval(payload, flatText);
  const evidenceBacked = normalizeBoolean(payload.evidence_backed);
  const ledgerPayload = {
    timestamp: payload.timestamp || new Date().toISOString(),
    module: payload.module || "workspace-memory",
    agent: payload.agent || "engineer",
    type: payload.type || "auto-memory",
    summary: payload.summary || "Auto memory durable delta",
    decision_score: extractDecisionScore(payload, flatText),
    self_audit_result: extractSelfAuditResult(payload, flatText),
    derived_updates: Array.isArray(payload.derived_updates)
      ? payload.derived_updates
      : normalizeLines(payload.derived_updates),
    evidence_refs: unique([
      ...normalizeLines(payload.evidence_refs),
      ...normalizeLines(payload.changed_files),
    ]),
  };

  if (designConfidence) {
    ledgerPayload.design_confidence = designConfidence;
  }

  if (sourceConfidence) {
    ledgerPayload.source_confidence = sourceConfidence;
  }

  if (confirmed !== null) {
    ledgerPayload.confirmed = confirmed;
  }

  if (qaApproval !== null) {
    ledgerPayload.qa_approval = qaApproval;
  }

  if (evidenceBacked !== null) {
    ledgerPayload.evidence_backed = evidenceBacked;
  }

  return ledgerPayload;
}

function appendLedger(ledgerPayload) {
  const tempDir = ensureDir(path.join(paths.runtimeRootDir, "temp"));
  const tempPayloadPath = path.join(
    tempDir,
    `auto-memory-ledger-${process.pid}-${Date.now()}.json`
  );

  writeJson(tempPayloadPath, ledgerPayload);

  try {
    const result = spawnSync(process.execPath, [
      path.join(paths.runtimeToolsDir, "append-learning-block.js"),
      "--input",
      tempPayloadPath,
    ], {
      cwd: paths.rootDir,
      encoding: "utf8",
    });

    if (result.status !== 0) {
      throw new Error((result.stderr || result.stdout || "Ledger append failed").trim());
    }

    return JSON.parse(result.stdout);
  } finally {
    if (fs.existsSync(tempPayloadPath)) {
      try {
        fs.unlinkSync(tempPayloadPath);
      } catch (error) {
        // Best-effort cleanup only; the ledger append itself remains append-only.
      }
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const payload = readPayload(args.input);
  const timestamp = payload.timestamp || new Date().toISOString();
  const classification = classifyTurn(payload, args);
  const hotUpdates = buildHotUpdates(payload);
  const appliedHotUpdates = [];
  let ledgerResult = null;

  if (!args.dryRun) {
    for (const update of hotUpdates) {
      appendHotUpdate(update, timestamp);
      appliedHotUpdates.push({
        key: update.key,
        path: path.relative(paths.rootDir, update.targetPath).replace(/\\/g, "/"),
        lines: update.lines.length,
      });
    }

    const ledgerPayload = buildLedgerPayload(payload, classification.classification);
    if (ledgerPayload) {
      ledgerResult = appendLedger(ledgerPayload);
    }
  }

  process.stdout.write(`${JSON.stringify({
    dry_run: Boolean(args.dryRun),
    classification: classification.classification,
    durable_signals: classification.durableSignals,
    trivial_signals: classification.trivialSignals,
    ledger_blocked_signals: classification.ledgerBlockedSignals || [],
    planned_hot_updates: hotUpdates.map((update) => ({
      key: update.key,
      path: path.relative(paths.rootDir, update.targetPath).replace(/\\/g, "/"),
      lines: update.lines.length,
    })),
    applied_hot_updates: appliedHotUpdates,
    ledger_appended: Boolean(ledgerResult),
    ledger: ledgerResult,
  }, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
}
