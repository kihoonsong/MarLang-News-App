const functions = require('firebase-functions');
const admin = require('firebase-admin');

// 소셜 미디어 크롤러 감지
const isSocialCrawler = (userAgent) => {
  if (!userAgent) return false;
  
  const crawlers = [
    'facebookexternalhit',
    'Twitterbot',
    'LinkedInBot',
    'WhatsApp',
    'TelegramBot',
    'SkypeUriPreview',
    'SlackBot',
    'DiscordBot',
    'Applebot',
    'GoogleBot'
  ];
  
  return crawlers.some(crawler => 
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
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
    // Firestore에서 기사 데이터 가져오기
    const articleDoc = await admin.firestore()
      .collection('articles')
      .doc(articleId)
      .get();
    
    if (!articleDoc.exists) {
      return null;
    }
    
    const article = articleDoc.data();
    const baseUrl = 'https://marlang-app.web.app';
    
    const title = article.title || 'NEWStep Eng News';
    const description = article.summary || article.description || '영어 뉴스를 통해 영어를 배우세요.';
    const imageUrl = article.image || `${baseUrl}/newstep-social-image.png`;
    const url = `${baseUrl}/article/${articleId}`;
    
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

// 기본 HTML 템플릿
const getBaseHtml = (metaTags, title) => {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${metaTags}
  <meta http-equiv="refresh" content="0;url=https://marlang-app.web.app">
</head>
<body>
  <h1>${title}</h1>
  <p>잠시만 기다려주세요. 페이지를 로드하고 있습니다...</p>
  <script>
    window.location.href = 'https://marlang-app.web.app';
  </script>
</body>
</html>
  `;
};

// 소셜 프리렌더링 함수
exports.socialPrerender = functions.https.onRequest(async (req, res) => {
  const userAgent = req.get('User-Agent') || '';
  const path = req.path;
  
  // 소셜 크롤러가 아니면 원본 사이트로 리다이렉트
  if (!isSocialCrawler(userAgent)) {
    return res.redirect(301, `https://marlang-app.web.app${path}`);
  }
  
  console.log('소셜 크롤러 감지:', userAgent, 'Path:', path);
  
  let metaTags = '';
  let title = 'NEWStep Eng News';
  
  try {
    // 기사 페이지인지 확인
    const articleMatch = path.match(/^\/article\/(.+)$/);
    
    if (articleMatch) {
      const articleId = articleMatch[1];
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