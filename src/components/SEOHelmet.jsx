import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SEOHelmet = ({ 
  title,
  description,
  keywords,
  url,
  image,
  article,
  category,
  type = "website",
  publishedTime,
  modifiedTime,
  author = "NEWStep News Team",
  siteName = "NEWStep Eng News"
}) => {
  const location = useLocation();
  
  // 기본값 설정 (동적 생성)
  const baseUrl = "https://marlang-app.web.app";
  const currentUrl = url || `${baseUrl}${location.pathname}`;
  
  // 페이지별 동적 메타데이터 생성
  const getPageMetadata = () => {
    const path = location.pathname;
    
    // 기사 상세 페이지
    if (article) {
      return {
        title: `${article.title} - NEWStep News`,
        description: article.summary || article.description || `Read "${article.title}" on NEWStep News - Learn English through latest news with AI translation and vocabulary features.`,
        keywords: `${article.title}, English news, ${article.category || 'news'}, English learning, AI translation, vocabulary, NEWStep`,
        image: article.image || `${baseUrl}/og-image.png`,
        type: "article"
      };
    }
    
    // 카테고리 페이지
    if (category) {
      return {
        title: `${category.name} News in English - NEWStep News`,
        description: `Latest ${category.name.toLowerCase()} news in English. Learn English through ${category.name.toLowerCase()} articles with AI translation and vocabulary building features.`,
        keywords: `${category.name} news, English ${category.name.toLowerCase()}, English learning, AI translation, vocabulary, NEWStep`,
        image: `${baseUrl}/og-image-${category.slug || category.name.toLowerCase()}.png`
      };
    }
    
    // 경로별 메타데이터
    switch (path) {
      case '/':
        return {
          title: "NEWStep Eng News - Learn English Through Latest News",
          description: "Learn English through latest news with AI-powered translation and vocabulary building. Read technology, science, business news and improve your English skills.",
          keywords: "English news, English learning, AI translation, vocabulary builder, news reader, language learning, NEWStep"
        };
        
      case '/search':
        return {
          title: "Search English News - NEWStep News",
          description: "Search through thousands of English news articles. Find news by topic, category, or keywords and learn English while staying informed.",
          keywords: "search English news, find news articles, English learning, news search, NEWStep"
        };
        
      case '/wordbook':
        return {
          title: "My Vocabulary - English Word Collection - NEWStep News",
          description: "Build and manage your English vocabulary collection. Save words from news articles and track your learning progress.",
          keywords: "English vocabulary, word collection, vocabulary builder, English learning, saved words, NEWStep"
        };
        
      case '/like':
        return {
          title: "Liked Articles - My Favorite News - NEWStep News",
          description: "Access your favorite English news articles. Keep track of interesting stories and continue learning English.",
          keywords: "favorite articles, liked news, bookmarked articles, English learning, NEWStep"
        };
        
      case '/profile':
        return {
          title: "My Profile - Learning Progress - NEWStep News",
          description: "Track your English learning progress, manage your preferences, and view your reading statistics.",
          keywords: "user profile, learning progress, English learning stats, NEWStep"
        };
        
      case '/privacy':
        return {
          title: "Privacy Policy - NEWStep News",
          description: "Learn about how NEWStep News protects your privacy and handles your personal information.",
          keywords: "privacy policy, data protection, user privacy, NEWStep"
        };
        
      case '/contact':
        return {
          title: "Contact Us - NEWStep News",
          description: "Get in touch with NEWStep News team. Send feedback, report issues, or ask questions about our English learning platform.",
          keywords: "contact, support, feedback, help, NEWStep"
        };
        
      default:
        // 동적 카테고리 페이지 처리
        const categoryMatch = path.match(/^\/([^\/]+)$/);
        if (categoryMatch) {
          const categoryName = categoryMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          return {
            title: `${categoryName} News in English - NEWStep News`,
            description: `Latest ${categoryName.toLowerCase()} news in English. Learn English through ${categoryName.toLowerCase()} articles with AI translation and vocabulary features.`,
            keywords: `${categoryName} news, English ${categoryName.toLowerCase()}, English learning, AI translation, NEWStep`
          };
        }
        
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
  const finalImage = image || metadata.image || `${baseUrl}/og-image.png`;
  const finalType = article ? "article" : type;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="en" />
      <meta name="revisit-after" content="1 days" />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={finalType} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />
      
      {/* Article specific Open Graph tags */}
      {article && (
        <>
          <meta property="article:author" content={author} />
          <meta property="article:section" content={article.category} />
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {article.tags && article.tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@NEWStepNews" />
      <meta name="twitter:creator" content="@NEWStepNews" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      <meta name="twitter:image:alt" content={finalTitle} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="theme-color" content="#1976d2" />
      <meta name="msapplication-TileColor" content="#1976d2" />
      <meta name="application-name" content="NEWStep News" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Alternate languages */}
      <link rel="alternate" hrefLang="en" href={currentUrl} />
      <link rel="alternate" hrefLang="ko" href={currentUrl} />
      <link rel="alternate" hrefLang="x-default" href={currentUrl} />
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://images.unsplash.com" />
      
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": finalType === "article" ? "NewsArticle" : "WebSite",
          ...(finalType === "article" ? {
            "headline": finalTitle,
            "description": finalDescription,
            "image": finalImage,
            "author": {
              "@type": "Organization",
              "name": author
            },
            "publisher": {
              "@type": "Organization",
              "name": siteName,
              "logo": {
                "@type": "ImageObject",
                "url": `${baseUrl}/logo.png`
              }
            },
            "datePublished": publishedTime || article?.publishedAt,
            "dateModified": modifiedTime || article?.updatedAt || article?.publishedAt,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": currentUrl
            },
            "articleSection": article?.category,
            "keywords": finalKeywords.split(', ')
          } : {
            "name": siteName,
            "description": finalDescription,
            "url": baseUrl,
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${baseUrl}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string"
            },
            "sameAs": [
              "https://twitter.com/NEWStepNews",
              "https://facebook.com/NEWStepNews"
            ]
          })
        })}
      </script>
      
      {/* Breadcrumb structured data for category pages */}
      {category && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
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
                "item": currentUrl
              }
            ]
          })}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHelmet;