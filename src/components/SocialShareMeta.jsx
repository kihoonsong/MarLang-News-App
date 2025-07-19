// 소셜 공유를 위한 동적 메타 태그 컴포넌트
import React, { useEffect } from 'react';
import { useSocialImage } from '../hooks/useSocialImage';

const SocialShareMeta = ({ article }) => {
  const { socialImageUrl, isGenerating } = useSocialImage(article);

  useEffect(() => {
    if (!article) return;

    const baseUrl = "https://marlang-app.web.app";
    const articleUrl = `${baseUrl}/article/${article.id}`;
    
    // 기본 메타 정보
    const title = `${article.title} - NEWStep News`;
    const description = article.summary || article.description || `Read "${article.title}" on NEWStep News - Learn English through latest news.`;
    
    // 동적으로 메타 태그 업데이트
    const updateMetaTag = (selector, attribute, value) => {
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement('meta');
        if (attribute === 'property') {
          meta.setAttribute('property', selector.replace('meta[property="', '').replace('"]', ''));
        } else if (attribute === 'name') {
          meta.setAttribute('name', selector.replace('meta[name="', '').replace('"]', ''));
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', value);
      
      // 디버깅용 로그
      if (selector.includes('og:image') || selector.includes('twitter:image')) {
        console.log(`메타태그 업데이트: ${selector} = ${value}`);
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
    
    // 기사 원본 이미지 사용 (일반 언론사 방식)
    if (article.image) {
      // 이미지 URL이 상대 경로인 경우 절대 경로로 변환
      const imageUrl = article.image.startsWith('http') ? article.image : `${baseUrl}${article.image}`;
      
      updateMetaTag('meta[property="og:image"]', 'property', imageUrl);
      updateMetaTag('meta[property="og:image:secure_url"]', 'property', imageUrl);
      updateMetaTag('meta[property="og:image:width"]', 'property', '1200');
      updateMetaTag('meta[property="og:image:height"]', 'property', '630');
      updateMetaTag('meta[property="og:image:alt"]', 'property', title);
      
      // 이미지 타입 감지
      const imageType = imageUrl.toLowerCase().includes('.png') ? 'image/png' : 
                       imageUrl.toLowerCase().includes('.jpg') || imageUrl.toLowerCase().includes('.jpeg') ? 'image/jpeg' :
                       imageUrl.toLowerCase().includes('.webp') ? 'image/webp' : 'image/jpeg';
      updateMetaTag('meta[property="og:image:type"]', 'property', imageType);
      
      // Twitter Card 메타 태그
      updateMetaTag('meta[name="twitter:card"]', 'name', 'summary_large_image');
      updateMetaTag('meta[name="twitter:title"]', 'name', title);
      updateMetaTag('meta[name="twitter:description"]', 'name', description);
      updateMetaTag('meta[name="twitter:image"]', 'name', imageUrl);
      updateMetaTag('meta[name="twitter:image:alt"]', 'name', title);
      
      console.log('소셜 메타데이터 이미지 설정:', imageUrl);
    } else {
      // 이미지가 없을 때 기본 이미지 사용
      const defaultImage = `${baseUrl}/og-image.png`;
      updateMetaTag('meta[property="og:image"]', 'property', defaultImage);
      updateMetaTag('meta[property="og:image:secure_url"]', 'property', defaultImage);
      updateMetaTag('meta[name="twitter:image"]', 'name', defaultImage);
      updateMetaTag('meta[name="twitter:card"]', 'name', 'summary');
      
      console.log('기본 소셜 메타데이터 이미지 설정:', defaultImage);
    }

    // Article 관련 메타 태그
    if (article.publishedAt) {
      updateMetaTag('meta[property="article:published_time"]', 'property', new Date(article.publishedAt).toISOString());
    }
    if (article.category) {
      updateMetaTag('meta[property="article:section"]', 'property', article.category);
    }
    updateMetaTag('meta[property="article:author"]', 'property', 'NEWStep News Team');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = articleUrl;

    // JSON-LD 구조화된 데이터
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.title,
      "description": description,
      "image": article.image || `${baseUrl}/og-image.png`,
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

  }, [article, socialImageUrl, isGenerating]);

  return null; // 이 컴포넌트는 렌더링하지 않음
};

export default SocialShareMeta;