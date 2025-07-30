const functions = require('firebase-functions');
const admin = require('firebase-admin');

// 소셜 미디어 크롤러 감지 (모바일 앱 포함)
const isSocialCrawler = (userAgent) => {
  if (!userAgent) return false;
  
  const ua = userAgent.toLowerCase();
  
  const crawlers = [
    // Facebook/Meta
    'facebookexternalhit',
    'facebookcatalog',
    'facebookbot',
    'meta-externalagent',
    
    // Twitter/X (데스크톱 + 모바일)
    'twitterbot',
    'twitter',
    'x11',
    
    // Threads (Meta)
    'threadsbot',
    'threads',
    
    // LinkedIn
    'linkedinbot',
    'linkedin',
    
    // WhatsApp
    'whatsapp',
    'whatsappbot',
    
    // Telegram
    'telegrambot',
    'telegram',
    
    // Discord
    'discordbot',
    'discord',
    
    // Slack
    'slackbot',
    'slack',
    
    // Skype
    'skypeuripreview',
    'skype',
    
    // Apple
    'applebot',
    'apple',
    
    // Google
    'googlebot',
    'google',
    
    // 기타 소셜 플랫폼
    'kakaotalk',
    'kakao',
    'line',
    'naver',
    'pinterest',
    'reddit',
    'tumblr',
    'snapchat',
    'instagram',
    'tiktok',
    
    // 일반적인 소셜 크롤러 패턴
    'social',
    'crawler',
    'bot',
    'spider',
    'scraper',
    'preview',
    'unfurl',
    'embed'
  ];
  
  // 명확한 크롤러만 감지 (일반 브라우저 제외)
  const explicitCrawlers = [
    'facebookexternalhit',
    'facebookcatalog', 
    'facebookbot',
    'twitterbot',
    'linkedinbot',
    'whatsappbot',
    'telegrambot',
    'discordbot',
    'slackbot',
    'googlebot',
    'bingbot',
    'applebot',
    'threadsbot',
    'threads'
  ];
  
  const isExplicitCrawler = explicitCrawlers.some(crawler => ua.includes(crawler));
  
  // 일반 브라우저는 명시적으로 제외
  const isRegularBrowser = ua.includes('mozilla') && 
                          (ua.includes('chrome') || ua.includes('safari') || ua.includes('firefox')) &&
                          !explicitCrawlers.some(crawler => ua.includes(crawler));
  
  // 명확한 크롤러만 true 반환, 일반 브라우저는 false
  return isExplicitCrawler && !isRegularBrowser;
};

// 크롤러 타입 감지 함수
const detectCrawlerType = (userAgent) => {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('facebookexternalhit') || ua.includes('facebookbot')) return 'facebook';
  if (ua.includes('twitterbot') || ua.includes('twitter')) return 'twitter';
  if (ua.includes('threads')) return 'threads';
  if (ua.includes('linkedinbot') || ua.includes('linkedin')) return 'linkedin';
  if (ua.includes('whatsapp')) return 'whatsapp';
  if (ua.includes('telegram')) return 'telegram';
  if (ua.includes('discord')) return 'discord';
  if (ua.includes('slack')) return 'slack';
  if (ua.includes('kakaotalk') || ua.includes('kakao')) return 'kakao';
  if (ua.includes('line')) return 'line';
  if (ua.includes('naver')) return 'naver';
  if (ua.includes('googlebot')) return 'google';
  if (ua.includes('bingbot')) return 'bing';
  if (ua.includes('applebot')) return 'apple';
  
  return 'unknown';
};

// 기본 메타데이터 생성
const generateBaseMeta = (title, description, imageUrl, url) => {
  return `
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="NEWStep Eng News" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="1200" />
    <meta property="og:image:type" content="image/png" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="twitter:site" content="@NEWStepNews" />
  `;
};

