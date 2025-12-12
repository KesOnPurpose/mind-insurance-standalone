import { chromium } from 'playwright';

async function testProtocolPage() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  // Collect network failures
  const networkFailures = [];
  page.on('requestfailed', request => {
    networkFailures.push({
      url: request.url(),
      failure: request.failure()?.errorText
    });
  });

  // Collect all network requests
  const networkRequests = [];
  page.on('response', response => {
    networkRequests.push({
      url: response.url(),
      status: response.status()
    });
  });

  console.log('Navigating to protocol detail page...');

  try {
    // Navigate and wait for network to be mostly idle
    await page.goto('http://localhost:8080/mind-insurance/protocol/17041504-a267-4b11-9545-356ec85abdda', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait a bit for React to render
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({
      path: '/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy/protocol-initial.png',
      fullPage: true
    });

    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => {
      console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
    });

    console.log('\n=== NETWORK FAILURES ===');
    if (networkFailures.length === 0) {
      console.log('No network failures detected');
    } else {
      networkFailures.forEach(failure => {
        console.log(`FAILED: ${failure.url} - ${failure.failure}`);
      });
    }

    console.log('\n=== API/SUPABASE REQUESTS ===');
    networkRequests
      .filter(req => req.url.includes('supabase') || req.url.includes('api'))
      .forEach(req => {
        console.log(`[${req.status}] ${req.url.substring(0, 100)}...`);
      });

    // Check page content
    console.log('\n=== PAGE CONTENT ANALYSIS ===');

    // Get all visible text
    const bodyText = await page.locator('body').textContent();
    console.log('Body text length:', bodyText?.length || 0);
    console.log('Body preview:', bodyText?.substring(0, 200) || 'No body text');

    // Check for specific elements
    const loadingSpinner = await page.locator('.animate-spin, [class*="spinner"], [class*="loading"]').count();
    console.log('Loading spinners found:', loadingSpinner);

    const errorElements = await page.locator('[class*="error"], [class*="Error"], .text-red, .text-destructive').count();
    console.log('Error elements found:', errorElements);

    // Check for auth-related elements
    const authElements = await page.locator('text=/sign in|login|authenticate/i').count();
    console.log('Auth-related text found:', authElements);

    // Wait longer and take another screenshot
    console.log('\nWaiting 5 more seconds for data to load...');
    await page.waitForTimeout(5000);

    await page.screenshot({
      path: '/Users/kesonpurpose/Downloads/UIB ASSETS/Cursor App Build/Grouphome App LOVABLE/mindhouse-prodigy/protocol-after-wait.png',
      fullPage: true
    });

    // Check content again
    const bodyTextAfter = await page.locator('body').textContent();
    console.log('\nBody text after wait:', bodyTextAfter?.substring(0, 500) || 'No body text');

    // Check for the specific protocol title
    const hasBreakingPanic = bodyTextAfter?.includes('Breaking') || bodyTextAfter?.includes('Panic');
    console.log('\nContains "Breaking" or "Panic":', hasBreakingPanic);

    console.log('\n=== ALL CONSOLE ERRORS ===');
    consoleMessages
      .filter(msg => msg.type === 'error')
      .forEach(msg => {
        console.log(`ERROR: ${msg.text}`);
      });

  } catch (error) {
    console.error('Error during test:', error.message);
  }

  await browser.close();
  console.log('\nTest complete.');
}

testProtocolPage();
