// 소셜 공유를 위한 동적 메타 태그 컴포넌트
import React, { useEffect } from 'react';
import { useSocialImage } from '../hooks/useSocialImage';
import { refreshSocialCache, getSocialDebugUrls } from '../utils/socialCacheUtils';

const SocialShareMeta = ({ article }) => {
  const { socialImageUrl, isGenerating } = useSocialImage(article);

  useEffect(() => {
    if (!article) {
      return;
    }

    const baseUrl = "https://marlang-app.web.app";
    // 캐시 무효화를 위한 타임스탬프 추가
    const timestamp = Date.now();
    const articleUrl = `${baseUrl}/article/${article.id}?v=${timestamp}`;
    const canonicalUrl = `${baseUrl}/article/${article.id}`;

    // 기본 메타 정보 (제목은 기사 제목만)
    const title = article.title;
    const description = article.summary || article.description || `Read "${article.title}" on NEWStep News - Learn English through latest news.`;

    // 동적으로 메타 태그 업데이트 (강제 교체)
    const updateMetaTag = (selector, attribute, value) => {
      // 기존 태그 완전 제거
      const existingMetas = document.querySelectorAll(selector);
      existingMetas.forEach(meta => meta.remove());

      // 새 태그 생성
      const meta = document.createElement('meta');
      if (attribute === 'property') {
        meta.setAttribute('property', selector.replace('meta[property="', '').replace('"]', ''));
      } else if (attribute === 'name') {
        meta.setAttribute('name', selector.replace('meta[name="', '').replace('"]', ''));
      } else if (attribute === 'itemprop') {
        meta.setAttribute('itemprop', selector.replace('meta[itemprop="', '').replace('"]', ''));
      }

      meta.setAttribute('content', value);
      document.head.appendChild(meta);

      // 디버깅용 로그
      if (selector.includes('og:image') || selector.includes('twitter:image')) {
        console.log(`🏷️ 메타태그 강제 교체:`, {
          selector,
          newValue: value,
          element: meta
        });
      }
    };

    // 기본 메타 태그 업데이트
    document.title = title;
    updateMetaTag('meta[name="description"]', 'name', description);
    updateMetaTag('meta[name="keywords"]', 'name', `${article.title}, English news, ${article.category || 'news'}, English learning, NEWStep`);

    // Open Graph 메타 태그
    updateMetaTag('meta[property="og:title"]', 'property', title);
    updateMetaTag('meta[property="og:description"]', 'property', description);
    updateMetaTag('meta[property="og:url"]', 'property', articleUrl);
    updateMetaTag('meta[property="og:type"]', 'property', 'article');
    updateMetaTag('meta[property="og:site_name"]', 'property', 'NEWStep Eng News');

    // 기사 이미지 처리 (강화된 버전)
    console.log('🔍 전체 기사 데이터:', article);
    console.log('🔍 이미지 관련 필드들:', {
      image: article.image,
      imageUrl: article.imageUrl,
      thumbnail: article.thumbnail,
      urlToImage: article.urlToImage
    });

    // 다양한 이미지 필드 확인 (우선순위 순서로 정렬)
    const possibleImageFields = [
      'image', 'imageUrl', 'urlToImage', 'thumbnail', 'img', 'picture',
      'featuredImage', 'mainImage', 'coverImage', 'photo', 'pic'
    ];

    let articleImage = null;
    for (const field of possibleImageFields) {
      if (article[field] && typeof article[field] === 'string' && article[field].trim()) {
        articleImage = article[field].trim();
        console.log(`🎯 이미지 필드 '${field}'에서 발견:`, articleImage);
        break;
      }
    }

    // 만약 위에서 찾지 못했다면 모든 필드를 다시 체크
    if (!articleImage) {
      console.log('🔍 모든 필드 재검색...');
      Object.keys(article).forEach(key => {
        if (key.toLowerCase().includes('image') || key.toLowerCase().includes('img') ||
          key.toLowerCase().includes('photo') || key.toLowerCase().includes('pic') ||
          key.toLowerCase().includes('thumbnail')) {
          console.log(`🔍 이미지 관련 필드 발견: ${key} =`, article[key]);
          if (!articleImage && article[key] && typeof article[key] === 'string' && article[key].trim()) {
            articleImage = article[key].trim();
          }
        }
      });
    }

    // 기본 이미지 (NEWStep 브랜드 이미지) - 캐시 무효화 적용
    let metaImageUrl = `${baseUrl}/newstep-social-image.jpg?v=${timestamp}`;

    // 기사 이미지 우선 사용
    console.log('🚀 기사 이미지 처리 시작');

    console.log('🖼️ 이미지 처리 시작:', {
      articleImage,
      hasImage: !!articleImage,
      imageType: typeof articleImage,
      imageLength: articleImage ? articleImage.length : 0
    });

    // 기사 이미지가 있으면 우선 사용
    if (articleImage) {
      console.log('🔍 기사 이미지 발견, 타입 및 내용 분석:', {
        type: typeof articleImage,
        value: articleImage,
        isString: typeof articleImage === 'string',
        length: articleImage ? String(articleImage).length : 0,
        startsWithHttp: String(articleImage).startsWith('http'),
        trimmed: String(articleImage).trim()
      });

      const imageStr = String(articleImage).trim();

      if (imageStr && imageStr !== '' && imageStr !== 'undefined' && imageStr !== 'null') {
        // HTTP/HTTPS URL인 경우 (가장 일반적)
        if (imageStr.startsWith('http://') || imageStr.startsWith('https://')) {
          // 이미지 URL 유효성 검증
          try {
            new URL(imageStr);
            // 캐시 무효화를 위한 파라미터 추가
            const separator = imageStr.includes('?') ? '&' : '?';
            metaImageUrl = `${imageStr}${separator}v=${timestamp}`;
            console.log('✅ 기사 HTTP 이미지 사용 (캐시 무효화):', metaImageUrl);
          } catch (e) {
            console.log('⚠️ 잘못된 이미지 URL, 기본 이미지 사용:', imageStr);
          }
        }
        // 상대 경로인 경우
        else if (imageStr.startsWith('/')) {
          metaImageUrl = `${baseUrl}${imageStr}?v=${timestamp}`;
          console.log('✅ 기사 상대경로 이미지 변환 (캐시 무효화):', metaImageUrl);
        }
        // 기타 경우 (상대 경로 without /)
        else if (!imageStr.startsWith('data:') && !imageStr.startsWith('blob:')) {
          metaImageUrl = `${baseUrl}/${imageStr}?v=${timestamp}`;
          console.log('✅ 기사 이미지 경로 추가 (캐시 무효화):', metaImageUrl);
        }
        else {
          console.log('⚠️ Base64/Blob 또는 지원하지 않는 이미지 형식, 기본 이미지 유지:', imageStr.substring(0, 50));
        }
      } else {
        console.log('⚠️ 기사 이미지 값이 비어있음:', imageStr);
      }
    } else {
      console.log('⚠️ 기사 이미지 필드 자체가 없음, 기본 이미지 사용');
    }

    const imageType = metaImageUrl.includes('.png') ? 'image/png' : 'image/jpeg';

    // Open Graph 메타 태그 (강화된 버전)
    updateMetaTag('meta[property="og:image"]', 'property', metaImageUrl);
    updateMetaTag('meta[property="og:image:secure_url"]', 'property', metaImageUrl);
    updateMetaTag('meta[property="og:image:type"]', 'property', imageType);
    updateMetaTag('meta[property="og:image:width"]', 'property', '1200');
    updateMetaTag('meta[property="og:image:height"]', 'property', '630');
    updateMetaTag('meta[property="og:image:alt"]', 'property', title);

    // 추가 이미지 메타 태그 (일부 플랫폼용)
    updateMetaTag('meta[name="image"]', 'name', metaImageUrl);
    updateMetaTag('meta[itemprop="image"]', 'itemprop', metaImageUrl);

    // Twitter Card 메타 태그 (강화된 버전)
    updateMetaTag('meta[name="twitter:card"]', 'name', 'summary_large_image');
    updateMetaTag('meta[name="twitter:site"]', 'name', '@NEWStepNews');
    updateMetaTag('meta[name="twitter:creator"]', 'name', '@NEWStepNews');
    updateMetaTag('meta[name="twitter:title"]', 'name', title);
    updateMetaTag('meta[name="twitter:description"]', 'name', description);
    updateMetaTag('meta[name="twitter:image"]', 'name', metaImageUrl);
    updateMetaTag('meta[name="twitter:image:alt"]', 'name', title);

    // 카카오톡용 추가 메타 태그
    updateMetaTag('meta[property="og:locale"]', 'property', 'ko_KR');
    updateMetaTag('meta[name="author"]', 'name', 'NEWStep News Team');

    console.log('🏷️ 최종 메타 이미지 URL:', metaImageUrl);

    // 소셜 플랫폼 캐시 디버깅 도구 링크 출력
    const debugUrls = getSocialDebugUrls(canonicalUrl);
    console.log('🔧 소셜 플랫폼 캐시 디버깅 도구:');
    console.log('📘 Facebook Debugger:', debugUrls.facebook);
    console.log('🐦 Twitter Card Validator:', debugUrls.twitter);
    console.log('💼 LinkedIn Post Inspector:', debugUrls.linkedin);

    // Facebook 캐시 새로고침 시도 (비동기)
    refreshSocialCache(canonicalUrl, 'facebook').then(success => {
      if (success) {
        console.log('✅ Facebook 캐시 새로고침 완료');
      } else {
        console.log('⚠️ Facebook 캐시 새로고침 실패 (수동으로 디버거 사용 필요)');
      }
    });



    // Article 관련 메타 태그
    if (article.publishedAt) {
      updateMetaTag('meta[property="article:published_time"]', 'property', new Date(article.publishedAt).toISOString());
    }
    if (article.category) {
      updateMetaTag('meta[property="article:section"]', 'property', article.category);
    }
    updateMetaTag('meta[property="article:author"]', 'property', 'NEWStep News Team');

    // Canonical URL (타임스탬프 없는 깨끗한 URL)
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    // JSON-LD 구조화된 데이터
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "description": description,
      "image": metaImageUrl,
      "url": articleUrl,
      "author": {
        "@type": "Organization",
        "name": "NEWStep News Team"
      },
      "publisher": {
        "@type": "Organization",
        "name": "NEWStep Eng News",
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/logo.png`
        }
      },
      "datePublished": article.publishedAt,
      "dateModified": article.updatedAt || article.publishedAt,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": articleUrl
      },
      "articleSection": article.category,
      "keywords": [article.title, "English news", article.category || "news", "English learning", "NEWStep"]
    };

    // 기존 JSON-LD 스크립트 제거
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // 새 JSON-LD 스크립트 추가
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

  }, [article]);

  return null; // 이 컴포넌트는 렌더링하지 않음
};

export default SocialShareMeta;