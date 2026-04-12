const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const AUTH_FILE = path.join(__dirname, 'auth', 'state', 'dev-energy-auth.json');
const OUTPUT_DIR = path.join(__dirname, 'artifacts', 'adhoc-notes');

async function explore() {
  console.log('=== Transaction Mapping Create Flow (storageState) ===\n');

  const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
  
  const apiCalls = [];

  try {
    // 1. Use storageState to import cookies and localStorage
    console.log('1. Creating browser with storageState...');
    
    // Create storageState object from auth file
    const storageState = {
      cookies: authData.cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        expires: c.expires,
        httpOnly: c.httpOnly,
        secure: c.secure,
        sameSite: c.sameSite
      })),
      origins: [{
        origin: 'https://dev-energy.pgn.co.id',
        localStorage: authData.origins[0].localStorage.map(l => ({
          name: l.name,
          value: l.value
        }))
      }]
    };

    const browser = await chromium.launch({ headless: true });
    
    // Create context with storageState
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();
    page.setDefaultTimeout(90000);

    // Capture API calls
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
        }
      }
    });

    // 2. Navigate directly to Transaction Mapping
    console.log('2. Navigating to Transaction Mapping...');
    await page.goto('https://dev-energy.pgn.co.id/system-setup/billing-item', {
      waitUntil: 'domcontentloaded',
      timeout: 90000
    });
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log('   URL:', currentUrl);

    // 3. Check if redirected to login
    if (currentUrl.includes('login')) {
      console.log('\n⚠️ Still redirected to login. Session expired or invalid.');
      console.log('   Need fresh authentication.');
      
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      fs.writeFileSync(path.join(OUTPUT_DIR, 'session-status.json'), JSON.stringify({
        status: 'EXPIRED',
        reason: 'Redirected to login page',
        timestamp: new Date().toISOString()
      }, null, 2));
      
      return { status: 'EXPIRED' };
    }

    // 4. Handle session warning if present
    console.log('\n3. Checking for session warning...');
    await page.waitForTimeout(2000);
    
    const modalInfo = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (modal && modal.textContent?.includes('being used')) {
        return { present: true, text: modal.textContent?.trim() };
      }
      return { present: false };
    });

    if (modalInfo.present) {
      console.log('   Session warning found!');
      console.log('   Modal text:', modalInfo.text?.substring(0, 100));
      
      // Click OK
      try {
        await page.click('button:has-text("OK")');
        console.log('   ✅ OK clicked');
        await page.waitForTimeout(3000);
      } catch (e) {
        console.log('   ⚠️ Could not click OK:', e.message);
      }
    }

    // 5. Analyze page
    console.log('\n4. Analyzing page...');
    const pageInfo = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()).filter(t => t);
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(t => t);
      const inputs = document.querySelectorAll('input, select, textarea').length;
      const tables = document.querySelectorAll('table').length;
      const tableHeaders = Array.from(document.querySelectorAll('table th')).map(th => th.textContent?.trim());
      const tableRows = document.querySelectorAll('table tbody tr').length;
      
      return { headings, buttons, inputs, tables, tableHeaders, tableRows };
    });

    console.log('   Headings:', pageInfo.headings.join(', '));
    console.log('   Buttons:', pageInfo.buttons.slice(0, 15).join(', '));
    console.log('   Tables:', pageInfo.tables);
    console.log('   Table rows:', pageInfo.tableRows);
    if (pageInfo.tableHeaders.length > 0) {
      console.log('   Table headers:', pageInfo.tableHeaders);
    }

    // 6. Find Create button
    console.log('\n5. Looking for Create button...');
    const createSelectors = [
      'button:has-text("Create")',
      'button:has-text("Create Transaction Mapping")',
      'button:has-text("Tambah")',
      'button:has-text("Add")',
      'button:has-text("Baru")',
      '[aria-label="Create"]',
      '[aria-label="Add"]',
      '.MuiIconButton-root[aria-label="add"]'
    ];

    let createClicked = false;
    let createBtnText = '';
    
    for (const selector of createSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 })) {
          createBtnText = await btn.textContent() || selector;
          await btn.click();
          createClicked = true;
          console.log('   ✅ Found and clicked:', createBtnText?.trim());
          await page.waitForTimeout(3000);
          break;
        }
      } catch (e) {}
    }

    if (!createClicked) {
      console.log('   ⚠️ Create button not visible');
    }

    // 7. Analyze form/modal
    console.log('\n6. Analyzing form...');
    const formInfo = await page.evaluate(() => {
      const fields = [];
      
      // Find form in modal
      const modal = document.querySelector('[role="dialog"]');
      const container = modal || document.body;
      
      const inputs = container.querySelectorAll('input:not([type="hidden"]), select, textarea');
      inputs.forEach(input => {
        if (input.offsetParent !== null || input.type === 'hidden') {
          const parentField = input.closest('[class*="field"], [class*="control"], [class*="Form"]');
          const label = parentField?.querySelector('label, span:first-child')?.textContent?.trim() ||
                        input.closest('label')?.textContent?.trim() ||
                        input.placeholder || input.name || input.id || '';
          
          fields.push({
            type: input.type || input.tagName,
            name: input.name || input.id,
            label: label.replace(/[*\s]+$/, ''),
            required: input.required || !!parentField?.querySelector('[class*="required"]') || label.includes('*'),
            placeholder: input.placeholder
          });
        }
      });
      
      const buttons = Array.from(container.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(t => t);
      
      return { fields, buttons, inModal: !!modal };
    });

    console.log('   In modal:', formInfo.inModal);
    console.log('   Fields:', formInfo.fields.length);
    formInfo.fields.forEach((f, i) => {
      const req = f.required ? '🔴 REQUIRED' : '🟡 optional';
      console.log(`   ${req} | [${f.type}] ${f.label || f.name}`);
    });
    console.log('   Buttons:', formInfo.buttons.slice(0, 10).join(', '));

    // 8. Try save
    console.log('\n7. Attempting save...');
    const saveSelectors = ['button:has-text("Save")', 'button:has-text("Simpan")', 'button:has-text("Submit")'];
    
    for (const selector of saveSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 })) {
          await btn.click();
          console.log('   ✅ Save clicked');
          await page.waitForTimeout(3000);
          break;
        }
      } catch (e) {}
    }

    // 9. Results
    console.log('\n8. Results:');
    const results = await page.evaluate(() => {
      return {
        errors: Array.from(document.querySelectorAll('[class*="error"], .Mui-error')).map(e => e.textContent?.trim()).filter(t => t && t.length < 200),
        toasts: Array.from(document.querySelectorAll('[class*="toast"], .MuiSnackbarContent')).map(t => t.textContent?.trim()).filter(t => t && t.length < 200),
        tableRows: document.querySelectorAll('table tbody tr').length
      };
    });
    
    console.log('   Errors:', results.errors.slice(0, 5));
    console.log('   Toasts:', results.toasts.slice(0, 3));
    console.log('   Table rows:', results.tableRows);

    // Save
    const findings = {
      timestamp: new Date().toISOString(),
      status: 'COMPLETED',
      pageUrl: currentUrl,
      pageInfo,
      formFields: formInfo.fields,
      createClicked,
      createBtnText,
      saveResults: results,
      apiCalls: apiCalls.filter(c => c.url)
    };

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'tx-create-final.json'), JSON.stringify(findings, null, 2));

    console.log('\n✅ Done!');
    return findings;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'tx-create-error.json'), JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    return { error: error.message };
  } finally {
    await browser.close();
  }
}

explore().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
