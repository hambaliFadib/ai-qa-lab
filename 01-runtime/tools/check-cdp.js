const {
  artifactPath,
  ensureCdpReady,
  getDefaultCdpVersionUrl,
  writeJson,
} = require("./cdp-utils");

async function main() {
  const cdpStatus = await ensureCdpReady({
    versionUrl: getDefaultCdpVersionUrl(),
    appUrl: process.env.APP_URL,
    cdpPort: process.env.CDP_PORT,
    profileDir: process.env.PROFILE_DIR,
  });

  const version = cdpStatus.version || {};
  const summary = {
    status: cdpStatus.recovered ? "recovered" : cdpStatus.status,
    checked_at: new Date().toISOString(),
    source: cdpStatus.source,
    version_url: cdpStatus.versionUrl,
    browser: version.Browser || "unknown",
    protocol_version: version["Protocol-Version"] || "unknown",
    user_agent: version["User-Agent"] || "unknown",
    web_socket_debugger_url: version.webSocketDebuggerUrl || process.env.CDP_URL || null,
    recovery_attempted: cdpStatus.recovery_attempted,
    recovered: cdpStatus.recovered,
    initial_error: cdpStatus.initial_error,
    recovery: cdpStatus.recovery,
  };

  const artifactFile = artifactPath("check-cdp-result.json");
  summary.artifact_path = artifactFile;

  try {
    writeJson(artifactFile, summary);
  } catch (error) {
    summary.artifact_write_warning = error.message || String(error);
  }

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});