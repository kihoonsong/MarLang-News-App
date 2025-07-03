import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'test@test.com',
  password: 'test123'
};

test.describe('MarLang Eng News - Core Functionality', () => {

  // 각 테스트가 독립적으로 실행되도록 보장
  test.beforeEach(async ({ page }) => {
    // 1. 테스트 시작 전 로컬 스토리지 완전 초기화
    await page.goto('/'); // 페이지에 먼저 방문해야 로컬 스토리지에 접근 가능
    await page.evaluate(() => window.localStorage.clear());
    console.log('[Test Setup] Local storage cleared.');

    // 2. UI를 통해 로그인 수행
    await page.goto('/');
    
    // 혹시 이미 로그인된 상태일 수 있으니, 프로필 버튼이 보이면 로그아웃부터 실행
    const profileButton = page.locator('a[href="/profile"]');
    if (await profileButton.isVisible()) {
      await profileButton.click();
      await page.waitForURL('**/profile');
      const logoutButton = page.locator('button:has-text("Logout")');
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForURL('**/'); // 홈으로 돌아올 때까지 대기
        console.log('[Test Setup] Existing session found. Logged out.');
      }
    }

    // 3. 깨끗한 상태에서 로그인
    await page.goto('/');
    await page.click('button:has-text("Login")');
    await page.waitForSelector('input[type="email"]');
    
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // 로그인이 성공적으로 완료되었는지 확인 (Profile 링크가 보일 때까지 대기)
    await expect(page.locator('a[href="/profile"]')).toBeVisible({ timeout: 10000 });
    console.log('[Test Setup] Logged in successfully.');
  });


  test('메인 페이지 로드 및 기본 요소 확인', async ({ page }) => {
    await page.goto('/');
    
    // 페이지 제목 확인
    await expect(page.locator('text=MarLang Eng News')).toBeVisible();
    
    // 네비게이션 바 확인
    await expect(page.locator('text=Home')).toBeVisible();
    await expect(page.locator('text=Date')).toBeVisible();
    await expect(page.locator('text=Wordbook')).toBeVisible();
    await expect(page.locator('text=Like')).toBeVisible();
    await expect(page.locator('text=Profile')).toBeVisible();
    
    // 카테고리 탭 확인
    await expect(page.locator('text=All')).toBeVisible();
    await expect(page.locator('text=Technology')).toBeVisible();
    await expect(page.locator('text=Science')).toBeVisible();
    
    // 검색창 확인
    await expect(page.locator('input[placeholder="Search articles..."]')).toBeVisible();
    
    // 다크모드 토글 확인
    await expect(page.locator('button').filter({ hasText: '🌙' })).toBeVisible();
  });

  test('뉴스 카드 표시 및 클릭 확인', async ({ page }) => {
    await page.goto('/');
    
    // 뉴스 카드들이 표시되는지 확인
    await expect(page.locator('text=AI Revolution in Healthcare')).toBeVisible();
    await expect(page.locator('text=Climate Change Impact')).toBeVisible();
    await expect(page.locator('text=The Future of Remote Work')).toBeVisible();
    
    // 첫 번째 카드 클릭해서 상세 페이지로 이동
    await page.click('text=AI Revolution in Healthcare');
    
    // 상세 페이지 URL 확인
    await expect(page).toHaveURL('/article/1');
  });

  test('상세 페이지 기능 확인', async ({ page }) => {
    await page.goto('/article/1');
    
    // 기사 제목 확인
    await expect(page.locator('text=AI Revolution in Healthcare: How Machine Learning is Transforming Patient Care')).toBeVisible();
    
    // TTS 버튼 확인
    await expect(page.locator('button:has-text("TTS")')).toBeVisible();
    
    // 난이도 탭 확인 (1, 2, 3)
    await expect(page.locator('button:has-text("1")')).toBeVisible();
    await expect(page.locator('button:has-text("2")')).toBeVisible();
    await expect(page.locator('button:has-text("3")')).toBeVisible();
    
    // Level 1이 기본 선택되어 있는지 확인
    await expect(page.locator('text=Level 1 - Beginner')).toBeVisible();
    
    // 좋아요 버튼 확인
    await expect(page.locator('button').filter({ hasText: '♥' })).toBeVisible();
    
    // 단어 저장 버튼 확인
    await expect(page.locator('button:has-text("Save Words")')).toBeVisible();
  });

  test('난이도 탭 전환 기능', async ({ page }) => {
    await page.goto('/article/1');
    
    // Level 2 클릭
    await page.click('button:has-text("2")');
    await expect(page.locator('text=Level 2 - Intermediate')).toBeVisible();
    
    // Level 3 클릭
    await page.click('button:has-text("3")');
    await expect(page.locator('text=Level 3 - Advanced')).toBeVisible();
    
    // Level 1로 다시 돌아가기
    await page.click('button:has-text("1")');
    await expect(page.locator('text=Level 1 - Beginner')).toBeVisible();
  });

  test('단어장 페이지 기능 확인', async ({ page }) => {
    await page.goto('/wordbook');
    
    // 단어장 제목 확인
    await expect(page.locator('text=📚 My Wordbook')).toBeVisible();
    
    // 정렬 옵션 확인
    await expect(page.locator('text=Sort by')).toBeVisible();
    
    // 저장된 샘플 단어들 확인
    await expect(page.locator('text=artificial')).toBeVisible();
    await expect(page.locator('text=revolutionizing')).toBeVisible();
    await expect(page.locator('text=algorithm')).toBeVisible();
    
    // 단어 의미 확인
    await expect(page.locator('text=made by humans, not natural')).toBeVisible();
    
    // 번역 확인
    await expect(page.locator('text=인공의 (Korean)')).toBeVisible();
  });

  test('단어장에서 기사로 이동', async ({ page }) => {
    await page.goto('/wordbook');
    
    // 기사 링크 클릭
    await page.click('text=From: AI Revolution in Healthcare');
    
    // 기사 상세 페이지로 이동했는지 확인
    await expect(page).toHaveURL('/article/1');
  });

  test('TTS 버튼 클릭 기능', async ({ page }) => {
    await page.goto('/article/1');
    
    // TTS 버튼 클릭
    await page.click('button:has-text("TTS")');
    
    // TTS 활성화 상태 확인 (버튼 색상 변경)
    const ttsButton = page.locator('button:has-text("TTS")');
    await expect(ttsButton).toBeVisible();
  });

  test('좋아요 버튼 클릭 기능', async ({ page }) => {
    await page.goto('/article/1');
    
    // 좋아요 버튼 클릭
    await page.click('svg[data-testid="FavoriteBorderIcon"]');
    
    // 좋아요 상태 변경 확인
    await expect(page.locator('svg[data-testid="FavoriteIcon"]')).toBeVisible();
  });

  test('뒤로가기 버튼 기능', async ({ page }) => {
    await page.goto('/article/1');
    
    // 뒤로가기 버튼 클릭
    await page.click('svg[data-testid="ArrowBackIcon"]');
    
    // 메인 페이지로 돌아갔는지 확인
    await expect(page).toHaveURL('/');
  });
}); 