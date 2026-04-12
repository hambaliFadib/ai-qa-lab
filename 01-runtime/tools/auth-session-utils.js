const { URL } = require("url");
const { paths, readJsonIfExists, writeJson } = require("./workspace-paths");

const APP_URL = process.env.APP_URL || "https://dev-energy.pgn.co.id";
const AUTH_ORIGIN = new URL(APP_URL).origin;
const AUTH_HOST = new URL(APP_URL).hostname;

function safeJsonParse(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function maskIdentity(value) {
  const text = String(value || "").trim();
  if (!text) {
    return null;
  }

  if (text.length <= 2) {
    return `${text[0]}*`;
  }

  return `${text.slice(0, 1)}${"*".repeat(Math.min(text.length - 2, 6))}${text.slice(-1)}`;
}

function parseTokenSummary(rawValue) {
  const parsed = safeJsonParse(rawValue);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  return {
    username: maskIdentity(parsed.username),
    user_level: parsed.userLevel || null,
    user_type: parsed.userType || null,
    expires_at: parsed.dateExpired || null,
    token_type: parsed.type || null,
  };
}

function listToNamedEntries(record) {
  return Object.entries(record || {}).map(([name, value]) => ({ name, value }));
}

function pickVisibleText(value, maxLength = 280) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3)}...`;
}

async function navigateToAppIfNeeded(page, options = {}) {
  const appUrl = options.appUrl || APP_URL;
  const currentUrl = page.url() || "";
  const shouldNavigate =
    !currentUrl ||
    currentUrl === "about:blank" ||
    currentUrl === "data:," ||
    currentUrl.startsWith("chrome://") ||
    !currentUrl.includes(AUTH_HOST);

  if (shouldNavigate) {
    await page.goto(appUrl, {
      waitUntil: options.waitUntil || "domcontentloaded",
      timeout: options.timeoutMs || 60000,
    });
  }

  await page.waitForTimeout(options.settleMs || 1500);
  return shouldNavigate;
}

async function inspectAuthSurface(page, options = {}) {
  if (options.navigate !== false) {
    await navigateToAppIfNeeded(page, options);
  } else {
    await page.waitForTimeout(options.settleMs || 800);
  }

  const surface = await page.evaluate(() => {
    const isVisible = (element) => {
      if (!(element instanceof Element)) {
        return false;
      }

      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };

    const hasVisibleSelector = (selector) => {
      const elements = Array.from(document.querySelectorAll(selector));
      return elements.some(isVisible);
    };

    const bodyText = document.body ? document.body.innerText || "" : "";
    const compactText = bodyText.replace(/\s+/g, " ").trim();
    const localStorageRecord = {};
    const sessionStorageRecord = {};

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      localStorageRecord[key] = localStorage.getItem(key);
    }

    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      sessionStorageRecord[key] = sessionStorage.getItem(key);
    }

    const loginSelectors = [
      "input[type='password']",
      "input[name='username']",
      "input[name='email']",
      "input[placeholder*='user' i]",
      "input[placeholder*='email' i]",
      "button[type='submit']",
      ".login-form",
      "form"
    ];

    const otpSelectors = [
      "input[name*='otp' i]",
      "input[id*='otp' i]",
      "input[placeholder*='otp' i]",
      "input[placeholder*='verification' i]",
      "input[placeholder*='verifikasi' i]",
      "input[inputmode='numeric'][maxlength='6']",
      "input[inputmode='numeric'][maxlength='4']"
    ];

    const hasLoginForm = loginSelectors.some(hasVisibleSelector);
    const hasOtpInput = otpSelectors.some(hasVisibleSelector);
    const hasSidebar = hasVisibleSelector("aside, [class*='sidebar'], nav");
    const hasTopbar = hasVisibleSelector("header, [class*='topbar'], [class*='header']");
    const hasProfile = hasVisibleSelector("[class*='avatar'], [class*='profile'], img[alt*='profile'], img[alt*='avatar']");
    const hasToken = Boolean(localStorageRecord.token || sessionStorageRecord.token);
    const hasUserInfo = Boolean(localStorageRecord.userInfo || sessionStorageRecord.userInfo);
    const loginText = /login|masuk|sign in|username|password/i.test(compactText);
    const otpText = /\botp\b|one time password|verification code|kode verifikasi|kode otp/i.test(compactText);
    const url = window.location.href;

    let accessStatus = "unknown";
    if (hasOtpInput || otpText) {
      accessStatus = "otp_required";
    } else if (url.includes("/login") || (hasLoginForm && !hasSidebar && !hasTopbar) || loginText) {
      accessStatus = "manual_login_required";
    } else if (hasToken || hasUserInfo || (hasSidebar && hasTopbar)) {
      accessStatus = "authenticated";
    }

    return {
      access_status: accessStatus,
      current_url: url,
      title: document.title,
      has_login_form: hasLoginForm,
      has_otp_input: hasOtpInput,
      has_sidebar: hasSidebar,
      has_topbar: hasTopbar,
      has_profile: hasProfile,
      has_token: hasToken,
      has_user_info: hasUserInfo,
      local_storage_keys: Object.keys(localStorageRecord),
      session_storage_keys: Object.keys(sessionStorageRecord),
      token_raw: localStorageRecord.token || sessionStorageRecord.token || null,
      text_sample: compactText.slice(0, 800),
      local_storage_record: localStorageRecord,
      session_storage_record: sessionStorageRecord,
    };
  });

  const tokenSummary = parseTokenSummary(surface.token_raw);
  delete surface.token_raw;

  return {
    ...surface,
    text_sample: pickVisibleText(surface.text_sample),
    token_summary: tokenSummary,
  };
}

async function captureAuthState(page, options = {}) {
  const appUrl = options.appUrl || APP_URL;
  const authPath = options.authStatePath || paths.authStateFile;
  const context = page.context();
  const surface = await inspectAuthSurface(page, {
    appUrl,
    navigate: options.navigate,
    settleMs: options.settleMs,
  });

  if (surface.access_status !== "authenticated") {
    return {
      captured: false,
      auth_state: surface.access_status,
      current_url: surface.current_url,
      title: surface.title,
      token_summary: surface.token_summary,
      saved_to: authPath,
      next_action:
        surface.access_status === "otp_required"
          ? "Complete OTP in the attached browser, then rerun capture-session."
          : "Complete manual login in the attached browser, then rerun capture-session.",
    };
  }

  const cookies = await context.cookies(appUrl);
  const authState = {
    meta: {
      captured_at: new Date().toISOString(),
      app_url: appUrl,
      current_url: surface.current_url,
      title: surface.title,
      auth_state: surface.access_status,
      token_summary: surface.token_summary,
    },
    cookies,
    origins: [
      {
        origin: AUTH_ORIGIN,
        localStorage: listToNamedEntries(surface.local_storage_record),
        sessionStorage: listToNamedEntries(surface.session_storage_record),
      },
    ],
  };

  writeJson(authPath, authState);

  return {
    captured: true,
    auth_state: surface.access_status,
    current_url: surface.current_url,
    title: surface.title,
    token_summary: surface.token_summary,
    cookie_count: cookies.length,
    local_storage_keys: surface.local_storage_keys,
    session_storage_keys: surface.session_storage_keys,
    saved_to: authPath,
  };
}

async function restoreAuthState(page, authState, options = {}) {
  if (!authState || !Array.isArray(authState.cookies) || !Array.isArray(authState.origins)) {
    return {
      restored: false,
      reason: "missing_auth_state",
      saved_to: options.authStatePath || paths.authStateFile,
    };
  }

  const appUrl = options.appUrl || APP_URL;
  const context = page.context();

  await context.clearCookies();
  await page.goto(appUrl, {
    waitUntil: options.waitUntil || "domcontentloaded",
    timeout: options.timeoutMs || 60000,
  });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  if (authState.cookies.length > 0) {
    await context.addCookies(authState.cookies);
  }

  for (const origin of authState.origins) {
    if (origin.origin !== AUTH_ORIGIN) {
      continue;
    }

    const localEntries = Array.isArray(origin.localStorage) ? origin.localStorage : [];
    const sessionEntries = Array.isArray(origin.sessionStorage) ? origin.sessionStorage : [];

    await page.evaluate(({ localEntries: localList, sessionEntries: sessionList }) => {
      for (const item of localList) {
        localStorage.setItem(item.name, item.value);
      }
      for (const item of sessionList) {
        sessionStorage.setItem(item.name, item.value);
      }
    }, { localEntries, sessionEntries });
  }

  await page.reload({
    waitUntil: options.waitUntil || "domcontentloaded",
    timeout: options.timeoutMs || 60000,
  });

  const surface = await inspectAuthSurface(page, {
    appUrl,
    navigate: false,
    settleMs: options.settleMs,
  });

  const restored = surface.access_status === "authenticated";

  return {
    restored,
    auth_state: surface.access_status,
    current_url: surface.current_url,
    title: surface.title,
    token_summary: surface.token_summary,
    reason: restored ? null : "authentication_not_restored",
    next_action: restored
      ? "Session restored successfully."
      : surface.access_status === "otp_required"
        ? "Complete OTP in the attached browser, then rerun restore-session or capture-session."
        : "Manual login is still required in the attached browser before testing can continue.",
  };
}

function readSavedAuthState(authPath = paths.authStateFile) {
  return readJsonIfExists(authPath, null);
}

module.exports = {
  APP_URL,
  AUTH_ORIGIN,
  AUTH_HOST,
  parseTokenSummary,
  inspectAuthSurface,
  captureAuthState,
  restoreAuthState,
  readSavedAuthState,
};
