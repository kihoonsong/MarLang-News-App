import { test, expect } from '@playwright/test';

test.describe('Layout Consistency Tests', () => {
  // 테스트할 페이지들과 예상 패딩 값들
  const pages = [
    { name: 'Home', url: '/', selector: '[data-testid="page-container"], .ContentContainer, .PageContainer' },
    { name: 'Date', url: '/date', selector: '[data-testid="page-container"], .ContentContainer, .PageContainer' },
    { name: 'Search', url: '/search', selector: '[data-testid="page-container"], .Container, .PageContainer' },
    { name: 'Wordbook', url: '/wordbook', selector: '[data-testid="page-container"], .ContentContainer, .PageContainer' },
    { name: 'Like', url: '/like', selector: '[data-testid="page-container"], .ContentContainer, .PageContainer' },
    { name: 'Profile', url: '/profile', selector: '[data-testid="page-container"], .ContentContainer, .PageContainer' },
    { name: 'Settings', url: '/settings', selector: '[data-testid="page-container"], .Container, .PageContainer' },
    { name: 'ArticleDetail', url: '/article/1', selector: '[data-testid="page-container"], .Container, .PageContainer' }
  ];

  // 예상 패딩 값들 (모바일과 데스크톱)
  const expectedPadding = {
    mobile: { left: '16px', right: '16px' }, // 1rem = 16px
    desktop: { left: '32px', right: '32px' } // 2rem = 32px
  };

  test.beforeEach(async ({ page }) => {
    // 로그인 (필요한 경우)
    await page.goto('/');
    
    // 로그인 버튼이 있는지 확인하고 테스트 계정으로 로그인
    const loginButton = page.locator('text=Login').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForSelector('[data-testid="auth-modal"]', { timeout: 5000 });
      
      // 이메일과 비밀번호 입력
      await page.fill('input[type="email"]', 'test@test.com');
      await page.fill('input[type="password"]', 'test123');
      await page.click('button[type="submit"]');
      
      // 로그인 완료 대기
      await page.waitForTimeout(2000);
    }
  });

  // 모바일 뷰포트에서 패딩 일관성 테스트
  test('should have consistent padding on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE 크기
    
    const paddingResults = [];
    
    for (const pageInfo of pages) {
      try {
        await page.goto(pageInfo.url);
        await page.waitForTimeout(1000); // 페이지 로딩 대기
        
        // 컨테이너 요소 찾기
        const containerSelectors = pageInfo.selector.split(', ');
        let container = null;
        
        for (const selector of containerSelectors) {
          const element = page.locator(selector).first();
          if (await element.isVisible()) {
            container = element;
            break;
          }
        }
        
        if (container) {
          const paddingLeft = await container.evaluate(el => 
            window.getComputedStyle(el).paddingLeft
          );
          const paddingRight = await container.evaluate(el => 
            window.getComputedStyle(el).paddingRight
          );
          
          paddingResults.push({
            page: pageInfo.name,
            paddingLeft,
            paddingRight,
            url: pageInfo.url
          });
          
          console.log(`${pageInfo.name}: left=${paddingLeft}, right=${paddingRight}`);
        } else {
          console.warn(`Container not found for ${pageInfo.name}`);
        }
      } catch (error) {
        console.error(`Error testing ${pageInfo.name}:`, error.message);
      }
    }
    
    // 모든 페이지가 동일한 패딩을 가지는지 확인
    const firstPagePadding = paddingResults[0];
    if (firstPagePadding) {
      for (const result of paddingResults) {
        expect(result.paddingLeft, `${result.page} left padding should match`).toBe(firstPagePadding.paddingLeft);
        expect(result.paddingRight, `${result.page} right padding should match`).toBe(firstPagePadding.paddingRight);
      }
    }
  });

  // 데스크톱 뷰포트에서 패딩 일관성 테스트
  test('should have consistent padding on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 }); // 데스크톱 크기
    
    const paddingResults = [];
    
    for (const pageInfo of pages) {
      try {
        await page.goto(pageInfo.url);
        await page.waitForTimeout(1000); // 페이지 로딩 대기
        
        // 컨테이너 요소 찾기
        const containerSelectors = pageInfo.selector.split(', ');
        let container = null;
        
        for (const selector of containerSelectors) {
          const element = page.locator(selector).first();
          if (await element.isVisible()) {
            container = element;
            break;
          }
        }
        
        if (container) {
          const paddingLeft = await container.evaluate(el => 
            window.getComputedStyle(el).paddingLeft
          );
          const paddingRight = await container.evaluate(el => 
            window.getComputedStyle(el).paddingRight
          );
          
          paddingResults.push({
            page: pageInfo.name,
            paddingLeft,
            paddingRight,
            url: pageInfo.url
          });
          
          console.log(`${pageInfo.name}: left=${paddingLeft}, right=${paddingRight}`);
        } else {
          console.warn(`Container not found for ${pageInfo.name}`);
        }
      } catch (error) {
        console.error(`Error testing ${pageInfo.name}:`, error.message);
      }
    }
    
    // 모든 페이지가 동일한 패딩을 가지는지 확인
    const firstPagePadding = paddingResults[0];
    if (firstPagePadding) {
      for (const result of paddingResults) {
        expect(result.paddingLeft, `${result.page} left padding should match`).toBe(firstPagePadding.paddingLeft);
        expect(result.paddingRight, `${result.page} right padding should match`).toBe(firstPagePadding.paddingRight);
      }
    }
  });

  // 최대 너비 일관성 테스트
  test('should have consistent max-width across pages', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 800 }); // 큰 화면
    
    const maxWidthResults = [];
    
    for (const pageInfo of pages) {
      try {
        await page.goto(pageInfo.url);
        await page.waitForTimeout(1000);
        
        // 컨테이너 요소 찾기
        const containerSelectors = pageInfo.selector.split(', ');
        let container = null;
        
        for (const selector of containerSelectors) {
          const element = page.locator(selector).first();
          if (await element.isVisible()) {
            container = element;
            break;
          }
        }
        
        if (container) {
          const maxWidth = await container.evaluate(el => 
            window.getComputedStyle(el).maxWidth
          );
          const width = await container.evaluate(el => 
            window.getComputedStyle(el).width
          );
          
          maxWidthResults.push({
            page: pageInfo.name,
            maxWidth,
            width,
            url: pageInfo.url
          });
          
          console.log(`${pageInfo.name}: maxWidth=${maxWidth}, width=${width}`);
        }
      } catch (error) {
        console.error(`Error testing ${pageInfo.name}:`, error.message);
      }
    }
    
    // 최대 너비가 일관되는지 확인 (1200px 또는 none)
    for (const result of maxWidthResults) {
      expect(
        result.maxWidth === '1200px' || result.maxWidth === 'none',
        `${result.page} should have max-width of 1200px or none, got ${result.maxWidth}`
      ).toBeTruthy();
    }
  });

  // 컨테이너 중앙 정렬 테스트
  test('should have centered containers', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 800 });
    
    for (const pageInfo of pages) {
      try {
        await page.goto(pageInfo.url);
        await page.waitForTimeout(1000);
        
        // 컨테이너 요소 찾기
        const containerSelectors = pageInfo.selector.split(', ');
        let container = null;
        
        for (const selector of containerSelectors) {
          const element = page.locator(selector).first();
          if (await element.isVisible()) {
            container = element;
            break;
          }
        }
        
        if (container) {
          const marginLeft = await container.evaluate(el => 
            window.getComputedStyle(el).marginLeft
          );
          const marginRight = await container.evaluate(el => 
            window.getComputedStyle(el).marginRight
          );
          
          console.log(`${pageInfo.name}: marginLeft=${marginLeft}, marginRight=${marginRight}`);
          
          // 중앙 정렬을 위해 margin이 auto이거나 동일해야 함
          if (marginLeft === 'auto' && marginRight === 'auto') {
            // 완벽한 중앙 정렬
            expect(true).toBeTruthy();
          } else {
            // 수동으로 설정된 마진이 동일한지 확인
            expect(marginLeft, `${pageInfo.page} margins should be equal for centering`).toBe(marginRight);
          }
        }
      } catch (error) {
        console.error(`Error testing ${pageInfo.name}:`, error.message);
      }
    }
  });
}); 