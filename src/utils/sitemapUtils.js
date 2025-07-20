// 사이트맵 관리 유틸리티 함수들

/**
 * 수동으로 사이트맵 업데이트를 요청하는 함수
 * 관리자 페이지나 기사 관리 시 사용
 */
export const requestSitemapUpdate = async () => {
  try {
    console.log('🔄 사이트맵 수동 업데이트 요청...');

    // Firebase Functions 엔드포인트 호출
    const functionsUrl = import.meta.env.PROD
      ? 'https://us-central1-marlang-app.cloudfunctions.net/updateSitemapManual'
      : 'http://localhost:5001/marlang-app/us-central1/updateSitemapManual';

    const response = await fetch(functionsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'client_request'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    console.log('✅ 사이트맵 업데이트 완료:', result);

    return {
      success: true,
      message: '사이트맵이 성공적으로 업데이트되었습니다.',
      stats: result.stats,
      timestamp: result.timestamp
    };

  } catch (error) {
    console.error('🚨 사이트맵 업데이트 실패:', error);

    return {
      success: false,
      message: '사이트맵 업데이트에 실패했습니다.',
      error: error.message
    };
  }
};

/**
 * 사이트맵 상태를 확인하는 함수
 */
export const checkSitemapStatus = async () => {
  try {
    // 현재 사이트맵 URL 확인
    const sitemapUrl = 'https://marlang-app.web.app/sitemap.xml';

    const response = await fetch(sitemapUrl, {
      method: 'HEAD', // 헤더만 가져오기
    });

    if (response.ok) {
      const lastModified = response.headers.get('last-modified');
      const contentLength = response.headers.get('content-length');

      return {
        exists: true,
        lastModified: lastModified ? new Date(lastModified) : null,
        size: contentLength ? parseInt(contentLength) : null,
        url: sitemapUrl
      };
    } else {
      return {
        exists: false,
        url: sitemapUrl
      };
    }

  } catch (error) {
    console.error('🚨 사이트맵 상태 확인 실패:', error);
    return {
      exists: false,
      error: error.message
    };
  }
};

/**
 * Google Search Console에 사이트맵 제출을 위한 URL 생성
 */
export const getSearchConsoleSubmissionUrl = () => {
  const sitemapUrl = encodeURIComponent('https://marlang-app.web.app/sitemap.xml');
  const property = encodeURIComponent('https://marlang-app.web.app');

  return `https://search.google.com/search-console/sitemaps?resource_id=${property}&sitemap_url=${sitemapUrl}`;
};

/**
 * 사이트맵 관련 디버깅 정보 출력
 */
export const debugSitemapInfo = async () => {
  try {
    console.log('🔍 사이트맵 디버깅 정보:');

    // 1. 현재 사이트맵 상태 확인
    const status = await checkSitemapStatus();
    console.log('📄 사이트맵 상태:', status);

    // 2. Google Search Console URL
    const submissionUrl = getSearchConsoleSubmissionUrl();
    console.log('🔗 Google Search Console 제출 URL:', submissionUrl);

    // 3. 사이트맵 내용 미리보기 (첫 1000자)
    try {
      const response = await fetch('https://marlang-app.web.app/sitemap.xml');
      if (response.ok) {
        const content = await response.text();
        console.log('📝 사이트맵 미리보기:', content.substring(0, 1000) + '...');

        // URL 개수 계산
        const urlCount = (content.match(/<url>/g) || []).length;
        console.log(`📊 총 URL 개수: ${urlCount}개`);
      }
    } catch (previewError) {
      console.warn('⚠️ 사이트맵 미리보기 실패:', previewError.message);
    }

    return status;

  } catch (error) {
    console.error('🚨 사이트맵 디버깅 실패:', error);
    return null;
  }
};

/**
 * 사이트맵 업데이트 알림 토스트 표시
 */
export const showSitemapUpdateNotification = (result, toast) => {
  if (!toast) return;

  if (result.success) {
    toast.show({
      message: `✅ 사이트맵 업데이트 완료 (${result.stats?.totalUrls || 0}개 URL)`,
      type: 'success',
      duration: 3000,
      position: 'top'
    });
  } else {
    toast.show({
      message: `❌ 사이트맵 업데이트 실패: ${result.message}`,
      type: 'error',
      duration: 5000,
      position: 'top'
    });
  }
};

// 개발 환경에서만 사용할 수 있는 디버깅 함수들
if (import.meta.env.DEV) {
  // 전역 함수로 등록하여 콘솔에서 직접 호출 가능
  window.sitemapDebug = {
    update: requestSitemapUpdate,
    status: checkSitemapStatus,
    debug: debugSitemapInfo,
    console: getSearchConsoleSubmissionUrl
  };

  console.log('🛠️ 개발 모드: 사이트맵 디버깅 함수 사용 가능');
  console.log('사용법:');
  console.log('- window.sitemapDebug.update() // 수동 업데이트');
  console.log('- window.sitemapDebug.status() // 상태 확인');
  console.log('- window.sitemapDebug.debug() // 전체 디버깅');
}