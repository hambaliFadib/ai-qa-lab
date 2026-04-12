const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const authPath = 'D:\\AI-QA-LAB\\PGN-BILLING-AI-QA\\01-playground\\auth\\state\\dev-energy-auth.json';
  const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  
  // Set cookies
  await context.addCookies(auth.cookies);
  
  // Get page and intercept API calls
  const page = await context.newPage();
  const apiCalls = [];
  
  page.on('request', request => {
    if (request.url().includes('/api') || request.url().includes('/rest')) {
      apiCalls.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api') || response.url().includes('/rest')) {
      const existing = apiCalls.find(c => c.url === response.url() && c.timestamp === response.request().timing().startTime);
      if (existing) {
        existing.status = response.status();
        existing.statusText = response.statusText();
      }
    }
  });
  
  // Set localStorage
  await page.addInitScript(auth => {
    if (auth && auth.origins) {
      auth.origins.forEach(origin => {
        if (origin.origin === 'https://dev-energy.pgn.co.id') {
          origin.localStorage.forEach(item => {
            localStorage.setItem(item.name, item.value);
          });
        }
      });
    }
  }, auth);
  
  // Navigate to target URL
  console.log('Navigating to /system-setup/billing-item...');
  await page.goto('https://dev-energy.pgn.co.id/system-setup/billing-item');
  await page.waitForLoadState('networkidle');
  
  // Handle session warning
  let sessionExpired = false;
  try {
    const warningModal = await page.locator('text=being used by other user').first();
    if (await warningModal.isVisible({ timeout: 3000 })) {
      console.log('Session warning modal detected');
      await page.click('button:has-text("OK")');
      await page.waitForLoadState('networkidle');
      console.log('Current URL after modal:', page.url());
      if (page.url().includes('/login')) {
        sessionExpired = true;
        console.log('SESSION_EXPIRED - Redirected to login');
      }
    }
  } catch (e) {
    console.log('No session warning modal');
  }
  
  if (sessionExpired) {
    console.log('SESSION_EXPIRED');
    await browser.close();
    process.exit(1);
  }
  
  // Wait for table to load
  await page.waitForSelector('table', { timeout: 10000 });
  
  // Get table info
  const columns = await page.evaluate(() => {
    const headers = document.querySelectorAll('table thead th');
    return Array.from(headers).map(h => h.textContent.trim());
  });
  const rowCount = await page.locator('table tbody tr').count();
  console.log('Table columns:', columns);
  console.log('Table row count:', rowCount);
  
  // Find and click Create button
  console.log('Looking for Create button...');
  
  // Get all buttons on page first
  const allButtons = await page.locator('button').all();
  console.log('Total buttons found:', allButtons.length);
  for (let i = 0; i < allButtons.length; i++) {
    const text = await allButtons[i].textContent();
    const ariaLabel = await allButtons[i].getAttribute('aria-label');
    const title = await allButtons[i].getAttribute('title');
    console.log(`Button ${i}: text="${text.trim()}" aria-label="${ariaLabel}" title="${title}"`);
  }
  
  // Also check for links and clickable elements that might be "Create"
  const allLinks = await page.locator('a').all();
  console.log('Total links found:', allLinks.length);
  
  // Let's look specifically for Ant Design buttons - they might be inside specific containers
  // Look for the action bar / toolbar area specifically
  const toolbarButtons = await page.evaluate(() => {
    // Search for buttons in various potential toolbar locations
    const results = [];
    
    // Check ant-btn class
    document.querySelectorAll('.ant-btn').forEach(btn => {
      results.push({
        class: btn.className,
        text: btn.textContent?.trim(),
        html: btn.outerHTML.substring(0, 300)
      });
    });
    
    // Check for any button in a toolbar-like container
    document.querySelectorAll('.ant-table-toolbar, .toolbar, .actions, [class*="toolbar"]').forEach(container => {
      container.querySelectorAll('button').forEach(btn => {
        results.push({
          containerClass: container.className,
          text: btn.textContent?.trim(),
          html: btn.outerHTML.substring(0, 300)
        });
      });
    });
    
    return results;
  });
  console.log('Toolbar buttons:', JSON.stringify(toolbarButtons, null, 2));
  
  // Check role=button elements more carefully
  const actionButtonsWithInfo = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('[role="button"]').forEach((el, i) => {
      results.push({
        tag: el.tagName,
        class: el.className,
        text: el.textContent?.trim().substring(0, 50),
        ariaLabel: el.getAttribute('aria-label'),
        title: el.getAttribute('title')
      });
    });
    return results;
  });
  console.log('Role=button elements:', JSON.stringify(actionButtonsWithInfo, null, 2));
  
  // Also look for floating action buttons or toolbar buttons
  const fabButtons = await page.locator('[class*="fab"], [class*="FAB"], [class*="toolbar"] button').all();
  console.log('FAB/Toolbar buttons:', fabButtons.length);
  
  // Look for any element with data attributes or specific roles
  const actionButtons = await page.locator('[role="button"]').all();
  console.log('Elements with role=button:', actionButtons.length);
  
  // Check page HTML structure for the action area
  const pageStructure = await page.evaluate(() => {
    // Find any section or div that might contain action buttons
    const possibleContainers = document.querySelectorAll('header, .header, .toolbar, .actions, .action-bar, [class*="header"], [class*="toolbar"]');
    const structure = [];
    possibleContainers.forEach((el, i) => {
      structure.push({
        tag: el.tagName,
        class: el.className,
        innerHTML: el.innerHTML.substring(0, 200)
      });
    });
    return structure;
  });
  console.log('Page structure sections:', JSON.stringify(pageStructure, null, 2));
  
  // Scroll to top and try finding button again
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  
  // Check if there's a "Add" button (English) or "Tambah" (Indonesian)
  const addBtn = page.locator('text=Add');
  if (await addBtn.count() > 0) {
    console.log('Found Add button');
    await addBtn.first().click();
  } else {
    console.log('No Add button found, checking for any clickable...');
    // Last resort - look for any icon-only buttons or spans
    const iconButtons = await page.locator('[class*="icon"]').all();
    console.log('Icon elements:', iconButtons.length);
  }
  
  // Try different button selectors
  const createBtn = page.locator('button:has-text("Create"), button:has-text("Tambah"), button:has-text("+ Tambah"), button:has-text("+ Create")');
  await createBtn.first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Document form fields
  const formFields = await page.evaluate(() => {
    const fields = [];
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const id = input.id || input.name || '';
      const label = document.querySelector(`label[for="${id}"], label:has([for="${id}"])`) || 
        (input.parentElement?.previousElementSibling?.tagName === 'LABEL' ? input.parentElement.previousElementSibling : null);
      const labelText = label ? label.textContent.trim() : '';
      const required = input.hasAttribute('required') || labelText.includes('*') || labelText.includes('wajib');
      fields.push({
        name: id || input.name,
        label: labelText,
        type: input.type || input.tagName.toLowerCase(),
        required: required
      });
    });
    return fields;
  });
  
  console.log('Form fields found:', JSON.stringify(formFields, null, 2));
  
  // Get all labels with their inputs for better mapping
  const allLabels = await page.evaluate(() => {
    const result = [];
    const labelElements = document.querySelectorAll('label, .label, .form-label, [class*="label"]');
    labelElements.forEach(l => {
      result.push({
        text: l.textContent.trim(),
        htmlFor: l.htmlFor
      });
    });
    return result;
  });
  console.log('All labels:', allLabels.slice(0, 30));
  
  // Try minimal save - fill only required fields
  console.log('Attempting minimal save...');
  
  // Fill text inputs that are required
  const requiredInputs = await page.locator('input[required], input[aria-required="true"]').all();
  for (const input of requiredInputs) {
    try {
      await input.fill('Test ' + Date.now());
    } catch (e) {
      console.log('Could not fill required input');
    }
  }
  
  // Select first option for dropdowns that are required
  const requiredSelects = await page.locator('select[required], select[aria-required="true"]').all();
  for (const select of requiredSelects) {
    try {
      await select.focus();
      await page.waitForTimeout(500);
      const options = await select.locator('option').count();
      if (options > 1) {
        await select.selectOption({ index: 1 });
        console.log('Selected first option in required select');
      }
    } catch (e) {
      console.log('Could not select in required select');
    }
  }
  
  // Click Save button
  const saveBtn = page.locator('button:has-text("Save"), button:has-text("Simpan"), button[type="submit"]');
  await saveBtn.first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Check for errors, toasts, validation
  let validationErrors = [];
  try {
    const errorMessages = await page.locator('.error, .invalid, [class*="error"], .text-danger').all();
    for (const err of errorMessages) {
      if (await err.isVisible()) {
        validationErrors.push(await err.textContent());
      }
    }
  } catch (e) {}
  
  let toasts = [];
  try {
    const toastElements = await page.locator('[class*="toast"], .notification, .alert').all();
    for (const toast of toastElements) {
      if (await toast.isVisible()) {
        toasts.push(await toast.textContent());
      }
    }
  } catch (e) {}
  
  // Check if save was successful
  const currentUrl = page.url();
  const newRowCount = await page.locator('table tbody tr').count();
  const success = !currentUrl.includes('/create') && !currentUrl.includes('/add') && newRowCount > rowCount;
  
  console.log('Save result:', { success, validationErrors, toasts, newRowCount, oldRowCount: rowCount });
  
  // Save API calls
  const apiOutput = {
    timestamp: new Date().toISOString(),
    targetUrl: 'https://dev-energy.pgn.co.id/system-setup/billing-item',
    apiCalls: apiCalls
  };
  
  fs.writeFileSync('D:\\AI-QA-LAB\\PGN-BILLING-AI-QA\\01-playground\\artifacts\\adhoc-notes\\tx-api.json', JSON.stringify(apiOutput, null, 2));
  
  // Generate markdown report
  const mdReport = `# Transaction Mapping Create Flow

## Test Date: ${new Date().toISOString()}

### 1. Session Handling
- Session Warning Handled: ${!sessionExpired ? 'Yes' : 'No'}
- Status: ${sessionExpired ? 'SESSION_EXPIRED' : 'OK'}

### 2. Table Information
- **Columns:** ${columns.join(', ')}
- **Row Count:** ${rowCount}

### 3. Create Form Fields
${formFields.map(f => `- **${f.label || f.name}**: type=${f.type}, required=${f.required}`).join('\n')}

### 4. All Labels Found
${allLabels.slice(0, 30).map(l => `- ${l.text}`).join('\n')}

### 5. Minimal Save Attempt
- **Success:** ${success ? 'YES' : 'NO'}
- **Row Count Before:** ${rowCount}
- **Row Count After:** ${newRowCount}

### 6. Validation Errors
${validationErrors.length > 0 ? validationErrors.map(e => `- ${e}`).join('\n') : 'None'}

### 7. Toasts/Notifications
${toasts.length > 0 ? toasts.map(t => `- ${t}`).join('\n') : 'None'}

### 8. API Calls Captured
- Total: ${apiCalls.length}
${apiCalls.map(a => `- ${a.method} ${a.url}`).join('\n')}

## Notes
`;
  
  fs.writeFileSync('D:\\AI-QA-LAB\\PGN-BILLING-AI-QA\\01-playground\\artifacts\\adhoc-notes\\transaction-mapping-create.md', mdReport);
  
  console.log('Test completed. Results saved.');
  await browser.close();
})();
