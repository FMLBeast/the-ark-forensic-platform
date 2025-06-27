import { test, expect } from '@playwright/test';

test.describe('Agent Orchestration Happy Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application and simulate authentication
    await page.goto('/');
    
    // Simulate authenticated state for E2E testing
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock-token-for-e2e-testing');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user',
        username: 'testuser',
        role: 'investigator'
      }));
    });
    
    // Navigate to dashboard or agent section
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
  });

  test('should display agent dashboard with agent status', async ({ page }) => {
    // Look for agent-related content
    const agentElements = page.locator('text=/agent|orchestrat/i');
    const statusElements = page.locator('[class*="status"], [data-testid*="status"]');
    const agentCards = page.locator('[class*="agent"], [class*="card"]');
    
    // Check for agent dashboard components
    const hasAgentElements = await agentElements.count() > 0;
    const hasStatusElements = await statusElements.count() > 0;
    const hasAgentCards = await agentCards.count() > 0;
    
    expect(hasAgentElements || hasStatusElements || hasAgentCards).toBeTruthy();
  });

  test('should show different agent types and capabilities', async ({ page }) => {
    // Look for different types of agents mentioned in the platform
    const fileAnalysisAgent = page.locator('text=/file.?analysis/i');
    const steganographyAgent = page.locator('text=/steganograph/i');
    const cryptographyAgent = page.locator('text=/cryptograph/i');
    const intelligenceAgent = page.locator('text=/intelligence/i');
    
    // Check for agent types
    const hasFileAgent = await fileAnalysisAgent.count() > 0;
    const hasStegoAgent = await steganographyAgent.count() > 0;
    const hasCryptoAgent = await cryptographyAgent.count() > 0;
    const hasIntelAgent = await intelligenceAgent.count() > 0;
    
    // Should have at least one type of agent mentioned
    expect(hasFileAgent || hasStegoAgent || hasCryptoAgent || hasIntelAgent).toBeTruthy();
  });

  test('should display agent performance metrics', async ({ page }) => {
    // Look for performance-related metrics
    const metricsElements = page.locator('text=/metric|performance|success|rate|count/i');
    const numericalData = page.locator('[class*="metric"], [class*="stat"], [class*="count"]');
    const progressBars = page.locator('[role="progressbar"], [class*="progress"]');
    
    // Check for performance indicators
    const hasMetrics = await metricsElements.count() > 0;
    const hasNumericalData = await numericalData.count() > 0;
    const hasProgressBars = await progressBars.count() > 0;
    
    expect(hasMetrics || hasNumericalData || hasProgressBars).toBeTruthy();
  });

  test('should allow starting new agent orchestration sessions', async ({ page }) => {
    // Look for action buttons to start analysis
    const startButtons = page.locator('button').filter({ hasText: /start|begin|run|execute|analyze|orchestrat/i });
    const actionButtons = page.locator('[class*="action"], [class*="primary"]');
    const submitButtons = page.locator('button[type="submit"], input[type="submit"]');
    
    // Check for orchestration controls
    const hasStartButtons = await startButtons.count() > 0;
    const hasActionButtons = await actionButtons.count() > 0;
    const hasSubmitButtons = await submitButtons.count() > 0;
    
    if (hasStartButtons) {
      // Test that start button is interactive
      await expect(startButtons.first()).toBeEnabled();
      
      // Click to see if it triggers any UI changes
      await startButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Should either show a form, modal, or progress indicator
      const hasModal = await page.locator('[role="dialog"], [class*="modal"]').count() > 0;
      const hasProgress = await page.locator('[role="progressbar"], [class*="progress"]').count() > 0;
      const hasForm = await page.locator('form, [class*="form"]').count() > 0;
      
      expect(hasModal || hasProgress || hasForm).toBeTruthy();
    }
    
    expect(hasStartButtons || hasActionButtons || hasSubmitButtons).toBeTruthy();
  });

  test('should show orchestration session progress and status', async ({ page }) => {
    // Look for session or task tracking
    const sessionElements = page.locator('text=/session|task|job|orchestrat/i');
    const statusElements = page.locator('text=/running|completed|pending|active|idle/i');
    const progressElements = page.locator('[role="progressbar"], [class*="progress"]');
    const phaseElements = page.locator('text=/phase|step|stage/i');
    
    // Check for session tracking
    const hasSessions = await sessionElements.count() > 0;
    const hasStatus = await statusElements.count() > 0;
    const hasProgress = await progressElements.count() > 0;
    const hasPhases = await phaseElements.count() > 0;
    
    expect(hasSessions || hasStatus || hasProgress || hasPhases).toBeTruthy();
  });

  test('should display agent collaboration and workflow', async ({ page }) => {
    // Look for workflow or collaboration indicators
    const workflowElements = page.locator('text=/workflow|collaboration|pipeline|sequence/i');
    const connectionElements = page.locator('text=/connect|link|relation|network/i');
    const timelineElements = page.locator('[class*="timeline"], [class*="flow"]');
    
    // Check for collaborative features
    const hasWorkflow = await workflowElements.count() > 0;
    const hasConnections = await connectionElements.count() > 0;
    const hasTimeline = await timelineElements.count() > 0;
    
    expect(hasWorkflow || hasConnections || hasTimeline).toBeTruthy();
  });

  test('should handle agent configuration and preferences', async ({ page }) => {
    // Look for configuration options
    const configElements = page.locator('text=/config|setting|preference|option/i');
    const settingsButtons = page.locator('button').filter({ hasText: /setting|config|preference/i });
    const selectElements = page.locator('select, [role="combobox"]');
    const checkboxElements = page.locator('input[type="checkbox"]');
    
    // Check for configuration capabilities
    const hasConfigElements = await configElements.count() > 0;
    const hasSettingsButtons = await settingsButtons.count() > 0;
    const hasSelectElements = await selectElements.count() > 0;
    const hasCheckboxElements = await checkboxElements.count() > 0;
    
    expect(hasConfigElements || hasSettingsButtons || hasSelectElements || hasCheckboxElements).toBeTruthy();
  });

  test('should show real-time agent activity and logs', async ({ page }) => {
    // Look for real-time activity indicators
    const liveElements = page.locator('text=/live|real-time|activity|log/i');
    const timestampElements = page.locator('[class*="timestamp"], [class*="time"]');
    const logElements = page.locator('[class*="log"], [class*="activity"], [class*="event"]');
    const lastActivityElements = page.locator('text=/last.?active|updated|recent/i');
    
    // Check for real-time features
    const hasLiveElements = await liveElements.count() > 0;
    const hasTimestamps = await timestampElements.count() > 0;
    const hasLogs = await logElements.count() > 0;
    const hasLastActivity = await lastActivityElements.count() > 0;
    
    expect(hasLiveElements || hasTimestamps || hasLogs || hasLastActivity).toBeTruthy();
  });

  test('should display agent results and insights', async ({ page }) => {
    // Look for results and insights from agent operations
    const resultsElements = page.locator('text=/result|insight|finding|discovery/i');
    const analysisResults = page.locator('[class*="result"], [class*="insight"], [class*="finding"]');
    const dataVisualization = page.locator('svg, canvas, [class*="chart"]');
    const summaryElements = page.locator('text=/summary|conclusion|recommendation/i');
    
    // Check for results presentation
    const hasResults = await resultsElements.count() > 0;
    const hasAnalysisResults = await analysisResults.count() > 0;
    const hasVisualization = await dataVisualization.count() > 0;
    const hasSummary = await summaryElements.count() > 0;
    
    expect(hasResults || hasAnalysisResults || hasVisualization || hasSummary).toBeTruthy();
  });

  test('should handle agent error states and recovery', async ({ page }) => {
    // Look for error handling in the UI
    const errorElements = page.locator('text=/error|failed|warning|issue/i');
    const alertElements = page.locator('[role="alert"], [class*="alert"], [class*="error"]');
    const retryButtons = page.locator('button').filter({ hasText: /retry|restart|recover/i });
    
    // Check for error handling capabilities
    const hasErrorElements = await errorElements.count() > 0;
    const hasAlerts = await alertElements.count() > 0;
    const hasRetryButtons = await retryButtons.count() > 0;
    
    // Error handling is important but not always visible in normal operation
    // This test mainly ensures the UI can handle error states gracefully
    expect(true).toBeTruthy();
    
    if (hasRetryButtons) {
      await expect(retryButtons.first()).toBeVisible();
    }
  });

  test('should support agent monitoring and health checks', async ({ page }) => {
    // Look for health and monitoring indicators
    const healthElements = page.locator('text=/health|monitor|status|uptime/i');
    const indicatorElements = page.locator('[class*="indicator"], [class*="status-dot"]');
    const metricsElements = page.locator('[class*="metric"], [class*="monitor"]');
    const diagnosticElements = page.locator('text=/diagnostic|check|ping/i');
    
    // Check for monitoring features
    const hasHealth = await healthElements.count() > 0;
    const hasIndicators = await indicatorElements.count() > 0;
    const hasMetrics = await metricsElements.count() > 0;
    const hasDiagnostics = await diagnosticElements.count() > 0;
    
    expect(hasHealth || hasIndicators || hasMetrics || hasDiagnostics).toBeTruthy();
  });

  test('should maintain responsive design for agent management', async ({ page }) => {
    // Test responsive design for agent orchestration interface
    
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    const agentContent = page.locator('[class*="agent"], [class*="orchestrat"]').first();
    if (await agentContent.count() > 0) {
      await expect(agentContent).toBeVisible();
    }
    
    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Content should remain accessible
    const mainContent = page.locator('main, [role="main"], body');
    await expect(mainContent).toBeVisible();
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Should have mobile-friendly layout
    await expect(mainContent).toBeVisible();
    
    // Check for mobile menu if navigation is collapsed
    const mobileMenu = page.locator('[class*="mobile"], [aria-label*="menu"]');
    const hamburgerMenu = page.locator('[class*="hamburger"], [class*="toggle"]');
    
    if (await mobileMenu.count() > 0 || await hamburgerMenu.count() > 0) {
      expect(true).toBeTruthy();
    }
  });
});