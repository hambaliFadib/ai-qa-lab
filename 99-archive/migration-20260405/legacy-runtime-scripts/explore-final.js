const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const AUTH_FILE = path.join(__dirname, 'auth', 'state', 'dev-energy-auth.json');
const OUTPUT_DIR = path.join(__dirname, 'artifacts', 'adhoc-notes');

async function explore() {
  console.log('=== Transaction Mapping Exploration ===\n');

  const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
  const browser = await chromium.launch({ headless: true });
  
  const apiCalls = [];
  const page = await browser.newPage();
  page.setDefaultTimeout(90000);

  // Capture API calls
  page.on('request', request => {
    const url = request.url();
    if (url.includes('pgn.co.id') && !url.includes('/static/') && !url.includes('.js') && !url.includes('.css') && !url.includes('.png') && !url.includes('.jpg') && !url.includes('.woff')) {
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
          const body = await response.json().catch(() => null);
          if (body) {
            existing.response = JSON.stringify(body).substring(0, 500);
          }
        } catch (e) {}
      }
    }
  });

  try {
    // 1. Create context with cookies first
    console.log('1. Creating authenticated context...');
    const context = await browser.newContext();
    
    // Add cookies
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
    
    // Create page with context
    const page = await context.newPage();
    page.setDefaultTimeout(90000);

    // 2. Add network listener
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
            const body = await response.json().catch(() => null);
            if (body) existing.response = JSON.stringify(body).substring(0, 500);
          } catch (e) {}
        }
      }
    });

    // 3. Navigate to base URL (will set cookies automatically)
    console.log('2. Loading app base...');
    await page.goto('https://dev-energy.pgn.co.id', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(3000);

    // 4. Check if redirected
    let currentUrl = page.url();
    console.log('   URL after load:', currentUrl);
    
    if (currentUrl.includes('login')) {
      // Try to get token from auth endpoint
      console.log('3. Session not set, attempting auth...');
      
      // Set localStorage token manually
      const tokenEntry = authData.origins[0].localStorage.find(l => l.name === 'token');
      await page.evaluate((token) => {
        localStorage.setItem('token', token);
      }, tokenEntry?.value || '');
      
      // Navigate to dashboard
      await page.goto('https://dev-energy.pgn.co.id/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      currentUrl = page.url();
      console.log('   URL after token set:', currentUrl);
    }

    // 5. Navigate to Transaction Mapping
    console.log('4. Navigating to Transaction Mapping...');
    await page.goto('https://dev-energy.pgn.co.id/system-setup/billing-item', {
      waitUntil: 'domcontentloaded',
      timeout: 90000
    });
    await page.waitForTimeout(5000);

    currentUrl = page.url();
    console.log('   URL:', currentUrl);

    // 6. Check if 404
    const pageText = await page.evaluate(() => document.body.innerText);
    if (pageText.includes('404') || pageText.includes('Not Found')) {
      console.log('   WARNING: 404 page');
      
      // Check for sidebar
      const hasSidebar = await page.evaluate(() => {
        return !!document.querySelector('aside, nav, [class*="sidebar"]');
      });
      console.log('   Has sidebar:', hasSidebar);
    }

    // 7. Analyze page
    console.log('\n5. Analyzing page...');
    const pageInfo = await page.evaluate(() => {
      return {
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim()).filter(t => t),
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t),
        inputs: Array.from(document.querySelectorAll('input, select, textarea')).length,
        tables: document.querySelectorAll('table').length,
        pageTitle: document.title
      };
    });

    console.log('   Title:', pageInfo.pageTitle);
    console.log('   Headings:', pageInfo.headings.join(' | '));
    console.log('   Buttons:', pageInfo.buttons.slice(0, 10).join(', '));
    console.log('   Inputs:', pageInfo.inputs);
    console.log('   Tables:', pageInfo.tables);

    // 8. Find Create
    console.log('\n6. Looking for Create...');
    const createSelectors = ['button:has-text("Create")', 'button:has-text("Tambah")', 'button:has-text("Add")'];
    
    for (const selector of createSelectors) {
      try {
        const btn = await page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 })) {
          await btn.click();
          console.log('   Create clicked!');
          await page.waitForTimeout(3000);
          break;
        }
      } catch (e) {}
    }

    // 9. Get form fields
    console.log('\n7. Analyzing form...');
    const formInfo = await page.evaluate(() => {
      const fields = [];
      const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
      inputs.forEach(input => {
        if (input.offsetParent !== null || input.type === 'hidden') {
          const label = input.closest('[class*="field"], [class*="control"]')?.querySelector('label, span')?.textContent?.trim() ||
                        input.placeholder || input.name || input.id || '';
          fields.push({
            type: input.type || input.tagName,
            label: label,
            required: input.required || label.includes('*'),
            visible: input.offsetParent !== null
          });
        }
      });
      
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t);
      const modals = document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="Modal"]').length;
      
      return { fields, buttons, modals };
    });

    console.log('   Fields:', formInfo.fields.length);
    formInfo.fields.filter(f => f.visible).forEach((f, i) => {
      const req = f.required ? '🔴' : '🟡';
      console.log(`   ${req} [${f.type}] ${f.label}`);
    });
    console.log('   Buttons:', formInfo.buttons.slice(0, 10).join(', '));
    console.log('   Modals:', formInfo.modals);

    // 10. Save and get results
    console.log('\n8. Saving...');
    const saveSelectors = ['button:has-text("Save")', 'button:has-text("Simpan")'];
    for (const selector of saveSelectors) {
      try {
        const btn = await page.locator(selector).first();
        if (await btn.isVisible({ timeout: 1000 })) {
          await btn.click();
          console.log('   Save clicked!');
          await page.waitForTimeout(3000);
          break;
        }
      } catch (e) {}
    }

    // 11. Check errors
    console.log('\n9. Results:');
    const results = await page.evaluate(() => {
      return {
        errors: Array.from(document.querySelectorAll('[class*="error"], .Mui-error')).map(e => e.textContent?.trim()).filter(t => t && t.length < 300),
        toasts: Array.from(document.querySelectorAll('[class*="toast"], .MuiSnackbar')).map(t => t.textContent?.trim()).filter(t => t && t.length < 300),
        tableRows: document.querySelectorAll('table tbody tr').length
      };
    });
    console.log('   Errors:', results.errors.slice(0, 5));
    console.log('   Toasts:', results.toasts.slice(0, 3));
    console.log('   Table rows:', results.tableRows);

    // Save findings
    const findings = {
      timestamp: new Date().toISOString(),
      targetUrl: '/system-setup/billing-item',
      currentUrl,
      pageInfo,
      formFields: formInfo.fields,
      createClicked: formInfo.modals > 0,
      errors: results.errors,
      tableRows: results.tableRows,
      apiCalls: apiCalls.filter(c => c.url)
    };

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'transaction-mapping-findings.json'), JSON.stringify(findings, null, 2));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'transaction-mapping-api.json'), JSON.stringify(apiCalls.filter(c => c.url), null, 2));

    console.log('\n✅ Done!');
    return findings;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'transaction-mapping-error.json'), JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    return { error: error.message };
  } finally {
    await browser.close();
  }
}

explore().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
