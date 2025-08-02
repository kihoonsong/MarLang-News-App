const functions = require('firebase-functions');
const admin = require('firebase-admin');

// 매우 엄격한 소셜 크롤러 감지 (일반 사용자 완전 차단)
const isSocialCrawler = (userAgent) => {
  if (!userAgent) return false;
  
  const ua = userAgent.toLowerCase();
  
  // 명확한 소셜 크롤러만 감지 (매우 제한적)
  const trustedCrawlers = [
    'facebookexternalhit',
    'facebookcatalog', 
    'facebookbot',
    'twitterbot',
    'linkedinbot',
    'whatsappbot',
    'telegrambot',
    'discordbot',
    'slackbot',
    'threadsbot',
    'meta-externalagent'
  ];
  
  // 일반 브라우저 패턴 감지 (매우 포괄적)
  const browserPatterns = [
    'mozilla',
    'chrome',
    'safari',
    'firefox',
    'edge',
    'opera',
    'webkit',
    'gecko',
    'trident',
    'mobile',
    'android',
    'iphone',
    'ipad',
    'windows',
    'macintosh',
    'linux',
    'x11'
  ];
  
  // 브라우저 패턴이 하나라도 있으면 일반 사용자로 간주
  const hasAnyBrowserPattern = browserPatterns.some(pattern => ua.includes(pattern));
  
  // 명확한 크롤러 패턴이 있는지 확인
  const hasExactCrawlerMatch = trustedCrawlers.some(crawler => ua.includes(crawler));
  
  // 매우 엄격한 조건: 명확한 크롤러 패턴이 있고, 브라우저 패턴이 없어야 함
  if (!hasExactCrawlerMatch) {
    return false; // 명확한 크롤러가 아니면 무조건 false
  }
  
  if (hasAnyBrowserPattern) {
    return false; // 브라우저 패턴이 하나라도 있으면 false
  }
  
  // 오직 명확한 크롤러 패턴만 있을 때만 true
  return true;
};

// 기사 메타데이터 생성
const generateArticleMeta = async (articleId) => {
  try {
    const articleDoc = await admin.firestore()
      .collection('articles')
      .doc(articleId)
      .get();
    
    if (!articleDoc.exists) return null;
    
    const article = articleDoc.data();
    
    if (article.status !== 'published') return null;
    
    const baseUrl = 'https://marlang-app.web.app';
    const title = article.title || 'NEWStep Eng News';
    const description = article.summary || article.description || '영어 뉴스를 통해 영어를 배우세요.';
    const imageUrl = article.image || article.imageUrl || article.urlToImage || `${baseUrl}/newstep-social-image.png`;
    const url = `${baseUrl}/article/${articleId}`;
    
    return `
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:image" content="${imageUrl}" />
      <meta property="og:url" content="${url}" />
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content="NEWStep Eng News" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${title}" />
      <meta name="twitter:description" content="${description}" />
      <meta name="twitter:image" content="${imageUrl}" />
    `;
  } catch (error) {
    console.error('기사 메타데이터 생성 오류:', error);
    return null;
  }
};

