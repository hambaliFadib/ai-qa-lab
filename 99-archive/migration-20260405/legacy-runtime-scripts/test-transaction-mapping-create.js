const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const AUTH_FILE = 'D:\\AI-QA-LAB\\PGN-BILLING-AI-QA\\01-playground\\auth\\state\\dev-energy-auth.json';
const TARGET_URL = 'https://dev-energy.pgn.co.id/system-setup/billing-item';
const OUTPUT_DIR = 'D:\\AI-QA-LAB\\PGN-BILLING-AI-QA\\01-playground\\artifacts\\adhoc-notes';

// API calls collector
let apiCalls = [];

async function runTest() {
    console.log('=== Starting Transaction Mapping Create Test ===\n');
    
    // Read auth file
    const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
    console.log('✓ Auth file loaded');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    
    // Set cookies
    for (const cookie of authData.cookies) {
        await context.addCookies([cookie]);
    }
    console.log('✓ Cookies set');
    
    // Set localStorage
    const page = await context.newPage();
    
    // Capture all API calls
    await page.route('**/*', async route => {
        const request = route.request();
        const url = request.url();
        const method = request.method();
        const resourceType = request.resourceType();
        
        // Only capture API calls (XHR/fetch)
        if (resourceType === 'xhr' || resourceType === 'fetch' || url.includes('/api/')) {
            let postData = null;
            if (method === 'POST' || method === 'PUT') {
                try {
                    postData = request.postData();
                } catch (e) {}
            }
            
            apiCalls.push({
                timestamp: new Date().toISOString(),
                url: url,
                method: method,
                resourceType: resourceType,
                postData: postData
            });
        }
        
        await route.continue();
    });
    
    // Navigate to target URL
    console.log(`\n→ Navigating to ${TARGET_URL}`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log(`Current URL: ${page.url()}`);
    
    // ===== STEP 1: Handle Session Warning Modal =====
    console.log('\n=== Handling Session Warning Modal ===');
    
    let sessionConflict = false;
    let modalDismissed = false;
    
    try {
        // Look for modal with "being used by other user"
        const modal = await page.waitForSelector('.ant-modal', { timeout: 3000 }).catch(() => null);
        
        if (modal) {
            const modalText = await modal.textContent();
            console.log(`Modal detected: ${modalText.substring(0, 100)}...`);
            
            if (modalText.includes('being used by other user') || modalText.includes('user is being used')) {
                sessionConflict = true;
                console.log('⚠️ Session conflict detected!');
                
                // Click OK button
                const okButton = await page.locator('.ant-modal button.ant-btn-primary, .ant-modal button:has-text("OK"), .ant-modal button:has-text("Ok")').first();
                await okButton.click();
                console.log('✓ OK button clicked');
                
                await page.waitForTimeout(2000);
                modalDismissed = true;
                
                // Check if redirected to login
                console.log(`URL after modal dismiss: ${page.url()}`);
                
                if (page.url().includes('/login') || page.url().includes('auth')) {
                    console.log('❌ SESSION_CONFLICT: Redirected to login page');
                    await browser.close();
                    return { status: 'SESSION_CONFLICT', message: 'Redirected to login after dismissing modal' };
                }
            }
        }
    } catch (e) {
        console.log('No session warning modal detected');
    }
    
    if (!sessionConflict) {
        console.log('✓ No session warning modal');
    }
    
    // ===== STEP 2: Analyze Table =====
    console.log('\n=== Analyzing Table ===');
    
    // Wait for table to load
    await page.waitForSelector('.ant-table', { timeout: 10000 }).catch(() => null);
    await page.waitForTimeout(1000);
    
    // Get column headers
    const headers = await page.locator('.ant-table-thead th').allTextContents();
    console.log('Table Columns:', headers.filter(h => h.trim()));
    
    // Get row count
    const rows = await page.locator('.ant-table-tbody tr.ant-table-row').count();
    console.log(`Table Row Count: ${rows}`);
    
    // ===== STEP 3: Find Create Button =====
    console.log('\n=== Finding Create Button ===');
    
    // Look for create buttons with various text
    const createButtonSelectors = [
        'button:has-text("Create")',
        'button:has-text("Tambah")',
        'button:has-text("Add")',
        'button:has-text("Baru")',
        'button[aria-label="Create"]',
        '.ant-btn-primary:has-text("Create")',
        '.ant-btn-primary:has-text("Tambah")',
        '.ant-btn-primary:has-text("Add")',
        'button.ant-btn-primary'
    ];
    
    let createButton = null;
    let createButtonText = '';
    
    for (const selector of createButtonSelectors) {
        try {
            const button = page.locator(selector).first();
            const isVisible = await button.isVisible().catch(() => false);
            if (isVisible) {
                createButton = button;
                createButtonText = await button.textContent();
                console.log(`Found create button: ${selector} -> "${createButtonText.trim()}"`);
                break;
            }
        } catch (e) {}
    }
    
    // If not found, look in toolbar
    if (!createButton) {
        const toolbarButtons = await page.locator('.ant-toolbar button, .ant-card-head button').all();
        for (const btn of toolbarButtons) {
            const text = await btn.textContent();
            if (text.toLowerCase().includes('create') || text.toLowerCase().includes('tambah') || text.toLowerCase().includes('add')) {
                createButton = btn;
                createButtonText = text;
                console.log(`Found in toolbar: "${text.trim()}"`);
                break;
            }
        }
    }
    
    if (!createButton) {
        console.log('❌ Create button not found');
        await browser.close();
        return { status: 'ERROR', message: 'Create button not found' };
    }
    
    // ===== STEP 4: Click Create =====
    console.log('\n=== Clicking Create Button ===');
    await createButton.click();
    
    // Wait for modal/form to open
    await page.waitForTimeout(2000);
    
    // Check if modal opened
    const modalForm = await page.locator('.ant-modal, .ant-drawer, [class*="modal"], [class*="form"]').first();
    const isModalOpen = await modalForm.isVisible().catch(() => false);
    console.log(`Form modal visible: ${isModalOpen}`);
    
    // ===== STEP 5: Document Form Fields =====
    console.log('\n=== Documenting Form Fields ===');
    
    const formFields = [];
    
    // Get all form inputs
    const inputs = await page.locator('.ant-form-item, .ant-input, .ant-select, input[type="text"], input[type="date"], textarea').all();
    
    // Look for form labels
    const labels = await page.locator('.ant-form-item-label label, .ant-form-item-label, label').allTextContents();
    console.log('Form labels found:', labels.filter(l => l.trim()));
    
    // Get all input fields
    const allInputs = await page.locator('input, select, textarea').all();
    console.log(`Total input elements: ${allInputs.length}`);
    
    for (const input of allInputs) {
        try {
            const isVisible = await input.isVisible().catch(() => false);
            if (!isVisible) continue;
            
            const inputType = await input.getAttribute('type').catch(() => 'text');
            const name = await input.getAttribute('name').catch(() => '');
            const id = await input.getAttribute('id').catch(() => '');
            const placeholder = await input.getAttribute('placeholder').catch(() => '');
            const required = await input.getAttribute('aria-required').catch(() => null);
            
            // Find associated label
            let labelText = '';
            const parent = await input.locator('..').first();
            const labelEl = await parent.locator('label').first();
            labelText = await labelEl.textContent().catch(() => '');
            
            if (!labelText) {
                const formItem = await input.locator('.ant-form-item').first();
                labelText = await formItem.locator('.ant-form-item-label label').textContent().catch(() => '');
            }
            
            formFields.push({
                type: inputType,
                name: name,
                id: id,
                placeholder: placeholder,
                required: required !== null,
                label: labelText.trim()
            });
        } catch (e) {
            // Skip problematic inputs
        }
    }
    
    console.log('\nForm Fields Found:');
    formFields.forEach((field, i) => {
        console.log(`  ${i + 1}. [${field.type}] ${field.label || field.name || field.id} ${field.required ? '(REQUIRED)' : ''}`);
    });
    
    // ===== STEP 6: Try Minimal Save =====
    console.log('\n=== Attempting Minimal Save ===');
    
    // Fill only required fields (try first)
    const mandatoryFields = formFields.filter(f => f.required || f.label.includes('*'));
    console.log(`Mandatory fields: ${mandatoryFields.length}`);
    
    // Try to fill fields
    for (const field of formFields.slice(0, 5)) { // Try first few fields
        if (field.type === 'hidden') continue;
        
        try {
            const input = page.locator(`input[name="${field.name}"], input[id="${field.id}"], #${field.id}`).first();
            if (await input.isVisible().catch(() => false)) {
                if (field.type === 'select' || field.placeholder?.includes('Select') || field.label.toLowerCase().includes('select')) {
                    // For dropdowns, click to open then select first option
                    await input.click();
                    await page.waitForTimeout(500);
                    const firstOption = await page.locator('.ant-select-dropdown .ant-select-item-option').first();
                    if (await firstOption.isVisible().catch(() => false)) {
                        await firstOption.click();
                        console.log(`  ✓ Filled dropdown: ${field.label || field.name}`);
                    }
                } else {
                    await input.fill('Test ' + (field.label || field.name));
                    console.log(`  ✓ Filled: ${field.label || field.name}`);
                }
            }
        } catch (e) {
            console.log(`  ⚠️ Could not fill: ${field.label || field.name}`);
        }
    }
    
    // Find and click Save button
    const saveButtonSelectors = [
        'button:has-text("Save")',
        'button:has-text("Simpan")',
        'button[type="submit"]',
        '.ant-modal-footer button.ant-btn-primary',
        '.ant-drawer-footer button.ant-btn-primary'
    ];
    
    let saveButton = null;
    for (const selector of saveButtonSelectors) {
        try {
            saveButton = page.locator(selector).first();
            if (await saveButton.isVisible().catch(() => false)) {
                break;
            }
        } catch (e) {}
    }
    
    if (saveButton) {
        console.log('Clicking Save button...');
        await saveButton.click();
        await page.waitForTimeout(3000);
        
        // Check for validation errors
        const errorMessages = await page.locator('.ant-form-item-explain-error, .ant-message-error').allTextContents();
        if (errorMessages.length > 0) {
            console.log('Validation Errors:');
            errorMessages.forEach(err => console.log(`  - ${err}`));
        }
        
        // Check for success toast
        const successMessage = await page.locator('.ant-message-success, .ant-notification-success').textContent().catch(() => '');
        if (successMessage) {
            console.log(`Success: ${successMessage}`);
        }
    } else {
        console.log('❌ Save button not found');
    }
    
    // Get final URL and page state
    console.log(`\nFinal URL: ${page.url()}`);
    
    // Save API calls to file
    const apiOutputPath = path.join(OUTPUT_DIR, 'transaction-mapping-api-calls.json');
    fs.writeFileSync(apiOutputPath, JSON.stringify(apiCalls, null, 2));
    console.log(`\n✓ API calls saved to ${apiOutputPath}`);
    console.log(`Total API calls captured: ${apiCalls.length}`);
    
    // Close browser
    await browser.close();
    
    console.log('\n=== Test Complete ===');
    
    return {
        status: 'COMPLETE',
        sessionConflict: sessionConflict,
        modalDismissed: modalDismissed,
        tableColumns: headers,
        tableRows: rows,
        createButtonText: createButtonText,
        formFields: formFields,
        apiCallsCount: apiCalls.length
    };
}

runTest().then(result => {
    console.log('\n=== FINAL RESULT ===');
    console.log(JSON.stringify(result, null, 2));
    
    // Write result to file
    const outputPath = path.join(OUTPUT_DIR, 'transaction-mapping-create-v3.md');
    const mdContent = `# Transaction Mapping Create Flow Test Result

**Date:** ${new Date().toISOString()}  
**Target URL:** ${TARGET_URL}  
**Status:** ${result.status}

---

## Session Handling

| Item | Status | Notes |
|------|--------|-------|
| Session Conflict Modal | ${result.sessionConflict ? '⚠️ Appeared' : '✓ Not shown'} | ${result.sessionConflict ? 'Clicked OK' : 'No modal'} |
| Redirect to Login | ${result.modalDismissed && !result.status.includes('CONFLICT') ? '✓ No' : 'N/A'} | After dismissing modal |
| Modal Dismissed | ${result.modalDismissed ? '✓ Yes' : 'N/A'} | - |

---

## Table Analysis

**Columns:** ${result.tableColumns?.join(', ') || 'N/A'}
**Row Count:** ${result.tableRows || 0}

---

## Create Button

| Property | Value |
|----------|-------|
| Button Text | ${result.createButtonText || 'Not found'} |
| Status | ${result.createButtonText ? '✅ Found' : '❌ Not found'} |

---

## Form Fields

| # | Field Type | Label/Name | Required |
|---|------------|------------|----------|
${result.formFields?.map((f, i) => `${i + 1} | ${f.type} | ${f.label || f.name || f.id} | ${f.required ? '✅' : '❌'}`).join('\n') || 'No fields documented'}

---

## Save Attempt

| Step | Status |
|------|--------|
| Fill Fields | Attempted |
| Click Save | ${result.formFields?.length > 0 ? 'Attempted' : 'Not reached'} |
| Validation Errors | Check console |
| Success/Toast | Check console |

---

## API Calls

**Total Captured:** ${result.apiCallsCount}

All API calls saved to: \`transaction-mapping-api-calls.json\`

---

## Test Status

\`\`\`
${JSON.stringify(result, null, 2)}
\`\`\`
`;
    
    fs.writeFileSync(outputPath, mdContent);
    console.log(`✓ Report saved to ${outputPath}`);
}).catch(err => {
    console.error('Test failed:', err);
});
