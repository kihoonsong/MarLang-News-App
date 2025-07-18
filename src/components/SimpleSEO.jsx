import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SimpleSEO = ({ 
  title,
  description,
  keywords,
  image,
  article,
  category
}) => {
  const location = useLocation();
  
  // 기본값 설정
  const baseUrl = "https://marlang-app.web.app";
  const currentUrl = `${baseUrl}${location.pathname}`;
  
  // 페이지별 동적 메타데이터 생성
  const getPageMetadata = () => {
    const path = location.pathname;
    
    // 기사 상세 페이지
    if (article) {
      return {
        title: `${article.title} - NEWStep News`,
        description: article.summary || article.description || `Read "${article.title}" on NEWStep News - Learn English through latest news.`,
        keywords: `${article.title}, English news, ${article.category || 'news'}, English learning, NEWStep`
      };
    }
    
    // 카테고리 페이지
    if (category) {
      return {
        title: `${category.name} News in English - NEWStep News`,
        description: `Latest ${category.name.toLowerCase()} news in English. Learn English through ${category.name.toLowerCase()} articles.`,
        keywords: `${category.name} news, English ${category.name.toLowerCase()}, English learning, NEWStep`
      };
    }
    
    // 경로별 메타데이터
    switch (path) {
      case '/':
        return {
          title: "NEWStep Eng News - Learn English Through Latest News",
          description: "Learn English through latest news with AI-powered translation and vocabulary building. Read technology, science, business news and improve your English skills.",
          keywords: "English news, English learning, AI translation, vocabulary builder, NEWStep"
        };
        
      case '/search':
        return {
          title: "Search English News - NEWStep News",
          description: "Search through thousands of English news articles. Find news by topic, category, or keywords and learn English while staying informed.",
          keywords: "search English news, find news articles, English learning, NEWStep"
        };
        
      case '/wordbook':
        return {
          title: "My Vocabulary - English Word Collection - NEWStep News",
          description: "Build and manage your English vocabulary collection. Save words from news articles and track your learning progress.",
          keywords: "English vocabulary, word collection, vocabulary builder, English learning, NEWStep"
        };
        
      default:
        return {
          title: "NEWStep Eng News - Learn English Through News",
          description: "Learn English through latest news with AI-powered translation and vocabulary building features.",
          keywords: "English news, English learning, AI translation, vocabulary, NEWStep"
        };
    }
  };
  
  const metadata = getPageMetadata();
  const finalTitle = title || metadata.title;
  const finalDescription = description || metadata.description;
  const finalKeywords = keywords || metadata.keywords;
  const finalImage = image || `${baseUrl}/og-image.png`;
  
  useEffect(() => {
    // 동적으로 메타 태그 업데이트
    document.title = finalTitle;
    
    // Description 메타 태그
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.name = 'description';
      document.head.appendChild(descMeta);
    }
    descMeta.content = finalDescription;
    
    // Keywords 메타 태그
    let keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (!keywordsMeta) {
      keywordsMeta = document.createElement('meta');
      keywordsMeta.name = 'keywords';
      document.head.appendChild(keywordsMeta);
    }
    keywordsMeta.content = finalKeywords;
    
    // Open Graph 메타 태그들
    const ogTags = [
      { property: 'og:title', content: finalTitle },
      { property: 'og:description', content: finalDescription },
      { property: 'og:url', content: currentUrl },
      { property: 'og:image', content: finalImage },
      { property: 'og:type', content: article ? 'article' : 'website' },
      { property: 'og:site_name', content: 'NEWStep Eng News' }
    ];
    
    ogTags.forEach(({ property, content }) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    });
    
    // Twitter Card 메타 태그들
    const twitterTags = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: finalTitle },
      { name: 'twitter:description', content: finalDescription },
      { name: 'twitter:image', content: finalImage }
    ];
    
    twitterTags.forEach(({ name, content }) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    });
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = currentUrl;
    
  }, [finalTitle, finalDescription, finalKeywords, finalImage, currentUrl, article]);
  
  return null; // 이 컴포넌트는 렌더링하지 않음
};

export default SimpleSEO;