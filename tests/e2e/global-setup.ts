import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for frontend to be ready
    console.log('⏳ Waiting for frontend to be ready...');
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Check if backend is responding
    console.log('⏳ Checking backend connectivity...');
    try {
      const response = await page.request.get('http://localhost:3001/health');
      if (response.ok()) {
        console.log('✅ Backend is responsive');
      } else {
        console.log('⚠️  Backend health check failed, continuing with mock data');
      }
    } catch (error) {
      console.log('⚠️  Backend not available, tests will use mock data');
    }
    
    console.log('✅ E2E test setup completed');
    
  } catch (error) {
    console.error('❌ E2E test setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;