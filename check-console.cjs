const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  // Navigate to the page
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });

  // Wait a bit for any async errors
  await page.waitForTimeout(2000);

  // Print all console messages
  console.log('\n=== CONSOLE MESSAGES ===\n');
  for (const msg of consoleMessages) {
    if (msg.type === 'error' || msg.type === 'warning') {
      console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
      if (msg.location.url) {
        console.log(`  at ${msg.location.url}:${msg.location.lineNumber}`);
      }
    }
  }

  // Take screenshot
  await page.screenshot({ path: 'page-state.png' });
  console.log('\nScreenshot saved as page-state.png');

  // Check if the root element has any content
  const rootContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      hasRoot: !!root,
      innerHTML: root ? root.innerHTML.substring(0, 200) : null,
      childCount: root ? root.children.length : 0
    };
  });

  console.log('\n=== ROOT ELEMENT STATE ===');
  console.log(rootContent);

  await browser.close();
})();