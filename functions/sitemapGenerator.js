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
    console.log('📊 Firestore에서 발행된 기사 조회 중...');
    const articlesSnapshot = await db.collection('articles')
      .where('status', '==', 'published')
      .get();
    
    console.log(`📊 Firestore 쿼리 결과: ${articlesSnapshot.size}개 문서`);
    
    // 모든 기사 데이터 상세 분석
    const allArticles = [];
    const invalidArticles = [];
    
    articlesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const article = {
        id: doc.id,
        title: data.title || 'Untitled',
        publishedAt: data.publishedAt,
        updatedAt: data.updatedAt,
        status: data.status,
        hasTitle: !!data.title,
        hasPublishedAt: !!data.publishedAt,
        titleLength: (data.title || '').length
      };
      
      // 유효성 검사
      if (!data.title || data.title.trim() === '') {
        invalidArticles.push({ ...article, reason: 'no_title' });
      } else if (!data.publishedAt) {
        invalidArticles.push({ ...article, reason: 'no_publishedAt' });
      } else {
        allArticles.push(article);
      }
    });
    
    console.log(`📊 유효한 기사: ${allArticles.length}개`);
    console.log(`📊 무효한 기사: ${invalidArticles.length}개`);
    
    if (invalidArticles.length > 0) {
      console.log('⚠️ 무효한 기사들:');
      invalidArticles.forEach((article, index) => {
        console.log(`  ${index + 1}. ID: ${article.id}, 이유: ${article.reason}, 제목: "${article.title}"`);
      });
    }
    
    const publishedArticles = allArticles
      .sort((a, b) => {
        // 클라이언트 사이드에서 publishedAt으로 내림차순 정렬
        const dateA = new Date(a.publishedAt || 0);
        const dateB = new Date(b.publishedAt || 0);
        return dateB - dateA;
      });
    
    console.log(`📰 사이트맵에 포함될 기사 ${publishedArticles.length}개 발견`);
    
    // 기사 ID 요약 로깅 (디버깅용)
    console.log('📝 발행된 기사 ID 요약:');
    console.log(`  - 첫 번째: ${publishedArticles[0]?.id} - "${publishedArticles[0]?.title}"`);
    console.log(`  - 마지막: ${publishedArticles[publishedArticles.length - 1]?.id} - "${publishedArticles[publishedArticles.length - 1]?.title}"`);
    console.log(`  - 총 개수: ${publishedArticles.length}개`);
    
    // 최근 5개 기사 정보 로깅
    if (publishedArticles.length > 0) {
      console.log('📝 최근 발행된 기사들:');
      publishedArticles.slice(0, 5).forEach((article, index) => {
        console.log(`  ${index + 1}. ${article.title} (ID: ${article.id}, 발행: ${article.publishedAt})`);
      });
    }
    
    // 카테고리 정보 가져오기 (프론트 라우팅과 동일한 1단계 경로 사용)
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
    
    // 카테고리 페이지 추가 (프론트 라우터 경로와 일치: /tech, /business ...)
    categories.forEach(category => {
      sitemap += `  <!-- ${category.name} 카테고리 -->
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
      
      let addedArticles = 0;
      const skippedArticles = [];
      
      publishedArticles.forEach((article, index) => {
        try {
          // 기사 ID 유효성 검사
          if (!article.id || typeof article.id !== 'string' || article.id.trim() === '') {
            throw new Error('Invalid article ID');
          }
          
          // 제목 유효성 검사 및 XML 이스케이프
          const title = (article.title || 'Untitled').replace(/[<>&"']/g, (match) => {
            const escapeMap = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' };
            return escapeMap[match];
          });
          
          const lastmod = article.updatedAt || article.publishedAt || today;
          let formattedDate;
          
          // 날짜 형식 검증 및 변환
          try {
            const dateObj = new Date(lastmod);
            if (isNaN(dateObj.getTime())) {
              throw new Error('Invalid date');
            }
            formattedDate = dateObj.toISOString().split('T')[0];
            // 유효한 날짜인지 확인
            if (!formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              throw new Error('Invalid date format');
            }
          } catch (dateError) {
            console.warn(`⚠️ 기사 ${article.id}의 날짜 형식 오류:`, lastmod, '기본값 사용');
            formattedDate = today;
          }
          
          // XML에 기사 추가
          sitemap += `  <url>
    <loc>${SITE_URL}/article/${article.id}</loc>
    <lastmod>${formattedDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
          addedArticles++;
          
          // 진행 상황 로깅 (매 20개마다)
          if ((index + 1) % 20 === 0) {
            console.log(`📊 진행 상황: ${index + 1}/${publishedArticles.length} 기사 처리됨`);
          }
          
        } catch (error) {
          console.error(`🚨 기사 ${article.id} XML 생성 실패:`, error);
          skippedArticles.push({
            id: article.id,
            title: article.title,
            error: error.message,
            publishedAt: article.publishedAt,
            updatedAt: article.updatedAt
          });
        }
      });
      
      console.log(`📊 XML에 추가된 기사: ${addedArticles}개`);
      console.log(`📊 건너뛴 기사: ${skippedArticles.length}개`);
      
      if (skippedArticles.length > 0) {
        console.log('⚠️ 건너뛴 기사들:');
        skippedArticles.forEach((article, index) => {
          console.log(`  ${index + 1}. ID: ${article.id}, 제목: "${article.title}", 에러: ${article.error}`);
        });
      }
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
    
    // 사이트맵을 Firestore에 저장 (통계 정보 포함)
    const now = new Date();
    const updateData = {
      xml: sitemapXML,
      lastUpdated: now.toISOString(),
      contentType: 'application/xml',
      stats: {
        totalUrls: sitemapXML.split('<url>').length - 1,
        articles: (sitemapXML.match(/\/article\//g) || []).length,
        categories: (sitemapXML.match(/\/category\//g) || []).length,
        lastGenerated: now.toISOString(),
        xmlSize: sitemapXML.length
      },
      // 강제 업데이트를 위한 타임스탬프
      forceUpdate: Date.now(),
      // 생성 메타데이터
      metadata: {
        generatedBy: 'sitemapGenerator',
        nodeVersion: process.version,
        timestamp: now.getTime()
      }
    };
    
    console.log('💾 Firestore에 사이트맵 저장 중...');
    await db.collection('system').doc('sitemap').set(updateData);
    
    console.log('📊 저장된 사이트맵 통계:', updateData.stats);
    console.log('🔄 Firestore 업데이트 완료, 타임스탬프:', updateData.forceUpdate);
    
    // 저장 후 검증
    const verifyDoc = await db.collection('system').doc('sitemap').get();
    if (verifyDoc.exists) {
      const verifyData = verifyDoc.data();
      const verifyArticleCount = (verifyData.xml.match(/\/article\//g) || []).length;
      console.log('✅ 저장 검증 완료 - 기사 개수:', verifyArticleCount);
      console.log('✅ 저장 검증 완료 - XML 크기:', verifyData.xml.length);
    } else {
      console.error('❌ 저장 검증 실패 - 문서가 존재하지 않음');
    }
    
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
 * 전체 기사 상태 분석 함수 (디버깅용)
 */
async function analyzeAllArticles() {
  try {
    const db = admin.firestore();
    
    // 모든 기사 가져오기 (상태 무관)
    const allArticlesSnapshot = await db.collection('articles').get();
    
    const statusCounts = {};
    const publishedArticles = [];
    const problemArticles = [];
    
    allArticlesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const status = data.status || 'no_status';
      
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      if (status === 'published') {
        const article = {
          id: doc.id,
          title: data.title,
          publishedAt: data.publishedAt,
          updatedAt: data.updatedAt,
          status: data.status
        };
        
        if (!data.title || !data.publishedAt) {
          problemArticles.push({
            ...article,
            issues: [
              !data.title ? 'no_title' : null,
              !data.publishedAt ? 'no_publishedAt' : null
            ].filter(Boolean)
          });
        } else {
          publishedArticles.push(article);
        }
      }
    });
    
    console.log('📊 전체 기사 상태 분석:');
    console.log('  - 총 기사 수:', allArticlesSnapshot.size);
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}개`);
    });
    console.log('  - 유효한 발행 기사:', publishedArticles.length);
    console.log('  - 문제가 있는 발행 기사:', problemArticles.length);
    
    if (problemArticles.length > 0) {
      console.log('⚠️ 문제가 있는 발행 기사들:');
      problemArticles.forEach((article, index) => {
        console.log(`  ${index + 1}. ID: ${article.id}, 문제: ${article.issues.join(', ')}, 제목: "${article.title || 'N/A'}"`);
      });
    }
    
    return {
      totalArticles: allArticlesSnapshot.size,
      statusCounts,
      validPublishedArticles: publishedArticles.length,
      problemArticles: problemArticles.length,
      problemDetails: problemArticles
    };
    
  } catch (error) {
    console.error('🚨 기사 분석 실패:', error);
    return null;
  }
}

/**
 * 메인 사이트맵 업데이트 함수
 */
async function updateSitemap(reason = 'manual') {
  try {
    console.log(`🚀 사이트맵 자동 업데이트 시작 (이유: ${reason})`);
    
    // 0. 전체 기사 상태 분석 (디버깅용)
    const analysis = await analyzeAllArticles();
    
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
      stats: {
        ...stats,
        actualArticleCount: (sitemapXML.match(/\/article\//g) || []).length,
        totalUrlsInXML: sitemapXML.split('<url>').length - 1
      },
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
  notifyGoogleSearchConsole,
  analyzeAllArticles
};