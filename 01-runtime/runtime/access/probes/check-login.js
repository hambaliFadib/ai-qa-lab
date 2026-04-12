const { connectBrowser, getOrCreatePage } = require("../../../tools/cdp-utils");

(async () => {
  try {
    const { browser } = await connectBrowser();
    const page = await getOrCreatePage(browser, "check-login");
    
    console.log("Navigating to PGN app...");
    await page.goto("https://dev-energy.pgn.co.id", {
      waitUntil: "domcontentloaded",
      timeout: 15000
    });
    
    await page.waitForTimeout(3000);
    
    const url = page.url();
    const title = await page.title();
    
    // Check for login indicators
    const loginSelectors = [
      'input[type="password"]',
      'input[name="username"]',
      'input[name="email"]',
      'input[placeholder*="user" i]',
      'input[placeholder*="email" i]',
      'button:has-text("Masuk")',
      'button:has-text("Login")'
    ];
    
    let hasLoginForm = false;
    for (const selector of loginSelectors) {
      try {
        const isVisible = await page.locator(selector).first().isVisible({ timeout: 2000 });
        if (isVisible) {
          hasLoginForm = true;
          console.log(`Login indicator found: ${selector}`);
          break;
        }
      } catch {}
    }
    
    console.log("=== LOGIN STATUS CHECK ===");
    console.log("Current URL:", url);
    console.log("Page Title:", title);
    console.log("At Login Page:", hasLoginForm);
    console.log("==========================");
    
    await browser.close();
    
    if (hasLoginForm) {
      console.log("\n>>> Browser is at LOGIN PAGE. User needs to login manually. <<<");
      process.exit(1);
    } else {
      console.log("\n>>> Browser is LOGGED IN (or at dashboard). <<<");
      process.exit(0);
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
})();