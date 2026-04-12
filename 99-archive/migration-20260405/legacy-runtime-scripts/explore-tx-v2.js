const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const AUTH_FILE = path.join(__dirname, 'auth', 'state', 'dev-energy-auth.json');
const OUTPUT_DIR = path.join(__dirname, 'artifacts', 'adhoc-notes');

async function exploreTransactionMapping() {
  console.log('=== Transaction Mapping Exploration ===\n');

  const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
  const browser = await chromium.launch({ headless: true });
  
  const apiCalls = [];
  const page = await browser.newPage();

  page.setDefaultTimeout(60000);

  // Capture all API calls
  page.on('request', request => {
    const url = request.url();
    if (url.includes('pgn.co.id')) {
      apiCalls.push({
        timestamp: new Date().toISOString(),
        method: request.method(),
        url: url,
        postDataPreview: request.postData()?.substring(0, 300)
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
            existing.responseBody = body ? JSON.stringify(body).substring(0, 1000) : null;
          }
        } catch (e) {}
      }
    }
  });

  try {
    // 1. Load base page
    console.log('1. Loading application...');
    await page.goto('https://dev-energy.pgn.co.id', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // 2. Apply session
    console.log('2. Applying session cookies...');
    for (const cookie of authData.cookies) {
      await page.context().addCookies([{
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

    // 3. Set localStorage
    console.log('3. Setting localStorage...');
    const tokenEntry = authData.origins[0].localStorage.find(l => l.name === 'token');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, tokenEntry?.value || '');

    // 4. Navigate to Transaction Mapping (CORRECT PATH)
    console.log('4. Navigating to /system-setup/billing-item...');
    await page.goto('https://dev-energy.pgn.co.id/system-setup/billing-item', {
      waitUntil: 'domcontentloaded'
    });
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log('   URL:', currentUrl);
    
    if (currentUrl.includes('login')) {
      throw new Error('SESSION_EXPIRED');
    }

    // 5. Page structure
    console.log('\n5. Analyzing page...');
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim()).filter(t => t),
        buttons: Array.from(document.querySelectorAll('button')).map(b => ({
          text: b.textContent.trim(),
          disabled: b.disabled
        })).filter(b => b.text),
        pageText: document.body.innerText.substring(0, 1000)
      };
    });

    console.log('   Headings:', pageInfo.headings.join(' | '));
    console.log('   Buttons:', pageInfo.buttons.map(b => b.text).join(', '));
    
    if (pageInfo.pageText.includes('404') || pageInfo.pageText.includes('Not Found')) {
      console.log('   WARNING: Page shows 404');
    }

    // 6. Find Create button
    console.log('\n6. Looking for Create button...');
    const createSelectors = [
      'button:has-text("Create")',
      'button:has-text("Tambah")',
      'button:has-text("Add")',
      '[data-testid="AddIcon"]',
      '[aria-label="add"]'
    ];
    
    let createClicked = false;
    for (const selector of createSelectors) {
      try {
        const btn = await page.locator(selector).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          await btn.click();
          createClicked = true;
          console.log('   Create clicked!');
          await page.waitForTimeout(3000);
          break;
        }
      } catch (e) {}
    }
    
    if (!createClicked) {
      console.log('   Create button not found');
    }

    // 7. Analyze form
    console.log('\n7. Analyzing form/modal...');
    const formInfo = await page.evaluate(() => {
      const fields = [];
      
      // Find any visible inputs
      const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea');
      inputs.forEach(input => {
        if (input.offsetParent !== null) {
          const parent = input.closest('[class]') || input.parentElement;
          const label = parent?.querySelector('label, span, p')?.textContent?.trim() || 
                        input.placeholder || 
                        input.name || input.id || '';
          fields.push({
            type: input.type || input.tagName,
            name: input.name || input.id,
            label: label,
            required: input.required || !!input.closest('[class*="required"]') || label.includes('*'),
            placeholder: input.placeholder,
            visible: input.offsetParent !== null
          });
        }
      });
      
      // Find dialog/modal
      const modal = document.querySelector('[role="dialog"], [class*="Modal"], [class*="Dialog"], [class*="Drawer"]');
      
      // Find all buttons
      const allBtns = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t);
      
      return { fields, modalFound: !!modal, buttons: allBtns };
    });

    console.log('   Found', formInfo.fields.length, 'input fields');
    formInfo.fields.forEach((f, i) => {
      const req = f.required ? '🔴' : '🟡';
      console.log(`   ${req} ${i+1}. [${f.type}] ${f.label || f.name}`);
    });
    console.log('   Buttons:', formInfo.buttons.slice(0, 10).join(', '));

    // 8. Identify mandatory fields
    console.log('\n8. Mandatory fields detected:');
    const mandatory = formInfo.fields.filter(f => f.required);
    if (mandatory.length > 0) {
      mandatory.forEach(f => console.log(`   - ${f.label || f.name}`));
    } else {
      console.log('   (none detected by HTML attributes)');
    }

    // 9. Save attempt
    console.log('\n9. Attempting save...');
    const saveSelectors = [
      'button:has-text("Save")',
      'button:has-text("Simpan")',
      'button:has-text("Submit")'
    ];
    
    for (const selector of saveSelectors) {
      try {
        const btn = await page.locator(selector).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          await btn.click();
          console.log('   Save clicked!');
          await page.waitForTimeout(3000);
          break;
        }
      } catch (e) {}
    }

    // 10. Check results
    console.log('\n10. Checking results...');
    const results = await page.evaluate(() => {
      const errors = Array.from(document.querySelectorAll('[class*="error"], .Mui-error, [role="alert"]'))
        .map(e => e.textContent?.trim())
        .filter(t => t && t.length < 200);
      const toasts = Array.from(document.querySelectorAll('[class*="toast"], [class*="Snackbar"], [role="status"]'))
        .map(t => t.textContent?.trim())
        .filter(t => t && t.length < 200);
      const table = document.querySelectorAll('table tbody tr').length;
      return { errors, toasts, tableRows: table };
    });
    
    console.log('   Errors:', results.errors.slice(0, 5));
    console.log('   Toasts:', results.toasts.slice(0, 3));
    console.log('   Table rows:', results.tableRows);

    // 11. Save findings
    const findings = {
      timestamp: new Date().toISOString(),
      targetUrl: '/system-setup/billing-item',
      actualUrl: currentUrl,
      pageFound: !currentUrl.includes('404'),
      pageInfo,
      formFields: formInfo.fields,
      mandatoryFields: mandatory.map(f => f.label || f.name),
      createClicked,
      errors: results.errors,
      toasts: results.toasts,
      tableRows: results.tableRows,
      apiCalls: apiCalls.filter(c => !c.url.includes('/static/'))
    };

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'transaction-mapping-detailed.json'),
      JSON.stringify(findings, null, 2)
    );
    
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'transaction-mapping-api.json'),
      JSON.stringify(apiCalls.filter(c => !c.url.includes('/static/')), null, 2)
    );

    console.log('\n✅ Files saved!');
    return findings;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'transaction-mapping-error.json'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        error: error.message,
        status: error.message.includes('login') ? 'SESSION_EXPIRED' : 'ERROR'
      }, null, 2)
    );
    
    return { error: error.message };
  } finally {
    await browser.close();
  }
}

exploreTransactionMapping()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
