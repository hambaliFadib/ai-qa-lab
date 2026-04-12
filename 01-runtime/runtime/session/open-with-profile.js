const { chromium } = require("playwright");
const { paths } = require("../../tools/workspace-paths");

const PROFILE_PATH = paths.chromeProfileDir;
const APP_URL = process.env.APP_URL || "https://dev-energy.pgn.co.id";

let browser;
let context;
let page;

async function main() {
  console.log("Launching Chrome with profile...");

  context = await chromium.launchPersistentContext(PROFILE_PATH, {
    headless: false,
    args: [
      "--remote-debugging-port=9222",
      "--ignore-certificate-errors",
    ],
  });

  browser = context.browser();
  console.log("Browser launched.");
  console.log("CDP available at http://127.0.0.1:9222");

  if (context.pages().length > 0) {
    page = context.pages()[0];
  } else {
    page = await context.newPage();
  }

  console.log(`Navigating to ${APP_URL}...`);
  await page.goto(APP_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);

  const state = await page.evaluate(() => ({
    url: window.location.href,
    hasToken: !!localStorage.getItem("token"),
  }));

  console.log("\n=== CURRENT STATE ===");
  console.log(`URL: ${state.url}`);
  console.log(`Has Token: ${state.hasToken}`);
  console.log("======================\n");

  if (!state.hasToken) {
    console.log("Silakan LOGIN MANUAL di browser yang terbuka.");
    console.log("Setelah login, bilang 'sudah login' dan saya akan menangkap session.");
  } else {
    console.log("Session sudah ada! Menangkap state...");
  }

  console.log("\nBrowser akan tetap terbuka.");
  console.log("Tekan Ctrl+C untuk keluar.\n");

  process.stdin.resume();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});