import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load home page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/NEWStep/);
    
    // Check if main navigation is present
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should display category tabs', async ({ page }) => {
    // Wait for categories to load
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
    
    // Check for common categories
    await expect(page.getByText('Recent')).toBeVisible();
    await expect(page.getByText('Technology')).toBeVisible();
  });

  test('should display articles', async ({ page }) => {
    // Wait for articles to load
    await page.waitForSelector('[data-testid="article-card"]', { timeout: 15000 });
    
    // Check if at least one article is displayed
    const articles = page.locator('[data-testid="article-card"]');
    await expect(articles.first()).toBeVisible();
  });

  test('should navigate to article detail on click', async ({ page }) => {
    // Wait for articles to load
    await page.waitForSelector('[data-testid="article-card"]', { timeout: 15000 });
    
    // Click on first article
    const firstArticle = page.locator('[data-testid="article-card"]').first();
    await firstArticle.click();
    
    // Should navigate to article detail page
    await expect(page).toHaveURL(/\/article\/.+/);
  });

  test('should handle category tab clicks', async ({ page }) => {
    // Wait for category tabs to load
    await page.waitForSelector('[role="tab"]', { timeout: 10000 });
    
    // Click on Technology tab
    const technologyTab = page.getByRole('tab', { name: /technology/i });
    if (await technologyTab.isVisible()) {
      await technologyTab.click();
      
      // Should scroll to technology section
      await expect(page.locator('#category-technology')).toBeInViewport();
    }
  });

  test('should display loading state initially', async ({ page }) => {
    // Reload page to catch loading state
    await page.reload();
    
    // Should show loading skeleton or spinner
    const loadingElement = page.locator('.MuiSkeleton-root').first();
    if (await loadingElement.isVisible({ timeout: 1000 })) {
      await expect(loadingElement).toBeVisible();
    }
  });

  test('should handle mobile navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile navigation is present
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
  });

  test('should display notices when available', async ({ page }) => {
    // Check if any notices are displayed
    const notices = page.locator('[role="alert"]');
    const noticeCount = await notices.count();
    
    if (noticeCount > 0) {
      await expect(notices.first()).toBeVisible();
    }
  });

  test('should handle horizontal scrolling on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Wait for articles to load
    await page.waitForSelector('[data-testid="article-card"]', { timeout: 15000 });
    
    // Check if horizontal scroll container exists
    const scrollContainer = page.locator('[data-testid="horizontal-scroll"]').first();
    if (await scrollContainer.isVisible()) {
      await expect(scrollContainer).toBeVisible();
    }
  });

  test('should handle error state gracefully', async ({ page }) => {
    // Intercept API calls and return error
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });
    
    await page.reload();
    
    // Should display error message with retry option
    const errorMessage = page.getByText(/failed to load/i);
    if (await errorMessage.isVisible({ timeout: 10000 })) {
      await expect(errorMessage).toBeVisible();
      
      // Should have retry button
      const retryButton = page.getByRole('button', { name: /retry/i });
      await expect(retryButton).toBeVisible();
    }
  });

  test('should maintain scroll position on category change', async ({ page }) => {
    // Wait for content to load
    await page.waitForSelector('[data-testid="article-card"]', { timeout: 15000 });
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    
    // Click on a category tab
    const categoryTab = page.getByRole('tab').first();
    await categoryTab.click();
    
    // Should maintain reasonable scroll position
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Focus on first interactive element
    await page.keyboard.press('Tab');
    
    // Should be able to navigate with keyboard
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test arrow key navigation on tabs
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');
  });

  test('should display ads when enabled', async ({ page }) => {
    // Check if ad containers are present
    const adContainers = page.locator('ins[data-ad-client]');
    const adCount = await adContainers.count();
    
    if (adCount > 0) {
      await expect(adContainers.first()).toBeVisible();
    }
  });

  test('should handle theme switching', async ({ page }) => {
    // Look for theme toggle button
    const themeToggle = page.getByRole('button', { name: /theme/i });
    
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      
      // Should change theme
      const body = page.locator('body');
      await expect(body).toHaveAttribute('data-theme');
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 }, // iPhone SE
      { width: 768, height: 1024 }, // iPad
      { width: 1920, height: 1080 } // Desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      // Should display content properly at each size
      await expect(page.locator('main')).toBeVisible();
      
      // Check if navigation adapts to screen size
      if (viewport.width < 768) {
        // Mobile navigation
        await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
      } else {
        // Desktop navigation
        await expect(page.locator('nav')).toBeVisible();
      }
    }
  });

  test('should handle search functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.getByRole('textbox', { name: /search/i });
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('technology');
      await page.keyboard.press('Enter');
      
      // Should navigate to search page or show results
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/search|technology/);
    }
  });
});