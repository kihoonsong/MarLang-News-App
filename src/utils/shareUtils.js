// 소셜 공유 유틸리티 함수들
import { generateSocialImage, blobToDataURL } from './socialImageGenerator';

// 네이티브 공유 API 지원 여부 확인
export const isNativeShareSupported = () => {
  return navigator.share && navigator.canShare;
};

// Web Share API를 사용한 공유
export const shareWithNativeAPI = async (article, socialImageUrl) => {
  if (!isNativeShareSupported()) {
    return false;
  }

  const articleUrl = `${window.location.origin}/article/${article.id}`;
  const shareText = `${article.title}\n\n${articleUrl}`;

  const shareData = {
    title: article.title,
    text: shareText,
    url: articleUrl
  };

  // 네이티브 공유는 텍스트와 링크만 공유 (이미지는 메타데이터로 자동 처리)
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

// 소셜 미디어별 공유 URL 생성
export const getSocialShareUrls = (article, socialImageUrl) => {
  const baseUrl = window.location.origin;
  const articleUrl = `${baseUrl}/article/${article.id}`;
  const title = encodeURIComponent(article.title);
  const description = encodeURIComponent(article.summary || article.description || '');
  const encodedUrl = encodeURIComponent(articleUrl);
  const shareText = encodeURIComponent(`${article.title}\n\n${articleUrl}`);
  
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${shareText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${shareText}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${title}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${title}`,
    pinterest: socialImageUrl 
      ? `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodeURIComponent(socialImageUrl)}&description=${title}`
      : `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${title}`,
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

// 통합 공유 함수
export const shareArticle = async (article, socialImageUrl, platform = 'native') => {
  try {
    // 네이티브 공유 시도
    if (platform === 'native' && isNativeShareSupported()) {
      const success = await shareWithNativeAPI(article, socialImageUrl);
      if (success) return true;
    }

    // URL 복사 (제목과 함께)
    if (platform === 'copy') {
      const articleUrl = `${window.location.origin}/article/${article.id}`;
      const copyText = `${article.title}\n\n${articleUrl}`;
      return await copyToClipboard(copyText);
    }

    // 소셜 미디어 공유
    return openSocialShare(platform, article, socialImageUrl);
    
  } catch (error) {
    console.error('공유 실패:', error);
    return false;
  }
};

// 공유 가능한 플랫폼 목록
export const getAvailablePlatforms = () => {
  const platforms = [
    { id: 'copy', name: 'Copy Link', icon: '🔗' },
    { id: 'facebook', name: 'Facebook', icon: '📘' },
    { id: 'twitter', name: 'Twitter', icon: '🐦' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬' },
    { id: 'telegram', name: 'Telegram', icon: '✈️' },
    { id: 'email', name: 'Email', icon: '📧' }
  ];

  // 네이티브 공유가 지원되면 맨 앞에 추가
  if (isNativeShareSupported()) {
    platforms.unshift({ id: 'native', name: 'Share', icon: '📤' });
  }

  return platforms;
};