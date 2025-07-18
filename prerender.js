// 애드센스 크롤러를 위한 프리렌더링 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
  projectId: "marlang-app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// HTML 템플릿 생성 함수
function generateArticleHTML(article) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.title} - NEWStep Eng News</title>
    <meta name="description" content="${article.summary || article.title}">
    <meta name="keywords" content="영어 학습, ${article.category}, English Learning, News">
    <meta name="author" content="NEWStep Team">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${article.title}">
    <meta property="og:description" content="${article.summary || article.title}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://marlang-app.web.app/article/${article.id}">
    <meta property="og:site_name" content="NEWStep Eng News">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${article.title}">
    <meta name="twitter:description" content="${article.summary || article.title}">
    
    <!-- 구조화된 데이터 -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "${article.title}",
      "description": "${article.summary || article.title}",
      "datePublished": "${article.publishedAt}",
      "dateModified": "${article.updatedAt || article.publishedAt}",
      "author": {
        "@type": "Organization",
        "name": "NEWStep Team"
      },
      "publisher": {
        "@type": "Organization",
        "name": "NEWStep Eng News"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://marlang-app.web.app/article/${article.id}"
      },
      "articleSection": "${article.category}",
      "keywords": ["영어 학습", "${article.category}", "English Learning", "News"],
      "educationalLevel": "${article.level || 'Intermediate'}",
      "learningResourceType": "Article",
      "educationalUse": "Language Learning"
    }
    </script>
