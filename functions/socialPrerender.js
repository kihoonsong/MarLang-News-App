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
    // /social/article/123 → /article/123 로 리다이렉트
    const articleMatch = path.match(/^\/social\/article\/(.+)$/);
    if (articleMatch) {
      const articleId = articleMatch[1];
      return res.redirect(301, `https://marlang-app.web.app/article/${articleId}`);
    }
    // 기타 경로는 홈으로 리다이렉트
    return res.redirect(301, 'https://marlang-app.web.app');
  }
  
  console.log('소셜 크롤러 감지:', userAgent, 'Path:', path);
  
  let metaTags = '';
  let title = 'NEWStep Eng News';
  
  try {
    // /social/article/123 형태의 기사 페이지인지 확인
    const articleMatch = path.match(/^\/social\/article\/(.+)$/);
    
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