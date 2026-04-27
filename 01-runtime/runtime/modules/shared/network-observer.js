function matchesUrl(url, patterns = []) {
  if (!patterns.length) {
    return true;
  }

  return patterns.some((pattern) => String(url || "").includes(pattern));
}

function trimUrl(url) {
  const value = String(url || "");
  if (value.length <= 500) {
    return value;
  }
  return `${value.slice(0, 497)}...`;
}

function createNetworkObserver(page, options = {}) {
  const patterns = options.urlContains || [];
  const records = [];
  const failures = [];
  const startedAt = new Date().toISOString();

  const responseHandler = (response) => {
    const url = response.url();
    if (!matchesUrl(url, patterns)) {
      return;
    }

    records.push({
      timestamp: new Date().toISOString(),
      type: "response",
      method: response.request().method(),
      status: response.status(),
      url: trimUrl(url),
    });
  };

  const failureHandler = (request) => {
    const url = request.url();
    if (!matchesUrl(url, patterns)) {
      return;
    }

    const failure = request.failure();
    failures.push({
      timestamp: new Date().toISOString(),
      type: "requestfailed",
      method: request.method(),
      url: trimUrl(url),
      error_text: failure?.errorText || "request failed",
    });
  };

  page.on("response", responseHandler);
  page.on("requestfailed", failureHandler);

  return {
    stop() {
      page.off("response", responseHandler);
      page.off("requestfailed", failureHandler);
    },
    summary() {
      const statusCounts = {};
      for (const record of records) {
        statusCounts[record.status] = (statusCounts[record.status] || 0) + 1;
      }

      return {
        name: options.name || "network-observer",
        started_at: startedAt,
        stopped_at: new Date().toISOString(),
        patterns,
        response_count: records.length,
        failure_count: failures.length,
        status_counts: statusCounts,
        has_4xx: records.some((record) => record.status >= 400 && record.status < 500),
        has_5xx: records.some((record) => record.status >= 500),
        failures,
        sample: records.slice(-20),
      };
    },
  };
}

module.exports = {
  createNetworkObserver,
};
