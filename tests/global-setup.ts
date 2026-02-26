import { chromium, type FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Set environment variable to bypass authentication during testing
  process.env['PLAYWRIGHT_TESTING'] = 'true';
  
  console.log('🎭 Playwright Global Setup: Authentication bypass enabled');
  
  // Optionally warm up the server by making a test request
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Test that the server is running and auth bypass works
    await page.goto(config.projects[0]?.use?.baseURL ?? 'http://localhost:3003');
    console.log('✅ Server is running and accessible');
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    throw error;
  } finally {
    await page.close();
    await browser.close();
  }
}

export default globalSetup;