// 소셜 크롤러용 HTML 템플릿
const getSocialHtml = (metaTags, title) => {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${metaTags}
</head>
<body>
  <h1>${title}</h1>
  <p>NEWStep Eng News - 영어 뉴스로 배우는 영어</p>
</body>
</html>`;
};

// 매우 엄격한 소셜 프리렌더링 함수 (일반 사용자 완전 차단)
exports.socialPrerender = functions.https.onRequest(async (req, res) => {
  const userAgent = req.get('User-Agent') || '';
  const path = req.path;
  const referer = req.get('Referer') || '';
  const acceptHeader = req.get('Accept') || '';
  
  // 로깅 (디버깅용)
  console.log('🔍 소셜 프리렌더링 요청 분석:', {
    userAgent: userAgent.substring(0, 100),
    path,
    referer,
    acceptHeader: acceptHeader.substring(0, 50),
    timestamp: new Date().toISOString()
  });
  
  // 1차 필터: User-Agent 기반 크롤러 감지
  const isCrawlerByUA = isSocialCrawler(userAgent);
  
  // 2차 필터: Accept 헤더 확인 (브라우저는 보통 text/html,application/xhtml+xml 등을 요청)
  const isBrowserRequest = acceptHeader.includes('text/html') && 
                          acceptHeader.includes('application/xhtml+xml');
  
  // 3차 필터: Referer 확인 (브라우저에서 직접 접근하면 referer가 있을 수 있음)
  const hasHumanReferer = referer && (
    referer.includes('google.com') || 
    referer.includes('naver.com') || 
    referer.includes('marlang-app.web.app')
  );
  
  // 매우 엄격한 판단: 명확한 크롤러가 아니면 모두 리다이렉트
  const shouldRedirect = !isCrawlerByUA || isBrowserRequest || hasHumanReferer;
  
  if (shouldRedirect) {
    console.log('🚫 일반 사용자 감지 - 즉시 리다이렉트:', {
      isCrawlerByUA,
      isBrowserRequest,
      hasHumanReferer,
      userAgent: userAgent.substring(0, 50),
      shouldRedirect: true
    });
    
    // 기사 URL 추출하여 정상 페이지로 리다이렉트
    const articleMatch = path.match(/^\/social\/article\/(.+)$/);
    if (articleMatch) {
      const articleId = articleMatch[1];
      console.log(`📰 기사 페이지로 리다이렉트: ${articleId}`);
      res.writeHead(301, { 'Location': `https://marlang-app.web.app/article/${articleId}` });
      return res.end();
    }
    
    // 기타 경로는 홈으로 리다이렉트
    console.log('🏠 홈페이지로 리다이렉트');
    res.writeHead(301, { 'Location': 'https://marlang-app.web.app' });
    return res.end();
  }
  
  // 여기까지 오면 확실한 소셜 크롤러
  console.log('🤖 확실한 소셜 크롤러 감지 - 메타데이터 제공:', {
    userAgent: userAgent.substring(0, 100)
  });
  
  try {
    const articleMatch = path.match(/^\/social\/article\/(.+)$/);
    
    if (articleMatch) {
      const articleId = articleMatch[1];
      console.log(`📄 기사 메타데이터 생성 시작: ${articleId}`);
      
      const articleMeta = await generateArticleMeta(articleId);
      
      if (articleMeta) {
        const html = getSocialHtml(articleMeta, '기사 - NEWStep Eng News');
        
        // 크롤러 전용 헤더 설정
        res.set('Cache-Control', 'public, max-age=300');
        res.set('Content-Type', 'text/html; charset=utf-8');
        res.set('X-Robots-Tag', 'noindex, nofollow'); // 검색엔진 인덱싱 방지
        
        console.log(`✅ 기사 메타데이터 제공 완료: ${articleId}`);
        return res.send(html);
      } else {
        console.log(`❌ 기사 메타데이터 생성 실패: ${articleId}`);
      }
    }
    
    // 기본 메타데이터 (홈페이지용)
    console.log('🏠 기본 메타데이터 제공');
    const defaultMeta = `
      <meta property="og:title" content="NEWStep Eng News" />
      <meta property="og:description" content="영어 뉴스를 통해 영어를 배우세요" />
      <meta property="og:image" content="https://marlang-app.web.app/newstep-social-image.png" />
      <meta property="og:url" content="https://marlang-app.web.app" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="NEWStep Eng News" />
    `;
    
    const html = getSocialHtml(defaultMeta, 'NEWStep Eng News');
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('X-Robots-Tag', 'noindex, nofollow');
    res.send(html);
    
  } catch (error) {
    console.error('🚨 소셜 프리렌더링 오류:', error);
    
    // 오류 시에도 일반 사용자면 리다이렉트
    const articleMatch = path.match(/^\/social\/article\/(.+)$/);
    if (articleMatch) {
      const articleId = articleMatch[1];
      return res.redirect(301, `https://marlang-app.web.app/article/${articleId}`);
    }
    return res.redirect(301, 'https://marlang-app.web.app');
  }
});