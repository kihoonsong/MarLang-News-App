// 실제 Firebase 기사들을 포함한 사이트맵 생성 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = {
  // Firebase 설정은 실제 값으로 교체 필요
  projectId: "marlang-app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function generateSitemap() {
  try {
    // Firestore에서 published 상태인 기사들 가져오기
    const articlesCol = collection(db, 'articles');
    const articleSnapshot = await getDocs(articlesCol);
    const articles = articleSnapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id }))
      .filter(article => article.status === 'published');

    console.log(`📰 발견된 발행 기사 수: ${articles.length}개`);

    // 사이트맵 XML 생성
    const baseUrls = [
      { loc: 'https://marlang-app.web.app/', lastmod: '2024-12-17', changefreq: 'daily', priority: '1.0' },
      { loc: 'https://marlang-app.web.app/politics', lastmod: '2024-12-17', changefreq: 'daily', priority: '0.9' },
      { loc: 'https://marlang-app.web.app/business', lastmod: '2024-12-17', changefreq: 'daily', priority: '0.9' },
      { loc: 'https://marlang-app.web.app/tech', lastmod: '2024-12-17', changefreq: 'daily', priority: '0.9' },
      { loc: 'https://marlang-app.web.app/culture', lastmod: '2024-12-17', changefreq: 'daily', priority: '0.9' },
      { loc: 'https://marlang-app.web.app/world', lastmod: '2024-12-17', changefreq: 'daily', priority: '0.8' },
      { loc: 'https://marlang-app.web.app/search', lastmod: '2024-12-17', changefreq: 'weekly', priority: '0.7' },
      { loc: 'https://marlang-app.web.app/wordbook', lastmod: '2024-12-17', changefreq: 'weekly', priority: '0.7' },
      { loc: 'https://marlang-app.web.app/privacy', lastmod: '2024-12-17', changefreq: 'monthly', priority: '0.5' },
      { loc: 'https://marlang-app.web.app/terms', lastmod: '2024-12-17', changefreq: 'monthly', priority: '0.5' },
      { loc: 'https://marlang-app.web.app/contact', lastmod: '2024-12-17', changefreq: 'monthly', priority: '0.5' }
    ];

    // 실제 기사 URL들 추가
    const articleUrls = articles.map(article => ({
      loc: `https://marlang-app.web.app/article/${article.id}`,
      lastmod: article.publishedAt ? article.publishedAt.split('T')[0] : '2024-12-17',
      changefreq: 'weekly',
      priority: '0.8'
    }));

    const allUrls = [...baseUrls, ...articleUrls];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    // public 폴더에 저장
    fs.writeFileSync('./public/sitemap.xml', sitemap);
    console.log(`✅ 사이트맵 생성 완료! 총 ${allUrls.length}개 URL (기사 ${articles.length}개 포함)`);
    
    // 기사 제목들 출력 (확인용)
    console.log('\n📋 포함된 기사들:');
    articles.slice(0, 10).forEach((article, index) => {
      console.log(`${index + 1}. ${article.title} (${article.category})`);
    });
    
    if (articles.length > 10) {
      console.log(`... 외 ${articles.length - 10}개 기사`);
    }

  } catch (error) {
    console.error('❌ 사이트맵 생성 실패:', error);
  }
}

generateSitemap();