/**
 * 사이트맵 서빙 함수
 * Firestore에 저장된 사이트맵 데이터를 XML로 제공
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * 사이트맵 XML을 제공하는 HTTP 함수
 */
exports.serveSitemap = functions.https.onRequest(async (req, res) => {
  try {
    console.log('📄 사이트맵 요청 수신');
    
    // CORS 헤더 설정
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // OPTIONS 요청 처리
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    // GET 요청만 허용
    if (req.method !== 'GET') {
      res.status(405).send('Method Not Allowed');
      return;
    }
    
    const db = admin.firestore();
    
    // Firestore에서 사이트맵 데이터 가져오기
    const sitemapDoc = await db.collection('system').doc('sitemap').get();
    
    if (!sitemapDoc.exists) {
      console.log('❌ 사이트맵 데이터가 존재하지 않음');
      res.status(404).send('Sitemap not found. Please generate sitemap first.');
      return;
    }
    
    const sitemapData = sitemapDoc.data();
    const sitemapXML = sitemapData.xml;
    
    if (!sitemapXML) {
      console.log('❌ 사이트맵 XML 데이터가 비어있음');
      res.status(404).send('Sitemap XML is empty.');
      return;
    }
    
    // 기사 개수 계산
    const articleCount = (sitemapXML.match(/\/article\//g) || []).length;
    
    console.log('✅ 사이트맵 제공 성공');
    console.log(`📊 사이트맵 통계: lastUpdated=${sitemapData.lastUpdated}, XML 길이=${sitemapXML.length}`);
    console.log(`📰 기사 개수: ${articleCount}개`);
    console.log(`🔄 강제 업데이트 타임스탬프: ${sitemapData.forceUpdate || 'N/A'}`);
    
    // XML 응답 헤더 설정 (강화된 캐시 방지)
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Last-Modified', new Date(sitemapData.lastUpdated).toUTCString());
    res.set('ETag', `"${sitemapData.forceUpdate || Date.now()}"`); // 강제 업데이트 타임스탬프 사용
    
    // 추가 디버깅 정보 (헤더에 포함)
    res.set('X-Sitemap-Updated', sitemapData.lastUpdated);
    res.set('X-Sitemap-Articles', articleCount.toString());
    res.set('X-Sitemap-Force-Update', (sitemapData.forceUpdate || 0).toString());
    res.set('X-Sitemap-Stats', JSON.stringify(sitemapData.stats || {}));
    
    // XML 응답
    res.status(200).send(sitemapXML);
    
  } catch (error) {
    console.error('🚨 사이트맵 서빙 실패:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});