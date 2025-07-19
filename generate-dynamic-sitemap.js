#!/usr/bin/env node

/**
 * Firebase 기사 데이터를 기반으로 동적 sitemap.xml 생성
 * 사용법: node generate-dynamic-sitemap.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

const SITE_URL = 'https://marlang-app.web.app';

// Firebase 설정
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

// Firebase 설정 검증
console.log('🔧 Firebase 설정 확인:');
console.log('- Project ID:', firebaseConfig.projectId || '❌ 누락');

if (!firebaseConfig.projectId) {
    console.error('🚨 Firebase Project ID가 누락되었습니다.');
    console.error('💡 .env 파일에서 VITE_FIREBASE_PROJECT_ID를 확인해주세요.');
    process.exit(1);
}

// Firebase 초기화
let app, db;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('✅ Firebase 초기화 완료');
} catch (error) {
    console.error('🚨 Firebase 초기화 실패:', error.message);
    process.exit(1);
}

async function generateSitemap() {
    try {
        console.log('🔄 Firebase에서 기사 데이터 가져오는 중...');

        // Firebase에서 발행된 기사만 가져오기
        const articlesCol = collection(db, 'articles');
        const articleSnapshot = await getDocs(articlesCol);

        const publishedArticles = articleSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(article => article.status === 'published')
            .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        console.log(`📰 발행된 기사 ${publishedArticles.length}개 발견`);

        if (publishedArticles.length === 0) {
            console.log('⚠️ 발행된 기사가 없습니다. 기본 sitemap을 생성합니다.');
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

            console.log(`📂 카테고리 ${categories.length}개 발견`);
        } catch (error) {
            console.log('⚠️ 카테고리 정보를 가져올 수 없습니다. 기본 카테고리를 사용합니다.');
            categories = [
                { id: 'technology', name: 'Technology' },
                { id: 'science', name: 'Science' },
                { id: 'business', name: 'Business' },
                { id: 'culture', name: 'Culture' }
            ];
        }

        // XML 생성
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- 메인 페이지 -->
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
`;

        // 카테고리 페이지 추가
        categories.forEach(category => {
            sitemap += `  <!-- ${category.name} 카테고리 -->
  <url>
    <loc>${SITE_URL}/${category.id}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
`;
        });

        // 개별 기사 페이지 추가
        if (publishedArticles.length > 0) {
            sitemap += `  <!-- 개별 기사들 (${publishedArticles.length}개) -->\n`;

            publishedArticles.forEach(article => {
                const lastmod = article.updatedAt || article.publishedAt || new Date().toISOString();
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

        // 기타 페이지들
        sitemap += `
  <!-- 기능 페이지들 -->
  <url>
    <loc>${SITE_URL}/search</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/wordbook</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- 정책 페이지들 -->
  <url>
    <loc>${SITE_URL}/privacy</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITE_URL}/contact</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;

        // sitemap.xml 파일 저장
        const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
        fs.writeFileSync(sitemapPath, sitemap, 'utf8');

        console.log('✅ sitemap.xml 생성 완료!');
        console.log(`📍 위치: ${sitemapPath}`);
        console.log(`📊 총 URL 수: ${publishedArticles.length + categories.length + 5}개`);

        // 통계 출력
        console.log('\n📈 사이트맵 통계:');
        console.log(`- 메인 페이지: 1개`);
        console.log(`- 카테고리 페이지: ${categories.length}개`);
        console.log(`- 기사 페이지: ${publishedArticles.length}개`);
        console.log(`- 기타 페이지: 4개`);

        // 카테고리별 기사 수 출력
        if (publishedArticles.length > 0) {
            console.log('\n📂 카테고리별 기사 수:');
            categories.forEach(category => {
                const count = publishedArticles.filter(article => article.category === category.name).length;
                console.log(`- ${category.name}: ${count}개`);
            });
        }

        return true;

    } catch (error) {
        console.error('🚨 Sitemap 생성 실패:', error);
        console.error('💡 Firebase 연결 또는 권한을 확인해주세요.');

        // 기본 sitemap 생성 (fallback)
        console.log('📝 기본 sitemap을 생성합니다...');
        const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/search</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/privacy</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITE_URL}/contact</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;

        const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
        fs.writeFileSync(sitemapPath, basicSitemap, 'utf8');
        console.log('✅ 기본 sitemap.xml 생성 완료');

        return false;
    }
}

// 실행
generateSitemap()
    .then((success) => {
        if (success) {
            console.log('\n🎉 동적 sitemap 생성이 성공적으로 완료되었습니다!');
        } else {
            console.log('\n⚠️ 기본 sitemap이 생성되었습니다. Firebase 연결을 확인해주세요.');
        }
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n🚨 치명적 오류:', error);
        process.exit(1);
    });