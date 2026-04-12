const {
  connectBrowser,
  getOrCreatePage,
} = require("../../../../tools/cdp-utils");

(async () => {
  const { browser } = await connectBrowser();
  const page = await getOrCreatePage(browser, "api-check");

  await page.goto("https://dev-energy.pgn.co.id/system-setup/billing-item/create", {
    waitUntil: "domcontentloaded",
    timeout: 15000,
  });
  await page.waitForTimeout(2000);

  try {
    await page.locator("button:has-text('Create Transaction Mapping')").click();
  } catch {}

  await page.waitForTimeout(3000);

  const allInputs = await page.evaluate(() => {
    const inputs = [];
    document.querySelectorAll("input, select, textarea").forEach((el) => {
      if (el.id) {
        inputs.push({
          id: el.id,
          name: el.name,
          type: el.type || el.tagName,
          value: el.value ? el.value.substring(0, 30) : "",
        });
      }
    });
    return inputs;
  });

  console.log("=== Form Inputs ===");
  console.log(JSON.stringify(allInputs, null, 2));

  const apiCheck = await page.evaluate(async () => {
    try {
      const response = await fetch("https://dev-energy.pgn.co.id/rbi/v1/dbs/api/billingitem/approval-hierarchies-get");
      const data = await response.json();
      return { status: response.status, data };
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log("\n=== Approval Hierarchy API ===");
  console.log(JSON.stringify(apiCheck, null, 2));

  await browser.close();
  process.exit(0);
})();
