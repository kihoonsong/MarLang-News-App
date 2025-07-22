// 홈페이지용 소셜 메타데이터 컴포넌트
import React, { useEffect } from 'react';

const HomeSocialMeta = () => {
    useEffect(() => {
        const baseUrl = "https://marlang-app.web.app";
        const timestamp = Date.now();

        // 홈페이지 기본 정보
        const title = "NEWStep Eng News - 영어 뉴스로 배우는 영어";
        const description = "영어 뉴스를 통해 영어를 배우고, AI 기반 번역과 단어장 기능으로 영어 실력을 향상시키세요. Technology, Science, Business, Culture 뉴스로 실용적인 영어 학습을 경험하세요.";
        const homeUrl = baseUrl;
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
        updateMetaTag('meta[name="keywords"]', 'name', '영어 뉴스, 영어 학습, AI 번역, 단어장, NEWStep, English News, Technology News, Science News, Business News, Culture News, English Learning, Vocabulary');

        // Open Graph 메타 태그 (홈페이지용)
        updateMetaTag('meta[property="og:title"]', 'property', title);
        updateMetaTag('meta[property="og:description"]', 'property', description);
        updateMetaTag('meta[property="og:url"]', 'property', homeUrl);
        updateMetaTag('meta[property="og:type"]', 'property', 'website');
        updateMetaTag('meta[property="og:site_name"]', 'property', 'NEWStep Eng News');
        updateMetaTag('meta[property="og:image"]', 'property', logoImageUrl);
        updateMetaTag('meta[property="og:image:secure_url"]', 'property', logoImageUrl);
        updateMetaTag('meta[property="og:image:type"]', 'property', 'image/png');
        updateMetaTag('meta[property="og:image:width"]', 'property', '1200');
        updateMetaTag('meta[property="og:image:height"]', 'property', '630');
        updateMetaTag('meta[property="og:image:alt"]', 'property', 'NEWStep Eng News - 영어 뉴스로 배우는 영어');
        updateMetaTag('meta[property="og:locale"]', 'property', 'ko_KR');

        // Twitter Card 메타 태그 (홈페이지용)
        updateMetaTag('meta[name="twitter:card"]', 'name', 'summary_large_image');
        updateMetaTag('meta[name="twitter:site"]', 'name', '@NEWStepNews');
        updateMetaTag('meta[name="twitter:creator"]', 'name', '@NEWStepNews');
        updateMetaTag('meta[name="twitter:title"]', 'name', title);
        updateMetaTag('meta[name="twitter:description"]', 'name', description);
        updateMetaTag('meta[name="twitter:image"]', 'name', logoImageUrl);
        updateMetaTag('meta[name="twitter:image:alt"]', 'name', 'NEWStep Eng News - 영어 뉴스로 배우는 영어');

        // 추가 메타 태그
        updateMetaTag('meta[name="image"]', 'name', logoImageUrl);
        updateMetaTag('meta[itemprop="image"]', 'itemprop', logoImageUrl);
        updateMetaTag('meta[name="author"]', 'name', 'NEWStep News Team');

        if (import.meta.env.DEV) {
            console.log('🏠 홈페이지 메타데이터 설정 완료:', {
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
        canonical.href = homeUrl;

        // JSON-LD 구조화된 데이터 (홈페이지용)
        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "NEWStep Eng News",
            "description": description,
            "url": homeUrl,
            "potentialAction": {
                "@type": "SearchAction",
                "target": `${homeUrl}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string"
            },
            "publisher": {
                "@type": "Organization",
                "name": "NEWStep Team",
                "logo": {
                    "@type": "ImageObject",
                    "url": logoImageUrl
                }
            },
            "mainEntity": {
                "@type": "EducationalOrganization",
                "name": "NEWStep Eng News",
                "description": "영어 뉴스 기반 영어 학습 플랫폼",
                "educationalCredentialAwarded": "English Language Learning"
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

    }, []);

    return null; // 이 컴포넌트는 렌더링하지 않음
};

export default HomeSocialMeta;