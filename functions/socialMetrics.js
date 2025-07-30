const functions = require('firebase-functions');
const admin = require('firebase-admin');

// 소셜 공유 메트릭 수집 함수
exports.trackSocialShare = functions.https.onCall(async (data, context) => {
  try {
    const { articleId, platform, userAgent, timestamp } = data;
    
    if (!articleId || !platform) {
      throw new functions.https.HttpsError('invalid-argument', 'articleId and platform are required');
    }

    // 메트릭 데이터 구성
    const metricData = {
      articleId,
      platform,
      userAgent: userAgent || 'unknown',
      timestamp: timestamp || new Date().toISOString(),
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
      hour: new Date().getHours(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Firestore에 메트릭 저장
    await admin.firestore()
      .collection('socialMetrics')
      .add(metricData);

    // 기사별 공유 카운트 업데이트
    const articleRef = admin.firestore().collection('articles').doc(articleId);
    await articleRef.update({
      [`shareCount.${platform}`]: admin.firestore.FieldValue.increment(1),
      [`shareCount.total`]: admin.firestore.FieldValue.increment(1),
      updatedAt: new Date().toISOString()
    });

    console.log(`📊 소셜 공유 메트릭 기록: ${articleId} → ${platform}`);
    
    return { success: true, message: 'Metric recorded successfully' };
  } catch (error) {
    console.error('소셜 메트릭 기록 오류:', error);
    throw new functions.https.HttpsError('internal', 'Failed to record metric');
  }
});

// 소셜 크롤러 접근 메트릭 수집
exports.trackCrawlerAccess = functions.https.onCall(async (data, context) => {
  try {
    const { articleId, userAgent, path, crawlerType, timestamp } = data;
    
    if (!articleId || !userAgent) {
      throw new functions.https.HttpsError('invalid-argument', 'articleId and userAgent are required');
    }

    // 크롤러 타입 감지
    const detectedCrawlerType = crawlerType || detectCrawlerType(userAgent);
    
    const crawlerData = {
      articleId,
      userAgent,
      path: path || `/article/${articleId}`,
      crawlerType: detectedCrawlerType,
      timestamp: timestamp || new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      hour: new Date().getHours(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Firestore에 크롤러 접근 기록
    await admin.firestore()
      .collection('crawlerMetrics')
      .add(crawlerData);

    console.log(`🤖 크롤러 접근 기록: ${detectedCrawlerType} → ${articleId}`);
    
    return { success: true, crawlerType: detectedCrawlerType };
  } catch (error) {
    console.error('크롤러 메트릭 기록 오류:', error);
    throw new functions.https.HttpsError('internal', 'Failed to record crawler metric');
  }
});

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

// 소셜 메트릭 분석 리포트 생성
exports.generateSocialReport = functions.https.onRequest(async (req, res) => {
  // CORS 헤더 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // 소셜 공유 메트릭 조회
    const shareMetrics = await admin.firestore()
      .collection('socialMetrics')
      .where('timestamp', '>=', startDate.toISOString())
      .get();

    // 크롤러 접근 메트릭 조회
    const crawlerMetrics = await admin.firestore()
      .collection('crawlerMetrics')
      .where('timestamp', '>=', startDate.toISOString())
      .get();

    // 데이터 분석
    const shareStats = {};
    const crawlerStats = {};
    const articleStats = {};

    shareMetrics.forEach(doc => {
      const data = doc.data();
      const platform = data.platform;
      const articleId = data.articleId;
      
      shareStats[platform] = (shareStats[platform] || 0) + 1;
      articleStats[articleId] = articleStats[articleId] || { shares: 0, crawlers: 0 };
      articleStats[articleId].shares++;
    });

    crawlerMetrics.forEach(doc => {
      const data = doc.data();
      const crawlerType = data.crawlerType;
      const articleId = data.articleId;
      
      crawlerStats[crawlerType] = (crawlerStats[crawlerType] || 0) + 1;
      articleStats[articleId] = articleStats[articleId] || { shares: 0, crawlers: 0 };
      articleStats[articleId].crawlers++;
    });

    const report = {
      period: `${days} days`,
      generated: new Date().toISOString(),
      summary: {
        totalShares: shareMetrics.size,
        totalCrawlerAccess: crawlerMetrics.size,
        uniqueArticles: Object.keys(articleStats).length
      },
      sharesByPlatform: shareStats,
      crawlersByType: crawlerStats,
      topArticles: Object.entries(articleStats)
        .sort(([,a], [,b]) => (b.shares + b.crawlers) - (a.shares + a.crawlers))
        .slice(0, 10)
        .map(([articleId, stats]) => ({ articleId, ...stats }))
    };

    res.json(report);
  } catch (error) {
    console.error('소셜 리포트 생성 오류:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});