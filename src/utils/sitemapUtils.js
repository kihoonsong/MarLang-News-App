// 사이트맵 관리 유틸리티 함수들

/**
 * 수동으로 사이트맵 업데이트를 요청하는 함수
 * 관리자 페이지나 기사 관리 시 사용
 */
export const requestSitemapUpdate = async () => {
  try {
    console.log('🔄 사이트맵 수동 업데이트 요청...');

    // Firebase Functions 엔드포인트 호출 (표준 Functions URL 사용)
    const isProduction = window.location.hostname === 'marlang-app.web.app';
    const functionsUrl = isProduction
      ? 'https://us-central1-marlang-app.cloudfunctions.net/updateSitemapManual'
      : 'http://localhost:5001/marlang-app/us-central1/updateSitemapManual';

    console.log('🔗 Functions URL:', functionsUrl);
    console.log('🌍 Environment:', isProduction ? 'Production' : 'Development');
    console.log('🕐 Request timestamp:', new Date().toISOString());

    // 먼저 연결 테스트
    console.log('🧪 연결 테스트 중...');
    const testResponse = await fetch(functionsUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit'
    });

    console.log('🧪 연결 테스트 결과:', testResponse.status, testResponse.statusText);

    if (testResponse.ok) {
      const testData = await testResponse.text();
      console.log('🧪 연결 테스트 응답:', testData);
    }

    // 실제 업데이트 요청
    console.log('📤 실제 업데이트 요청 전송...');
    const response = await fetch(functionsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'client_request',
        userAgent: navigator.userAgent,
        referrer: window.location.href
      })
    });

    console.log('📡 Response status:', response.status, response.statusText);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
      } catch (textError) {
        errorText = `Failed to read error response: ${textError.message}`;
      }
      
      console.error('🚨 HTTP Error Response:', errorText);
      
      // 상세한 에러 정보 제공
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        url: functionsUrl,
        method: 'POST',
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      };
      
      console.error('🚨 Error details:', errorDetails);
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}\n${errorText}`);
    }

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      const textResponse = await response.text();
      console.error('🚨 JSON 파싱 실패, 텍스트 응답:', textResponse);
      throw new Error(`Invalid JSON response: ${textResponse}`);
    }

    console.log('📦 Response data:', result);

    if (result.success) {
      console.log('✅ 사이트맵 업데이트 완료:', result.stats);
      
      // 업데이트 후 검증
      setTimeout(async () => {
        try {
          const verificationResult = await checkSitemapStatus();
          console.log('🔍 업데이트 후 검증:', verificationResult);
        } catch (verifyError) {
          console.warn('⚠️ 업데이트 후 검증 실패:', verifyError);
        }
      }, 3000);
      
      return {
        success: true,
        message: '사이트맵이 성공적으로 업데이트되었습니다.',
        stats: result.stats,
        timestamp: result.timestamp,
        debug: result.debug
      };
    } else {
      console.error('❌ 서버에서 실패 응답:', result);
      return {
        success: false,
        message: result.message || '서버에서 실패 응답을 받았습니다.',
        error: result.error
      };
    }

  } catch (error) {
    console.error('🚨 사이트맵 업데이트 실패:', error);
    console.error('🚨 Error stack:', error.stack);

    // 네트워크 에러인지 확인
    const isNetworkError = error.name === 'TypeError' && error.message.includes('fetch');
    const isCorsError = error.message.includes('CORS') || error.message.includes('cors');
    
    let userFriendlyMessage = '사이트맵 업데이트에 실패했습니다.';
    
    if (isNetworkError) {
      userFriendlyMessage += ' (네트워크 연결 문제)';
    } else if (isCorsError) {
      userFriendlyMessage += ' (CORS 정책 문제)';
    } else if (error.message.includes('HTTP 500')) {
      userFriendlyMessage += ' (서버 내부 오류)';
    } else if (error.message.includes('HTTP 404')) {
      userFriendlyMessage += ' (함수를 찾을 수 없음)';
    }

    return {
      success: false,
      message: userFriendlyMessage,
      error: error.message,
      errorType: isNetworkError ? 'network' : isCorsError ? 'cors' : 'server',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * 사이트맵 상태를 확인하는 함수
 */
export const checkSitemapStatus = async (bypassCache = false) => {
  try {
    // 캐시 우회 옵션
    const timestamp = Date.now();
    const baseUrl = 'https://marlang-app.web.app/sitemap.xml';
    const sitemapUrl = bypassCache ? `${baseUrl}?t=${timestamp}&nocache=1` : baseUrl;

    console.log('🔍 사이트맵 상태 확인:', sitemapUrl);

    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    const response = await fetch(sitemapUrl, {
      method: 'HEAD', // 헤더만 가져오기
      headers: bypassCache ? headers : {}
    });

    if (response.ok) {
      const lastModified = response.headers.get('last-modified');
      const contentLength = response.headers.get('content-length');
      const etag = response.headers.get('etag');

      console.log('📊 사이트맵 헤더 정보:', {
        lastModified,
        contentLength,
        etag,
        bypassCache
      });

      return {
        exists: true,
        lastModified: lastModified ? new Date(lastModified) : null,
        size: contentLength ? parseInt(contentLength) : null,
        etag: etag,
        url: sitemapUrl,
        status: 'active',
        bypassCache
      };
    } else {
      return {
        exists: false,
        url: sitemapUrl,
        status: 'error',
        bypassCache
      };
    }

  } catch (error) {
    console.error('🚨 사이트맵 상태 확인 실패:', error);
    return {
      exists: false,
      error: error.message,
      status: 'error',
      bypassCache
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

/**
 * 간단한 연결 테스트 함수
 */
export const testSitemapConnection = async () => {
  try {
    const isProduction = window.location.hostname === 'marlang-app.web.app';
    const functionsUrl = isProduction
      ? 'https://us-central1-marlang-app.cloudfunctions.net/updateSitemapManual'
      : 'http://localhost:5001/marlang-app/us-central1/updateSitemapManual';

    console.log('🧪 연결 테스트 시작...');
    console.log('🔗 URL:', functionsUrl);

    const response = await fetch(functionsUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
    });

    console.log('📡 테스트 응답 상태:', response.status);

    if (response.ok) {
      const result = await response.text();
      console.log('✅ 연결 성공:', result);
      return { success: true, status: response.status, data: result };
    } else {
      const error = await response.text();
      console.log('❌ 연결 실패:', error);
      return { success: false, status: response.status, error };
    }
  } catch (error) {
    console.error('🚨 연결 테스트 실패:', error);
    return { success: false, error: error.message };
  }
};

// 개발 환경에서만 사용할 수 있는 디버깅 함수들
if (typeof window !== 'undefined') {
  // 전역 함수로 등록하여 콘솔에서 직접 호출 가능
  window.sitemapDebug = {
    update: requestSitemapUpdate,
    status: checkSitemapStatus,
    debug: debugSitemapInfo,
    test: testSitemapConnection,
    console: getSearchConsoleSubmissionUrl
  };

  console.log('🛠️ 사이트맵 디버깅 함수 사용 가능');
  console.log('사용법:');
  console.log('- window.sitemapDebug.test() // 연결 테스트');
  console.log('- window.sitemapDebug.update() // 수동 업데이트');
  console.log('- window.sitemapDebug.status() // 상태 확인');
  console.log('- window.sitemapDebug.debug() // 전체 디버깅');
}