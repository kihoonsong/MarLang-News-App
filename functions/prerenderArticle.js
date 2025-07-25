const { onRequest } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Firebase Admin은 index.js에서 이미 초기화됨
const db = getFirestore();

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
    
    <!-- Google AdSense verification -->
    <meta name="google-adsense-account" content="ca-pub-6930662244421305">
    
    <!-- SEO 메타 태그 -->
    <meta name="description" content="${cleanSummary}">
    <meta name="keywords" content="영어 뉴스, ${article.category}, English News, English Learning, ${cleanTitle}">
    <meta name="author" content="NEWStep Team">
    <meta name="robots" content="index, follow">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${cleanTitle} - NEWStep Eng News">
    <meta property="og:description" content="${cleanSummary}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${SITE_URL}/article/${article.id}">
    <meta property="og:site_name" content="NEWStep Eng News">
    <meta property="og:image" content="${article.image || article.imageUrl || article.urlToImage || `${SITE_URL}/newstep-social-image.jpg`}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@NEWStepNews">
    <meta name="twitter:creator" content="@NEWStepNews">
    <meta name="twitter:title" content="${cleanTitle}">
    <meta name="twitter:description" content="${cleanSummary}">
    <meta name="twitter:image" content="${article.image || article.imageUrl || article.urlToImage || `${SITE_URL}/newstep-social-image.jpg`}">
    <meta name="twitter:image:alt" content="${cleanTitle}">
    
    <!-- 구조화된 데이터 (JSON-LD) -->
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
        "url": "${SITE_URL}",
        "logo": {
          "@type": "ImageObject",
          "url": "${SITE_URL}/icon-192.png"
        }
      },
      "datePublished": "${article.publishedAt}",
      "dateModified": "${article.updatedAt || article.publishedAt}",
      "articleSection": "${article.category}",
      "url": "${SITE_URL}/article/${article.id}",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "${SITE_URL}/article/${article.id}"
      }
      ${article.image ? `,"image": ["${article.image}"]` : ''}
    }
    </script>
    
    <!-- Google AdSense script -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6930662244421305"
     crossorigin="anonymous"></script>
    
    <!-- 기본 스타일 -->
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            color: #333;
            background-color: #fff;
        }
        .article-header { 
            border-bottom: 2px solid #1976d2; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .article-meta { 
            color: #666; 
            font-size: 0.9em; 
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .article-title { 
            font-size: 2.2em; 
            margin: 15px 0; 
            color: #1976d2;
            font-weight: bold;
            line-height: 1.3;
        }
        .article-image { 
            width: 100%; 
            height: 300px; 
            object-fit: cover; 
            border-radius: 12px; 
            margin: 20px 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .article-content { 
            font-size: 1.1em; 
            line-height: 1.8;
            margin-bottom: 40px;
        }
        .category-tag { 
            background: #e3f2fd; 
            color: #1976d2; 
            padding: 6px 16px; 
            border-radius: 20px; 
            font-size: 0.85em; 
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .learning-section {
            margin: 40px 0;
            padding: 30px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 16px;
            border-left: 5px solid #1976d2;
        }
        .learning-section h3 {
            color: #1976d2;
            margin-bottom: 20px;
            font-size: 1.4em;
        }
        .feature-list {
            list-style: none;
            padding: 0;
        }
        .feature-list li {
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.3);
        }
        .feature-list li:last-child {
            border-bottom: none;
        }
        .app-link {
            display: inline-block;
            background: linear-gradient(45deg, #1976d2, #42a5f5);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            margin-top: 20px;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(25, 118, 210, 0.3);
            transition: transform 0.2s;
        }
        .app-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(25, 118, 210, 0.4);
        }
        .navigation {
            margin-top: 50px;
            padding: 30px 0;
            border-top: 2px solid #f0f0f0;
            text-align: center;
        }
        .navigation a {
            color: #1976d2;
            text-decoration: none;
            margin: 0 15px;
            font-weight: 500;
        }
        .navigation a:hover {
            text-decoration: underline;
        }
        .stats {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;
        }
        .stat-item {
            text-align: center;
        }
        .stat-number {
            font-size: 1.5em;
            font-weight: bold;
            color: #1976d2;
        }
        .stat-label {
            font-size: 0.9em;
            color: #666;
        }
        @media (max-width: 768px) {
            body { padding: 15px; }
            .article-title { font-size: 1.8em; }
            .learning-section { padding: 20px; }
            .stats { flex-direction: column; gap: 15px; }
        }
    </style>
</head>
<body>
    <!-- 크롤러용 정적 콘텐츠 -->
    <article itemscope itemtype="https://schema.org/NewsArticle">
        <header class="article-header">
            <div class="article-meta">
                <span class="category-tag" itemprop="articleSection">${article.category}</span>
                <time datetime="${article.publishedAt}" itemprop="datePublished">${publishDate}</time>
                ${article.views ? `<span>👁 ${article.views} views</span>` : ''}
                ${article.likes ? `<span>❤️ ${article.likes} likes</span>` : ''}
            </div>
            <h1 class="article-title" itemprop="headline">${cleanTitle}</h1>
        </header>
        
        ${article.image ? `<img src="${article.image}" alt="${cleanTitle}" class="article-image" itemprop="image" onerror="this.style.display='none'">` : ''}
        
        <div class="article-content" itemprop="articleBody">
            <p><strong>📝 요약:</strong> <span itemprop="description">${article.summary || '영어 뉴스를 통해 영어 실력을 향상시켜보세요.'}</span></p>
            
            ${article.content ? `
            <div style="margin-top: 30px;">
                <h3>📰 기사 내용</h3>
                <div style="background: #fafafa; padding: 20px; border-radius: 8px; border-left: 4px solid #1976d2;">
                    ${article.content.replace(/\n/g, '<br>')}
                </div>
            </div>
            ` : ''}
            
            <!-- 통계 정보 -->
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-number">${article.category}</div>
                    <div class="stat-label">카테고리</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${publishDate}</div>
                    <div class="stat-label">발행일</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${article.views || 0}</div>
                    <div class="stat-label">조회수</div>
                </div>
            </div>
        </div>
        
        <!-- 학습 기능 안내 -->
        <div class="learning-section">
            <h3>🎯 NEWStep에서 이 기사로 영어 학습하기</h3>
            <p>이 영어 뉴스 기사를 통해 실용적인 영어 실력을 향상시켜보세요!</p>
            <ul class="feature-list">
                <li><strong>🤖 AI 번역:</strong> 모르는 문장을 클릭하면 즉시 한국어로 번역</li>
                <li><strong>📚 스마트 단어장:</strong> 새로운 단어를 자동으로 저장하고 체계적으로 학습</li>
                <li><strong>🔊 음성 읽기:</strong> 원어민 발음으로 듣기 연습 및 발음 교정</li>
                <li><strong>📊 개인화 학습:</strong> 나만의 학습 진도와 성취도 관리</li>
                <li><strong>🎮 인터랙티브 학습:</strong> 퀴즈와 게임으로 재미있게 영어 학습</li>
            </ul>
            <a href="${SITE_URL}/article/${article.id}" class="app-link">
                📱 앱에서 이 기사 학습하기 →
            </a>
        </div>
        
        <!-- 관련 정보 -->
        <div style="margin: 30px 0; padding: 20px; background: #fff3e0; border-radius: 12px;">
            <h4 style="color: #f57c00; margin-bottom: 15px;">💡 영어 학습 팁</h4>
            <p>뉴스 기사로 영어를 공부할 때는 다음 순서를 추천합니다:</p>
            <ol>
                <li>먼저 제목과 요약을 읽고 전체 내용 파악</li>
                <li>모르는 단어는 단어장에 저장</li>
                <li>전체 기사를 소리내어 읽기</li>
                <li>중요한 문장은 번역해서 이해도 확인</li>
                <li>관련 주제의 다른 기사도 읽어보기</li>
            </ol>
        </div>
    </article>
    
    <!-- 네비게이션 -->
    <nav class="navigation">
        <a href="${SITE_URL}">🏠 홈으로</a>
        <a href="${SITE_URL}/${article.category?.toLowerCase()}">📂 ${article.category} 더보기</a>
        <a href="${SITE_URL}/search">🔍 기사 검색</a>
        <a href="${SITE_URL}/wordbook">📚 나의 단어장</a>
    </nav>
    
    <!-- React 앱 마운트 포인트 -->
    <div id="root"></div>
    
    <!-- React 앱 로드 스크립트 -->
    <script>
        // 전역 변수로 기사 데이터 제공
        window.__PRERENDERED_ARTICLE__ = {
            id: '${article.id}',
            title: '${cleanTitle}',
            summary: '${article.summary || ''}',
            category: '${article.category}',
            publishedAt: '${article.publishedAt}',
            image: '${article.image || ''}',
            content: ${JSON.stringify(article.content || '')},
            isPrerendered: true
        };
        
        // 페이지 로드 완료 후 React 앱 초기화
        window.addEventListener('DOMContentLoaded', function() {
            console.log('✅ SEO 최적화된 기사 페이지 로드 완료');
            
            // Google Analytics 이벤트 (있다면)
            if (typeof gtag !== 'undefined') {
                gtag('event', 'page_view', {
                    page_title: '${cleanTitle}',
                    page_location: '${SITE_URL}/article/${article.id}',
                    content_group1: '${article.category}'
                });
            }
            
            // React 앱 로드 확인 및 전환
            let attempts = 0;
            const maxAttempts = 20; // 2초
            
            const checkReactApp = () => {
                attempts++;
                const reactRoot = document.querySelector('#root > div');
                
                if (reactRoot && reactRoot.children.length > 0) {
                    console.log('✅ React 앱 로드 완료 - 정적 콘텐츠 숨김');
                    // 정적 콘텐츠 숨기기
                    const staticContent = document.querySelector('article[itemscope]');
                    const staticNav = document.querySelector('nav.navigation');
                    
                    if (staticContent) {
                        staticContent.style.display = 'none';
                    }
                    if (staticNav) {
                        staticNav.style.display = 'none';
                    }
                    return;
                }
                
                if (attempts < maxAttempts) {
                    setTimeout(checkReactApp, 100);
                } else {
                    console.warn('⚠️ React 앱 로드 실패 - 정적 콘텐츠 유지');
                }
            };
            
            // 500ms 후 React 앱 확인 시작
            setTimeout(checkReactApp, 500);
        });
    </script>
    
    <!-- React 앱 스크립트 -->
    <script type="module" src="/src/main.jsx"></script>
</body>
</html>`;
}

// 기본 HTML (기사를 찾을 수 없을 때)
function generateNotFoundHTML(articleId) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>기사를 찾을 수 없습니다 - NEWStep Eng News</title>
    <meta name="robots" content="noindex">
</head>
<body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
    <h1>🔍 기사를 찾을 수 없습니다</h1>
    <p>요청하신 기사(ID: ${articleId})를 찾을 수 없습니다.</p>
    <a href="${SITE_URL}" style="color: #1976d2;">홈으로 돌아가기</a>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
</body>
</html>`;
}

// Cloud Function
exports.prerenderArticle = onRequest({
  region: 'us-central1',
  memory: '256MiB',
  timeoutSeconds: 10,
}, async (req, res) => {
  try {
    // URL에서 기사 ID 추출
    const path = req.path;
    const articleId = path.split('/').pop();
    
    console.log(`🔍 기사 프리렌더링 요청: ${articleId}`);
    
    if (!articleId || articleId === 'article') {
      res.status(404).send(generateNotFoundHTML('unknown'));
      return;
    }
    
    // Firestore에서 기사 데이터 가져오기
    const articleDoc = await db.collection('articles').doc(articleId).get();
    
    if (!articleDoc.exists) {
      console.log(`❌ 기사 없음: ${articleId}`);
      res.status(404).send(generateNotFoundHTML(articleId));
      return;
    }
    
    const articleData = articleDoc.data();
    
    // 발행되지 않은 기사는 404 처리
    if (articleData.status !== 'published') {
      console.log(`🚫 미발행 기사: ${articleId} (status: ${articleData.status})`);
      res.status(404).send(generateNotFoundHTML(articleId));
      return;
    }
    
    // 조회수 증가 (비동기)
    db.collection('articles').doc(articleId).update({
      views: (articleData.views || 0) + 1,
      updatedAt: new Date().toISOString()
    }).catch(error => {
      console.error('조회수 업데이트 실패:', error);
    });
    
    // HTML 생성 및 반환
    const html = generateArticleHTML({ id: articleId, ...articleData });
    
    // 캐시 헤더 설정
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600'); // 5분 캐시
    res.set('Content-Type', 'text/html; charset=utf-8');
    
    console.log(`✅ 기사 프리렌더링 완료: ${articleId}`);
    res.send(html);
    
  } catch (error) {
    console.error('🚨 프리렌더링 오류:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>⚠️ 일시적인 오류가 발생했습니다</h1>
          <p>잠시 후 다시 시도해주세요.</p>
          <a href="${SITE_URL}">홈으로 돌아가기</a>
          <div id="root"></div>
          <script type="module" src="/src/main.jsx"></script>
        </body>
      </html>
    `);
  }
});