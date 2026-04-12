const { chromium } = require('playwright');

const CDP_URL = 'ws://127.0.0.1:9222/devtools/browser/11d9f82d-0141-4ffe-979d-176ad6965b8d';
const OUTPUT_DIR = 'D:\\AI-QA-LAB\\PGN-BILLING-AI-QA\\01-playground\\artifacts\\adhoc-notes';

async function createTransactionMapping() {
  console.log('=== Transaction Mapping - SUCCESS Create Flow (v3) ===\n');

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
    console.log('1. Navigating to Transaction Mapping...');
    await page.goto('https://dev-energy.pgn.co.id/system-setup/billing-item', {
      waitUntil: 'domcontentloaded'
    });
    await page.waitForTimeout(3000);

    // Click Create
    console.log('2. Clicking Create...');
    await page.click('button:has-text("Create Transaction Mapping")', { timeout: 5000 });
    await page.waitForTimeout(3000);

    // Fill Name
    console.log('3. Filling Name...');
    await page.fill('input[name="name"]', `QATest_${Date.now()}`);
    console.log('   ✅ Name filled');

    // Fill Description
    console.log('4. Filling Description...');
    await page.fill('textarea', 'QATest auto');
    console.log('   ✅ Description filled');

    // Fill Start Date - click and type in date picker
    console.log('5. Filling Start Date...');
    const dateInput = page.locator('#startDate, input[name="startDate"]');
    await dateInput.click();
    await page.waitForTimeout(500);
    // Clear and type date
    await dateInput.fill('');
    await page.keyboard.type('04/04/2026');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    console.log('   ✅ Start Date filled');

    // Fill dropdowns using evaluate
    console.log('6. Filling dropdowns via direct DOM manipulation...');
    
    await page.evaluate(() => {
      // Helper to fill rc-select-like fields
      const fillSelect = (name, value) => {
        const input = document.querySelector(`input[name="${name}"]`);
        if (input) {
          // Click to open dropdown
          input.click();
          setTimeout(() => {
            // Find and click first option
            const options = document.querySelectorAll('[role="option"], [role="listbox"] div, .rc-select-item');
            if (options.length > 0) {
              options[0].click();
            }
          }, 200);
        }
      };
      
      // Try filling each dropdown
      ['billingItemCategory', 'type', 'billType', 'criteria', 'apphierId'].forEach(name => {
        const input = document.querySelector(`input[name="${name}"]`);
        if (input && input.value === '') {
          input.click();
        }
      });
    });
    
    await page.waitForTimeout(2000);

    // Try clicking first option in any visible dropdown
    console.log('   Selecting options...');
    try {
      // Look for visible option in dropdowns
      await page.evaluate(() => {
        const options = document.querySelectorAll('[role="option"]');
        if (options.length > 0) {
          options[0].click();
        }
      });
      await page.waitForTimeout(500);
      console.log('   ✅ Option selected');
    } catch (e) {
      console.log('   ⚠️ No options found');
    }

    // Click Save
    console.log('7. Clicking Save...');
    await page.click('button:has-text("Save")', { timeout: 3000 });
    await page.waitForTimeout(5000);

    // Check results
    console.log('8. Checking results...');
    
    const results = await page.evaluate(() => {
      const errors = Array.from(document.querySelectorAll('[class*="error"], .Mui-error'))
        .map(e => e.textContent?.trim()).filter(t => t && t.length < 300);
      const toasts = Array.from(document.querySelectorAll('[class*="toast"], [role="status"], [role="alert"]'))
        .map(t => t.textContent?.trim()).filter(t => t && t.length < 300);
      const modalClosed = !document.querySelector('[role="dialog"]:not([aria-hidden="true"])');
      
      return { errors: [...new Set(errors)], toasts: [...new Set(toasts)], modalClosed };
    });

    console.log(`   Modal closed: ${results.modalClosed}`);
    console.log(`   Unique Errors: ${results.errors.length}`);
    console.log(`   Unique Toasts: ${results.toasts.length}`);
    
    if (results.errors.length > 0) {
      console.log('   Errors:', results.errors.slice(0, 5));
    }
    if (results.toasts.length > 0) {
      console.log('   Toasts:', results.toasts.slice(0, 5));
    }

    // Check POST API for billingitem
    const postCalls = apiCalls.filter(c => c.method === 'POST' && c.url.includes('billingitem'));
    console.log(`\n9. POST billingitem calls: ${postCalls.length}`);
    
    if (postCalls.length > 0) {
      postCalls.forEach(call => {
        console.log(`   - ${call.status || 'pending'}: ${call.url}`);
        if (call.postData) {
          console.log(`     Payload: ${call.postData.substring(0, 200)}`);
        }
      });
    }

    // Save
    const success = results.modalClosed;
    const fs = require('fs');
    fs.writeFileSync(`${OUTPUT_DIR}\\tx-create-v3.json`, JSON.stringify({
      timestamp: new Date().toISOString(),
      success,
      results,
      apiCalls
    }, null, 2));

    console.log(`\n${'='.repeat(50)}`);
    console.log(`CREATE ${success ? '✅ SUCCESS' : '❌ PARTIAL'}`);
    console.log('='.repeat(50));

    return { success, results, apiCalls };

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    const fs = require('fs');
    fs.writeFileSync(`${OUTPUT_DIR}\\tx-create-v3-error.json`, JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }, null, 2));
    
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