</head>
<body>
    <header>
        <h1>NEWStep Eng News</h1>
        <nav>
            <a href="/">Home</a> |
            <a href="/category/technology">Technology</a> |
            <a href="/category/science">Science</a> |
            <a href="/category/business">Business</a> |
            <a href="/category/culture">Culture</a> |
            <a href="/search">Search</a>
        </nav>
    </header>
    
    <main>
        <article>
            <header>
                <h1>${article.title}</h1>
                <div class="article-meta">
                    <span class="category">${article.category}</span>
                    <span class="date">${new Date(article.publishedAt).toLocaleDateString('ko-KR')}</span>
                    <span class="level">Level: ${article.level || 'Intermediate'}</span>
                    <span class="reading-time">${article.readingTime || 5}분 읽기</span>
                </div>
            </header>
            
            <div class="article-summary">
                <p><strong>요약:</strong> ${article.summary}</p>
            </div>
            
            <div class="article-content">
                ${article.content ? (typeof article.content === 'string' ? `<p>${article.content.replace(/\n/g, '</p><p>')}</p>` : `<p>${JSON.stringify(article.content)}</p>`) : '<p>영어 학습을 위한 뉴스 콘텐츠입니다. 자세한 내용은 웹사이트에서 확인하세요.</p>'}
            </div>
            
            ${article.tags ? `
            <div class="article-tags">
                <h3>관련 태그</h3>
                ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}
            </div>
            ` : ''}
            
            <div class="educational-value">
                <h3>영어 학습 가치</h3>
                <ul>
                    <li>카테고리별 전문 영어 어휘 학습</li>
                    <li>AI 기반 번역으로 정확한 의미 파악</li>
                    <li>TTS 기능으로 정확한 발음 연습</li>
                    <li>개인화된 단어장으로 체계적 학습</li>
                </ul>
            </div>
        </article>
    </main>
    
    <footer>
        <p><a href="/privacy">개인정보처리방침</a> | <a href="/terms">이용약관</a> | <a href="/contact">연락처</a></p>
        <p>© 2024 NEWStep Eng News. All rights reserved.</p>
    </footer>
    
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        header { border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
        nav a { text-decoration: none; color: #1976d2; margin: 0 5px; }
        .article-meta { color: #666; margin: 10px 0; }
        .article-meta span { margin-right: 15px; }
        .category { background: #1976d2; color: white; padding: 2px 8px; border-radius: 4px; }
        .tag { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; margin-right: 5px; }
        .article-summary { background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .educational-value { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</body>
</html>`;
}

async function prerenderArticles() {
  try {
    console.log('🚀 프리렌더링 시작...');
    
    // Firestore에서 published 기사들 가져오기
    const articlesCol = collection(db, 'articles');
    const articleSnapshot = await getDocs(articlesCol);
    const articles = articleSnapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id }))
      .filter(article => article.status === 'published');

    console.log(`📰 발견된 발행 기사 수: ${articles.length}개`);

    // dist 폴더에 article 디렉토리 생성
    const articleDir = './dist/article';
    if (!fs.existsSync(articleDir)) {
      fs.mkdirSync(articleDir, { recursive: true });
    }

    // 각 기사마다 정적 HTML 파일 생성
    let successCount = 0;
    for (const article of articles) {
      try {
        const html = generateArticleHTML(article);
        const filePath = path.join(articleDir, `${article.id}.html`);
        fs.writeFileSync(filePath, html);
        successCount++;
        
        if (successCount <= 5) {
          console.log(`✅ 생성: /article/${article.id}.html - "${article.title}"`);
        }
      } catch (error) {
        console.error(`❌ 실패: ${article.id} -`, error.message);
      }
    }

    console.log(`\n🎉 프리렌더링 완료!`);
    console.log(`📊 총 ${successCount}/${articles.length}개 기사 HTML 생성`);
    console.log(`📁 위치: ${articleDir}`);
    
    // 추가로 카테고리 페이지도 생성
    await prerenderCategoryPages(articles);
    
  } catch (error) {
    console.error('❌ 프리렌더링 실패:', error);
  }
}

async function prerenderCategoryPages(articles) {
  console.log('\n📂 카테고리 페이지 생성 중...');
  
  const categories = ['Technology', 'Science', 'Business', 'Culture', 'Society'];
  const categoryDir = './dist/category';
  
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }
  
  for (const category of categories) {
    const categoryArticles = articles.filter(article => article.category === category);
    
    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${category} News - NEWStep Eng News</title>
    <meta name="description" content="${category} 영어 뉴스로 영어를 배우세요. ${categoryArticles.length}개의 ${category} 기사가 있습니다.">
    <meta name="keywords" content="${category}, 영어 학습, English Learning, News">
</head>
<body>
    <header>
        <h1>NEWStep Eng News - ${category}</h1>
        <nav>
            <a href="/">Home</a> |
            <a href="/category/technology">Technology</a> |
            <a href="/category/science">Science</a> |
            <a href="/category/business">Business</a> |
            <a href="/category/culture">Culture</a>
        </nav>
    </header>
    
    <main>
        <h2>${category} 뉴스 (${categoryArticles.length}개)</h2>
        <p>${category} 분야의 영어 뉴스를 통해 전문 어휘와 표현을 학습하세요.</p>
        
        <div class="articles-list">
            ${categoryArticles.slice(0, 20).map(article => `
                <article class="article-item">
                    <h3><a href="/article/${article.id}">${article.title}</a></h3>
                    <p>${article.summary}</p>
                    <div class="meta">
                        <span class="date">${new Date(article.publishedAt).toLocaleDateString('ko-KR')}</span>
                        <span class="level">${article.level || 'Intermediate'}</span>
                    </div>
                </article>
            `).join('')}
        </div>
    </main>
    
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .article-item { border-bottom: 1px solid #eee; padding: 20px 0; }
        .article-item h3 a { color: #1976d2; text-decoration: none; }
        .meta { color: #666; font-size: 0.9em; }
        .meta span { margin-right: 15px; }
    </style>
</body>
</html>`;
    
    fs.writeFileSync(path.join(categoryDir, `${category.toLowerCase()}.html`), html);
    console.log(`✅ ${category}: ${categoryArticles.length}개 기사`);
  }
}

prerenderArticles();