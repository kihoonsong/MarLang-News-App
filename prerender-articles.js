#!/usr/bin/env node

/**
 * Firebase 기사를 기반으로 정적 HTML 페이지 생성 (SEO 최적화)
 * 사용법: node prerender-articles.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SITE_URL = 'https://marlang-app.web.app';

// HTML 템플릿 생성 함수
function generateArticleHTML(article) {
  const cleanSummary = (article.summary || '').replace(/"/g, '&quot;').substring(0, 160);
  const cleanTitle = (article.title || '').replace(/"/g, '&quot;');
  const publishDate = new Date(article.publishedAt).toLocaleDateString('ko-KR');
  
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${cleanTitle} - NEWStep Eng News</title>
    
    <!-- SEO 메타 태그 -->
    <meta name="description" content="${cleanSummary}">
    <meta name="keywords" content="영어 뉴스, ${article.category}, English News, ${cleanTitle}">
    <meta name="author" content="NEWStep Team">
    <meta name="robots" content="index, follow">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${cleanTitle} - NEWStep Eng News">
    <meta property="og:description" content="${cleanSummary}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${SITE_URL}/article/${article.id}">
    <meta property="og:site_name" content="NEWStep Eng News">
    ${article.image ? `<meta property="og:image" content="${article.image}">` : ''}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${cleanTitle}">
    <meta name="twitter:description" content="${cleanSummary}">
    ${article.image ? `<meta name="twitter:image" content="${article.image}">` : ''}
    
    <!-- 구조화된 데이터 -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "${cleanTitle}",
      "description": "${cleanSummary}",
      "author": {
        "@type": "Organization",
        "name": "NEWStep Team"
      },
      "publisher": {
        "@type": "Organization",
        "name": "NEWStep Eng News",
        "url": "${SITE_URL}"
      },
      "datePublished": "${article.publishedAt}",
      "dateModified": "${article.updatedAt || article.publishedAt}",
      "articleSection": "${article.category}",
      "url": "${SITE_URL}/article/${article.id}"
      ${article.image ? `,"image": "${article.image}"` : ''}
    }
    </script>
    
    <!-- 기본 스타일 -->
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            color: #333;
        }
        .article-header { 
            border-bottom: 1px solid #eee; 
            padding-bottom: 20px; 
            margin-bottom: 20px; 
        }
        .article-meta { 
            color: #666; 
            font-size: 0.9em; 
            margin-bottom: 10px; 
        }
        .article-title { 
            font-size: 2em; 
            margin: 10px 0; 
            color: #1976d2; 
        }
        .article-image { 
            width: 100%; 
            height: 300px; 
            object-fit: cover; 
            border-radius: 8px; 
            margin: 20px 0; 
        }
        .article-content { 
            font-size: 1.1em; 
            line-height: 1.8; 
        }
        .category-tag { 
            background: #e3f2fd; 
            color: #1976d2; 
            padding: 4px 12px; 
            border-radius: 16px; 
            font-size: 0.8em; 
            font-weight: bold; 
        }
        .loading-message {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        .app-link {
            display: inline-block;
            background: #1976d2;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <!-- 크롤러용 정적 콘텐츠 -->
    <article>
        <header class="article-header">
            <div class="article-meta">
                <span class="category-tag">${article.category}</span>
                <span style="margin-left: 10px;">${publishDate}</span>
            </div>
            <h1 class="article-title">${cleanTitle}</h1>
        </header>
        
        ${article.image ? `<img src="${article.image}" alt="${cleanTitle}" class="article-image" onerror="this.style.display='none'">` : ''}
        
        <div class="article-content">
            <p><strong>요약:</strong> ${article.summary || '영어 뉴스 기사입니다.'}</p>
            
            ${article.content ? `
            <div style="margin-top: 30px;">
                <h3>기사 내용</h3>
                <div>${article.content.replace(/\n/g, '<br>')}</div>
            </div>
            ` : ''}
            
            <div style="margin-top: 40px; padding: 20px; background: #f5f5f5; border-radius: 8px;">
                <h3>🎯 NEWStep Eng News에서 영어 학습하기</h3>
                <p>이 기사를 통해 영어를 배우고 싶다면 NEWStep 앱에서 다음 기능을 이용하세요:</p>
                <ul>
                    <li><strong>AI 번역:</strong> 모르는 문장을 즉시 번역</li>
                    <li><strong>단어장:</strong> 새로운 단어를 저장하고 학습</li>
                    <li><strong>음성 읽기:</strong> 정확한 발음으로 듣기 연습</li>
                    <li><strong>개인화 학습:</strong> 나만의 학습 진도 관리</li>
                </ul>
                <a href="${SITE_URL}/article/${article.id}" class="app-link">
                    📱 앱에서 이 기사 학습하기
                </a>
            </div>
        </div>
    </article>
    
    <!-- 네비게이션 -->
    <nav style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <a href="${SITE_URL}">🏠 홈으로</a> |
        <a href="${SITE_URL}/${article.category?.toLowerCase()}">📂 ${article.category} 더보기</a> |
        <a href="${SITE_URL}/search">🔍 검색</a>
    </nav>
    
    <!-- React 앱 로드 (사용자 인터랙션용) -->
    <div id="loading-message" class="loading-message">
        <p>🔄 인터랙티브 기능을 로딩 중입니다...</p>
        <p>잠시만 기다려주세요.</p>
    </div>
    
    <div id="root"></div>
    
    <!-- React 앱 스크립트 -->
    <script>
        // React 앱이 로드되면 정적 콘텐츠 숨기기
        window.addEventListener('load', function() {
            setTimeout(function() {
                const loadingMsg = document.getElementById('loading-message');
                if (loadingMsg && document.querySelector('[data-reactroot]')) {
                    loadingMsg.style.display = 'none';
                }
            }, 2000);
        });
    </script>
    <script type="module" src="/src/main.jsx"></script>
</body>
</html>`;
}

async function prerenderArticles() {
  try {
    console.log('🔄 Firebase에서 기사 데이터 가져오는 중...');
    
    const articlesCol = collection(db, 'articles');
    const articleSnapshot = await getDocs(articlesCol);
    
    const publishedArticles = articleSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(article => article.status === 'published');

    console.log(`📰 발행된 기사 ${publishedArticles.length}개 발견`);

    // dist/article 디렉토리 생성
    const articleDir = path.join(process.cwd(), 'dist', 'article');
    if (!fs.existsSync(articleDir)) {
      fs.mkdirSync(articleDir, { recursive: true });
    }

    // 각 기사별 HTML 파일 생성
    let successCount = 0;
    
    for (const article of publishedArticles) {
      try {
        const html = generateArticleHTML(article);
        const filePath = path.join(articleDir, `${article.id}.html`);
        
        fs.writeFileSync(filePath, html, 'utf8');
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`📝 ${successCount}개 기사 HTML 생성 완료...`);
        }
      } catch (error) {
        console.error(`❌ 기사 ${article.id} HTML 생성 실패:`, error.message);
      }
    }

    console.log(`✅ 총 ${successCount}개 기사 HTML 생성 완료!`);
    console.log(`📍 위치: ${articleDir}`);
    
    // Firebase Hosting 설정 업데이트 안내
    console.log('\n🔧 다음 단계:');
    console.log('1. firebase.json에서 rewrite 규칙 확인');
    console.log('2. npm run build 실행');
    console.log('3. firebase deploy 실행');
    
  } catch (error) {
    console.error('🚨 프리렌더링 실패:', error);
    process.exit(1);
  }
}

// 환경변수 로드
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

prerenderArticles();