/**
 * 자동 사이트맵 생성 및 업데이트 모듈
 * Firebase Functions에서 사용하는 서버사이드 사이트맵 생성기
 */

const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

const SITE_URL = 'https://marlang-app.web.app';
const BUCKET_NAME = 'marlang-app.appspot.com'; // Firebase Storage 버킷명

// Google Cloud Storage 클라이언트 초기화
const storage = new Storage();

/**
 * Firebase에서 발행된 기사 데이터를 가져와서 사이트맵 XML 생성
 */
async function generateSitemapXML() {
  try {
    console.log('🔄 사이트맵 생성 시작...');
    
    const db = admin.firestore();
    
    // 발행된 기사들만 가져오기 (임시: 정렬 제거하여 인덱스 요구사항 회피)
    const articlesSnapshot = await db.collection('articles')
      .where('status', '==', 'published')
      .get();
    
    const publishedArticles = articlesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => {
        // 클라이언트 사이드에서 publishedAt으로 내림차순 정렬
        const dateA = new Date(a.publishedAt || 0);
        const dateB = new Date(b.publishedAt || 0);
        return dateB - dateA;
      });
    
    console.log(`📰 발행된 기사 ${publishedArticles.length}개 발견`);
    
    // 카테고리 정보 가져오기 (기본값 사용)
    const categories = [
      { id: 'tech', name: 'Technology' },
      { id: 'business', name: 'Business' },
      { id: 'politics', name: 'Politics' },
      { id: 'culture', name: 'Culture' },
      { id: 'world', name: 'World' }
    ];
    
    // XML 생성
    const today = new Date().toISOString().split('T')[0];
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- 메인 페이지 -->
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
`;
    
    // 카테고리 페이지 추가
    categories.forEach(category => {
      sitemap += `  <!-- ${category.name} 📈 카테고리 -->
  <url>
    <loc>${SITE_URL}/${category.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
`;
    });
    
    // 개별 기사 페이지 추가
    if (publishedArticles.length > 0) {
      sitemap += `  <!-- 개별 기사들 (${publishedArticles.length}개) -->
`;
      
      publishedArticles.forEach(article => {
        const lastmod = article.updatedAt || article.publishedAt || today;
        const formattedDate = new Date(lastmod).toISOString().split('T')[0];
        
        sitemap += `  <url>
    <loc>${SITE_URL}/article/${article.id}</loc>
    <lastmod>${formattedDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      });
    }
    
    // 기능 페이지들 추가
    sitemap += `
  <!-- 기능 페이지들 -->
  <url>
    <loc>${SITE_URL}/search</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/wordbook</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- 정책 페이지들 -->
  <url>
    <loc>${SITE_URL}/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITE_URL}/terms</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITE_URL}/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;
    
    console.log(`✅ 사이트맵 XML 생성 완료 (총 ${publishedArticles.length + categories.length + 6}개 URL)`);
    
    return {
      xml: sitemap,
      stats: {
        totalUrls: publishedArticles.length + categories.length + 6,
        articles: publishedArticles.length,
        categories: categories.length,
        pages: 6,
        lastUpdated: today
      }
    };
    
  } catch (error) {
    console.error('🚨 사이트맵 생성 실패:', error);
    throw error;
  }
}

/**
 * 생성된 사이트맵을 Firestore에 저장 (Storage 대신 임시 해결책)
 */
async function uploadSitemapToStorage(sitemapXML) {
  try {
    console.log('📤 Firestore에 사이트맵 저장 중... (Storage 대신 임시 방법)');
    
    const db = admin.firestore();
    
    // 사이트맵을 Firestore에 저장
    await db.collection('system').doc('sitemap').set({
      xml: sitemapXML,
      lastUpdated: new Date().toISOString(),
      contentType: 'application/xml'
    });
    
    // 사이트맵 URL (클라이언트에서 이 데이터를 읽어서 제공)
    const sitemapUrl = `${SITE_URL}/sitemap.xml`;
    
    console.log(`✅ 사이트맵 Firestore 저장 완료: ${sitemapUrl}`);
    console.log('💡 참고: 실제 sitemap.xml은 클라이언트에서 Firestore 데이터를 읽어서 제공됩니다.');
    
    return sitemapUrl;
    
  } catch (error) {
    console.error('🚨 사이트맵 저장 실패:', error);
    throw error;
  }
}

/**
 * Google Search Console에 사이트맵 제출 알림 (선택적)
 */
async function notifyGoogleSearchConsole(sitemapUrl) {
  try {
    // Google Search Console API는 별도 인증이 필요하므로 
    // 현재는 로그만 출력 (향후 확장 가능)
    console.log('🔔 Google Search Console 알림 준비');
    console.log(`📍 사이트맵 URL: ${sitemapUrl}`);
    console.log('💡 수동으로 Google Search Console에서 사이트맵을 재제출하세요.');
    
    return true;
  } catch (error) {
    console.error('⚠️ Google Search Console 알림 실패:', error);
    return false;
  }
}

/**
 * 메인 사이트맵 업데이트 함수
 */
async function updateSitemap(reason = 'manual') {
  try {
    console.log(`🚀 사이트맵 자동 업데이트 시작 (이유: ${reason})`);
    
    // 1. 사이트맵 XML 생성
    const { xml: sitemapXML, stats } = await generateSitemapXML();
    
    // 2. Firebase Storage에 업로드
    const sitemapUrl = await uploadSitemapToStorage(sitemapXML);
    
    // 3. Google Search Console 알림 (선택적)
    await notifyGoogleSearchConsole(sitemapUrl);
    
    // 4. 업데이트 로그 기록
    const updateLog = {
      timestamp: new Date().toISOString(),
      reason,
      stats,
      sitemapUrl,
      success: true
    };
    
    // Firestore에 업데이트 로그 저장 (선택적)
    try {
      await admin.firestore().collection('system_logs').add({
        type: 'sitemap_update',
        ...updateLog
      });
    } catch (logError) {
      console.warn('⚠️ 로그 저장 실패:', logError.message);
    }
    
    console.log('🎉 사이트맵 자동 업데이트 완료!');
    console.log('📊 업데이트 통계:', stats);
    
    return updateLog;
    
  } catch (error) {
    console.error('🚨 사이트맵 업데이트 실패:', error);
    
    // 실패 로그 기록
    try {
      await admin.firestore().collection('system_logs').add({
        type: 'sitemap_update_error',
        timestamp: new Date().toISOString(),
        reason,
        error: error.message,
        success: false
      });
    } catch (logError) {
      console.warn('⚠️ 에러 로그 저장 실패:', logError.message);
    }
    
    throw error;
  }
}

module.exports = {
  generateSitemapXML,
  uploadSitemapToStorage,
  updateSitemap,
  notifyGoogleSearchConsole
};