// 기사 메타데이터 생성
const generateArticleMeta = async (articleId) => {
  try {
    console.log(`🔍 기사 데이터 조회 시작: ${articleId}`);
    
    // Firestore에서 기사 데이터 가져오기
    const articleDoc = await admin.firestore()
      .collection('articles')
      .doc(articleId)
      .get();
    
    if (!articleDoc.exists) {
      console.log(`❌ 기사 없음: ${articleId}`);
      return null;
    }
    
    const article = articleDoc.data();
    console.log(`✅ 기사 데이터 발견:`, {
      id: articleId,
      title: article.title,
      hasImage: !!article.image,
      hasSummary: !!article.summary,
      status: article.status
    });
    
    // 발행되지 않은 기사는 기본 메타데이터 사용
    if (article.status !== 'published') {
      console.log(`⚠️ 미발행 기사: ${articleId} (status: ${article.status})`);
      return null;
    }
    
    const baseUrl = 'https://marlang-app.web.app';
    
    const title = article.title || 'NEWStep Eng News';
    const description = article.summary || article.description || '영어 뉴스를 통해 영어를 배우세요.';
    const imageUrl = article.image || article.imageUrl || article.urlToImage || `${baseUrl}/newstep-social-image.png`;
    const url = `${baseUrl}/article/${articleId}`;
    
    console.log(`📝 메타데이터 생성:`, { title, description, imageUrl, url });
    
    return generateBaseMeta(title, description, imageUrl, url);
  } catch (error) {
    console.error('기사 메타데이터 생성 오류:', error);
    return null;
  }
};

// 홈페이지 메타데이터
const generateHomeMeta = () => {
  const baseUrl = 'https://marlang-app.web.app';
  const title = 'NEWStep Eng News - 매일 뉴스로 배우는 영어';
  const description = '영어 뉴스를 통해 영어를 배우고, AI 기반 번역과 단어장 기능으로 영어 실력을 향상시키세요.';
  const imageUrl = `${baseUrl}/newstep-social-image.png`;
  const url = baseUrl;
  
  return generateBaseMeta(title, description, imageUrl, url);
};

// 소셜 크롤러용 HTML 템플릿 (리다이렉트 없음)
const getBaseHtml = (metaTags, title) => {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${metaTags}
  <!-- 소셜 크롤러용 - 리다이렉트 없음 -->
</head>
<body>
  <h1>${title}</h1>
  <p>NEWStep Eng News - 영어 뉴스로 배우는 영어</p>
  <p>이 페이지는 소셜 미디어 공유를 위한 메타데이터를 제공합니다.</p>
</body>
</html>`;
};

// 소셜 프리렌더링 함수
exports.socialPrerender = functions.https.onRequest(async (req, res) => {
  const userAgent = req.get('User-Agent') || '';
  const path = req.path;
  
  // 일반 사용자는 실제 기사 페이지로 리다이렉트
  if (!isSocialCrawler(userAgent)) {
    console.log('👤 일반 사용자 감지 - 리다이렉트:', {
      userAgent: userAgent,
      path: path,
      timestamp: new Date().toISOString()
    });
    
    // /social/article/123 → /article/123 로 리다이렉트
    const articleMatch = path.match(/^\/social\/article\/(.+)$/);
    if (articleMatch) {
      const articleId = articleMatch[1];
      return res.redirect(301, `https://marlang-app.web.app/article/${articleId}`);
    }
    // 기타 경로는 홈으로 리다이렉트
    return res.redirect(301, 'https://marlang-app.web.app');
  }
  
  console.log('🔍 소셜 크롤러 감지:', {
    userAgent: userAgent,
    path: path,
    isCrawler: true,
    timestamp: new Date().toISOString()
  });
  
  let metaTags = '';
  let title = 'NEWStep Eng News';
  
  try {
    // /social/article/123 형태의 기사 페이지인지 확인
    const articleMatch = path.match(/^\/social\/article\/(.+)$/);
    
    if (articleMatch) {
      const articleId = articleMatch[1];
      
      // 크롤러 접근 메트릭 수집 (비동기)
      try {
        const crawlerType = detectCrawlerType(userAgent);
        admin.firestore().collection('crawlerMetrics').add({
          articleId,
          userAgent,
          path,
          crawlerType,
          timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
          hour: new Date().getHours(),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }).catch(error => {
          console.warn('소셜 크롤러 메트릭 기록 실패:', error);
        });
      } catch (metricError) {
        console.warn('소셜 크롤러 메트릭 수집 오류:', metricError);
      }
      
      const articleMeta = await generateArticleMeta(articleId);
      
      if (articleMeta) {
        metaTags = articleMeta;
        title = `기사 - NEWStep Eng News`;
      } else {
        metaTags = generateHomeMeta();
      }
    } else {
      // 홈페이지 또는 기타 페이지
      metaTags = generateHomeMeta();
    }
    
    const html = getBaseHtml(metaTags, title);
    
    res.set('Cache-Control', 'public, max-age=300'); // 5분 캐시
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
    
  } catch (error) {
    console.error('프리렌더링 오류:', error);
    
    // 오류 시 기본 메타데이터로 응답
    const fallbackMeta = generateHomeMeta();
    const html = getBaseHtml(fallbackMeta, title);
    
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
});