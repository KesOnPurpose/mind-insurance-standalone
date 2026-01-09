import { chromium } from 'playwright';

async function testProtocolPage() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navigating to protocol detail page...');

  try {
    await page.goto('http://localhost:8080/mind-insurance/protocol/17041504-a267-4b11-9545-356ec85abdda', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('Page loaded. Taking screenshot...');

    // Take a full page screenshot
    await page.screenshot({
      path: '/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy/protocol-page-screenshot.png',
      fullPage: true
    });

    console.log('Screenshot saved to protocol-page-screenshot.png');

    // Check page title/content
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);

    // Look for the protocol title
    const protocolTitle = await page.locator('h1, h2, h3').first().textContent().catch(() => 'No heading found');
    console.log('First heading found:', protocolTitle);

    // Check for any visible text containing "Breaking" or "Panic"
    const breakingText = await page.locator('text=/Breaking.*Panic/i').count();
    console.log('Found "Breaking...Panic" text occurrences:', breakingText);

    // Check for day elements
    const dayElements = await page.locator('text=/Day\\s*\\d/i').count();
    console.log('Found Day elements:', dayElements);

    // Check for any error messages or auth screens
    const errorText = await page.locator('text=/error|login|sign in|authenticate/i').count();
    console.log('Found error/auth text occurrences:', errorText);

    // Get page URL to confirm navigation
    console.log('Current URL:', page.url());

    // Check console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });

  } catch (error) {
    console.error('Error during test:', error.message);

    // Try to take a screenshot even on error
    try {
      await page.screenshot({
        path: '/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy/protocol-page-error.png',
        fullPage: true
      });
      console.log('Error screenshot saved to protocol-page-error.png');
    } catch (screenshotError) {
      console.error('Could not take error screenshot:', screenshotError.message);
    }
  }

  await browser.close();
  console.log('Test complete.');
}

testProtocolPage();
