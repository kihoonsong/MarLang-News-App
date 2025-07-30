const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');

// Firebase Admin은 index.js에서 이미 초기화됨
const db = getFirestore();

const SITE_URL = 'https://marlang-app.web.app';

// HTML 템플릿 생성 함수 (개선된 버전)
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
    
    <!-- 카카오 애드핏 스크립트 -->
    <script async src="//t1.daumcdn.net/kas/static/ba.min.js"></script>
    
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            margin: 0;
            padding: 0;
            color: #333;
            background-color: #f8f9fa;
        }
        
        .page-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
            min-height: 100vh;
        }
        
        .article-image { 
            width: 100%;
            height: 300px;
            object-fit: cover;
            border-radius: 16px;
            margin-bottom: 1rem;
        }
        
        .article-meta { 
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
        }
        
        .article-title { 
            font-size: 1.8rem;
            font-weight: bold;
            margin-bottom: 1.5rem;
            line-height: 1.3;
            color: #333;
        }
        
        .date-text {
            color: #666;
            font-size: 0.9rem;
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
        
        .content-card {
            background: #fff;
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            border: 1px solid #f0f0f0;
        }
        
        .content-text {
            font-size: 1.1rem;
            line-height: 1.6;
            color: #333;
        }
        
        .ad-container {
            margin: 2rem 0;
            padding: 1rem;
            background: #fafafa;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e0e0e0;
        }
        
        .ad-label {
            font-size: 11px;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        
        @media (max-width: 768px) {
            .page-container { 
                padding: 15px; 
            }
            
            .article-title { 
                font-size: 1.6rem;
            }
            
            .article-image {
                height: 250px;
            }
        }
    </style>
</head>
<body>
    <div class="page-container">
        <article itemscope itemtype="https://schema.org/NewsArticle">
            ${article.image ? `<img src="${article.image}" alt="${cleanTitle}" class="article-image" itemprop="image" crossorigin="anonymous" onerror="this.style.display='none'">` : ''}
            
            <div class="article-meta">
                <span class="category-tag" itemprop="articleSection">${article.category}</span>
                <span class="date-text">
                    <time datetime="${article.publishedAt}" itemprop="datePublished">${publishDate}</time>
                </span>
                ${article.views ? `<span class="date-text">👁 ${article.views} views</span>` : ''}
            </div>
            
            <h1 class="article-title" itemprop="headline">${cleanTitle}</h1>
            
            <div class="content-card">
                <div class="content-text" itemprop="articleBody">
                    <p><strong>📝 요약:</strong> <span itemprop="description">${article.summary || '영어 뉴스를 통해 영어 실력을 향상시켜보세요.'}</span></p>
                    
                    ${article.content ? `
                    <div style="margin-top: 1.5rem;">
                        <div class="article-content-text">
                            ${typeof article.content === 'string' ? article.content.replace(/\n/g, '<br>') :
                (article.content.beginner || article.content.intermediate || article.content.advanced || JSON.stringify(article.content))}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- 광고 영역 -->
            <div class="ad-container">
                <div class="ad-label">광고</div>
                <ins class="kakao_ad_area" 
                     style="display:block;" 
                     data-ad-unit="DAN-JVIJRJhlqIMMpiLm" 
                     data-ad-width="728" 
                     data-ad-height="90"></ins>
                <script type="text/javascript">
                    (adsbygoogle = window.adsbygoogle || []).push({});
                </script>
            </div>
            
            <!-- 모바일 광고 -->
            <div class="ad-container" style="display: none;">
                <div class="ad-label">광고</div>
                <ins class="kakao_ad_area" 
                     style="display:block;" 
                     data-ad-unit="DAN-RNzVkjnBfLSGDxqM" 
                     data-ad-width="320" 
                     data-ad-height="50"></ins>
            </div>
            
            <script>
                // 모바일 감지 및 광고 표시
                if (window.innerWidth <= 768) {
                    document.querySelectorAll('.ad-container')[0].style.display = 'none';
                    document.querySelectorAll('.ad-container')[1].style.display = 'block';
                }
            </script>
        </article>
    </div>
    
    <!-- React 앱 마운트 포인트 -->
    <div id="root"></div>
    
    <!-- 프리렌더 데이터 설정 -->
    <script>
        window.__PRERENDERED_ARTICLE__ = {
            id: '${article.id}',
            title: '${cleanTitle}',
            summary: '${(article.summary || '').replace(/'/g, "\\'")}',
            category: '${article.category || 'General'}',
            publishedAt: '${article.publishedAt}',
            image: '${article.image || ''}',
            content: ${JSON.stringify(article.content || '')},
            contentType: '${typeof article.content}',
            hasStructuredContent: ${!!(article.content && typeof article.content === 'object')},
            isPrerendered: true,
            _metadata: {
                generatedAt: '${new Date().toISOString()}',
                version: '1.0',
                source: 'prerender'
            }
        };
        
        // React 앱 로드 후 정적 콘텐츠 숨김
        window.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                const reactRoot = document.querySelector('#root > div');
                if (reactRoot && reactRoot.children.length > 0) {
                    document.querySelector('.page-container').style.display = 'none';
                }
            }, 1000);
        });
    </script>
    
    <!-- React 앱 스크립트 -->
    <script type="module" crossorigin src="/assets/js/index-Bb0Hm0T9.js"></script>
    <link rel="modulepreload" crossorigin href="/assets/js/react-vendor-Dz8DRwSR.js">
    <link rel="modulepreload" crossorigin href="/assets/js/mui-core-CgHrKOaS.js">
</body>
</html>`;
}

// 404 페이지 HTML
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
    <script type="module" crossorigin src="/assets/js/index-Bb0Hm0T9.js"></script>
    <link rel="modulepreload" crossorigin href="/assets/js/react-vendor-Dz8DRwSR.js">
    <link rel="modulepreload" crossorigin href="/assets/js/mui-core-CgHrKOaS.js">
</body>
</html>`;
}

// 소셜 크롤러 감지 함수
const isSocialCrawler = (userAgent) => {
  if (!userAgent) return false;
  
  const ua = userAgent.toLowerCase();
  const crawlers = [
    'facebookexternalhit', 'facebookcatalog', 'facebookbot',
    'twitterbot', 'linkedinbot', 'whatsappbot', 'telegrambot',
    'discordbot', 'slackbot', 'googlebot', 'bingbot', 'applebot', 'threadsbot', 'threads'
  ];
  
  return crawlers.some(crawler => ua.includes(crawler));
};

// 크롤러 타입 감지 함수
const detectCrawlerType = (userAgent) => {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('facebookexternalhit') || ua.includes('facebookbot')) return 'facebook';
  if (ua.includes('twitterbot')) return 'twitter';
  if (ua.includes('threads')) return 'threads';
  if (ua.includes('linkedinbot')) return 'linkedin';
  if (ua.includes('whatsapp')) return 'whatsapp';
  if (ua.includes('telegram')) return 'telegram';
  if (ua.includes('discord')) return 'discord';
  if (ua.includes('googlebot')) return 'google';
  
  return 'unknown';
};

// 개선된 기사 프리렌더링 함수
const prerenderArticle = onRequest(
  {
    region: 'asia-northeast3',
    memory: '1GiB',
    timeoutSeconds: 60,
    cors: true
  },
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      // CORS 헤더 설정
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      
      if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
      }
      
      if (req.method !== 'GET') {
        res.status(405).send('Method Not Allowed');
        return;
      }
      
      // URL에서 기사 ID 추출
      const urlPath = req.path || req.url || '';
      console.log(`🔍 요청 URL: ${urlPath}`);
      
      const articleIdMatch = urlPath.match(/\/article\/([^\/\?&#]+)/);
      
      if (!articleIdMatch) {
        console.error('❌ 기사 ID를 찾을 수 없음:', urlPath);
        res.status(404).send(generateNotFoundHTML('unknown'));
        return;
      }
      
      const articleId = decodeURIComponent(articleIdMatch[1]);
      console.log(`🔍 기사 프리렌더링 요청: ${articleId}`);
      
      // User-Agent 확인
      const userAgent = req.get('User-Agent') || '';
      const isCrawler = isSocialCrawler(userAgent);
      const crawlerType = isCrawler ? detectCrawlerType(userAgent) : null;
      
      console.log(`🤖 요청 분석: ${isCrawler ? `크롤러(${crawlerType})` : '일반 사용자'}`);
      
      // Firestore에서 기사 데이터 조회 (ID 정규화 포함)
      let article = null;
      
      // 원본 ID 외에도 슬러그/언더바/대시 뒤 토큰, 숫자 토큰 등을 후보로 시도
      const normalizeArticleId = (raw) => {
        const candidates = [raw];
        // 언더바/대시가 있으면 마지막 토큰 시도
        if (raw.includes('_') || raw.includes('-')) {
          const lastToken = raw.split(/[_-]/).pop();
          if (lastToken && !candidates.includes(lastToken)) candidates.push(lastToken);
        }
        // 길이 8+ 숫자 토큰 시도
        const numericMatch = raw.match(/(\d{8,})/);
        if (numericMatch && !candidates.includes(numericMatch[1])) {
          candidates.push(numericMatch[1]);
        }
        return candidates;
      };

      try {
        const candidateIds = normalizeArticleId(articleId);
        console.log('🔍 ID 후보군:', candidateIds);
        let articleDoc = null;
        let usedId = null;
        for (const cid of candidateIds) {
          console.log(`📊 Firestore 조회 시도: articles/${cid}`);
          const docSnap = await db.collection('articles').doc(cid).get();
          if (docSnap.exists) {
            articleDoc = docSnap;
            usedId = cid;
            break;
          }
        }
        if (!articleDoc) {
          console.warn(`⚠️ 기사를 찾을 수 없음: ${articleId}`);
          res.status(404).send(generateNotFoundHTML(articleId));
          return;
        }
        
        const articleData = articleDoc.data();
        console.log(`📊 기사 데이터 조회 완료: ${articleData.title} (상태: ${articleData.status})`);
        
        // 발행된 기사만 프리렌더링
        if (articleData.status !== 'published') {
          console.warn(`⚠️ 미발행 기사: ${articleId} (상태: ${articleData.status})`);
          res.status(404).send(generateNotFoundHTML(articleId));
          return;
        }
        
        article = {
          id: usedId,
          ...articleData,
          image: articleData.image || articleData.imageUrl || articleData.urlToImage || null
        };
        
        console.log(`✅ 기사 데이터 로드 완료: ${article.title}`);
        
        // 조회수 증가 (비동기)
        db.collection('articles').doc(usedId).update({
          views: (articleData.views || 0) + 1,
          updatedAt: new Date().toISOString()
        }).catch(error => {
          console.warn('조회수 업데이트 실패:', error);
        });
        
      } catch (firestoreError) {
        console.error('❌ Firestore 조회 실패:', firestoreError);
        
        // Firestore 오류 시에도 React 앱이 로드되도록 기본 HTML 반환
        const errorHtml = `
          <!DOCTYPE html>
          <html lang="ko">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>기사 로딩 중... - NEWStep Eng News</title>
          </head>
          <body>
            <div style="padding: 20px; text-align: center;">
              <h1>기사를 불러오는 중입니다...</h1>
              <p>잠시만 기다려주세요.</p>
            </div>
            <div id="root"></div>
            <script>
              window.__ARTICLE_LOAD_ERROR__ = {
                articleId: '${articleId}',
                error: 'firestore_error',
                timestamp: '${new Date().toISOString()}'
              };
            </script>
            <script type="module" crossorigin src="/assets/js/index-Bb0Hm0T9.js"></script>
            <link rel="modulepreload" crossorigin href="/assets/js/react-vendor-Dz8DRwSR.js">
            <link rel="modulepreload" crossorigin href="/assets/js/mui-core-CgHrKOaS.js">
          </body>
          </html>
        `;
        
        res.status(500).send(errorHtml);
        return;
      }
      
      // HTML 생성 및 응답
      const html = generateArticleHTML(article);
      
      // 캐시 헤더 설정
      if (isCrawler) {
        res.set('Cache-Control', 'public, max-age=3600, s-maxage=7200');
      } else {
        res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
      }
      
      res.set('Content-Type', 'text/html; charset=utf-8');
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ 프리렌더링 완료: ${articleId} (${processingTime}ms)`);
      
      res.send(html);
      
    } catch (error) {
      console.error('❌ 프리렌더링 오류:', error);
      const processingTime = Date.now() - startTime;
      console.log(`❌ 프리렌더링 실패: ${processingTime}ms`);
      
      const errorHtml = `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>오류 발생 - NEWStep Eng News</title>
        </head>
        <body>
          <div style="padding: 20px; text-align: center;">
            <h1>일시적인 오류가 발생했습니다</h1>
            <p>페이지를 새로고침해주세요.</p>
            <button onclick="window.location.reload()" style="padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 5px; cursor: pointer;">새로고침</button>
          </div>
          <div id="root"></div>
          <script>
            window.__PRERENDER_ERROR__ = {
              error: 'server_error',
              timestamp: '${new Date().toISOString()}'
            };
          </script>
          <script type="module" crossorigin src="/assets/js/index-Bb0Hm0T9.js"></script>
          <link rel="modulepreload" crossorigin href="/assets/js/react-vendor-Dz8DRwSR.js">
          <link rel="modulepreload" crossorigin href="/assets/js/mui-core-CgHrKOaS.js">
        </body>
        </html>
      `;
      
      res.status(500).send(errorHtml);
    }
  }
);

module.exports = { prerenderArticle };