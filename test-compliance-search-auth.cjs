const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  const consoleWarnings = [];
  const consoleLogs = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    } else {
      consoleLogs.push(msg.text().substring(0, 200)); // Truncate long logs
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(`Page Error: ${error.message}`);
  });

  console.log('=== COMPLIANCE SEARCH FUNCTIONALITY TEST ===\n');

  try {
    // First, navigate to the auth page since compliance requires authentication
    console.log('1. Navigating to http://localhost:5173/compliance?tab=search...');
    await page.goto('http://localhost:5173/compliance?tab=search', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    if (currentUrl.includes('/auth')) {
      console.log('   (Page redirected to auth - authentication required)');
      console.log('\n2. Taking screenshot of auth page...');
      await page.screenshot({ path: '/tmp/compliance-auth-desktop.png', fullPage: true });

      // Check for any errors on auth page itself
      console.log('   Checking auth page for errors...\n');
    }

    // Now let's directly test by injecting a mock session or checking for the compliance components
    // First, let's see what the auth page looks like and check for errors
    console.log('3. Checking for JavaScript errors on page...\n');

    // Report console errors
    console.log('--- Console Errors ---');
    if (consoleErrors.length === 0) {
      console.log('   No console errors detected');
    } else {
      consoleErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    }

    console.log('\n--- Console Warnings ---');
    if (consoleWarnings.length === 0) {
      console.log('   No console warnings detected');
    } else {
      consoleWarnings.slice(0, 10).forEach((warn, i) => console.log(`   ${i + 1}. ${warn}`));
    }

    // Test mobile viewport
    console.log('\n4. Testing mobile viewport (375px)...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/compliance-auth-mobile.png', fullPage: true });

    // Get page title
    const pageTitle = await page.title();
    console.log(`\n5. Page title: ${pageTitle}`);

    // Check what elements are present
    console.log('\n6. Checking page structure...');
    const bodyText = await page.textContent('body');
    console.log(`   Page contains ~${bodyText.length} characters of text`);

    // Check for specific compliance-related elements
    const hasComplianceTab = await page.$('[data-value="search"], [value="search"]');
    const hasSearchInput = await page.$('input[type="search"], input[type="text"]');
    console.log(`   Has compliance search tab: ${!!hasComplianceTab}`);
    console.log(`   Has search input: ${!!hasSearchInput}`);

    // Check if there's a loading spinner
    const hasSpinner = await page.$('.animate-spin, [class*="spin"]');
    console.log(`   Has loading spinner: ${!!hasSpinner}`);

    console.log('\n=== TEST COMPLETE ===');
    console.log('\nScreenshots saved to:');
    console.log('  - /tmp/compliance-auth-desktop.png');
    console.log('  - /tmp/compliance-auth-mobile.png');

    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total console errors: ${consoleErrors.length}`);
    console.log(`Total console warnings: ${consoleWarnings.length}`);
    if (currentUrl.includes('/auth')) {
      console.log('\nNOTE: Page requires authentication. To test compliance search:');
      console.log('  - Log in via the UI, or');
      console.log('  - Set up test credentials in the test script');
    }

  } catch (error) {
    console.error('\nTest failed with error:', error.message);
    console.error('Stack:', error.stack);
    try {
      await page.screenshot({ path: '/tmp/compliance-search-error.png', fullPage: true });
      console.log('Error screenshot saved to /tmp/compliance-search-error.png');
    } catch (screenshotErr) {
      console.error('Could not take error screenshot:', screenshotErr.message);
    }
  }

  await browser.close();
})();
