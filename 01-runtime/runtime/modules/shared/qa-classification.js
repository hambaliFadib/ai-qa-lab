const CLASSIFICATIONS = Object.freeze({
  BUG: "bug",
  EXPECTED_VALIDATION: "expected_validation",
  SCRIPT_FALSE_POSITIVE: "script_false_positive",
  BLOCKED_BY_BUSINESS_RULE: "blocked_by_business_rule",
  NEEDS_MANUAL_REVIEW: "needs_manual_review",
});

const STATUS = Object.freeze({
  PASSED: "passed",
  FAILED: "failed",
  BLOCKED: "blocked",
  SKIPPED: "skipped",
});

function toMessage(error) {
  if (!error) {
    return "";
  }
  return error.stack || error.message || String(error);
}

function containsAny(value, needles) {
  const lower = String(value || "").toLowerCase();
  return needles.some((needle) => lower.includes(needle));
}

function looksLikeAccessOrEnvironmentIssue(error) {
  return containsAny(toMessage(error), [
    "econnrefused",
    "econnreset",
    "eacces",
    "enotfound",
    "etimedout",
    "net::err",
    "fetch failed",
    "socket hang up",
    "vpn",
    "dns",
    "connection to host",
    "could not be established",
  ]);
}

function looksLikeAutomationIssue(error) {
  return containsAny(toMessage(error), [
    "locator",
    "selector",
    "strict mode violation",
    "waiting for selector",
    "element is not visible",
    "element is not attached",
    "target closed",
    "timeout",
  ]);
}

function classifyError(error, context = {}) {
  if (context.businessRuleBlocked) {
    return {
      classification: CLASSIFICATIONS.BLOCKED_BY_BUSINESS_RULE,
      reason: context.reason || "The app blocked the action through an expected business rule.",
    };
  }

  if (looksLikeAccessOrEnvironmentIssue(error)) {
    return {
      classification: CLASSIFICATIONS.NEEDS_MANUAL_REVIEW,
      reason: "Access or environment is not stable enough to classify as product defect.",
    };
  }

  if (looksLikeAutomationIssue(error)) {
    return {
      classification: CLASSIFICATIONS.SCRIPT_FALSE_POSITIVE,
      reason: "Automation failed before product behavior was proven.",
    };
  }

  return {
    classification: CLASSIFICATIONS.NEEDS_MANUAL_REVIEW,
    reason: "Failure needs manual review before it can be classified as a product bug.",
  };
}

function classifyOutcome(input = {}) {
  if (input.expectedValidation) {
    return input.passed
      ? {
          classification: CLASSIFICATIONS.EXPECTED_VALIDATION,
          reason: input.reason || "The application showed the expected validation guardrail.",
        }
      : {
          classification: CLASSIFICATIONS.BUG,
          reason: input.reason || "Expected validation did not appear or did not match.",
        };
  }

  if (input.businessRuleBlocked) {
    return {
      classification: CLASSIFICATIONS.BLOCKED_BY_BUSINESS_RULE,
      reason: input.reason || "The scenario is blocked by a known business rule or data state.",
    };
  }

  if (input.scriptIssue) {
    return {
      classification: CLASSIFICATIONS.SCRIPT_FALSE_POSITIVE,
      reason: input.reason || "The observed failure is in the script or selector strategy.",
    };
  }

  if (input.error) {
    return classifyError(input.error, input);
  }

  if (input.productBugEvidence) {
    return {
      classification: CLASSIFICATIONS.BUG,
      reason: input.reason || "Evidence contradicts expected product behavior.",
    };
  }

  if (input.passed === false) {
    return {
      classification: CLASSIFICATIONS.NEEDS_MANUAL_REVIEW,
      reason: input.reason || "The case failed but product defect evidence is incomplete.",
    };
  }

  return {
    classification: null,
    reason: input.reason || "No defect classification required for a passing case.",
  };
}

function buildCaseResult(input = {}) {
  const status = input.status || (input.passed ? STATUS.PASSED : STATUS.FAILED);
  const classification = input.classification
    ? { classification: input.classification, reason: input.classificationReason || "" }
    : classifyOutcome({
        ...input,
        passed: status === STATUS.PASSED,
      });

  return {
    id: input.id,
    title: input.title,
    phase: input.phase,
    status,
    classification: classification.classification,
    classification_reason: classification.reason,
    expected: input.expected || null,
    actual: input.actual || null,
    evidence: input.evidence || {},
    network: input.network || null,
    error: input.error
      ? {
          message: input.error.message || String(input.error),
          stack: input.includeStack ? toMessage(input.error) : undefined,
        }
      : null,
  };
}

module.exports = {
  CLASSIFICATIONS,
  STATUS,
  classifyError,
  classifyOutcome,
  buildCaseResult,
  looksLikeAccessOrEnvironmentIssue,
  looksLikeAutomationIssue,
};
