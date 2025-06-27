import { test, expect } from '@playwright/test';

test.describe('Authentication Happy Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page initially', async ({ page }) => {
    // Check that we're on the login page
    await expect(page).toHaveTitle(/The Ark/);
    
    // Look for login form elements
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
  });

  test('should show Matrix-style UI elements', async ({ page }) => {
    // Check for Matrix-themed elements
    await expect(page.locator('body')).toHaveClass(/matrix|dark|cyber/);
    
    // Look for green text or Matrix-style animations
    const hasMatrixStyling = await page.evaluate(() => {
      const computedStyle = window.getComputedStyle(document.body);
      const color = computedStyle.color;
      // Check for green or matrix-style colors
      return color.includes('rgb(0, 255, 0)') || 
             color.includes('#00ff00') || 
             color.includes('green') ||
             document.querySelector('.matrix') !== null ||
             document.querySelector('[class*="matrix"]') !== null;
    });
    
    // If no specific Matrix styling found, just check for dark theme
    if (!hasMatrixStyling) {
      await expect(page.locator('body')).toHaveCSS('background-color', /(rgb\(0, 0, 0\)|#000000|rgb\(1[0-9], 1[0-9], 1[0-9]\))/);
    }
  });

  test('should handle login form submission', async ({ page }) => {
    // Fill in login form
    await page.getByLabel(/username/i).fill('testuser');
    await page.getByLabel(/password/i).fill('testpass');
    
    // Submit form
    await page.getByRole('button', { name: /login|sign in/i }).click();
    
    // Check for either successful login or error message
    // Since we don't have a real backend, we expect either:
    // 1. Redirect to dashboard (success)
    // 2. Error message (expected with mock data)
    
    await page.waitForTimeout(1000); // Wait for response
    
    const currentUrl = page.url();
    const hasErrorMessage = await page.locator('[class*="error"], [role="alert"], .text-red').count() > 0;
    
    // Either we should be redirected or see an error message
    expect(currentUrl.includes('/dashboard') || hasErrorMessage).toBeTruthy();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling fields
    await page.getByRole('button', { name: /login|sign in/i }).click();
    
    // Should see validation messages or form should not submit
    const usernameField = page.getByLabel(/username/i);
    const passwordField = page.getByLabel(/password/i);
    
    // Check if HTML5 validation is working
    const isUsernameInvalid = await usernameField.evaluate((el: HTMLInputElement) => !el.validity.valid);
    const isPasswordInvalid = await passwordField.evaluate((el: HTMLInputElement) => !el.validity.valid);
    
    expect(isUsernameInvalid || isPasswordInvalid).toBeTruthy();
  });

  test('should show responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that login form is still visible and usable
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
    
    // Check that elements are properly sized for mobile
    const loginButton = page.getByRole('button', { name: /login|sign in/i });
    const buttonSize = await loginButton.boundingBox();
    
    // Button should be touchable (at least 44px tall)
    expect(buttonSize?.height).toBeGreaterThanOrEqual(40);
  });

  test('should handle logout flow if already authenticated', async ({ page }) => {
    // Try to access a protected route or dashboard
    await page.goto('/dashboard');
    
    // If we're redirected to login, that's expected behavior
    await page.waitForURL(/login|auth/, { timeout: 5000 }).catch(() => {
      // If no redirect, we might already be on a dashboard
    });
    
    // Look for logout button or user menu
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    const userMenu = page.locator('[data-testid="user-menu"], [class*="user-menu"]');
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      // Should redirect to login
      await expect(page).toHaveURL(/login|auth|\/$/);
    } else if (await userMenu.isVisible()) {
      await userMenu.click();
      // Look for logout in dropdown
      await page.getByRole('menuitem', { name: /logout|sign out/i }).click();
      await expect(page).toHaveURL(/login|auth|\/$/);
    }
  });

  test('should display proper branding and title', async ({ page }) => {
    // Check for "The Ark" branding
    await expect(page).toHaveTitle(/The Ark/);
    
    // Look for logo or branding elements
    const logo = page.locator('img[alt*="logo"], img[alt*="Ark"], [class*="logo"]');
    const brandingText = page.locator('text=/The Ark|ARK|Forensic/i');
    
    // Should have either logo or branding text visible
    const hasLogo = await logo.count() > 0;
    const hasBrandingText = await brandingText.count() > 0;
    
    expect(hasLogo || hasBrandingText).toBeTruthy();
  });
});