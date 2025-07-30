// 소셜 공유를 위한 동적 메타 태그 컴포넌트 (강화된 버전)
import React, { useEffect, useRef } from 'react';
import { useSocialImage } from '../hooks/useSocialImage';
import { refreshSocialCache, getSocialDebugUrls } from '../utils/socialCacheUtils';

const SocialShareMeta = ({ article }) => {
  const { socialImageUrl, isGenerating } = useSocialImage(article);
  const metaUpdateRef = useRef(false);

  useEffect(() => {
    if (!article) {
      return;
    }

    // 중복 실행 방지
    if (metaUpdateRef.current) {
      return;
    }
    metaUpdateRef.current = true;

    const baseUrl = "https://marlang-app.web.app";
    // 소셜 미디어용 URL (메타데이터 생성용)
    const socialUrl = `${baseUrl}/social/article/${article.id}`;
    // 실제 기사 URL (사용자가 접근하는 URL)
    const canonicalUrl = `${baseUrl}/article/${article.id}`;
    // 캐시 무효화를 위한 타임스탬프 추가
    const timestamp = Date.now();
    const articleUrl = `${canonicalUrl}?v=${timestamp}`;

    // 기본 메타 정보 (제목은 기사 제목만)
    const title = article.title || 'NEWStep News Article';
    const description = article.summary || article.description || `Read "${article.title}" on NEWStep News - Learn English through latest news.`;

    // 동적으로 메타 태그 업데이트 (강제 교체)
    const updateMetaTag = (selector, attribute, value) => {
      try {
        // 기존 태그 완전 제거
        const existingMetas = document.querySelectorAll(selector);
        existingMetas.forEach(meta => meta.remove());

        // 새 태그 생성
        const meta = document.createElement('meta');
        if (attribute === 'property') {
          const propertyName = selector.replace('meta[property="', '').replace('"]', '');
          meta.setAttribute('property', propertyName);
        } else if (attribute === 'name') {
          const nameValue = selector.replace('meta[name="', '').replace('"]', '');
          meta.setAttribute('name', nameValue);
        } else if (attribute === 'itemprop') {
          const itempropValue = selector.replace('meta[itemprop="', '').replace('"]', '');
          meta.setAttribute('itemprop', itempropValue);
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
      } catch (error) {
        console.error('메타태그 업데이트 실패:', error);
      }
    };

    // 기본 메타 태그 업데이트
    document.title = title;
    updateMetaTag('meta[name="description"]', 'name', description);
    updateMetaTag('meta[name="keywords"]', 'name', `${article.title}, English news, ${article.category || 'news'}, English learning, NEWStep`);

    // Open Graph 메타 태그 (소셜 크롤러용 URL 사용)
    updateMetaTag('meta[property="og:title"]', 'property', title);
    updateMetaTag('meta[property="og:description"]', 'property', description);
    updateMetaTag('meta[property="og:url"]', 'property', canonicalUrl); // 실제 기사 URL 사용
    updateMetaTag('meta[property="og:type"]', 'property', 'article');
    updateMetaTag('meta[property="og:site_name"]', 'property', 'NEWStep Eng News');
    
    // Canonical URL은 실제 기사 URL로 설정
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }
    const canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    canonicalLink.href = canonicalUrl;
    document.head.appendChild(canonicalLink);

    // 기사 이미지 처리 (강화된 버전)
    if (import.meta.env.DEV) {
      console.log('🔍 기사 메타데이터 처리:', {
        title: article.title,
        hasImage: !!article.image,
        imageUrl: article.image
      });
    }

    // 다양한 이미지 필드 확인 (우선순위 순서로 정렬)
    const possibleImageFields = [
      'image', 'imageUrl', 'urlToImage', 'thumbnail', 'img', 'picture',
      'featuredImage', 'mainImage', 'coverImage', 'photo', 'pic'
    ];

    let articleImage = null;
    for (const field of possibleImageFields) {
      if (article[field] && typeof article[field] === 'string' && article[field].trim()) {
        articleImage = article[field].trim();
        if (import.meta.env.DEV) {
          console.log(`🎯 이미지 필드 '${field}'에서 발견:`, articleImage);
        }
        break;
      }
    }

    // 만약 위에서 찾지 못했다면 모든 필드를 다시 체크
    if (!articleImage) {
      Object.keys(article).forEach(key => {
        if (key.toLowerCase().includes('image') || key.toLowerCase().includes('img') ||
          key.toLowerCase().includes('photo') || key.toLowerCase().includes('pic') ||
          key.toLowerCase().includes('thumbnail')) {
          if (!articleImage && article[key] && typeof article[key] === 'string' && article[key].trim()) {
            articleImage = article[key].trim();
            if (import.meta.env.DEV) {
              console.log(`🔍 추가 검색에서 이미지 발견: ${key} =`, articleImage);
            }
          }
        }
      });
    }

    // 기본 이미지 (NEWStep 브랜드 이미지) - 절대 URL 사용
    let metaImageUrl = `${baseUrl}/newstep-social-image.png`;

    // 기사 이미지가 있으면 우선 사용
    if (articleImage) {
      const imageStr = String(articleImage).trim();

      if (imageStr && imageStr !== '' && imageStr !== 'undefined' && imageStr !== 'null') {
        // HTTP/HTTPS URL인 경우 (가장 일반적)
        if (imageStr.startsWith('http://') || imageStr.startsWith('https://')) {
          try {
            new URL(imageStr);
            
            // Firebase Storage 여부와 관계없이 절대 URL을 사용
            metaImageUrl = imageStr;
            if (import.meta.env.DEV) {
              console.log('✅ 기사 이미지 사용:', metaImageUrl);
            }
          } catch (e) {
            if (import.meta.env.DEV) {
              console.log('⚠️ 잘못된 이미지 URL, 기본 이미지 사용:', imageStr);
            }
          }
        }
        // 상대 경로인 경우
        else if (imageStr.startsWith('/')) {
          metaImageUrl = `${baseUrl}${imageStr}`;
          if (import.meta.env.DEV) {
            console.log('✅ 기사 상대경로 이미지 변환:', metaImageUrl);
          }
        }
        // 기타 경우 (상대 경로 without /)
        else if (!imageStr.startsWith('data:') && !imageStr.startsWith('blob:')) {
          metaImageUrl = `${baseUrl}/${imageStr}`;
          if (import.meta.env.DEV) {
            console.log('✅ 기사 이미지 경로 추가:', metaImageUrl);
          }
        }
      }
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

    // 추가 소셜 메타 태그 (강화)
    updateMetaTag('meta[property="og:updated_time"]', 'property', new Date().toISOString());
    updateMetaTag('meta[property="article:published_time"]', 'property', article.publishedAt || new Date().toISOString());
    updateMetaTag('meta[property="article:modified_time"]', 'property', new Date().toISOString());
    updateMetaTag('meta[property="article:section"]', 'property', article.category || 'News');
    updateMetaTag('meta[property="article:tag"]', 'property', `${article.title}, English, News, Learning`);

    // 구조화된 데이터 (JSON-LD) 추가
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": title,
      "description": description,
      "image": metaImageUrl,
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
      "datePublished": article.publishedAt || new Date().toISOString(),
      "dateModified": new Date().toISOString(),
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonicalUrl
      },
      "url": socialUrl
    };

    // 기존 구조화된 데이터 스크립트 제거
    const existingStructuredData = document.querySelectorAll('script[type="application/ld+json"]');
    existingStructuredData.forEach(script => script.remove());

    // 새로운 구조화된 데이터 스크립트 추가
    const structuredDataScript = document.createElement('script');
    structuredDataScript.type = 'application/ld+json';
    structuredDataScript.textContent = JSON.stringify(structuredData);
    document.head.appendChild(structuredDataScript);

    if (import.meta.env.DEV) {
      console.log('🏷️ 최종 메타 이미지 URL:', metaImageUrl);
      console.log('📊 구조화된 데이터 추가됨');
    }

    // 소셜 플랫폼 캐시 디버깅 도구 링크 출력 (개발 환경에서만)
    if (import.meta.env.DEV) {
      const debugUrls = getSocialDebugUrls(socialUrl); // 소셜 URL로 디버깅
      console.log('🔧 소셜 플랫폼 캐시 디버깅 도구:');
      console.log('📘 Facebook Debugger:', debugUrls.facebook);
      console.log('🧵 Threads Debugger:', debugUrls.threads);
      console.log('🐦 Twitter Card Validator:', debugUrls.twitter);
      console.log('💼 LinkedIn Post Inspector:', debugUrls.linkedin);
      console.log('🔗 소셜 크롤러용 URL:', socialUrl);
      console.log('🔗 실제 기사 URL:', canonicalUrl);
    }

    // Facebook 캐시 새로고침 시도 (비동기, 개발 환경에서만)
    if (import.meta.env.DEV) {
      refreshSocialCache(socialUrl); // 소셜 URL로 캐시 새로고침
    }

    // 메타데이터 업데이트 완료 후 플래그 리셋
    setTimeout(() => {
      metaUpdateRef.current = false;
    }, 1000);

  }, [article, socialImageUrl]);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
};

export default SocialShareMeta;