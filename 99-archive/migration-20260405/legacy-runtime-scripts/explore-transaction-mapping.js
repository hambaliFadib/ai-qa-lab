const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const AUTH_FILE = path.join(__dirname, 'auth', 'state', 'dev-energy-auth.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'artifacts', 'adhoc-notes');
const API_OUTPUT = path.join(__dirname, '..', '.opencode', 'api-discovery');

async function exploreTransactionMapping() {
  console.log('🚀 Starting Transaction Mapping Exploration...\n');

  const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  const apiCalls = [];
  const page = await context.newPage();

  // Capture network requests
  page.on('request', request => {
    const url = request.url();
    if (url.includes('pgn.co.id') || url.includes('localhost')) {
      apiCalls.push({
        timestamp: new Date().toISOString(),
        method: request.method(),
        url: url,
        postData: request.postData()
      });
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('pgn.co.id') || url.includes('localhost')) {
      const existing = apiCalls.find(c => c.url === url);
      if (existing) {
        existing.status = response.status();
        existing.statusText = response.statusText();
      }
    }
  });

  try {
    // 1. Go to the application
    console.log('📍 Step 1: Loading application...');
    await page.goto('https://dev-energy.pgn.co.id', { waitUntil: 'networkidle' });
    
    // 2. Set cookies from auth file
    console.log('🔐 Step 2: Applying session cookies...');
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
    
    // 3. Set localStorage token
    console.log('🔑 Step 3: Setting access token...');
    const tokenEntry = authData.origins[0].localStorage.find(l => l.name === 'token');
    if (tokenEntry) {
      await page.evaluate((token) => {
        localStorage.setItem('token', token);
      }, tokenEntry.value);
    }

    // 4. Reload to apply session
    console.log('🔄 Step 4: Reloading with session...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check if redirected to login
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('login') || currentUrl.includes('auth')) {
      throw new Error('SESSION_EXPIRED: Redirected to login page');
    }

    // 5. Navigate to System Setup menu
    console.log('📂 Step 5: Navigating to System Setup...');
    
    // Try to find and click System Setup
    const systemSetupSelectors = [
      'text=System Setup',
      'text=System',
      '[data-menu="system-setup"]',
      'a[href*="system-setup"]'
    ];
    
    let foundSystemSetup = false;
    for (const selector of systemSetupSelectors) {
      try {
        const el = await page.locator(selector).first();
        if (await el.isVisible({ timeout: 2000 })) {
          await el.click();
          foundSystemSetup = true;
          console.log('   ✅ Found System Setup');
          break;
        }
      } catch (e) {}
    }
    
    if (!foundSystemSetup) {
      // Try to find any expandable menu
      console.log('   🔍 Looking for menu items...');
      const menuItems = await page.locator('nav li, aside li, .menu-item, [role="menuitem"]').allTextContents();
      console.log('   Available menu items:', menuItems.slice(0, 20));
    }

    await page.waitForTimeout(2000);

    // 6. Navigate to Master Data
    console.log('📂 Step 6: Navigating to Master Data...');
    const masterDataSelectors = [
      'text=Master Data',
      'text=Master',
      '[data-menu="master-data"]'
    ];
    
    for (const selector of masterDataSelectors) {
      try {
        const el = await page.locator(selector).first();
        if (await el.isVisible({ timeout: 2000 })) {
          await el.click();
          console.log('   ✅ Found Master Data');
          break;
        }
      } catch (e) {}
    }
    
    await page.waitForTimeout(1000);

    // 7. Navigate to Transaction Mapping
    console.log('📂 Step 7: Navigating to Transaction Mapping...');
    const mappingSelectors = [
      'text=Transaction Mapping',
      'text=Mapping',
      '[data-menu="transaction-mapping"]',
      'a[href*="transaction-mapping"]'
    ];
    
    for (const selector of mappingSelectors) {
      try {
        const el = await page.locator(selector).first();
        if (await el.isVisible({ timeout: 2000 })) {
          await el.click();
          console.log('   ✅ Found Transaction Mapping');
          break;
        }
      } catch (e) {}
    }
    
    await page.waitForTimeout(3000);

    // 8. Capture page state
    console.log('\n📊 Step 8: Analyzing page structure...');
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({ tag: h.tagName, text: h.textContent.trim() })),
        buttons: Array.from(document.querySelectorAll('button')).map(b => ({ text: b.textContent.trim(), disabled: b.disabled })),
        inputs: Array.from(document.querySelectorAll('input, textarea, select')).map(i => ({ 
          type: i.type || i.tagName, 
          name: i.name || i.id || i.placeholder,
          required: i.required || i.hasAttribute('aria-required')
        })),
        labels: Array.from(document.querySelectorAll('label, [class*="label"], [class*="field"]')).map(l => l.textContent.trim()).filter(t => t),
        tables: document.querySelectorAll('table').length,
        forms: document.querySelectorAll('form').length
      };
    });
    
    console.log('   Page Title:', pageInfo.title);
    console.log('   Headings:', pageInfo.headings.map(h => h.text).join(', '));
    console.log('   Buttons:', pageInfo.buttons.filter(b => b.text).map(b => b.text).join(', '));
    console.log('   Tables:', pageInfo.tables);

    // 9. Find and click Create button
    console.log('\n🔘 Step 9: Looking for Create button...');
    const createButton = await page.locator('button:has-text("Create"), button:has-text("Tambah"), button:has-text("Add"), button:has-text("Baru"), [data-action="create"]').first();
    
    let createClicked = false;
    if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createButton.click();
      createClicked = true;
      console.log('   ✅ Create button clicked');
      await page.waitForTimeout(2000);
    } else {
      console.log('   ⚠️ Create button not found, searching in modal...');
    }

    // 10. Capture form fields in modal/modal
    console.log('\n📝 Step 10: Analyzing form fields...');
    const formFields = await page.evaluate(() => {
      const fields = [];
      
      // Find all form elements
      const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
      inputs.forEach(input => {
        const label = input.closest('label')?.textContent?.trim() ||
                      input.closest('[class*="field"]')?.querySelector('label')?.textContent?.trim() ||
                      input.name ||
                      input.id ||
                      input.placeholder;
        
        fields.push({
          type: input.type || input.tagName,
          name: input.name || input.id,
          label: label,
          required: input.required || input.hasAttribute('aria-required') || input.closest('[class*="required"]'),
          disabled: input.disabled,
          value: input.value,
          options: input.tagName === 'SELECT' ? 
            Array.from(input.options).map(o => ({ value: o.value, text: o.textContent })) : null
        });
      });
      
      return fields;
    });
    
    console.log('\n📋 Form Fields Found:');
    formFields.forEach((field, i) => {
      const req = field.required ? '🔴' : '🟡';
      console.log(`   ${req} [${field.type}] ${field.label || field.name}`);
      if (field.options) {
        console.log(`      Options: ${field.options.slice(0, 5).map(o => o.text).join(', ')}...`);
      }
    });

    // 11. Identify mandatory fields
    console.log('\n🔴 Identifying Mandatory Fields...');
    const mandatoryFields = formFields.filter(f => f.required || f.label?.includes('*'));
    console.log('   Mandatory:', mandatoryFields.map(f => f.label || f.name).join(', ') || 'None detected');

    // 12. Attempt minimal save
    console.log('\n💾 Step 12: Attempting minimal save...');
    const saveButton = await page.locator('button:has-text("Save"), button:has-text("Simpan"), [data-action="save"]').first();
    
    if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveButton.click();
      console.log('   💾 Save clicked');
      await page.waitForTimeout(3000);
      
      // Check for errors
      const errors = await page.evaluate(() => {
        return {
          validationErrors: Array.from(document.querySelectorAll('[class*="error"], [class*="invalid"], .Mui-error')).map(e => e.textContent),
          toastMessages: Array.from(document.querySelectorAll('[class*="toast"], [role="alert"]')).map(t => t.textContent),
          currentUrl: window.location.href
        };
      });
      
      console.log('   Validation errors:', errors.validationErrors.slice(0, 5));
      console.log('   Toast messages:', errors.toastMessages.slice(0, 5));
    }

    // 13. Check table for data
    console.log('\n📊 Step 13: Checking table for saved data...');
    const tableData = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      return {
        rowCount: rows.length,
        headers: Array.from(document.querySelectorAll('table th')).map(th => th.textContent),
        firstRow: rows[0] ? Array.from(rows[0].querySelectorAll('td')).map(td => td.textContent) : null
      };
    });
    
    console.log('   Table rows:', tableData.rowCount);
    console.log('   Headers:', tableData.headers);

    // Save results
    const results = {
      timestamp: new Date().toISOString(),
      sessionStatus: 'ACTIVE',
      navigationSuccess: true,
      pageInfo,
      formFields,
      mandatoryFields: mandatoryFields.map(f => f.label || f.name),
      apiCalls: apiCalls.filter(c => c.status).slice(0, 50),
      createClicked,
      tableData,
      errors: []
    };

    // Save to files
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'transaction-mapping-raw.json'),
      JSON.stringify(results, null, 2)
    );

    console.log('\n✅ Exploration Complete!');
    console.log(`📁 Results saved to: ${OUTPUT_DIR}/transaction-mapping-raw.json`);
    
    return results;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    const errorResults = {
      timestamp: new Date().toISOString(),
      error: error.message,
      sessionStatus: error.message.includes('login') ? 'EXPIRED' : 'ERROR',
      apiCalls: apiCalls.filter(c => c.status).slice(0, 50)
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

exploreTransactionMapping().then(results => {
  console.log('\n📋 Summary:', JSON.stringify(results, null, 2));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
