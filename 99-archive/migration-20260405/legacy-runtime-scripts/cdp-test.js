const { chromium } = require('playwright');

const CDP_URL = 'ws://127.0.0.1:9222/devtools/browser/11d9f82d-0141-4ffe-979d-176ad6965b8d';
const OUTPUT_DIR = 'D:\\AI-QA-LAB\\PGN-BILLING-AI-QA\\01-playground\\artifacts\\adhoc-notes';

async function createTransactionMapping() {
  console.log('=== Transaction Mapping - Create Test ===\n');

  const apiCalls = [];
  let browser = null;

  try {
    browser = await chromium.connectOverCDP(CDP_URL);
    const contexts = browser.contexts();
    let page = await contexts[0].newPage();
    page.setDefaultTimeout(60000);

    // Network capture
    page.on('request', request => {
      const url = request.url();
      if (url.includes('pgn.co.id') && !url.includes('/static/')) {
        apiCalls.push({
          method: request.method(),
          url: url,
          postData: request.postData()
        });
      }
    });

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('pgn.co.id') && !url.includes('/static/')) {
        const existing = apiCalls.find(c => c.url === url);
        if (existing) {
          existing.status = response.status();
          try {
            existing.response = JSON.stringify(await response.json());
          } catch (e) {}
        }
      }
    });

    // Navigate
    console.log('1. Navigate...');
    await page.goto('https://dev-energy.pgn.co.id/system-setup/billing-item', {
      waitUntil: 'domcontentloaded'
    });
    await page.waitForTimeout(3000);

    // Click Create
    console.log('2. Create...');
    await page.click('button:has-text("Create Transaction Mapping")');
    await page.waitForTimeout(2000);

    // Fill Name
    console.log('3. Name...');
    await page.locator('input[placeholder="Type here.."]').fill(`QATest_${Date.now()}`);

    // Fill Description
    console.log('4. Description...');
    await page.locator('textarea').fill('QATest auto');

    // Fill Date - use keyboard type (not fill)
    console.log('5. Date...');
    await page.locator('#startDate').click();
    await page.keyboard.type('04/04/2026');

    // Click Save
    console.log('6. Save...');
    await page.locator('button:has-text("Save")').click();
    await page.waitForTimeout(3000);

    // Results
    console.log('7. Results...');
    const results = await page.evaluate(() => {
      const errors = [...new Set(Array.from(document.querySelectorAll('[class*="error"], .Mui-error'))
        .map(e => e.textContent?.trim()).filter(t => t))];
      const toasts = [...new Set(Array.from(document.querySelectorAll('[class*="toast"], [role="status"]'))
        .map(t => t.textContent?.trim()).filter(t => t))];
      return { errors, toasts };
    });

    console.log(`   Errors: ${results.errors.length}`);
    console.log(`   Toasts: ${results.toasts.length}`);
    console.log('   ', results.errors.slice(0, 5));
    console.log('   ', results.toasts.slice(0, 5));

    // POST check
    const postCalls = apiCalls.filter(c => c.method === 'POST' && c.url.includes('billingitem'));
    console.log(`   POST billingitem: ${postCalls.length}`);

    const fs = require('fs');
    fs.writeFileSync(`${OUTPUT_DIR}\\tx-create-test.json`, JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      apiCalls
    }, null, 2));

    console.log('\n✅ Done!');
    return { results, apiCalls };

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    return { error: error.message };
  } finally {
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
  }
}

createTransactionMapping()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
