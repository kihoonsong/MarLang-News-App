#!/usr/bin/env node

/**
 * 안전한 동적 sitemap.xml 생성 스크립트
 * Firebase 연결 실패 시 기본 sitemap 생성
 */

import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://marlang-app.web.app';

// 기본 sitemap 생성 함수
function generateBasicSitemap() {
  const today = new Date().toISOString().split('T')[0];
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- 메인 페이지 -->
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- 카테고리 페이지들 -->
  <url>
    <loc>${SITE_URL}/tech</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/business</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/politics</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/culture</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/world</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
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
  
  <!-- 정책 페이지들 -->
  <url>
    <loc>${SITE_URL}/privacy</loc>
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
  
  <!-- 샘플 기사 URL들 (실제 기사 ID로 교체 필요) -->
  <url>
    <loc>${SITE_URL}/article/sample-tech-article-1</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/article/sample-science-article-1</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/article/sample-business-article-1</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
}

// Firebase를 사용한 동적 sitemap 생성 시도
async function generateDynamicSitemap() {
  try {
    // 동적 import로 Firebase 모듈 로드
    const { initializeApp } = await import('firebase/app');
    const { getFirestore, collection, getDocs } = await import('firebase/firestore');
    const dotenv = await import('dotenv');
    
    // 환경변수 로드
    dotenv.config();
    
    const firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID
    };
    
    if (!firebaseConfig.projectId) {
      throw new Error('Firebase Project ID가 설정되지 않았습니다.');
    }
    
    console.log('🔄 Firebase에서 기사 데이터 가져오는 중...');
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // 기사 데이터 가져오기
    const articlesCol = collection(db, 'articles');
    const articleSnapshot = await getDocs(articlesCol);
    
    const publishedArticles = articleSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(article => article.status === 'published')
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    
    console.log(`📰 발행된 기사 ${publishedArticles.length}개 발견`);
    
    if (publishedArticles.length === 0) {
      throw new Error('발행된 기사가 없습니다.');
    }
    
    // 카테고리 정보 가져오기
    let categories = [];
    try {
      const configCol = collection(db, 'config');
      const configSnapshot = await getDocs(configCol);
      
      configSnapshot.docs.forEach(doc => {
        if (doc.id === 'categories' && doc.data().list) {
          categories = doc.data().list.filter(cat => cat.type === 'category');
        }
      });
    } catch (error) {
      console.log('⚠️ 카테고리 정보 사용 기본값');
      categories = [
        { id: 'tech', name: 'Technology' },
        { id: 'business', name: 'Business' },
        { id: 'politics', name: 'Politics' },
        { id: 'culture', name: 'Culture' },
        { id: 'world', name: 'World' }
      ];
    }
    
    // 동적 sitemap XML 생성
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
      sitemap += `  <url>
    <loc>${SITE_URL}/${category.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;
    });
    
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
  
  <!-- 정책 페이지들 -->
  <url>
    <loc>${SITE_URL}/privacy</loc>
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
  
  <!-- 개별 기사들 -->
`;
    
    // 개별 기사 URL 추가
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
    
    sitemap += `</urlset>`;
    
    console.log(`✅ 동적 sitemap 생성 성공! (${publishedArticles.length}개 기사 포함)`);
    
    // 통계 출력
    console.log('\n📈 사이트맵 통계:');
    console.log(`- 메인 페이지: 1개`);
    console.log(`- 카테고리 페이지: ${categories.length}개`);
    console.log(`- 기사 페이지: ${publishedArticles.length}개`);
    console.log(`- 기타 페이지: 4개`);
    console.log(`- 총 URL 수: ${publishedArticles.length + categories.length + 5}개`);
    
    return sitemap;
    
  } catch (error) {
    console.log(`⚠️ 동적 sitemap 생성 실패: ${error.message}`);
    return null;
  }
}

// 메인 실행 함수
async function main() {
  console.log('🚀 Sitemap 생성 시작...');
  
  let sitemap;
  
  // 1. 동적 sitemap 생성 시도
  sitemap = await generateDynamicSitemap();
  
  // 2. 실패 시 기본 sitemap 사용
  if (!sitemap) {
    console.log('📝 기본 sitemap을 생성합니다...');
    sitemap = generateBasicSitemap();
    console.log('✅ 기본 sitemap 생성 완료');
  }
  
  // 3. 파일 저장
  try {
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap, 'utf8');
    
    console.log(`📍 Sitemap 저장 완료: ${sitemapPath}`);
    console.log('\n🎉 Sitemap 생성이 완료되었습니다!');
    
    // 파일 크기 확인
    const stats = fs.statSync(sitemapPath);
    console.log(`📊 파일 크기: ${Math.round(stats.size / 1024)}KB`);
    
  } catch (error) {
    console.error('🚨 파일 저장 실패:', error.message);
    process.exit(1);
  }
}

// 실행
main().catch(error => {
  console.error('🚨 치명적 오류:', error);
  process.exit(1);
});