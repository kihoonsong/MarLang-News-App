import { test, expect } from '@playwright/test';

test.describe('Smoke Test', () => {
  test('should load the homepage successfully', async ({ page }) => {
    console.log('[Smoke Test] Navigating to homepage...');
    // 1. 페이지 접속
    await page.goto('/', { timeout: 15000 }); // 타임아웃을 15초로 설정
    console.log('[Smoke Test] Homepage navigation complete.');

    // 2. 페이지의 핵심 요소인 타이틀이 보이는지 확인
    const title = page.locator('h1:has-text("MarLang Eng News")');
    await expect(title).toBeVisible({ timeout: 10000 });
    console.log('[Smoke Test] Title is visible.');

    // 3. 네비게이션 바의 'Home' 링크가 보이는지 확인
    const homeLink = page.locator('nav a:has-text("Home")');
    await expect(homeLink).toBeVisible();
    console.log('[Smoke Test] Home link is visible.');
  });
});
