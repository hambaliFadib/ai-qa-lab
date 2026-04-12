const { chromium } = require('playwright');

const CDP_URL = 'ws://127.0.0.1:9222/devtools/browser/11d9f82d-0141-4ffe-979d-176ad6965b8d';
const OUTPUT_DIR = 'D:\\AI-QA-LAB\\PGN-BILLING-AI-QA\\01-playground\\artifacts\\adhoc-notes';

async function createTransactionMapping() {
  console.log('=== Transaction Mapping - SUCCESS Create Flow (v2) ===\n');

  const apiCalls = [];
  let browser = null;

  try {
    // 1. Connect to browser
    console.log('1. Connecting to browser via CDP...');
    browser = await chromium.connectOverCDP(CDP_URL);
    const contexts = browser.contexts();
    let page = await contexts[0].newPage();
    page.setDefaultTimeout(60000);

    // 2. Network capture
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
            const body = await response.json().catch(() => null);
            if (body) existing.response = JSON.stringify(body);
          } catch (e) {}
        }
      }
    });

    // 3. Navigate
    console.log('\n2. Navigating to Transaction Mapping...');
    await page.goto('https://dev-energy.pgn.co.id/system-setup/billing-item', {
      waitUntil: 'domcontentloaded'
    });
    await page.waitForTimeout(3000);

    // 4. Click Create
    console.log('\n3. Clicking Create...');
    await page.click('button:has-text("Create Transaction Mapping")', { timeout: 5000 });
    await page.waitForTimeout(3000);

    // 5. Analyze form structure first
    console.log('\n4. Analyzing form structure...');
    
    const formStructure = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      const container = modal || document.body;
      
      const fields = [];
      const allInputs = container.querySelectorAll('input, select, textarea');
      allInputs.forEach(input => {
        const parent = input.closest('[class*="field"], [class*="Field"], [class*="control"], [class*="Control"], div');
        const siblings = parent ? Array.from(parent.querySelectorAll('label, span')) : [];
        
        fields.push({
          tag: input.tagName,
          type: input.type,
          name: input.name || input.id,
          placeholder: input.placeholder,
          value: input.value,
          readonly: input.readOnly,
          disabled: input.disabled,
          required: input.required,
          className: parent?.className || '',
          labels: siblings.map(s => s.textContent?.trim()).filter(t => t)
        });
      });
      
      return fields.filter(f => !f.className.includes('hidden') && f.className !== '');
    });
    
    console.log('   Form fields found:');
    formStructure.forEach((f, i) => {
      console.log(`   ${i+1}. [${f.tag}] ${f.name || f.type} | placeholder: "${f.placeholder}" | readonly: ${f.readOnly} | labels: ${f.labels.join(', ')}`);
    });

    // 6. Fill fields based on structure
    console.log('\n5. Filling fields...');
    const timestamp = Date.now();
    const testName = `QATest_${timestamp}`;
    
    // Fill using more flexible selectors
    for (const field of formStructure) {
      if (field.readOnly || field.disabled) continue;
      
      const selector = `input[name="${field.name}"], input#${field.name}, ${field.tag.toLowerCase()}[placeholder*="${field.placeholder}"]`;
      
      try {
        if (field.type === 'checkbox') {
          // Checkbox - leave unchecked
          console.log(`   - ${field.name}: skipped (checkbox)`);
        } else if (field.placeholder?.toLowerCase().includes('name')) {
          await page.fill(selector, testName);
          console.log(`   ✅ Name: ${testName}`);
        } else if (field.placeholder?.toLowerCase().includes('description')) {
          await page.fill(selector, 'QATest auto');
          console.log(`   ✅ Description filled`);
        } else if (field.placeholder?.toLowerCase().includes('start')) {
          // Date field - need to click and type
          await page.click(selector);
          await page.waitForTimeout(500);
          await page.keyboard.type('04/04/2026');
          await page.keyboard.press('Enter');
          console.log(`   ✅ Start Date: 04/04/2026`);
        } else if (field.labels.some(l => l.toLowerCase().includes('category'))) {
          // Category dropdown
          await page.click(selector);
          await page.waitForTimeout(1000);
          await page.keyboard.press('ArrowDown');
          await page.waitForTimeout(300);
          await page.keyboard.press('Enter');
          console.log(`   ✅ Category selected`);
        } else if (field.labels.some(l => l.toLowerCase().includes('type')) && !field.labels.some(l => l.toLowerCase().includes('bill'))) {
          // Type dropdown
          await page.click(selector);
          await page.waitForTimeout(1000);
          await page.keyboard.press('ArrowDown');
          await page.waitForTimeout(300);
          await page.keyboard.press('Enter');
          console.log(`   ✅ Type selected`);
        } else if (field.labels.some(l => l.toLowerCase().includes('bill'))) {
          // Bill Type dropdown
          await page.click(selector);
          await page.waitForTimeout(1000);
          await page.keyboard.press('ArrowDown');
          await page.waitForTimeout(300);
          await page.keyboard.press('Enter');
          console.log(`   ✅ Bill Type selected`);
        } else if (field.labels.some(l => l.toLowerCase().includes('criteria'))) {
          // Criteria dropdown
          await page.click(selector);
          await page.waitForTimeout(1000);
          await page.keyboard.press('ArrowDown');
          await page.waitForTimeout(300);
          await page.keyboard.press('Enter');
          console.log(`   ✅ Criteria selected`);
        } else if (field.labels.some(l => l.toLowerCase().includes('approval'))) {
          // Approval Hierarchy
          await page.click(selector);
          await page.waitForTimeout(1000);
          await page.keyboard.press('ArrowDown');
          await page.waitForTimeout(300);
          await page.keyboard.press('Enter');
          console.log(`   ✅ Approval selected`);
        } else if (field.type === 'text' && !field.readOnly) {
          // Other text fields
          await page.fill(selector, 'test');
          console.log(`   - ${field.name}: filled with "test"`);
        }
      } catch (e) {
        console.log(`   ⚠️ ${field.name || field.type}: ${e.message.substring(0, 50)}`);
      }
    }

    // 7. Click Save
    console.log('\n6. Clicking Save...');
    await page.click('button:has-text("Save")', { timeout: 3000 });
    await page.waitForTimeout(5000);

    // 8. Check results
    console.log('\n7. Checking results...');
    
    const results = await page.evaluate(() => {
      const errors = Array.from(document.querySelectorAll('[class*="error"], .Mui-error'))
        .map(e => e.textContent?.trim()).filter(t => t && t.length < 500);
      const toasts = Array.from(document.querySelectorAll('[class*="toast"], [role="status"], [role="alert"]'))
        .map(t => t.textContent?.trim()).filter(t => t && t.length < 500);
      const modalClosed = !document.querySelector('[role="dialog"]:not([aria-hidden="true"])');
      const tableRows = document.querySelectorAll('table tbody tr').length;
      
      return { errors, toasts, modalClosed, tableRows };
    });

    console.log(`   Modal closed: ${results.modalClosed}`);
    console.log(`   Table rows: ${results.tableRows}`);
    console.log(`   Errors: ${results.errors.length}`);
    console.log(`   Toasts: ${results.toasts.length}`);
    
    if (results.errors.length > 0) {
      console.log('   Error samples:', results.errors.slice(0, 3));
    }
    if (results.toasts.length > 0) {
      console.log('   Toast samples:', results.toasts.slice(0, 3));
    }

    // 9. Check POST API
    const postCalls = apiCalls.filter(c => c.method === 'POST');
    console.log(`\n8. POST calls: ${postCalls.length}`);
    postCalls.forEach(call => {
      console.log(`   - ${call.status || 'pending'}: ${call.url}`);
    });

    const success = results.modalClosed && postCalls.length > 0;

    // Save
    const fs = require('fs');
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(`${OUTPUT_DIR}\\tx-create-v2.json`, JSON.stringify({
      timestamp: new Date().toISOString(),
      testName,
      success,
      results,
      formStructure,
      apiCalls: { post: postCalls, all: apiCalls }
    }, null, 2));

    console.log(`\n${'='.repeat(50)}`);
    console.log(`CREATE ${success ? '✅ SUCCESS' : '❌ PARTIAL'}`);
    console.log(`Test Name: ${testName}`);
    console.log('='.repeat(50));

    return { success, results, apiCalls };

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    const fs = require('fs');
    fs.writeFileSync(`${OUTPUT_DIR}\\tx-create-v2-error.json`, JSON.stringify({
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
