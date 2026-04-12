const {
  artifactPath,
  connectBrowser,
  getOrCreatePage,
  writeJson,
  writeText,
} = require("../../tools/cdp-utils");

const APP_URL = process.env.APP_URL || "https://dev-energy.pgn.co.id";
function formatMarkdown(result) {
  return [
    "# Access Stabilization Report",
    "",
    `- Checked at: ${result.checked_at}`,
    `- CDP URL: ${result.cdp_url}`,
    `- Current URL: ${result.current_url}`,
    `- Access status: ${result.access_status}`,
    "",
    "## UI Markers",
    "",
    `- Sidebar: ${result.markers.has_sidebar}`,
    `- Topbar: ${result.markers.has_topbar}`,
    `- Profile marker: ${result.markers.has_profile}`,
    `- Redirected to login: ${result.markers.redirected_to_login}`,
    "",
    "## Notes",
    "",
    result.markers.text_sample || "No visible text sample captured.",
    "",
  ].join("\n");
}

async function restoreSession(context, authState) {
  if (!authState || !authState.cookies || !authState.origins) {
    console.log("No auth state found, skipping session restore");
    return;
  }

  // Restore cookies - need to update domain to match current URL
  const updatedCookies = authState.cookies.map(cookie => ({
    ...cookie,
    domain: "dev-energy.pgn.co.id", // Ensure domain matches
  }));
  await context.addCookies(updatedCookies);
  console.log(`Restored ${updatedCookies.length} cookies`);

  // Create a new page for setting localStorage
  const page = await context.newPage();
  
  // Navigate to origin first
  await page.goto("https://dev-energy.pgn.co.id", { waitUntil: "domcontentloaded" });
  
  // Restore localStorage for each origin
  for (const origin of authState.origins) {
    if (origin.localStorage) {
      for (const item of origin.localStorage) {
        await page.evaluate(
          ([key, value]) => localStorage.setItem(key, value),
          [item.name, item.value]
        );
      }
      console.log(`Restored ${origin.localStorage.length} localStorage items for ${origin.origin}`);
    }
  }
  
  // Close the temp page
  await page.close();
}

async function main() {
  const { browser, cdpUrl } = await connectBrowser();
  
  console.log("=== Browser Debug Info ===");
  console.log(`Total contexts: ${browser.contexts().length}`);
  
  // Check ALL pages in ALL contexts
  for (let i = 0; i < browser.contexts().length; i++) {
    const ctx = browser.contexts()[i];
    console.log(`Context ${i}: ${ctx.pages().length} pages`);
    for (let j = 0; j < ctx.pages().length; j++) {
      const p = ctx.pages()[j];
      console.log(`  Page ${j}: ${p.url()}`);
    }
  }
  
  // Get the first page from first context
  let page;
  const context = browser.contexts()[0];
  
  if (context && context.pages().length > 0) {
    page = context.pages()[0];
    console.log(`Using existing page: ${page.url()}`);
  } else {
    page = await context.newPage();
  }

  // Check current browser state without navigation
  const browserState = await page.evaluate(() => {
    const cookies = document.cookie;
    const token = localStorage.getItem("token");
    const sideBar = localStorage.getItem("side_bar");
    return {
      url: window.location.href,
      title: document.title,
      hasCookies: cookies.length > 0,
      cookieSample: cookies.slice(0, 200),
      hasToken: !!token,
      hasSideBar: !!sideBar,
      localStorageKeys: Object.keys(localStorage),
    };
  });
  
  console.log("Browser state:", JSON.stringify(browserState, null, 2));
  console.log("==========================");
  
  // Skip goto - just check the current page state
  await page.waitForTimeout(1000);
  
  // Check if we're on login or have the app loaded
  const currentUrl = page.url();
  console.log(`Current URL after navigation: ${currentUrl}`);
  
  // If redirected to login, try to stay on the page and check localStorage
  if (currentUrl.includes("/login")) {
    const hasToken = await page.evaluate(() => {
      const token = localStorage.getItem("token");
      return !!token;
    });
    console.log(`LocalStorage token exists: ${hasToken}`);
  }

  const markers = await page.evaluate(() => {
    const url = window.location.href;
    return {
      url,
      title: document.title,
      redirected_to_login: url.includes("/login"),
      has_sidebar: Boolean(document.querySelector("aside, [class*='sidebar'], nav")),
      has_topbar: Boolean(document.querySelector("header, [class*='topbar'], [class*='header']")),
      has_profile: Boolean(
        document.querySelector(
          "[class*='avatar'], [class*='profile'], img[alt*='profile'], img[alt*='avatar']"
        )
      ),
      text_sample: document.body.innerText.slice(0, 500),
    };
  });

  let accessStatus = "ACCESS_PARTIAL";
  if (markers.redirected_to_login) {
    accessStatus = "ACCESS_BLOCKED";
  } else if (markers.has_sidebar && markers.has_topbar) {
    accessStatus = "ACCESS_STABLE";
  }

  const result = {
    checked_at: new Date().toISOString(),
    cdp_url: cdpUrl,
    current_url: page.url(),
    access_status: accessStatus,
    markers,
  };

  try {
    writeJson(artifactPath("access-stabilization-home.json"), result);
    writeText(artifactPath("access-stabilization-home.md"), formatMarkdown(result));
  } catch (writeError) {
    result.artifact_write_warning = writeError.message;
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(0);
}

main().catch((error) => {
  const result = {
    checked_at: new Date().toISOString(),
    access_status: "ACCESS_BLOCKED",
    error: error.message,
  };
  try {
    writeJson(artifactPath("access-stabilization-error.json"), result);
  } catch (writeError) {
    process.stderr.write(`Artifact write failed: ${writeError.message}\n`);
  }
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
