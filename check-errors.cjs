const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Collect all console messages and errors
  const messages = [];

  page.on('console', msg => {
    messages.push({
      type: msg.type(),
      text: msg.text(),
      args: msg.args()
    });
  });

  page.on('pageerror', error => {
    messages.push({
      type: 'pageerror',
      text: error.message,
      stack: error.stack
    });
  });

  // Navigate to the page
  try {
    await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded', timeout: 10000 });
  } catch (e) {
    console.log('Navigation error:', e.message);
  }

  // Wait for potential async errors
  await page.waitForTimeout(3000);

  // Print all messages
  console.log('\n=== ALL CONSOLE OUTPUT ===\n');
  for (const msg of messages) {
    console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
    if (msg.stack) {
      console.log('Stack:', msg.stack);
    }
  }

  // Check for specific Supabase issues
  const supabaseCheck = await page.evaluate(() => {
    // Check if environment variables are defined (this runs in browser context)
    try {
      const hasImportMeta = typeof window !== 'undefined' && window.import && window.import.meta;
      return {
        hasWindow: typeof window !== 'undefined',
        hasImportMeta: hasImportMeta,
        error: null
      };
    } catch (e) {
      return { error: e.toString() };
    }
  });

  console.log('\n=== SUPABASE CONFIGURATION ===');
  console.log(supabaseCheck);

  // Try to get any React error messages
  const reactErrors = await page.evaluate(() => {
    const root = document.getElementById('root');
    const errorDiv = document.querySelector('[class*="error"]');
    return {
      rootExists: !!root,
      rootHTML: root ? root.innerHTML.substring(0, 500) : null,
      errorFound: !!errorDiv,
      errorText: errorDiv ? errorDiv.textContent : null
    };
  });

  console.log('\n=== REACT RENDER STATE ===');
  console.log(reactErrors);

  await browser.close();
})();