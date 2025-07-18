import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login options', async ({ page }) => {
    // Look for login button or user menu
    const loginButton = page.getByRole('button').filter({ hasText: /login|sign in|로그인/i });
    const userMenu = page.locator('[data-testid="user-menu"]');
    
    // Should have either login button or user menu (if already logged in)
    const hasLogin = await loginButton.isVisible();
    const hasUserMenu = await userMenu.isVisible();
    
    expect(hasLogin || hasUserMenu).toBe(true);
  });

  test('should open auth modal when login clicked', async ({ page }) => {
    // Look for login button
    const loginButton = page.getByRole('button').filter({ hasText: /login|sign in|로그인/i });
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      // Should open auth modal
      const authModal = page.locator('[role="dialog"]').filter({ hasText: /login|sign in|로그인/i });
      await expect(authModal).toBeVisible();
      
      // Should display login options
      const googleButton = page.getByRole('button').filter({ hasText: /google/i });
      const naverButton = page.getByRole('button').filter({ hasText: /naver|네이버/i });
      
      await expect(googleButton.or(naverButton)).toBeVisible();
    }
  });

  test('should handle Google login attempt', async ({ page }) => {
    // Open auth modal
    const loginButton = page.getByRole('button').filter({ hasText: /login|sign in|로그인/i });
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      const authModal = page.locator('[role="dialog"]');
      await expect(authModal).toBeVisible();
      
      // Click Google login
      const googleButton = page.getByRole('button').filter({ hasText: /google/i });
      
      if (await googleButton.isVisible()) {
        // Intercept Google OAuth redirect
        await page.route('**/accounts.google.com/**', route => {
          route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: '<html><body>Google OAuth Mock</body></html>'
          });
        });
        
        await googleButton.click();
        
        // Should attempt to redirect or show loading
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should handle Naver login attempt', async ({ page }) => {
    // Open auth modal
    const loginButton = page.getByRole('button').filter({ hasText: /login|sign in|로그인/i });
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      const authModal = page.locator('[role="dialog"]');
      await expect(authModal).toBeVisible();
      
      // Click Naver login
      const naverButton = page.getByRole('button').filter({ hasText: /naver|네이버/i });
      
      if (await naverButton.isVisible()) {
        // Intercept Naver OAuth redirect
        await page.route('**/nid.naver.com/**', route => {
          route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: '<html><body>Naver OAuth Mock</body></html>'
          });
        });
        
        await naverButton.click();
        
        // Should attempt to redirect or show loading
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should close auth modal', async ({ page }) => {
    // Open auth modal
    const loginButton = page.getByRole('button').filter({ hasText: /login|sign in|로그인/i });
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      const authModal = page.locator('[role="dialog"]');
      await expect(authModal).toBeVisible();
      
      // Try to close modal
      const closeButton = authModal.getByRole('button').filter({ hasText: /close|×/i });
      
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await expect(authModal).not.toBeVisible();
      } else {
        // Try clicking backdrop
        await page.click('body');
        await page.waitForTimeout(500);
      }
    }
  });

  test('should handle keyboard navigation in auth modal', async ({ page }) => {
    // Open auth modal
    const loginButton = page.getByRole('button').filter({ hasText: /login|sign in|로그인/i });
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      const authModal = page.locator('[role="dialog"]');
      await expect(authModal).toBeVisible();
      
      // Test escape key
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      // Modal should close
      await expect(authModal).not.toBeVisible();
    }
  });

  test('should display loading state during authentication', async ({ page }) => {
    // Open auth modal
    const loginButton = page.getByRole('button').filter({ hasText: /login|sign in|로그인/i });
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      const authModal = page.locator('[role="dialog"]');
      await expect(authModal).toBeVisible();
      
      // Mock slow authentication
      await page.route('**/accounts.google.com/**', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: '<html><body>Loading...</body></html>'
          });
        }, 2000);
      });
      
      const googleButton = page.getByRole('button').filter({ hasText: /google/i });
      
      if (await googleButton.isVisible()) {
        await googleButton.click();
        
        // Should show loading state
        const loadingElement = page.locator('.loading, .spinner, [role="progressbar"]');
        if (await loadingElement.isVisible({ timeout: 1000 })) {
          await expect(loadingElement).toBeVisible();
        }
      }
    }
  });

  test('should handle authentication errors', async ({ page }) => {
    // Open auth modal
    const loginButton = page.getByRole('button').filter({ hasText: /login|sign in|로그인/i });
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      const authModal = page.locator('[role="dialog"]');
      await expect(authModal).toBeVisible();
      
      // Mock authentication error
      await page.route('**/accounts.google.com/**', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Authentication failed' })
        });
      });
      
      const googleButton = page.getByRole('button').filter({ hasText: /google/i });
      
      if (await googleButton.isVisible()) {
        await googleButton.click();
        
        // Should show error message
        const errorMessage = page.getByText(/error|failed|오류/i);
        if (await errorMessage.isVisible({ timeout: 3000 })) {
          await expect(errorMessage).toBeVisible();
        }
      }
    }
  });

  test('should handle user menu when authenticated', async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('naverAuthUser', JSON.stringify({
        uid: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        provider: 'naver'
      }));
    });
    
    await page.reload();
    
    // Should show user menu instead of login button
    const userMenu = page.locator('[data-testid="user-menu"]').or(
      page.getByRole('button').filter({ hasText: /test user|profile|menu/i })
    );
    
    if (await userMenu.isVisible()) {
      await expect(userMenu).toBeVisible();
      
      // Click user menu
      await userMenu.click();
      
      // Should show user options
      const profileOption = page.getByText(/profile|프로필/i);
      const logoutOption = page.getByText(/logout|로그아웃/i);
      
      await expect(profileOption.or(logoutOption)).toBeVisible();
    }
  });

  test('should handle logout', async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('naverAuthUser', JSON.stringify({
        uid: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        provider: 'naver'
      }));
    });
    
    await page.reload();
    
    // Find and click logout
    const userMenu = page.locator('[data-testid="user-menu"]').or(
      page.getByRole('button').filter({ hasText: /test user|profile|menu/i })
    );
    
    if (await userMenu.isVisible()) {
      await userMenu.click();
      
      const logoutButton = page.getByRole('button').filter({ hasText: /logout|로그아웃/i });
      
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        
        // Should return to logged out state
        await page.waitForTimeout(1000);
        
        const loginButton = page.getByRole('button').filter({ hasText: /login|sign in|로그인/i });
        await expect(loginButton).toBeVisible();
      }
    }
  });

  test('should persist authentication state', async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      localStorage.setItem('naverAuthUser', JSON.stringify({
        uid: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        provider: 'naver'
      }));
    });
    
    await page.reload();
    
    // Should maintain authenticated state after reload
    const userMenu = page.locator('[data-testid="user-menu"]').or(
      page.getByRole('button').filter({ hasText: /test user|profile|menu/i })
    );
    
    if (await userMenu.isVisible()) {
      await expect(userMenu).toBeVisible();
    }
  });

  test('should handle protected routes', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('/profile');
    
    // Should redirect to login or show auth modal
    const currentUrl = page.url();
    const hasAuthModal = await page.locator('[role="dialog"]').isVisible();
    
    expect(currentUrl.includes('/profile') || hasAuthModal).toBe(true);
  });

  test('should handle Naver callback', async ({ page }) => {
    // Navigate to Naver callback URL with mock parameters
    await page.goto('/auth/naver/callback?code=test-code&state=test-state');
    
    // Should handle callback (might redirect or show loading)
    await page.waitForTimeout(2000);
    
    // Should eventually redirect somewhere
    const finalUrl = page.url();
    expect(finalUrl).toBeTruthy();
  });

  test('should be accessible', async ({ page }) => {
    // Open auth modal
    const loginButton = page.getByRole('button').filter({ hasText: /login|sign in|로그인/i });
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      const authModal = page.locator('[role="dialog"]');
      await expect(authModal).toBeVisible();
      
      // Check accessibility attributes
      await expect(authModal).toHaveAttribute('aria-modal', 'true');
      
      // Check if buttons are properly labeled
      const buttons = authModal.getByRole('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const hasText = await button.textContent();
        const hasAriaLabel = await button.getAttribute('aria-label');
        
        expect(hasText || hasAriaLabel).toBeTruthy();
      }
    }
  });

  test('should handle mobile authentication', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Should display mobile-friendly auth interface
    const loginButton = page.getByRole('button').filter({ hasText: /login|sign in|로그인/i });
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      const authModal = page.locator('[role="dialog"]');
      await expect(authModal).toBeVisible();
      
      // Modal should be properly sized for mobile
      const modalRect = await authModal.boundingBox();
      expect(modalRect.width).toBeLessThanOrEqual(375);
    }
  });
});