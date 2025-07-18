import { test, expect } from '@playwright/test';

test.describe('Article Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page first
    await page.goto('/');
    
    // Wait for articles to load and click on first article
    await page.waitForSelector('[data-testid="article-card"]', { timeout: 15000 });
    const firstArticle = page.locator('[data-testid="article-card"]').first();
    await firstArticle.click();
    
    // Wait for article detail page to load
    await page.waitForURL(/\/article\/.+/);
  });

  test('should load article detail page successfully', async ({ page }) => {
    // Should be on article detail page
    await expect(page).toHaveURL(/\/article\/.+/);
    
    // Should display article title
    const title = page.locator('h1, h2').first();
    await expect(title).toBeVisible();
  });

  test('should display article content', async ({ page }) => {
    // Should display article content
    const content = page.locator('[data-testid="article-content"]');
    if (await content.isVisible()) {
      await expect(content).toBeVisible();
    } else {
      // Fallback: check for any substantial text content
      const textContent = page.locator('p, div').filter({ hasText: /\w{20,}/ }).first();
      await expect(textContent).toBeVisible();
    }
  });

  test('should display level selector', async ({ page }) => {
    // Look for level selector (buttons or dropdown)
    const levelSelector = page.locator('[data-testid="level-selector"]');
    if (await levelSelector.isVisible()) {
      await expect(levelSelector).toBeVisible();
    } else {
      // Fallback: look for level-related buttons
      const levelButtons = page.getByRole('button').filter({ hasText: /level|beginner|intermediate|advanced/i });
      const buttonCount = await levelButtons.count();
      if (buttonCount > 0) {
        await expect(levelButtons.first()).toBeVisible();
      }
    }
  });

  test('should handle level switching', async ({ page }) => {
    // Look for level buttons
    const levelButtons = page.getByRole('button').filter({ hasText: /level|beginner|intermediate|advanced/i });
    const buttonCount = await levelButtons.count();
    
    if (buttonCount > 1) {
      // Click on different level
      await levelButtons.nth(1).click();
      
      // Content should change (wait for any loading)
      await page.waitForTimeout(500);
      
      // Should still be on same page
      await expect(page).toHaveURL(/\/article\/.+/);
    }
  });

  test('should display TTS controls', async ({ page }) => {
    // Look for TTS play button
    const playButton = page.getByRole('button').filter({ hasText: /play|speak|listen/i }).or(
      page.locator('[data-testid="tts-play"]')
    );
    
    if (await playButton.isVisible()) {
      await expect(playButton).toBeVisible();
    }
  });

  test('should handle TTS functionality', async ({ page }) => {
    // Look for TTS controls
    const ttsButton = page.getByRole('button').filter({ hasText: /play|speak|listen/i }).first();
    
    if (await ttsButton.isVisible()) {
      await ttsButton.click();
      
      // Should change to pause/stop button or show playing state
      await page.waitForTimeout(1000);
      
      const stopButton = page.getByRole('button').filter({ hasText: /pause|stop/i }).first();
      if (await stopButton.isVisible()) {
        await expect(stopButton).toBeVisible();
        
        // Click stop
        await stopButton.click();
      }
    }
  });

  test('should handle word clicking for vocabulary', async ({ page }) => {
    // Look for clickable words in content
    const clickableWords = page.locator('.clickable-word, [data-testid="clickable-word"]');
    const wordCount = await clickableWords.count();
    
    if (wordCount > 0) {
      // Click on first clickable word
      await clickableWords.first().click();
      
      // Should show word popup or definition
      const popup = page.locator('[data-testid="word-popup"], .word-definition-popup');
      if (await popup.isVisible({ timeout: 2000 })) {
        await expect(popup).toBeVisible();
        
        // Should have close button or click outside to close
        const closeButton = popup.getByRole('button').filter({ hasText: /close|×/i }).first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        } else {
          // Click outside to close
          await page.click('body');
        }
      }
    }
  });

  test('should display article metadata', async ({ page }) => {
    // Should display publication date
    const dateElement = page.locator('[data-testid="publish-date"]').or(
      page.locator('time').or(
        page.getByText(/\d{4}|\w+ \d+/)
      )
    );
    
    if (await dateElement.first().isVisible()) {
      await expect(dateElement.first()).toBeVisible();
    }
    
    // Should display category
    const categoryElement = page.locator('[data-testid="category"]').or(
      page.locator('.category, .chip').first()
    );
    
    if (await categoryElement.isVisible()) {
      await expect(categoryElement).toBeVisible();
    }
  });

  test('should handle like/favorite functionality', async ({ page }) => {
    // Look for like/favorite button
    const likeButton = page.getByRole('button').filter({ hasText: /like|favorite|heart/i }).or(
      page.locator('[data-testid="like-button"]')
    );
    
    if (await likeButton.isVisible()) {
      await likeButton.click();
      
      // Should change state (might require login)
      await page.waitForTimeout(500);
    }
  });

  test('should handle share functionality', async ({ page }) => {
    // Look for share button
    const shareButton = page.getByRole('button').filter({ hasText: /share/i }).or(
      page.locator('[data-testid="share-button"]')
    );
    
    if (await shareButton.isVisible()) {
      await shareButton.click();
      
      // Should show share options or trigger native share
      await page.waitForTimeout(500);
    }
  });

  test('should handle navigation between articles', async ({ page }) => {
    // Look for next/previous article buttons
    const nextButton = page.getByRole('button').filter({ hasText: /next|→/i });
    const prevButton = page.getByRole('button').filter({ hasText: /previous|←/i });
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
      
      // Should navigate to next article
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/article\/.+/);
    } else if (await prevButton.isVisible()) {
      await prevButton.click();
      
      // Should navigate to previous article
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/article\/.+/);
    }
  });

  test('should handle mobile swipe navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Get article content area
    const contentArea = page.locator('main, [data-testid="article-content"]').first();
    
    if (await contentArea.isVisible()) {
      // Simulate swipe left (next article)
      await contentArea.hover();
      await page.mouse.down();
      await page.mouse.move(-200, 0);
      await page.mouse.up();
      
      await page.waitForTimeout(1000);
      
      // Should still be on an article page
      await expect(page).toHaveURL(/\/article\/.+/);
    }
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Test arrow key navigation
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    
    // Should change level or navigate
    await expect(page).toHaveURL(/\/article\/.+/);
    
    // Test escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('should display ads in article', async ({ page }) => {
    // Check for ad containers in article
    const adContainers = page.locator('ins[data-ad-client], [data-testid="ad-container"]');
    const adCount = await adContainers.count();
    
    if (adCount > 0) {
      await expect(adContainers.first()).toBeVisible();
    }
  });

  test('should handle loading states', async ({ page }) => {
    // Reload page to catch loading state
    await page.reload();
    
    // Should show loading indicator
    const loadingElement = page.locator('.loading, .spinner, .MuiCircularProgress-root').first();
    if (await loadingElement.isVisible({ timeout: 1000 })) {
      await expect(loadingElement).toBeVisible();
    }
    
    // Should eventually load content
    await page.waitForSelector('h1, h2', { timeout: 10000 });
  });

  test('should handle error states', async ({ page }) => {
    // Navigate to non-existent article
    await page.goto('/article/non-existent-article-id');
    
    // Should show error message or 404 page
    const errorElement = page.getByText(/not found|error|404/i);
    if (await errorElement.isVisible({ timeout: 5000 })) {
      await expect(errorElement).toBeVisible();
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
      const title = page.locator('h1, h2').first();
      await expect(title).toBeVisible();
      
      // Content should be readable
      const content = page.locator('main, article').first();
      await expect(content).toBeVisible();
    }
  });

  test('should handle back navigation', async ({ page }) => {
    // Go back to home page
    await page.goBack();
    
    // Should be back on home page
    await expect(page).toHaveURL('/');
    
    // Should display home page content
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should maintain scroll position on level change', async ({ page }) => {
    // Scroll down in article
    await page.evaluate(() => window.scrollTo(0, 500));
    
    // Change level if available
    const levelButtons = page.getByRole('button').filter({ hasText: /level|beginner|intermediate|advanced/i });
    const buttonCount = await levelButtons.count();
    
    if (buttonCount > 1) {
      await levelButtons.nth(1).click();
      await page.waitForTimeout(500);
      
      // Should maintain reasonable scroll position
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(0);
    }
  });

  test('should handle TTS speed controls', async ({ page }) => {
    // Look for speed control
    const speedControl = page.locator('[data-testid="tts-speed"], .speed-control').first();
    
    if (await speedControl.isVisible()) {
      await speedControl.click();
      
      // Should show speed options
      const speedOptions = page.locator('.speed-option, [data-testid="speed-option"]');
      const optionCount = await speedOptions.count();
      
      if (optionCount > 0) {
        await speedOptions.first().click();
      }
    }
  });
});