// 소셜 공유 유틸리티 함수들
import { generateSocialImage, blobToDataURL } from './socialImageGenerator';

// 네이티브 공유 API 지원 여부 확인
export const isNativeShareSupported = () => {
  return navigator.share && navigator.canShare;
};

// Web Share API를 사용한 공유 (실제 기사 URL 사용)
export const shareWithNativeAPI = async (article, socialImageUrl) => {
  if (!isNativeShareSupported()) {
    return false;
  }

  // 실제 기사 URL 사용
  const articleUrl = `${window.location.origin}/article/${article.id}`;
  const shareText = `${article.title}\n\n${articleUrl}`;

  const shareData = {
    title: article.title,
    text: shareText,
    url: articleUrl
  };

  // 이미지가 있을 경우 Web Share API Level 2로 이미지 포함 시도
  if (article.image && navigator.canShare) {
    try {
      // 이미지 URL을 절대 경로로 변환
      const imageUrl = article.image.startsWith('http') ? article.image : `${window.location.origin}${article.image}`;
      
      // 이미지를 fetch해서 File 객체로 변환
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const imageFile = new File([blob], `${article.id}-image.jpg`, { type: blob.type });
      
      const shareDataWithImage = {
        ...shareData,
        files: [imageFile]
      };

      // 이미지 포함 공유가 가능한지 확인
      if (navigator.canShare(shareDataWithImage)) {
        await navigator.share(shareDataWithImage);
        console.log('이미지 포함 네이티브 공유 성공');
        return true;
      }
    } catch (imageError) {
      console.log('이미지 포함 공유 실패, 텍스트만 공유 시도:', imageError);
    }
  }

  // 이미지 없이 텍스트와 링크만 공유 (메타데이터의 og:image가 자동으로 표시됨)
  try {
    await navigator.share(shareData);
    return true;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('네이티브 공유 실패:', error);
    }
    return false;
  }
};

// 클립보드에 복사
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 폴백: 임시 텍스트 영역 사용
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('클립보드 복사 실패:', error);
    return false;
  }
};

// 소셜 미디어별 공유 URL 생성 (서버 사이드 렌더링된 메타데이터 사용)
export const getSocialShareUrls = (article, socialImageUrl) => {
  const baseUrl = window.location.origin;
  // 실제 기사 URL (사용자 접근용)
  const articleUrl = `${baseUrl}/article/${article.id}`;
  
  const title = encodeURIComponent(article.title);
  const description = encodeURIComponent(article.summary || article.description || '');
  const encodedArticleUrl = encodeURIComponent(articleUrl);
  const shareText = encodeURIComponent(`${article.title}\n\n${articleUrl}`);
  
  return {
    // 소셜 크롤러가 메타데이터를 읽을 수 있도록 소셜 URL 사용
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedArticleUrl}`,
    threads: `https://www.threads.net/intent/post?text=${encodeURIComponent(`${article.title}\n\n${articleUrl}`)}`,
    twitter: `https://twitter.com/intent/tweet?text=${shareText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedArticleUrl}`,
    whatsapp: `https://wa.me/?text=${shareText}`,
    telegram: `https://t.me/share/url?url=${encodedArticleUrl}&text=${title}`,
    reddit: `https://reddit.com/submit?url=${encodedArticleUrl}&title=${title}`,
    pinterest: socialImageUrl 
      ? `https://pinterest.com/pin/create/button/?url=${encodedArticleUrl}&media=${encodeURIComponent(socialImageUrl)}&description=${title}`
      : `https://pinterest.com/pin/create/button/?url=${encodedArticleUrl}&description=${title}`,
    email: `mailto:?subject=${title}&body=${description}%0A%0A${articleUrl}`
  };
};

// 소셜 미디어 공유 창 열기
export const openSocialShare = (platform, article, socialImageUrl) => {
  const urls = getSocialShareUrls(article, socialImageUrl);
  const url = urls[platform];
  
  if (!url) {
    console.error('지원하지 않는 플랫폼:', platform);
    return false;
  }

  // 이메일은 직접 링크 열기
  if (platform === 'email') {
    window.location.href = url;
    return true;
  }

  // 다른 플랫폼은 팝업 창으로 열기
  const popup = window.open(
    url,
    'share',
    'width=600,height=400,scrollbars=yes,resizable=yes'
  );

  // 팝업 차단 확인
  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    // 팝업이 차단된 경우 새 탭에서 열기
    window.open(url, '_blank');
  }

  return true;
};

// 소셜 공유 메트릭 수집 함수 (간소화)
const trackSocialShare = async (articleId, platform) => {
  try {
    // 개발 환경에서만 로그 출력
    if (import.meta.env.DEV) {
      console.log(`📊 소셜 공유 메트릭: ${articleId} → ${platform}`);
    }
    
    // 메트릭 수집은 선택적으로 비활성화 (안정성 우선)
    // TODO: Firebase Functions 호출 안정화 후 재활성화
    /*
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions();
    const trackShare = httpsCallable(functions, 'trackSocialShare');
    
    await trackShare({
      articleId,
      platform,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
    */
  } catch (error) {
    // 메트릭 수집 실패는 조용히 처리 (사용자 경험에 영향 없음)
    if (import.meta.env.DEV) {
      console.warn('소셜 공유 메트릭 기록 실패:', error);
    }
  }
};

// 통합 공유 함수
export const shareArticle = async (article, socialImageUrl, platform = 'native') => {
  try {
    let success = false;
    
    // 네이티브 공유 시도
    if (platform === 'native' && isNativeShareSupported()) {
      success = await shareWithNativeAPI(article, socialImageUrl);
      if (success) {
        // 네이티브 공유 성공 시 메트릭 수집
        await trackSocialShare(article.id, 'native');
        return true;
      }
    }

    // URL 복사 (제목과 함께) - 실제 기사 URL 사용
    if (platform === 'copy') {
      const articleUrl = `${window.location.origin}/article/${article.id}`;
      const copyText = `${article.title}\n\n${articleUrl}`;
      success = await copyToClipboard(copyText);
      if (success) {
        await trackSocialShare(article.id, 'copy');
      }
      return success;
    }

    // 소셜 미디어 공유
    success = openSocialShare(platform, article, socialImageUrl);
    if (success) {
      await trackSocialShare(article.id, platform);
    }
    return success;
    
  } catch (error) {
    console.error('공유 실패:', error);
    return false;
  }
};

// 공유 가능한 플랫폼 목록
export const getAvailablePlatforms = () => {
  const platforms = [
    { id: 'copy', name: 'Copy Link', icon: '🔗' }
  ];

  // 네이티브 공유가 지원되면 맨 앞에 추가
  if (isNativeShareSupported()) {
    platforms.unshift({ id: 'native', name: 'Share', icon: '📤' });
  }

  return platforms;
};