// 소셜 미디어 캐시 관리 유틸리티
export const socialPlatforms = {
  facebook: {
    name: 'Facebook',
    debugUrl: 'https://developers.facebook.com/tools/debug/',
    cacheRefreshUrl: 'https://developers.facebook.com/tools/debug/sharing/',
    description: 'Facebook의 Open Graph 캐시를 새로고침합니다.'
  },
  twitter: {
    name: 'Twitter',
    debugUrl: 'https://cards-dev.twitter.com/validator',
    description: 'Twitter Card 유효성을 검사합니다.'
  },
  linkedin: {
    name: 'LinkedIn',
    debugUrl: 'https://www.linkedin.com/post-inspector/',
    description: 'LinkedIn 포스트 미리보기를 확인합니다.'
  }
};

// URL 캐시 새로고침 요청
export const refreshSocialCache = async (url, platform = 'facebook') => {
  try {
    const platformConfig = socialPlatforms[platform];
    if (!platformConfig) {
      throw new Error(`지원하지 않는 플랫폼: ${platform}`);
    }

    // Facebook의 경우 Graph API를 통한 캐시 새로고침 시도
    if (platform === 'facebook') {
      const refreshUrl = `https://graph.facebook.com/?id=${encodeURIComponent(url)}&scrape=true`;
      
      try {
        const response = await fetch(refreshUrl, {
          method: 'POST',
          mode: 'no-cors' // CORS 제한으로 인해 no-cors 모드 사용
        });
        
        console.log('Facebook 캐시 새로고침 요청 완료');
        return true;
      } catch (error) {
        console.log('Facebook 캐시 새로고침 실패 (CORS 제한):', error);
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error('소셜 캐시 새로고침 실패:', error);
    return false;
  }
};

// 소셜 미디어 디버깅 도구 URL 생성
export const getSocialDebugUrls = (url) => {
  const encodedUrl = encodeURIComponent(url);
  
  return {
    facebook: `${socialPlatforms.facebook.debugUrl}?q=${encodedUrl}`,
    twitter: socialPlatforms.twitter.debugUrl,
    linkedin: `${socialPlatforms.linkedin.debugUrl}${encodedUrl}`
  };
};

// 메타데이터 유효성 검사
export const validateMetadata = (article) => {
  const issues = [];
  
  // 제목 검사
  if (!article.title || article.title.length < 10) {
    issues.push('제목이 너무 짧습니다 (최소 10자 권장)');
  }
  if (article.title && article.title.length > 60) {
    issues.push('제목이 너무 깁니다 (최대 60자 권장)');
  }
  
  // 설명 검사
  const description = article.summary || article.description || '';
  if (!description || description.length < 50) {
    issues.push('설명이 너무 짧습니다 (최소 50자 권장)');
  }
  if (description.length > 160) {
    issues.push('설명이 너무 깁니다 (최대 160자 권장)');
  }
  
  // 이미지 검사
  if (!article.image && !article.imageUrl && !article.urlToImage) {
    issues.push('소셜 공유용 이미지가 없습니다');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

// 소셜 미디어 최적화 점수 계산
export const calculateSocialScore = (article) => {
  let score = 0;
  const maxScore = 100;
  
  // 제목 점수 (30점)
  if (article.title) {
    if (article.title.length >= 10 && article.title.length <= 60) {
      score += 30;
    } else if (article.title.length >= 5) {
      score += 15;
    }
  }
  
  // 설명 점수 (30점)
  const description = article.summary || article.description || '';
  if (description) {
    if (description.length >= 50 && description.length <= 160) {
      score += 30;
    } else if (description.length >= 20) {
      score += 15;
    }
  }
  
  // 이미지 점수 (25점)
  if (article.image || article.imageUrl || article.urlToImage) {
    score += 25;
  }
  
  // 카테고리 점수 (10점)
  if (article.category) {
    score += 10;
  }
  
  // 발행일 점수 (5점)
  if (article.publishedAt) {
    score += 5;
  }
  
  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D'
  };
};

// 소셜 미디어 공유 최적화 제안
export const getSocialOptimizationSuggestions = (article) => {
  const suggestions = [];
  const validation = validateMetadata(article);
  
  if (!validation.isValid) {
    suggestions.push(...validation.issues.map(issue => ({
      type: 'warning',
      message: issue,
      priority: 'high'
    })));
  }
  
  // 추가 최적화 제안
  if (article.title && !article.title.includes('|') && !article.title.includes('-')) {
    suggestions.push({
      type: 'info',
      message: '제목에 브랜드명을 추가하는 것을 고려해보세요 (예: "제목 - NEWStep")',
      priority: 'low'
    });
  }
  
  const description = article.summary || article.description || '';
  if (description && !description.includes('영어') && !description.includes('English')) {
    suggestions.push({
      type: 'info',
      message: '설명에 "영어 학습" 관련 키워드를 포함하는 것을 고려해보세요',
      priority: 'medium'
    });
  }
  
  return suggestions;
};

// 소셜 미디어 미리보기 데이터 생성
export const generateSocialPreview = (article) => {
  const baseUrl = window.location.origin;
  const articleUrl = `${baseUrl}/article/${article.id}`;
  
  return {
    url: articleUrl,
    title: article.title,
    description: article.summary || article.description || '',
    image: article.image || article.imageUrl || article.urlToImage || `${baseUrl}/newstep-social-image.jpg`,
    siteName: 'NEWStep Eng News',
    type: 'article',
    author: 'NEWStep Team',
    publishedTime: article.publishedAt,
    section: article.category
  };
};