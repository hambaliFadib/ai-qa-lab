const { chromium } = require('playwright');

const CDP_URL = 'ws://127.0.0.1:9222/devtools/browser/11d9f82d-0141-4ffe-979d-176ad6965b8d';
const OUTPUT_DIR = 'D:\\AI-QA-LAB\\PGN-BILLING-AI-QA\\01-playground\\artifacts\\adhoc-notes';

async function createTransactionMapping() {
  console.log('=== Transaction Mapping - SUCCESS Create Flow ===\n');

  const apiCalls = [];
  let browser = null;

  try {
    // 1. Connect to browser
    console.log('1. Connecting to browser via CDP...');
    browser = await chromium.connectOverCDP(CDP_URL);
    const contexts = browser.contexts();
    let page = await contexts[0].newPage();
    page.setDefaultTimeout(60000);

    // 2. Network capture for POST
    page.on('request', request => {
      const url = request.url();
      if (url.includes('pgn.co.id') && !url.includes('/static/')) {
        apiCalls.push({
          method: request.method(),
          url: url,
          postData: request.postData(),
          timestamp: new Date().toISOString()
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
            const ct = response.headers()['content-type'] || '';
            if (ct.includes('json')) {
              const body = await response.json().catch(() => null);
              if (body) existing.response = JSON.stringify(body);
            }
          } catch (e) {}
        }
      }
    });

    // 3. Navigate to Transaction Mapping
    console.log('\n2. Navigating to /system-setup/billing-item...');
    await page.goto('https://dev-energy.pgn.co.id/system-setup/billing-item', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(3000);
    console.log(`   URL: ${page.url()}`);

    // 4. Click Create button
    console.log('\n3. Clicking Create Transaction Mapping...');
    
    const createSelectors = [
      'button:has-text("Create Transaction Mapping")',
      'button:has-text("Create")',
      '[aria-label*="Create"]'
    ];

    let createClicked = false;
    for (const selector of createSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          await btn.click();
          createClicked = true;
          console.log('   ✅ Create clicked');
          await page.waitForTimeout(3000);
          break;
        }
      } catch (e) {}
    }

    if (!createClicked) {
      throw new Error('Create button not found or not visible');
    }

    // 5. Fill form - Category (dropdown)
    console.log('\n4. Filling mandatory fields...');
    
    const timestamp = Date.now();
    const testName = `QATest_${timestamp}`;
    
    // Category
    console.log('   - Category...');
    try {
      // Click the search field to open dropdown
      await page.click('input[name="billingItemCategory"], [name="billingItemCategory"]', { timeout: 2000 });
      await page.waitForTimeout(1000);
      // Type to filter and select first option
      await page.keyboard.type('a');
      await page.waitForTimeout(500);
      // Press Enter or click first option
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      console.log('     ✅ Category filled');
    } catch (e) {
      console.log(`     ⚠️ Category: ${e.message}`);
    }

    // Type
    console.log('   - Type...');
    try {
      await page.click('input[name="type"], [name="type"]', { timeout: 2000 });
      await page.waitForTimeout(1000);
      await page.keyboard.type('a');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      console.log('     ✅ Type filled');
    } catch (e) {
      console.log(`     ⚠️ Type: ${e.message}`);
    }

    // Name
    console.log('   - Name...');
    try {
      await page.fill('input[name="name"], input[placeholder*="Name"], input[placeholder*="name"]', testName);
      await page.waitForTimeout(500);
      console.log(`     ✅ Name: ${testName}`);
    } catch (e) {
      console.log(`     ⚠️ Name: ${e.message}`);
    }

    // Bill Type
    console.log('   - Bill Type...');
    try {
      await page.click('input[name="billType"], [name="billType"]', { timeout: 2000 });
      await page.waitForTimeout(1000);
      await page.keyboard.type('a');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      console.log('     ✅ Bill Type filled');
    } catch (e) {
      console.log(`     ⚠️ Bill Type: ${e.message}`);
    }

    // Criteria
    console.log('   - Criteria...');
    try {
      await page.click('input[name="criteria"], [name="criteria"]', { timeout: 2000 });
      await page.waitForTimeout(1000);
      await page.keyboard.type('a');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      console.log('     ✅ Criteria filled');
    } catch (e) {
      console.log(`     ⚠️ Criteria: ${e.message}`);
    }

    // Start Date
    console.log('   - Start Date...');
    try {
      await page.fill('input[name="startDate"], input[placeholder*="Start"]', '2026-04-04');
      await page.waitForTimeout(500);
      console.log('     ✅ Start Date: 2026-04-04');
    } catch (e) {
      console.log(`     ⚠️ Start Date: ${e.message}`);
    }

    // Description
    console.log('   - Description...');
    try {
      await page.fill('textarea[name="description"], textarea', 'QATest auto');
      await page.waitForTimeout(500);
      console.log('     ✅ Description: QATest auto');
    } catch (e) {
      console.log(`     ⚠️ Description: ${e.message}`);
    }

    // Approval Hierarchy
    console.log('   - Approval Hierarchy...');
    try {
      await page.click('input[name*="approval"], input[name*="Approval"], [name="rc_select_4"]', { timeout: 2000 });
      await page.waitForTimeout(1000);
      await page.keyboard.type('a');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      console.log('     ✅ Approval Hierarchy filled');
    } catch (e) {
      console.log(`     ⚠️ Approval Hierarchy: ${e.message}`);
    }

    // 6. Click Save as Draft
    console.log('\n5. Clicking Save as Draft...');
    
    const saveSelectors = [
      'button:has-text("Save as Draft")',
      'button:has-text("Save")',
      'button:has-text("Simpan")'
    ];

    let saveClicked = false;
    for (const selector of saveSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          await btn.click();
          saveClicked = true;
          console.log('   ✅ Save clicked');
          await page.waitForTimeout(5000);
          break;
        }
      } catch (e) {}
    }

    if (!saveClicked) {
      throw new Error('Save button not found');
    }

    // 7. Check results
    console.log('\n6. Checking results...');
    
    const results = await page.evaluate(() => {
      const errors = Array.from(document.querySelectorAll('[class*="error"], .Mui-error'))
        .map(e => e.textContent?.trim())
        .filter(t => t && t.length < 500);
      
      const toasts = Array.from(document.querySelectorAll('[class*="toast"], .MuiSnackbarContent, [role="status"], [role="alert"]'))
        .map(t => t.textContent?.trim())
        .filter(t => t && t.length < 500);
      
      const tableRows = document.querySelectorAll('table tbody tr').length;
      const modalClosed = !document.querySelector('[role="dialog"]:not([aria-hidden="true"])');
      const currentUrl = window.location.href;
      
      return { errors, toasts, tableRows, modalClosed, currentUrl };
    });

    console.log(`   Modal closed: ${results.modalClosed}`);
    console.log(`   Table rows: ${results.tableRows}`);
    console.log('   Errors:', results.errors.slice(0, 3));
    console.log('   Toasts:', results.toasts.slice(0, 3));

    // 8. Check for POST API call
    console.log('\n7. Checking API calls...');
    
    const postCalls = apiCalls.filter(c => c.method === 'POST' && c.url.includes('billingitem'));
    const getCalls = apiCalls.filter(c => c.method === 'GET' && c.url.includes('billingitem'));
    
    console.log(`   POST calls: ${postCalls.length}`);
    console.log(`   GET calls: ${getCalls.length}`);
    
    if (postCalls.length > 0) {
      console.log('\n   POST API Details:');
      postCalls.forEach(call => {
        console.log(`   - ${call.status || 'pending'}: ${call.url}`);
        if (call.response) {
          try {
            const resp = JSON.parse(call.response);
            console.log(`     Response: ${JSON.stringify(resp).substring(0, 200)}`);
          } catch (e) {
            console.log(`     Response: ${call.response?.substring(0, 200)}`);
          }
        }
      });
    }

    // Determine success
    const success = results.modalClosed && (results.toasts.length > 0 || !results.errors.some(e => e.includes('Please input')));

    // Save results
    const findings = {
      timestamp: new Date().toISOString(),
      testName,
      createClicked,
      saveClicked,
      success,
      results,
      apiCalls: {
        post: postCalls,
        get: getCalls,
        all: apiCalls
      }
    };

    const fs = require('fs');
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(`${OUTPUT_DIR}\\tx-create-success.json`, JSON.stringify(findings, null, 2));

    console.log(`\n${'='.repeat(50)}`);
    console.log(`CREATE ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Test Name: ${testName}`);
    console.log(`Modal Closed: ${results.modalClosed}`);
    console.log(`Errors: ${results.errors.length}`);
    console.log(`Toasts: ${results.toasts.length}`);
    console.log('='.repeat(50));

    return findings;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    const fs = require('fs');
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(`${OUTPUT_DIR}\\tx-create-error.json`, JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    return { error: error.message };
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
  }
}

createTransactionMapping()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
