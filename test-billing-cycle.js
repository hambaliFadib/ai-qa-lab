const { chromium } = require('./01-runtime/runtime/node_modules/playwright');

(async () => {
  console.log('Connecting to CDP browser...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0] || await context.newPage();
  
  console.log('Navigating to Billing Cycle...');
  await page.goto('https://dev-energy.pgn.co.id/system-setup/billing-cycle', { timeout: 30000 });
  await page.waitForLoadState('networkidle');
  
  console.log('Page title:', await page.title());
  console.log('URL:', page.url());
  
  // Check for main content
  const hasContent = await page.locator('.ant-layout, .ant-table, .ant-btn').count();
  console.log('Main elements found:', hasContent);
  
  await browser.close();
  console.log('Done');
})();
