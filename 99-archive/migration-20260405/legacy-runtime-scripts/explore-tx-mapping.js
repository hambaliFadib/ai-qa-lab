const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const AUTH_FILE = path.join(__dirname, 'auth', 'state', 'dev-energy-auth.json');
const OUTPUT_DIR = path.join(__dirname, 'artifacts', 'adhoc-notes');

async function exploreTransactionMapping() {
  console.log('Starting Transaction Mapping Exploration...\n');

  const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
  const browser = await chromium.launch({ headless: true });
  
  const apiCalls = [];
  const page = await browser.newPage();

  // Set longer timeout and domcontentloaded instead of networkidle
  page.setDefaultTimeout(60000);

  // Capture network requests
  page.on('request', request => {
    const url = request.url();
    if (url.includes('pgn.co.id')) {
      apiCalls.push({
        timestamp: new Date().toISOString(),
        method: request.method(),
        url: url,
        postDataPreview: request.postData()?.substring(0, 200)
      });
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('pgn.co.id')) {
      const existing = apiCalls.find(c => c.url === url);
      if (existing) {
        existing.status = response.status();
        try {
          const ct = response.headers()['content-type'] || '';
          if (ct.includes('json')) {
            const body = await response.json().catch(() => null);
            existing.responseBody = body ? JSON.stringify(body).substring(0, 500) : null;
          }
        } catch (e) {}
      }
    }
  });

  try {
    // 1. Load base page first
    console.log('1. Loading application base...');
    await page.goto('https://dev-energy.pgn.co.id', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 2. Apply cookies
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
    const configEntry = authData.origins[0].localStorage.find(l => l.name === 'config');
    const sidebarEntry = authData.origins[0].localStorage.find(l => l.name === 'side_bar');
    
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, tokenEntry?.value || '');
    
    await page.evaluate((config) => {
      localStorage.setItem('config', config);
    }, configEntry?.value || '');

    // 4. Navigate to Transaction Mapping
    console.log('4. Navigating to Transaction Mapping...');
    await page.goto('https://dev-energy.pgn.co.id/system-setup/master-data/transaction-mapping', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(5000);

    // 5. Check if we got redirected to login
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    if (currentUrl.includes('login') || currentUrl.includes('auth')) {
      throw new Error('SESSION_EXPIRED: Redirected to login page');
    }

    // 6. Analyze page structure
    console.log('5. Analyzing page structure...');
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim()).filter(t => t),
        buttons: Array.from(document.querySelectorAll('button')).map(b => ({
          text: b.textContent.trim(),
          disabled: b.disabled,
          visible: b.offsetParent !== null
        })).filter(b => b.text),
        inputs: Array.from(document.querySelectorAll('input, textarea, select')).map(i => ({
          type: i.type || i.tagName,
          name: i.name || i.id,
          placeholder: i.placeholder,
          required: i.required || i.hasAttribute('aria-required'),
          disabled: i.disabled
        })),
        tables: document.querySelectorAll('table').length,
        modals: document.querySelectorAll('[role="dialog"], .MuiDialog-root, .modal').length
      };
    });

    console.log('   Title:', pageInfo.title);
    console.log('   Headings:', pageInfo.headings.join(', '));
    console.log('   Buttons:', pageInfo.buttons.map(b => b.text).join(', '));
    console.log('   Inputs:', pageInfo.inputs.length);
    console.log('   Tables:', pageInfo.tables);
    console.log('   Modals:', pageInfo.modals);

    // 7. Try to find and click Create button
    console.log('6. Looking for Create button...');
    const createButtonSelectors = [
      'button:has-text("Create")',
      'button:has-text("Tambah")',
      'button:has-text("Add")',
      'button:has-text("Baru")',
      '[data-action="create"]',
      '.btn-create'
    ];
    
    let createClicked = false;
    for (const selector of createButtonSelectors) {
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

    // 8. Analyze form in modal
    console.log('7. Analyzing form fields...');
    const formInfo = await page.evaluate(() => {
      const fields = [];
      
      // Check for dialog/modal
      const modal = document.querySelector('[role="dialog"], .MuiDialog-root, .modal, [class*="Drawer"], aside');
      if (modal) {
        const inputs = modal.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
          const label = input.closest('div')?.querySelector('label, span')?.textContent?.trim() ||
                        input.placeholder ||
                        input.name ||
                        input.id;
          fields.push({
            type: input.type || input.tagName,
            name: input.name || input.id,
            label: label,
            required: input.required || input.hasAttribute('aria-required') || !!input.closest('[class*="required"]'),
            placeholder: input.placeholder
          });
        });
        
        const buttons = modal.querySelectorAll('button');
        const btns = Array.from(buttons).map(b => b.textContent.trim()).filter(t => t);
        
        return { fields, buttons: btns, modalFound: true };
      }
      
      // Check main page
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        const label = input.closest('label')?.textContent?.trim() ||
                      input.closest('[class*="field"]')?.querySelector('label')?.textContent?.trim() ||
                      input.placeholder ||
                      input.name;
        fields.push({
          type: input.type || input.tagName,
          name: input.name || input.id,
          label: label,
          required: input.required || input.hasAttribute('aria-required'),
          placeholder: input.placeholder
        });
      });
      
      return { fields, buttons: [], modalFound: false };
    });

    console.log('\nForm Fields:');
    formInfo.fields.forEach((f, i) => {
      const req = f.required ? 'REQUIRED' : 'optional';
      console.log(`  ${i+1}. [${f.type}] ${f.label || f.name} (${req})`);
    });
    
    console.log('Buttons in form:', formInfo.buttons.join(', '));

    // 9. Try minimal save
    console.log('\n8. Attempting save...');
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
    console.log('9. Checking results...');
    const errors = await page.evaluate(() => {
      const validationMsgs = Array.from(document.querySelectorAll('[class*="error"], .Mui-error, [role="alert"]'))
        .map(e => e.textContent?.trim())
        .filter(t => t);
      const toast = Array.from(document.querySelectorAll('[class*="toast"], .snackbar, [role="status"]'))
        .map(t => t.textContent?.trim())
        .filter(t => t);
      return { validationMsgs, toast };
    });
    
    console.log('   Validation errors:', errors.validationMsgs.slice(0, 5));
    console.log('   Toast messages:', errors.toast.slice(0, 3));

    // 11. Check table
    console.log('10. Checking table...');
    const tableInfo = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      const headers = Array.from(document.querySelectorAll('table th')).map(th => th.textContent?.trim());
      return {
        rowCount: rows.length,
        headers,
        firstRow: rows[0] ? Array.from(rows[0].querySelectorAll('td')).map(td => td.textContent?.trim()) : null
      };
    });
    
    console.log('   Rows:', tableInfo.rowCount);
    console.log('   Headers:', tableInfo.headers);

    // Save results
    const results = {
      timestamp: new Date().toISOString(),
      sessionStatus: 'ACTIVE',
      currentUrl,
      pageInfo,
      formFields: formInfo.fields,
      createClicked,
      errors,
      tableInfo,
      apiCalls: apiCalls.filter(c => c.url.includes('pgn.co.id') && !c.url.includes('/static/'))
    };

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'transaction-mapping-detailed.json'),
      JSON.stringify(results, null, 2)
    );
    
    // Also save API calls separately
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'transaction-mapping-api-calls.json'),
      JSON.stringify(apiCalls.filter(c => !c.url.includes('/static/')), null, 2)
    );

    console.log('\nResults saved!');
    return results;

  } catch (error) {
    console.error('Error:', error.message);
    
    const errorResults = {
      timestamp: new Date().toISOString(),
      error: error.message,
      sessionStatus: error.message.includes('login') ? 'EXPIRED' : 'ERROR',
      apiCalls: apiCalls.filter(c => !c.url.includes('/static/'))
    };
    
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'transaction-mapping-error.json'),
      JSON.stringify(errorResults, null, 2)
    );
    
    return errorResults;
  } finally {
    await browser.close();
  }
}

exploreTransactionMapping()
  .then(r => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
