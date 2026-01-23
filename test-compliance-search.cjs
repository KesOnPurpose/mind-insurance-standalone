const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(`Page Error: ${error.message}`);
  });

  console.log('Navigating to compliance search page...');

  try {
    await page.goto('http://localhost:5173/compliance?tab=search', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('Page loaded. Taking desktop screenshot...');
    await page.screenshot({ path: '/tmp/compliance-search-desktop.png', fullPage: true });

    // Check for search input - using various selectors
    let searchInput = await page.$('input[placeholder*="Search"]');
    if (!searchInput) {
      searchInput = await page.$('input[placeholder*="search"]');
    }
    if (!searchInput) {
      searchInput = await page.$('input[type="search"]');
    }
    if (!searchInput) {
      // Try to find any text input
      searchInput = await page.$('input[type="text"]');
    }

    if (searchInput) {
      console.log('Search input found. Entering query...');
      await searchInput.fill('FHA discrimination protections');
      await page.waitForTimeout(1000);

      // Take screenshot after entering query
      await page.screenshot({ path: '/tmp/compliance-search-query-entered.png', fullPage: true });

      // Look for a search button or press Enter
      let searchButton = await page.$('button:has-text("Search")');
      if (!searchButton) {
        searchButton = await page.$('button[type="submit"]');
      }

      if (searchButton) {
        console.log('Clicking search button...');
        await searchButton.click();
      } else {
        console.log('No search button found, pressing Enter...');
        await searchInput.press('Enter');
      }

      console.log('Search submitted. Waiting for results...');
      await page.waitForTimeout(3000);

      await page.screenshot({ path: '/tmp/compliance-search-results-desktop.png', fullPage: true });
    } else {
      console.log('Search input not found with standard selectors.');
      // List all inputs for debugging
      const allInputs = await page.$$('input');
      console.log(`Found ${allInputs.length} input elements on page`);

      for (let i = 0; i < allInputs.length; i++) {
        const placeholder = await allInputs[i].getAttribute('placeholder');
        const type = await allInputs[i].getAttribute('type');
        console.log(`  Input ${i}: type="${type}", placeholder="${placeholder}"`);
      }
    }

    // Mobile viewport
    console.log('\nTesting mobile viewport...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/compliance-search-mobile.png', fullPage: true });

    // Report console errors
    console.log('\n--- Console Errors ---');
    if (consoleErrors.length === 0) {
      console.log('No console errors detected');
    } else {
      consoleErrors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
    }

    // Get page content for debugging
    const pageTitle = await page.title();
    console.log(`\nPage title: ${pageTitle}`);

    // Check current URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

  } catch (error) {
    console.error('Error during test:', error.message);
    await page.screenshot({ path: '/tmp/compliance-search-error.png', fullPage: true });
  }

  await browser.close();
  console.log('\nTest completed. Screenshots saved to /tmp/');
})();
