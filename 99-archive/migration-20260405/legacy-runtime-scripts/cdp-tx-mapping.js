const { chromium } = require('playwright');

const CDP_URL = 'ws://127.0.0.1:9222/devtools/browser/11d9f82d-0141-4ffe-979d-176ad6965b8d';
const OUTPUT_DIR = 'D:\\AI-QA-LAB\\PGN-BILLING-AI-QA\\01-playground\\artifacts\\adhoc-notes';

async function testTransactionMapping() {
  console.log('=== Transaction Mapping Create Flow Test ===\n');

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
          postData: request.postData()?.substring(0, 300)
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
              if (body) existing.response = JSON.stringify(body).substring(0, 500);
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
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log(`   URL: ${currentUrl}`);

    // 4. Check for session warning modal
    console.log('\n3. Checking for session warning...');
    const modalInfo = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (modal && modal.textContent?.includes('being used')) {
        return { present: true, text: modal.textContent?.trim() };
      }
      return { present: false };
    });

    if (modalInfo.present) {
      console.log('   ⚠️ Session warning found!');
      console.log('   Modal text:', modalInfo.text?.substring(0, 100));
      
      // Click OK
      try {
        await page.click('button:has-text("OK")');
        console.log('   ✅ OK clicked');
        await page.waitForTimeout(3000);
      } catch (e) {
        console.log('   ⚠️ Could not click OK:', e.message);
      }
    } else {
      console.log('   ✅ No session warning');
    }

    // 5. Analyze page structure
    console.log('\n4. Analyzing page structure...');
    const pageInfo = await page.evaluate(() => {
      const tableHeaders = Array.from(document.querySelectorAll('table th')).map(th => th.textContent?.trim());
      const tableRows = document.querySelectorAll('table tbody tr').length;
      const toolbarBtns = Array.from(document.querySelectorAll('[class*="toolbar"] button, [class*="Toolbar"] button, button[aria-label]')).map(b => ({
        text: b.textContent?.trim(),
        ariaLabel: b.getAttribute('aria-label')
      })).filter(b => b.text || b.ariaLabel);
      
      return { 
        tableHeaders, 
        tableRows,
        toolbarBtns
      };
    });

    console.log('   Table columns:', pageInfo.tableHeaders.join(', '));
    console.log('   Table rows:', pageInfo.tableRows);
    console.log('   Toolbar buttons:', pageInfo.toolbarBtns.map(b => b.text || b.ariaLabel).join(', '));

    // 6. Find and click Create button
    console.log('\n5. Looking for Create button...');
    
    // First try to find it
    const createBtnInfo = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const createButtons = [];
      
      buttons.forEach(btn => {
        const text = btn.textContent?.trim().toLowerCase();
        if (text.includes('create') || text.includes('tambah') || text.includes('add')) {
          createButtons.push({
            text: btn.textContent?.trim(),
            visible: btn.offsetParent !== null,
            disabled: btn.disabled
          });
        }
      });
      
      // Also check for Add icon buttons
      const addIcons = document.querySelectorAll('[aria-label*="add"], [aria-label*="Add"], [data-testid*="AddIcon"]');
      addIcons.forEach(icon => {
        const parent = icon.closest('button');
        if (parent) {
          createButtons.push({
            text: 'Add Icon Button',
            visible: parent.offsetParent !== null,
            disabled: parent.disabled
          });
        }
      });
      
      return createButtons;
    });

    console.log('   Create buttons found:', createBtnInfo.length);
    createBtnInfo.forEach(btn => {
      console.log(`   - "${btn.text}" (visible: ${btn.visible}, disabled: ${btn.disabled})`);
    });

    // Try to click Create
    let createClicked = false;
    
    // Try different selectors
    const selectors = [
      'button:has-text("Create")',
      'button:has-text("Create Transaction Mapping")',
      'button:has-text("Tambah")',
      'button:has-text("Add")',
      '[aria-label*="add"]:not([aria-label*="addTo"])',
      '[data-testid="AddIcon"]'
    ];

    for (const selector of selectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 })) {
          const btnText = await btn.textContent() || selector;
          await btn.click();
          createClicked = true;
          console.log(`   ✅ Clicked: ${btnText}`);
          await page.waitForTimeout(3000);
          break;
        }
      } catch (e) {}
    }

    if (!createClicked) {
      console.log('   ⚠️ Create button not visible, trying to find in expanded menus...');
      
      // Try clicking System Setup menu first
      try {
        await page.click('text=System Setup', { timeout: 2000 });
        await page.waitForTimeout(1000);
        await page.click('text=Master Data', { timeout: 2000 });
        await page.waitForTimeout(1000);
        await page.click('text=Transaction Mapping', { timeout: 2000 });
        await page.waitForTimeout(3000);
        
        // Try clicking Create again
        for (const selector of selectors) {
          try {
            const btn = page.locator(selector).first();
            if (await btn.isVisible({ timeout: 1000 })) {
              await btn.click();
              createClicked = true;
              console.log(`   ✅ Clicked after menu expansion: ${selector}`);
              await page.waitForTimeout(3000);
              break;
            }
          } catch (e) {}
        }
      } catch (e) {
        console.log('   Menu expansion failed:', e.message);
      }
    }

    // 7. Analyze form if modal opened
    console.log('\n6. Analyzing form/modal...');
    const formInfo = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"], [class*="Drawer"], [class*="drawer"]');
      const container = modal || document.body;
      
      const fields = [];
      const inputs = container.querySelectorAll('input:not([type="hidden"]), select, textarea');
      inputs.forEach(input => {
        if (input.offsetParent !== null || input.type === 'hidden') {
          const parentField = input.closest('[class*="field"], [class*="control"], [class*="Form"]');
          let label = parentField?.querySelector('label, span:first-child')?.textContent?.trim() ||
                      input.closest('label')?.textContent?.trim() ||
                      input.placeholder || '';
          
          // Clean up label
          label = label.replace(/[*\s]+$/, '').trim();
          
          fields.push({
            type: input.type || input.tagName,
            name: input.name || input.id || '',
            label: label,
            required: input.required || !!parentField?.querySelector('[class*="required"]') || label.includes('*'),
            placeholder: input.placeholder,
            value: input.value,
            visible: input.offsetParent !== null
          });
        }
      });
      
      const buttons = Array.from(container.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(t => t);
      
      return { 
        fields, 
        buttons, 
        inModal: !!modal,
        modalTitle: modal?.querySelector('h1, h2, h3, [class*="title"]')?.textContent?.trim()
      };
    });

    console.log(`   In modal: ${formInfo.inModal}`);
    console.log(`   Modal title: ${formInfo.modalTitle || 'N/A'}`);
    console.log(`   Fields found: ${formInfo.fields.length}`);
    
    const visibleFields = formInfo.fields.filter(f => f.visible);
    console.log('\n   Form Fields:');
    visibleFields.forEach((f, i) => {
      const req = f.required ? '🔴 REQUIRED' : '🟡 optional';
      console.log(`   ${req} | [${f.type}] ${f.label || f.name}`);
    });
    
    console.log('\n   Buttons in form:', formInfo.buttons.slice(0, 10).join(', '));

    // 8. Try minimal save (fill required fields and save)
    console.log('\n7. Attempting minimal save...');
    
    // Fill required fields with test data
    const filledFields = [];
    for (const field of visibleFields) {
      if (field.required) {
        try {
          if (field.type === 'select-one' || field.type === 'SELECT') {
            // For dropdowns, select first option
            await page.selectOption(`select[name="${field.name}"], select[id="${field.name}"]`, { index: 1 });
            filledFields.push(field.label || field.name);
            console.log(`   ✅ Filled dropdown: ${field.label || field.name}`);
          } else if (field.type === 'text' || field.type === 'TEXT') {
            // For text fields, use test data
            await page.fill(`input[name="${field.name}"], input[id="${field.name}"]`, `QATest_${Date.now()}`);
            filledFields.push(field.label || field.name);
            console.log(`   ✅ Filled text: ${field.label || field.name}`);
          } else if (field.type === 'date' || field.type === 'DATE') {
            // For date fields, use today
            await page.fill(`input[name="${field.name}"], input[id="${field.name}"]`, '2026-04-04');
            filledFields.push(field.label || field.name);
            console.log(`   ✅ Filled date: ${field.label || field.name}`);
          }
        } catch (e) {
          console.log(`   ⚠️ Could not fill: ${field.label || field.name} - ${e.message}`);
        }
      }
    }

    // Click Save
    console.log('\n8. Clicking Save...');
    const saveSelectors = [
      'button:has-text("Save")',
      'button:has-text("Simpan")',
      'button:has-text("Submit")'
    ];

    for (const selector of saveSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 })) {
          await btn.click();
          console.log('   ✅ Save clicked');
          await page.waitForTimeout(5000);
          break;
        }
      } catch (e) {}
    }

    // 9. Check results
    console.log('\n9. Checking results...');
    const results = await page.evaluate(() => {
      const errors = Array.from(document.querySelectorAll('[class*="error"], .Mui-error, [role="alert"]'))
        .map(e => e.textContent?.trim())
        .filter(t => t && t.length < 500);
      
      const toasts = Array.from(document.querySelectorAll('[class*="toast"], .MuiSnackbarContent, [role="status"]'))
        .map(t => t.textContent?.trim())
        .filter(t => t && t.length < 500);
      
      const tableRows = document.querySelectorAll('table tbody tr').length;
      const modalClosed = !document.querySelector('[role="dialog"]:not([aria-hidden="true"])');
      
      return { errors, toasts, tableRows, modalClosed };
    });

    console.log('   Validation errors:', results.errors.slice(0, 5));
    console.log('   Toast messages:', results.toasts.slice(0, 3));
    console.log('   Table rows:', results.tableRows);
    console.log('   Modal closed:', results.modalClosed);

    // 10. Capture final API calls for create
    console.log('\n10. Checking API calls for create...');
    const createApiCalls = apiCalls.filter(c => 
      c.url.includes('billingitem') && 
      (c.method === 'POST' || c.url.includes('get-paging'))
    );
    
    console.log('   Create-related API calls:');
    createApiCalls.forEach(call => {
      console.log(`   - ${call.method} ${call.url} (${call.status || 'pending'})`);
    });

    // Save results
    const findings = {
      timestamp: new Date().toISOString(),
      accessStatus: 'ACCESS_STABLE',
      currentUrl,
      createClicked,
      pageInfo,
      formFields: visibleFields.map(f => ({ name: f.name, label: f.label, type: f.type, required: f.required })),
      mandatoryFields: visibleFields.filter(f => f.required).map(f => f.label || f.name),
      filledFields,
      saveResults: results,
      createApiCalls
    };

    const fs = require('fs');
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(`${OUTPUT_DIR}\\transaction-mapping-create-result.json`, JSON.stringify(findings, null, 2));
    fs.writeFileSync(`${OUTPUT_DIR}\\transaction-mapping-api-full.json`, JSON.stringify(apiCalls, null, 2));

    console.log('\n✅ Test complete!');
    console.log('Results saved to artifacts/adhoc-notes/');
    
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

testTransactionMapping()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
