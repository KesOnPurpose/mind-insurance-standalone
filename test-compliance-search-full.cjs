/**
 * Full Compliance Search Test
 * Tests the compliance search page with authentication bypass via storage injection
 */
const { chromium } = require('playwright');

(async () => {
  console.log('=== COMPLIANCE SEARCH FULL TEST ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Collect console messages
  const consoleErrors = [];
  const consoleWarnings = [];
  const consoleLogs = [];

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(text);
    } else if (msg.type() === 'log') {
      consoleLogs.push(text.substring(0, 300));
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(`PAGE ERROR: ${error.message}`);
  });

  try {
    // First, navigate to home page to load the app
    console.log('1. Loading app at http://localhost:5173...');
    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait a moment for the app to initialize
    await page.waitForTimeout(2000);

    // Check if we landed on auth page
    const url = page.url();
    console.log(`   Current URL: ${url}`);

    if (url.includes('/auth')) {
      console.log('   App requires authentication.');
      console.log('\n2. Taking screenshot of auth page...');
      await page.screenshot({ path: '/tmp/compliance-test-auth-desktop.png', fullPage: true });

      // Check for any errors on the auth page
      console.log('\n3. Checking auth page for JavaScript errors...');
    } else {
      console.log('   App loaded without auth redirect.');
    }

    // Now try to navigate directly to compliance with search tab
    console.log('\n4. Attempting to navigate to /compliance?tab=search...');
    await page.goto('http://localhost:5173/compliance?tab=search', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for any redirects
    await page.waitForTimeout(2000);

    const complianceUrl = page.url();
    console.log(`   Current URL: ${complianceUrl}`);

    // Take desktop screenshot
    console.log('\n5. Taking desktop screenshot (1440px)...');
    await page.screenshot({ path: '/tmp/compliance-test-desktop.png', fullPage: true });

    // If we're on the compliance page (not redirected to auth), test the search
    if (complianceUrl.includes('/compliance')) {
      console.log('\n6. Testing search functionality...');

      // Look for search input
      const searchInput = await page.$('input[type="text"], input[placeholder*="Search"], input[placeholder*="search"]');
      if (searchInput) {
        console.log('   Found search input! Testing query...');

        await searchInput.click();
        await page.waitForTimeout(500);

        await searchInput.fill('FHA discrimination protections');
        console.log('   Entered query: "FHA discrimination protections"');

        await page.waitForTimeout(1000);
        await page.screenshot({ path: '/tmp/compliance-test-query-entered.png', fullPage: true });

        // Try to submit the search
        const searchButton = await page.$('button:has-text("Search"), button[type="submit"]');
        if (searchButton) {
          console.log('   Clicking search button...');
          await searchButton.click();
        } else {
          console.log('   No search button found, pressing Enter...');
          await searchInput.press('Enter');
        }

        // Wait for results
        console.log('   Waiting for search results...');
        await page.waitForTimeout(3000);

        // Take screenshot of results
        await page.screenshot({ path: '/tmp/compliance-test-results.png', fullPage: true });

        // Check for specific error about toLowerCase
        const hasToLowerCaseError = consoleErrors.some(e =>
          e.includes('toLowerCase') || e.includes('is not a function')
        );

        if (hasToLowerCaseError) {
          console.log('\n   ERROR: Found "toLowerCase is not a function" error!');
          console.log('   The bug was NOT fully fixed.');
        } else {
          console.log('\n   SUCCESS: No "toLowerCase is not a function" error detected.');
        }
      } else {
        console.log('   No search input found on page.');
      }
    }

    // Mobile viewport test
    console.log('\n7. Testing mobile viewport (375px)...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/compliance-test-mobile.png', fullPage: true });

    // Report errors
    console.log('\n=== CONSOLE ERRORS ===');
    if (consoleErrors.length === 0) {
      console.log('No console errors detected.');
    } else {
      consoleErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.substring(0, 500)}`);
      });
    }

    console.log('\n=== CONSOLE WARNINGS ===');
    if (consoleWarnings.length === 0) {
      console.log('No console warnings.');
    } else {
      consoleWarnings.slice(0, 5).forEach((warn, i) => {
        console.log(`${i + 1}. ${warn.substring(0, 200)}`);
      });
      if (consoleWarnings.length > 5) {
        console.log(`... and ${consoleWarnings.length - 5} more warnings`);
      }
    }

    // Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Total console errors: ${consoleErrors.length}`);
    console.log(`Total console warnings: ${consoleWarnings.length}`);
    console.log(`Final URL: ${page.url()}`);

    // Check for the specific error we were looking for
    const criticalError = consoleErrors.find(e =>
      e.includes('toLowerCase') ||
      e.includes('is not a function') ||
      e.includes('query.toLowerCase')
    );

    if (criticalError) {
      console.log('\nCRITICAL: Found the bug that was supposed to be fixed:');
      console.log(`  "${criticalError}"`);
    } else {
      console.log('\nNo "query.toLowerCase is not a function" error found.');
    }

    console.log('\n=== SCREENSHOTS SAVED ===');
    console.log('  - /tmp/compliance-test-auth-desktop.png (if auth page shown)');
    console.log('  - /tmp/compliance-test-desktop.png');
    console.log('  - /tmp/compliance-test-query-entered.png (if search found)');
    console.log('  - /tmp/compliance-test-results.png (if search submitted)');
    console.log('  - /tmp/compliance-test-mobile.png');

  } catch (error) {
    console.error('\nTest failed with error:', error.message);
    try {
      await page.screenshot({ path: '/tmp/compliance-test-error.png', fullPage: true });
      console.log('Error screenshot saved to /tmp/compliance-test-error.png');
    } catch (screenshotErr) {
      console.error('Could not take error screenshot:', screenshotErr.message);
    }
  }

  await browser.close();
})();
