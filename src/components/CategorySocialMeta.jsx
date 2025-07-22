// 카테고리 페이지용 소셜 메타데이터 컴포넌트
import React, { useEffect } from 'react';

const CategorySocialMeta = ({ category }) => {
  useEffect(() => {
    if (!category) return;

    const baseUrl = "https://marlang-app.web.app";
    const timestamp = Date.now();
    
    // 카테고리별 정보
    const title = `${category.name} - NEWStep Eng News`;
    const description = `${category.name} 카테고리의 최신 영어 뉴스를 통해 영어를 배우세요. NEWStep에서 제공하는 AI 번역과 단어장 기능으로 효과적인 영어 학습을 경험하세요.`;
    const categoryUrl = `${baseUrl}/${category.slug}`;
    const logoImageUrl = `${baseUrl}/newstep-social-image.png`;

    // 동적으로 메타 태그 업데이트
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
    };

    // 기본 메타 태그 업데이트
    document.title = title;
    updateMetaTag('meta[name="description"]', 'name', description);
    updateMetaTag('meta[name="keywords"]', 'name', `${category.name}, 영어 뉴스, 영어 학습, AI 번역, 단어장, NEWStep, English News, English Learning`);

    // Open Graph 메타 태그 (카테고리용)
    updateMetaTag('meta[property="og:title"]', 'property', title);
    updateMetaTag('meta[property="og:description"]', 'property', description);
    updateMetaTag('meta[property="og:url"]', 'property', categoryUrl);
    updateMetaTag('meta[property="og:type"]', 'property', 'website');
    updateMetaTag('meta[property="og:site_name"]', 'property', 'NEWStep Eng News');
    updateMetaTag('meta[property="og:image"]', 'property', logoImageUrl);
    updateMetaTag('meta[property="og:image:secure_url"]', 'property', logoImageUrl);
    updateMetaTag('meta[property="og:image:type"]', 'property', 'image/png');
    updateMetaTag('meta[property="og:image:width"]', 'property', '1200');
    updateMetaTag('meta[property="og:image:height"]', 'property', '630');
    updateMetaTag('meta[property="og:image:alt"]', 'property', `${category.name} - NEWStep Eng News`);
    updateMetaTag('meta[property="og:locale"]', 'property', 'ko_KR');

    // Twitter Card 메타 태그 (카테고리용)
    updateMetaTag('meta[name="twitter:card"]', 'name', 'summary_large_image');
    updateMetaTag('meta[name="twitter:site"]', 'name', '@NEWStepNews');
    updateMetaTag('meta[name="twitter:creator"]', 'name', '@NEWStepNews');
    updateMetaTag('meta[name="twitter:title"]', 'name', title);
    updateMetaTag('meta[name="twitter:description"]', 'name', description);
    updateMetaTag('meta[name="twitter:image"]', 'name', logoImageUrl);
    updateMetaTag('meta[name="twitter:image:alt"]', 'name', `${category.name} - NEWStep Eng News`);

    // 추가 메타 태그
    updateMetaTag('meta[name="image"]', 'name', logoImageUrl);
    updateMetaTag('meta[itemprop="image"]', 'itemprop', logoImageUrl);
    updateMetaTag('meta[name="author"]', 'name', 'NEWStep News Team');

    if (import.meta.env.DEV) {
      console.log('📂 카테고리 메타데이터 설정 완료:', {
        category: category.name,
        title,
        description: description.substring(0, 50) + '...',
        image: logoImageUrl
      });
    }

    // Canonical URL 설정
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = categoryUrl;

    // JSON-LD 구조화된 데이터 (카테고리용)
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": title,
      "description": description,
      "url": categoryUrl,
      "mainEntity": {
        "@type": "ItemList",
        "name": `${category.name} Articles`,
        "description": `Latest ${category.name} news articles for English learning`
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": baseUrl
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": category.name,
            "item": categoryUrl
          }
        ]
      },
      "publisher": {
        "@type": "Organization",
        "name": "NEWStep Team",
        "logo": {
          "@type": "ImageObject",
          "url": logoImageUrl
        }
      }
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

  }, [category]);

  return null; // 이 컴포넌트는 렌더링하지 않음
};

export default CategorySocialMeta;