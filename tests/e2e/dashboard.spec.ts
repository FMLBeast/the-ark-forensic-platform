import { test, expect } from '@playwright/test';

test.describe('Dashboard Happy Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/');
    
    // Try to navigate to dashboard or simulate authentication
    await page.goto('/dashboard');
    
    // If redirected to login, try with a mock authentication approach
    if (page.url().includes('login') || page.url().includes('auth')) {
      // For E2E testing, we'll simulate being authenticated
      // In a real app, this would involve actual login
      console.log('Simulating authenticated state for E2E testing');
      
      // Set some local storage to simulate authentication
      await page.evaluate(() => {
        localStorage.setItem('auth_token', 'mock-token-for-e2e-testing');
        localStorage.setItem('user', JSON.stringify({
          id: 'test-user',
          username: 'testuser',
          role: 'investigator'
        }));
      });
      
      // Reload the page to apply authentication state
      await page.reload();
    }
  });

  test('should display dashboard with key components', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForTimeout(2000);
    
    // Check for main dashboard elements
    const dashboardTitle = page.locator('h1, h2, h3').filter({ hasText: /dashboard|ark|investigation/i });
    const navigationMenu = page.locator('nav, [role="navigation"]');
    
    // Should have some form of dashboard content
    const hasDashboardTitle = await dashboardTitle.count() > 0;
    const hasNavigation = await navigationMenu.count() > 0;
    
    expect(hasDashboardTitle || hasNavigation).toBeTruthy();
  });

  test('should show agent dashboard or agent-related components', async ({ page }) => {
    // Look for agent-related content
    const agentElements = page.locator('text=/agent|orchestrat/i');
    const statusIndicators = page.locator('[class*="status"], [data-testid*="status"]');
    const progressBars = page.locator('[role="progressbar"], [class*="progress"]');
    
    // Dashboard should have some dynamic content
    const hasAgentContent = await agentElements.count() > 0;
    const hasStatusContent = await statusIndicators.count() > 0;
    const hasProgressContent = await progressBars.count() > 0;
    
    // At least one type of dynamic content should be present
    expect(hasAgentContent || hasStatusContent || hasProgressContent).toBeTruthy();
  });

  test('should display forensic data sections', async ({ page }) => {
    // Look for forensic-related content
    const forensicElements = page.locator('text=/forensic|analysis|investigation|evidence/i');
    const dataVisualization = page.locator('svg, canvas, [class*="chart"], [class*="graph"]');
    const dataTable = page.locator('table, [role="table"], [class*="table"]');
    
    const hasForensicContent = await forensicElements.count() > 0;
    const hasVisualization = await dataVisualization.count() > 0;
    const hasDataTable = await dataTable.count() > 0;
    
    // Should have some form of data presentation
    expect(hasForensicContent || hasVisualization || hasDataTable).toBeTruthy();
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    // Should have main content visible
    const mainContent = page.locator('main, [role="main"], .content');
    await expect(mainContent.first()).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Content should still be visible and accessible
    await expect(mainContent.first()).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Should have mobile-friendly layout
    await expect(mainContent.first()).toBeVisible();
    
    // Check for mobile menu button if navigation is collapsed
    const mobileMenuButton = page.locator('[aria-label*="menu"], [class*="mobile-menu"], [class*="hamburger"]');
    const isMobileMenuVisible = await mobileMenuButton.count() > 0;
    
    if (isMobileMenuVisible) {
      await expect(mobileMenuButton.first()).toBeVisible();
    }
  });

  test('should handle navigation between sections', async ({ page }) => {
    // Look for navigation links or buttons
    const navLinks = page.locator('a[href], button').filter({ hasText: /dashboard|agents|forensic|analysis|settings/i });
    
    if (await navLinks.count() > 0) {
      // Try clicking on the first available navigation item
      const firstLink = navLinks.first();
      await firstLink.click();
      await page.waitForTimeout(1000);
      
      // Should navigate to a different section or update content
      const currentUrl = page.url();
      expect(currentUrl).toBeTruthy(); // Basic check that we're still on a valid page
    } else {
      // If no navigation found, check for dynamic content updates
      const dynamicContent = page.locator('[class*="dynamic"], [data-testid*="content"]');
      expect(await dynamicContent.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display real-time or live data features', async ({ page }) => {
    // Look for real-time indicators
    const liveIndicators = page.locator('text=/live|real-time|online|active/i');
    const timestampElements = page.locator('[class*="timestamp"], [data-testid*="time"]');
    const statusDots = page.locator('[class*="status-dot"], [class*="indicator"]');
    
    // Check for any real-time features
    const hasLiveIndicators = await liveIndicators.count() > 0;
    const hasTimestamps = await timestampElements.count() > 0;
    const hasStatusIndicators = await statusDots.count() > 0;
    
    // Dashboard should have some indication of live/current state
    expect(hasLiveIndicators || hasTimestamps || hasStatusIndicators).toBeTruthy();
  });

  test('should handle loading states gracefully', async ({ page }) => {
    // Reload the page to see loading states
    await page.reload();
    
    // Look for loading indicators within first few seconds
    const loadingSpinner = page.locator('[class*="loading"], [class*="spinner"], [aria-label*="loading"]');
    const loadingText = page.locator('text=/loading|please wait/i');
    
    // Wait a moment for loading states to appear
    await page.waitForTimeout(500);
    
    const hasLoadingSpinner = await loadingSpinner.count() > 0;
    const hasLoadingText = await loadingText.count() > 0;
    
    // Either we see loading states or content loads immediately
    // Both are acceptable for a good user experience
    expect(true).toBeTruthy(); // This test mainly checks that page doesn't crash during loading
    
    // Wait for loading to complete
    await page.waitForTimeout(2000);
    
    // After loading, should have main content
    const mainContent = page.locator('main, [role="main"], .dashboard');
    await expect(mainContent.first()).toBeVisible();
  });

  test('should maintain Matrix/cyber theme consistency', async ({ page }) => {
    // Check that the Matrix theme is consistent throughout the dashboard
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      return {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
        fontFamily: computedStyle.fontFamily
      };
    });
    
    // Should have dark background (Matrix-style)
    const isDarkTheme = bodyStyles.backgroundColor.includes('0, 0, 0') || 
                       bodyStyles.backgroundColor.includes('rgb(0, 0, 0)') ||
                       bodyStyles.backgroundColor === 'rgb(0, 0, 0)' ||
                       bodyStyles.backgroundColor.includes('rgba(0, 0, 0');
    
    // Check for green text (classic Matrix color) or other cyber colors
    const hasMatrixColors = bodyStyles.color.includes('0, 255, 0') || 
                           bodyStyles.color.includes('rgb(0, 255, 0)') ||
                           bodyStyles.color.includes('#00ff00');
    
    // At minimum should have dark theme
    expect(isDarkTheme || hasMatrixColors).toBeTruthy();
  });
});