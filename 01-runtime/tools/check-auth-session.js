const {
  artifactPath,
  connectBrowser,
  getOrCreatePage,
  writeJson,
} = require("./cdp-utils");
const { APP_URL, inspectAuthSurface } = require("./auth-session-utils");

async function main() {
  const { cdpUrl, cdpStatus, browser } = await connectBrowser();
  const page = await getOrCreatePage(browser, "pgn.co.id");
  const surface = await inspectAuthSurface(page, {
    appUrl: APP_URL,
    navigate: true,
  });

  const summary = {
    checked_at: new Date().toISOString(),
    app_url: APP_URL,
    cdp_url: cdpUrl,
    cdp_status: cdpStatus.recovered ? "recovered" : cdpStatus.status,
    auth_state: surface.access_status,
    current_url: surface.current_url,
    title: surface.title,
    ready_for_testing: surface.access_status === "authenticated",
    needs_manual_login: ["manual_login_required", "otp_required"].includes(surface.access_status),
    needs_otp: surface.access_status === "otp_required",
    next_action:
      surface.access_status === "authenticated"
        ? "Session is ready. Continue testing or capture session if you want to refresh saved auth state."
        : surface.access_status === "otp_required"
          ? "Ask the user to complete OTP in the attached browser, then run capture-session to persist the fresh session."
          : "Ask the user to log in manually in the attached browser, then run capture-session to persist the fresh session.",
    markers: {
      has_login_form: surface.has_login_form,
      has_otp_input: surface.has_otp_input,
      has_sidebar: surface.has_sidebar,
      has_topbar: surface.has_topbar,
      has_profile: surface.has_profile,
      has_token: surface.has_token,
      has_user_info: surface.has_user_info,
      token_summary: surface.token_summary,
      local_storage_keys: surface.local_storage_keys,
      session_storage_keys: surface.session_storage_keys,
      text_sample: surface.text_sample,
    },
  };

  const artifactFile = artifactPath("auth-session-status.json");
  summary.artifact_path = artifactFile;

  try {
    writeJson(artifactFile, summary);
  } catch (error) {
    summary.artifact_write_warning = error.message || String(error);
  }

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  setImmediate(() => process.exit(0));
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});