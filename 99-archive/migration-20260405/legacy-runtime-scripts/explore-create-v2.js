const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const AUTH_FILE = path.join(__dirname, 'auth', 'state', 'dev-energy-auth.json');
const OUTPUT_DIR = path.join(__dirname, 'artifacts', 'adhoc-notes');

async function explore() {
  console.log('=== Transaction Mapping Create Flow ===\n');

  const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
  const browser = await chromium.launch({ headless: true });
  
  const apiCalls = [];
  const page = await browser.newPage();
  page.setDefaultTimeout(90000);

  // Capture API calls
  page.on('request', request => {
    const url = request.url();
    if (url.includes('pgn.co.id') && !url.includes('/static/') && !url.includes('.js') && !url.includes('.css')) {
      apiCalls.push({
        timestamp: new Date().toISOString(),
        method: request.method(),
        url: url,
        postData: request.postData()?.substring(0, 500)
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
            if (body) {
              existing.response = JSON.stringify(body).substring(0, 1000);
            }
          }
        } catch (e) {}
      }
    }
  });

  try {
    // 1. Create context with cookies
    console.log('1. Creating authenticated context...');
    const context = await browser.newContext();
    
    for (const cookie of authData.cookies) {
      await context.addCookies([{
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite
      }]);
    }
    
    const page = await context.newPage();
    page.setDefaultTimeout(90000);

    // 2. Navigate to Transaction Mapping
    console.log('2. Navigating to /system-setup/billing-item...');
    await page.goto('https://dev-energy.pgn.co.id/system-setup/billing-item', {
      waitUntil: 'domcontentloaded'
    });
    await page.waitForTimeout(5000);

    // 3. Check for session warning modal
    console.log('\n3. Checking for session warning modal...');
    const modalText = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"], .MuiDialog-root, .modal');
      if (modal) {
        return modal.textContent?.trim();
      }
      return null;
    });

    if (modalText && modalText.includes('being used by other user')) {
      console.log('   ⚠️ Session warning detected!');
      console.log('   Clicking OK to dismiss...');
      
      // Try to find and click OK button
      const okSelectors = [
        'button:has-text("OK")',
        'button:has-text("Ok")',
        'button:has-text("好的")',
        '[type="button"]:has-text("OK")'
      ];
      
      for (const selector of okSelectors) {
        try {
          const btn = await page.locator(selector).first();
          if (await btn.isVisible({ timeout: 2000 })) {
            await btn.click();
            console.log('   ✅ OK clicked');
            await page.waitForTimeout(3000);
            break;
          }
        } catch (e) {}
      }
      
      // Check if modal is gone
      const modalGone = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"], .MuiDialog-root, .modal');
        return !modal || !modal.textContent?.includes('being used');
      });
      
      if (modalGone) {
        console.log('   ✅ Modal dismissed successfully');
      } else {
        console.log('   ⚠️ Modal may still be present');
      }
    }

    // 4. Get table info
    console.log('\n4. Analyzing table...');
    const tableInfo = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('table th')).map(th => th.textContent?.trim());
      const rows = document.querySelectorAll('table tbody tr');
      const firstRow = rows[0] ? Array.from(rows[0].querySelectorAll('td')).map(td => td.textContent?.trim()) : null;
      return { headers, rowCount: rows.length, firstRow };
    });
    
    console.log('   Headers:', tableInfo.headers);
    console.log('   Row count:', tableInfo.rowCount);
    console.log('   First row:', tableInfo.firstRow);

    // 5. Find Create button
    console.log('\n5. Looking for Create button...');
    const createSelectors = [
      'button:has-text("Create")',
      'button:has-text("Create Transaction Mapping")',
      'button:has-text("Tambah")',
      'button:has-text("Add")',
      'button:has-text("Baru")',
      '[aria-label="Create"]',
      '[aria-label="Add"]',
      '[data-testid="AddIcon"]',
      '.btn-create',
      'button[class*="create"]',
      'button[class*="add"]'
    ];
    
    let createClicked = false;
    for (const selector of createSelectors) {
      try {
        const btn = await page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 })) {
          const btnText = await btn.textContent();
          console.log('   Found:', btnText?.trim());
          await btn.click();
          createClicked = true;
          console.log('   ✅ Create clicked!');
          await page.waitForTimeout(3000);
          break;
        }
      } catch (e) {}
    }
    
    if (!createClicked) {
      console.log('   ⚠️ Create button not found, searching in toolbar...');
      
      // Look in toolbar area
      const toolbarBtns = await page.evaluate(() => {
        const toolbar = document.querySelector('[class*="toolbar"], [class*="Toolbar"], .MuiToolbar');
        if (toolbar) {
          return Array.from(toolbar.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(t => t);
        }
        return [];
      });
      console.log('   Toolbar buttons:', toolbarBtns);
    }

    // 6. Analyze form/modal
    console.log('\n6. Analyzing form/modal...');
    const formInfo = await page.evaluate(() => {
      const fields = [];
      
      // Find modal or main form
      const container = document.querySelector('[role="dialog"], .MuiDialog-root, [class*="Drawer"], [class*="drawer"], aside');
      
      if (container) {
        console.log('Modal/Drawer found');
        const inputs = container.querySelectorAll('input:not([type="hidden"]), select, textarea');
        inputs.forEach(input => {
          if (input.offsetParent !== null) {
            const label = input.closest('[class*="field"], [class*="control"], [class*="Input"]')?.querySelector('label, span')?.textContent?.trim() ||
                          input.closest('div')?.previousElementSibling?.textContent?.trim() ||
                          input.placeholder || input.name || input.id || '';
            fields.push({
              type: input.type || input.tagName,
              name: input.name || input.id,
              label: label,
              required: input.required || !!input.closest('[class*="required"]') || label.includes('*'),
              placeholder: input.placeholder
            });
          }
        });
        
        const buttons = Array.from(container.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(t => t);
        return { fields, buttons, containerType: 'modal' };
      }
      
      // Check main page for inline form
      const mainInputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
      mainInputs.forEach(input => {
        if (input.offsetParent !== null) {
          const label = input.closest('[class*="field"]')?.querySelector('label, span')?.textContent?.trim() ||
                        input.placeholder || input.name || input.id || '';
          fields.push({
            type: input.type || input.tagName,
            name: input.name || input.id,
            label: label,
            required: input.required || label.includes('*'),
            placeholder: input.placeholder
          });
        }
      });
      
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(t => t);
      return { fields, buttons, containerType: 'main' };
    });

    console.log('   Container type:', formInfo.containerType);
    console.log('   Fields found:', formInfo.fields.length);
    formInfo.fields.forEach((f, i) => {
      const req = f.required ? '🔴' : '🟡';
      console.log(`   ${req} ${i+1}. [${f.type}] ${f.label || f.name}`);
    });
    console.log('   Buttons:', formInfo.buttons.slice(0, 15).join(', '));

    // 7. Try minimal save
    console.log('\n7. Attempting save (minimal)...');
    const saveSelectors = [
      'button:has-text("Save")',
      'button:has-text("Simpan")',
      'button:has-text("Submit")'
    ];
    
    for (const selector of saveSelectors) {
      try {
        const btn = await page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 })) {
          console.log('   Clicking Save...');
          await btn.click();
          await page.waitForTimeout(3000);
          break;
        }
      } catch (e) {}
    }

    // 8. Check results
    console.log('\n8. Checking results...');
    const results = await page.evaluate(() => {
      return {
        errors: Array.from(document.querySelectorAll('[class*="error"], .Mui-error, [role="alert"]'))
          .map(e => e.textContent?.trim())
          .filter(t => t && t.length < 500),
        toasts: Array.from(document.querySelectorAll('[class*="toast"], .MuiSnackbarContent, [role="status"]'))
          .map(t => t.textContent?.trim())
          .filter(t => t && t.length < 500),
        modalVisible: !!document.querySelector('[role="dialog"]:not([aria-hidden="true"])'),
        tableRows: document.querySelectorAll('table tbody tr').length
      };
    });
    
    console.log('   Validation errors:', results.errors.slice(0, 5));
    console.log('   Toast messages:', results.toasts.slice(0, 3));
    console.log('   Modal visible:', results.modalVisible);
    console.log('   Table rows:', results.tableRows);

    // Save findings
    const findings = {
      timestamp: new Date().toISOString(),
      pageUrl: page.url(),
      tableInfo,
      formInfo,
      createClicked,
      saveResults: results,
      apiCalls: apiCalls.filter(c => c.url)
    };

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'tx-mapping-create-v2.json'), JSON.stringify(findings, null, 2));
    
    console.log('\n✅ Done!');
    return findings;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'tx-mapping-error.json'), JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    return { error: error.message };
  } finally {
    await browser.close();
  }
}

explore().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
