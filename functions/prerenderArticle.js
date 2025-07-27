const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');

// Firebase Admin은 index.js에서 이미 초기화됨
const db = getFirestore();

const SITE_URL = 'https://marlang-app.web.app';

// HTML 템플릿 생성 함수
function generateArticleHTML(article) {
    const cleanSummary = (article.summary || '').replace(/"/g, '&quot;').substring(0, 160);
    const cleanTitle = (article.title || '').replace(/"/g, '&quot;');
    const publishDate = new Date(article.publishedAt).toLocaleDateString('ko-KR');

    return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${cleanTitle} - NEWStep Eng News</title>
    
    <!-- Google AdSense verification -->
    <meta name="google-adsense-account" content="ca-pub-6930662244421305">
    
    <!-- SEO 메타 태그 -->
    <meta name="description" content="${cleanSummary}">
    <meta name="keywords" content="영어 뉴스, ${article.category}, English News, English Learning, ${cleanTitle}">
    <meta name="author" content="NEWStep Team">
    <meta name="robots" content="index, follow">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${cleanTitle} - NEWStep Eng News">
    <meta property="og:description" content="${cleanSummary}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${SITE_URL}/article/${article.id}">
    <meta property="og:site_name" content="NEWStep Eng News">
    <meta property="og:image" content="${article.image || article.imageUrl || article.urlToImage || `${SITE_URL}/newstep-social-image.jpg`}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@NEWStepNews">
    <meta name="twitter:creator" content="@NEWStepNews">
    <meta name="twitter:title" content="${cleanTitle}">
    <meta name="twitter:description" content="${cleanSummary}">
    <meta name="twitter:image" content="${article.image || article.imageUrl || article.urlToImage || `${SITE_URL}/newstep-social-image.jpg`}">
    <meta name="twitter:image:alt" content="${cleanTitle}">
    
    <!-- 구조화된 데이터 (JSON-LD) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "${cleanTitle}",
      "description": "${cleanSummary}",
      "author": {
        "@type": "Organization",
        "name": "NEWStep Team"
      },
      "publisher": {
        "@type": "Organization",
        "name": "NEWStep Eng News",
        "url": "${SITE_URL}",
        "logo": {
          "@type": "ImageObject",
          "url": "${SITE_URL}/icon-192.png"
        }
      },
      "datePublished": "${article.publishedAt}",
      "dateModified": "${article.updatedAt || article.publishedAt}",
      "articleSection": "${article.category}",
      "url": "${SITE_URL}/article/${article.id}",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "${SITE_URL}/article/${article.id}"
      }
      ${article.image ? `,"image": ["${article.image}"]` : ''}
    }
    </script>
    
    <!-- Google AdSense script -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6930662244421305"
     crossorigin="anonymous"></script>
    
    <!-- React 컴포넌트와 동일한 스타일 -->
    <style>
        /* 기본 레이아웃 - React 앱과 동일 */
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            margin: 0;
            padding: 0;
            color: #333;
            background-color: #f8f9fa;
        }
        
        /* 컨테이너 - React PageContainer와 동일 */
        .page-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
            min-height: 100vh;
            opacity: 1;
            transform: translateY(0);
            transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
        }
        
        /* 로딩 상태 */
        .page-container.loading {
            opacity: 0.95;
        }
        
        /* React 앱 로드 중 표시 */
        .react-loading {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #1976d2, #42a5f5);
            transform: scaleX(0);
            transform-origin: left;
            animation: loadingBar 2s ease-in-out infinite;
            z-index: 9999;
            display: none; /* 초기에는 숨김 */
        }
        
        @keyframes loadingBar {
            0% { transform: scaleX(0); }
            50% { transform: scaleX(0.7); }
            100% { transform: scaleX(1); opacity: 0; }
        }
        
        /* 이미지 - ThumbnailImage 스타일과 동일 */
        .article-image { 
            width: 100%;
            height: 300px;
            object-fit: cover;
            border-radius: 16px;
            margin-bottom: 1rem;
        }
        
        /* 메타 정보 - MetaInfo 스타일과 동일 */
        .article-meta { 
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
        }
        
        /* 제목 - Title 스타일과 동일 */
        .article-title { 
            font-size: 1.8rem;
            font-weight: bold;
            margin-bottom: 1.5rem;
            line-height: 1.3;
            color: #333;
        }
        
        /* 날짜 텍스트 - DateText 스타일과 동일 */
        .date-text {
            color: #666;
            font-size: 0.9rem;
        }
        
        /* 카테고리 태그 */
        .category-tag { 
            background: #e3f2fd; 
            color: #1976d2; 
            padding: 6px 16px; 
            border-radius: 20px; 
            font-size: 0.85em; 
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* 컨트롤 섹션 - ControlsSection 스타일과 동일 */
        .controls-section {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #fff;
            border-radius: 16px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            border: 1px solid #f0f0f0;
        }
        
        /* 플레이백 컨트롤 - PlaybackControls 스타일과 동일 */
        .playback-controls {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        /* 플레이 버튼 - PlayButton 스타일과 동일 */
        .play-button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(45deg, #1976d2, #42a5f5);
            color: white;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
        }
        
        .play-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4);
        }
        
        /* 액션 버튼들 - ActionButtons 스타일과 동일 */
        .action-buttons {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .action-button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 1px solid #e0e0e0;
            background: #fff;
            color: #666;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .action-button:hover {
            background: #f5f5f5;
            border-color: #1976d2;
            color: #1976d2;
        }
        
        /* 콘텐츠 카드 - ContentCard 스타일과 동일 */
        .content-card {
            background: #fff;
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            border: 1px solid #f0f0f0;
        }
        
        /* 콘텐츠 헤더 - ContentHeader 스타일과 동일 */
        .content-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
        }
        
        /* 콘텐츠 제목 - ContentTitle 스타일과 동일 */
        .content-title {
            font-size: 1.3rem;
            font-weight: bold;
            color: #333;
        }
        
        /* 콘텐츠 텍스트 - ContentText 스타일과 동일 */
        .content-text {
            font-size: 1.1rem;
            line-height: 1.5;
            color: #333;
        }
        
        /* 레벨 컨트롤 */
        .level-controls {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .level-button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 1px solid #e0e0e0;
            background: #fff;
            color: #666;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 1.2rem;
        }
        
        .level-button:hover {
            background: #f5f5f5;
            border-color: #1976d2;
            color: #1976d2;
        }
        
        .level-indicator {
            font-size: 0.9rem;
            color: #666;
            font-weight: 500;
        }
        
        /* 기사 콘텐츠 텍스트 */
        .article-content-text {
            font-size: 1.1rem;
            line-height: 1.6;
            color: #333;
        }
        
        /* 학습 섹션 */
        .learning-section {
            margin: 2rem 0;
            padding: 2rem;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 16px;
            border-left: 5px solid #1976d2;
        }
        
        .learning-section h3 {
            color: #1976d2;
            margin-bottom: 1rem;
            font-size: 1.4em;
        }
        
        .feature-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .feature-list li {
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255,255,255,0.3);
        }
        
        .feature-list li:last-child {
            border-bottom: none;
        }
        
        .app-link {
            display: inline-block;
            background: linear-gradient(45deg, #1976d2, #42a5f5);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 25px;
            margin-top: 20px;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(25, 118, 210, 0.3);
            transition: transform 0.2s;
        }
        
        .app-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(25, 118, 210, 0.4);
        }
        
        /* 네비게이션 */
        .navigation {
            margin-top: 3rem;
            padding: 2rem 0;
            border-top: 1px solid #f0f0f0;
            text-align: center;
        }
        
        .navigation a {
            color: #1976d2;
            text-decoration: none;
            margin: 0 15px;
            font-weight: 500;
        }
        
        .navigation a:hover {
            text-decoration: underline;
        }
        
        /* 반응형 디자인 */
        @media (max-width: 768px) {
            .page-container { 
                padding: 15px; 
            }
            
            .article-title { 
                font-size: 1.6rem;
                margin-bottom: 1rem;
            }
            
            .article-image {
                height: 250px;
            }
            
            .article-meta {
                gap: 0.5rem;
                margin-bottom: 0.5rem;
            }
            
            .controls-section {
                flex-direction: column;
                gap: 1rem;
                align-items: stretch;
            }
            
            .learning-section { 
                padding: 1.5rem; 
            }
        }
        
        @media (max-width: 480px) {
            .article-title { 
                font-size: 1.5rem;
                margin-bottom: 0.75rem;
            }
            
            .article-image {
                height: 200px;
                margin-bottom: 0.75rem;
            }
        }
        
        /* 레벨 컨트롤 스타일 */
        .level-controls {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .level-button {
            background: transparent;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #666;
            font-size: 1.2rem;
            transition: all 0.2s ease;
        }
        
        .level-button:hover:not(:disabled) {
            background: #f5f5f5;
            border-color: #1976d2;
            color: #1976d2;
        }
        
        .level-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .level-indicator {
            font-size: 0.9rem;
            color: #666;
            font-weight: 500;
            min-width: 40px;
            text-align: center;
        }
        
        /* 숨김 처리 (React 앱 로드 후) */
        .prerender-hidden {
            display: none !important;
        }
    </style>
</head>
<body>
    <!-- React 로딩 표시 -->
    <div class="react-loading"></div>
    
    <!-- React 컴포넌트와 동일한 구조의 정적 콘텐츠 -->
    <div class="page-container">
        <article itemscope itemtype="https://schema.org/NewsArticle">
            <!-- 썸네일 이미지 -->
            ${article.image ? `<img src="${article.image}" alt="${cleanTitle}" class="article-image" itemprop="image" crossorigin="anonymous" onerror="this.style.display='none'">` : ''}
            
            <!-- 메타 정보 -->
            <div class="article-meta">
                <span class="category-tag" itemprop="articleSection">${article.category}</span>
                <span class="date-text">
                    <time datetime="${article.publishedAt}" itemprop="datePublished">${publishDate}</time>
                </span>
                ${article.views ? `<span class="date-text">👁 ${article.views} views</span>` : ''}
            </div>
            
            <!-- 제목 -->
            <h1 class="article-title" itemprop="headline">${cleanTitle}</h1>
            
            <!-- 컨트롤 섹션 (TTS 및 액션 버튼들) -->
            <div class="controls-section">
                <div class="playback-controls">
                    <button class="play-button" title="음성 읽기">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                    <span class="date-text">음성 읽기</span>
                </div>
                
                <div class="action-buttons">
                    <button class="action-button" title="좋아요">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                    </button>
                    <button class="action-button" title="공유">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.50-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <!-- 콘텐츠 카드 -->
            <div class="content-card">
                <div class="content-header">
                    <h3 class="content-title">Level 1 - Beginner</h3>
                    <div class="level-controls">
                        <button class="level-button" title="이전 레벨">‹</button>
                        <span class="level-indicator">1 / 3</span>
                        <button class="level-button" title="다음 레벨">›</button>
                    </div>
                </div>
                
                <div class="content-text" itemprop="articleBody">
                    <p><strong>📝 요약:</strong> <span itemprop="description">${article.summary || '영어 뉴스를 통해 영어 실력을 향상시켜보세요.'}</span></p>
                    
                    ${article.content ? `
                    <div style="margin-top: 1.5rem;">
                        <div class="article-content-text">
                            ${typeof article.content === 'string' ? article.content.replace(/\n/g, '<br>') :
                (article.content.beginner || article.content.intermediate || article.content.advanced || JSON.stringify(article.content))}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- 학습 기능 안내 -->
            <div class="learning-section">
                <h3>🎯 NEWStep에서 이 기사로 영어 학습하기</h3>
                <p>이 영어 뉴스 기사를 통해 실용적인 영어 실력을 향상시켜보세요!</p>
                <ul class="feature-list">
                    <li><strong>🤖 AI 번역:</strong> 모르는 문장을 클릭하면 즉시 한국어로 번역</li>
                    <li><strong>📚 스마트 단어장:</strong> 새로운 단어를 자동으로 저장하고 체계적으로 학습</li>
                    <li><strong>🔊 음성 읽기:</strong> 원어민 발음으로 듣기 연습 및 발음 교정</li>
                    <li><strong>📊 개인화 학습:</strong> 나만의 학습 진도와 성취도 관리</li>
                    <li><strong>🎮 인터랙티브 학습:</strong> 퀴즈와 게임으로 재미있게 영어 학습</li>
                </ul>
                <a href="${SITE_URL}/article/${article.id}" class="app-link">
                    📱 앱에서 이 기사 학습하기 →
                </a>
            </div>
            
            <!-- 관련 정보 -->
            <div class="content-card" style="background: #fff3e0; border-color: #f57c00;">
                <h4 style="color: #f57c00; margin-bottom: 15px;">💡 영어 학습 팁</h4>
                <p>뉴스 기사로 영어를 공부할 때는 다음 순서를 추천합니다:</p>
                <ol>
                    <li>먼저 제목과 요약을 읽고 전체 내용 파악</li>
                    <li>모르는 단어는 단어장에 저장</li>
                    <li>전체 기사를 소리내어 읽기</li>
                    <li>중요한 문장은 번역해서 이해도 확인</li>
                    <li>관련 주제의 다른 기사도 읽어보기</li>
                </ol>
            </div>
        </article>
        
        <!-- 네비게이션 -->
        <nav class="navigation">
            <a href="${SITE_URL}">🏠 홈으로</a>
            <a href="${SITE_URL}/${article.category?.toLowerCase()}">📂 ${article.category} 더보기</a>
            <a href="${SITE_URL}/search">🔍 기사 검색</a>
            <a href="${SITE_URL}/wordbook">📚 나의 단어장</a>
        </nav>
    </div>
    
    <!-- React 앱 마운트 포인트 -->
    <div id="root"></div>
    
    <!-- React 앱 로드 스크립트 -->
    <script>
        // 안전한 전역 변수 설정
        try {
            window.__PRERENDERED_ARTICLE__ = {
                id: '${article.id}',
                title: '${cleanTitle}',
                summary: '${(article.summary || '').replace(/'/g, "\\'")}',
                category: '${article.category || 'General'}',
                publishedAt: '${article.publishedAt}',
                image: '${article.image || ''}',
                content: ${JSON.stringify(article.content || '')},
                contentType: '${typeof article.content}',
                hasStructuredContent: ${!!(article.content && typeof article.content === 'object')},
                isPrerendered: true,
                _metadata: {
                    generatedAt: '${new Date().toISOString()}',
                    version: '1.0',
                    source: 'prerender'
                }
            };
            console.log('✅ 프리렌더 데이터 설정 완료');
        } catch (error) {
            console.error('❌ 프리렌더 데이터 설정 실패:', error);
            window.__PRERENDERED_ARTICLE__ = {
                id: '${article.id}',
                title: '${cleanTitle}',
                summary: 'Content loading...',
                category: 'General',
                publishedAt: '${article.publishedAt}',
                image: '',
                content: '',
                contentType: 'string',
                hasStructuredContent: false,
                isPrerendered: true,
                _metadata: {
                    generatedAt: '${new Date().toISOString()}',
                    version: '1.0',
                    source: 'prerender_fallback',
                    error: 'data_setup_failed'
                }
            };
        }
        
        // 페이지 로드 완료 후 React 앱 초기화
        window.addEventListener('DOMContentLoaded', function() {
            console.log('✅ SEO 최적화된 기사 페이지 로드 완료');
            
            // 사용자에게 로딩 중임을 알림
            const loadingMessage = document.createElement('div');
            loadingMessage.innerHTML = '📱 인터랙티브 버전으로 전환 중...';
            loadingMessage.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #1976d2; color: white; padding: 10px 15px; border-radius: 8px; font-size: 14px; z-index: 10000; box-shadow: 0 2px 10px rgba(0,0,0,0.2);';
            document.body.appendChild(loadingMessage);
            
            // 3초 후 메시지 제거
            setTimeout(() => {
                if (loadingMessage.parentNode) {
                    loadingMessage.parentNode.removeChild(loadingMessage);
                }
            }, 3000);
            
            // UI 요소 참조
            const loadingBar = document.querySelector('.react-loading');
            const pageContainer = document.querySelector('.page-container');
            
            // 로딩 바 시작
            if (loadingBar) {
                loadingBar.style.display = 'block';
            }
            
            // 페이지 컨테이너에 로딩 상태 추가
            if (pageContainer) {
                pageContainer.classList.add('loading');
            }
            
            // React 앱 로드 확인 및 전환
            let attempts = 0;
            const maxAttempts = 20;
            
            const checkReactApp = () => {
                attempts++;
                const reactRoot = document.querySelector('#root > div');
                
                if (reactRoot && reactRoot.children.length > 0) {
                    console.log('✅ React 앱 로드 완료 - 부드러운 전환 시작');
                    
                    // 로딩 바 숨김
                    if (loadingBar) {
                        loadingBar.style.display = 'none';
                    }
                    
                    // React 앱이 완전히 렌더링될 때까지 잠시 대기
                    setTimeout(() => {
                        if (pageContainer) {
                            // 로딩 상태 제거
                            pageContainer.classList.remove('loading');
                            
                            // 더 부드러운 전환을 위한 설정
                            pageContainer.style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
                            pageContainer.style.opacity = '0';
                            pageContainer.style.transform = 'translateY(-10px)';
                            
                            // 완전히 사라진 후 숨김
                            setTimeout(() => {
                                pageContainer.style.display = 'none';
                                console.log('✅ 정적 콘텐츠 숨김 완료');
                            }, 500);
                        }
                    }, 200); // React 앱 안정화를 위한 추가 대기
                    return;
                }
                
                if (attempts < maxAttempts) {
                    setTimeout(checkReactApp, 100);
                } else {
                    console.warn('⚠️ React 앱 로드 실패 - 정적 콘텐츠 유지');
                    
                    // 로딩 바 숨김
                    if (loadingBar) {
                        loadingBar.style.display = 'none';
                    }
                    
                    // 정적 콘텐츠를 완전히 활성화
                    if (pageContainer) {
                        pageContainer.classList.remove('loading');
                        pageContainer.style.opacity = '1';
                        pageContainer.style.transform = 'none';
                    }
                    
                    // React 앱 로드 실패 시 정적 콘텐츠에 기본 인터랙션 추가
                    const playButton = document.querySelector('.play-button');
                    if (playButton) {
                        playButton.addEventListener('click', function() {
                            alert('음성 읽기 기능을 사용하려면 페이지를 새로고침해주세요.');
                        });
                    }
                    
                    const actionButtons = document.querySelectorAll('.action-button');
                    actionButtons.forEach(button => {
                        button.addEventListener('click', function() {
                            alert('이 기능을 사용하려면 페이지를 새로고침해주세요.');
                        });
                    });
                }
            };
            
            setTimeout(checkReactApp, 500);
        });
    </script>
    
    <!-- React 앱 스타일 -->
    <link rel="stylesheet" crossorigin href="/assets/css/index-CSfyY_c0.css">
    
    <!-- React 앱 스크립트 -->
    <script type="module" crossorigin src="/assets/js/index-Bb0Hm0T9.js"></script>
    <link rel="modulepreload" crossorigin href="/assets/js/react-vendor-Dz8DRwSR.js">
    <link rel="modulepreload" crossorigin href="/assets/js/mui-core-CgHrKOaS.js">
</body>
</html>`;
}

// 기본 HTML (기사를 찾을 수 없을 때)
function generateNotFoundHTML(articleId) {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>기사를 찾을 수 없습니다 - NEWStep Eng News</title>
    <meta name="robots" content="noindex">
</head>
<body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
    <h1>🔍 기사를 찾을 수 없습니다</h1>
    <p>요청하신 기사(ID: ${articleId})를 찾을 수 없습니다.</p>
    <a href="${SITE_URL}" style="color: #1976d2;">홈으로 돌아가기</a>
    <div id="root"></div>
    <script type="module" crossorigin src="/assets/js/index-Bb0Hm0T9.js"></script>
    <link rel="modulepreload" crossorigin href="/assets/js/react-vendor-Dz8DRwSR.js">
    <link rel="modulepreload" crossorigin href="/assets/js/mui-core-CgHrKOaS.js">
</body>
</html>`;
}

exports.prerenderArticle = onRequest({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 10,
}, async (req, res) => {
    try {
        // URL에서 기사 ID 추출
        const path = req.path;
        const pathParts = path.split('/').filter(part => part);
        
        console.log(`🔍 프리렌더링 요청 경로: ${path}, 파트: ${JSON.stringify(pathParts)}`);

        // 메인 페이지나 기사가 아닌 경로는 404 처리
        if (pathParts.length === 0 || pathParts[0] !== 'article' || pathParts.length !== 2) {
            console.log(`❌ 잘못된 경로, 404 처리: ${path}`);
            res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Page Not Found</title>
                    <meta http-equiv="refresh" content="0;url=/">
                </head>
                <body>
                    <script>window.location.href = '/';</script>
                    <p>Redirecting to home page...</p>
                </body>
                </html>
            `);
            return;
        }

        const articleId = pathParts[1];

        console.log(`🔍 기사 프리렌더링 요청: ${articleId}`);

        if (!articleId || articleId === 'article') {
            res.status(404).send(generateNotFoundHTML('unknown'));
            return;
        }

        // Firestore에서 기사 데이터 가져오기
        const articleDoc = await db.collection('articles').doc(articleId).get();

        if (!articleDoc.exists) {
            console.log(`❌ 기사 없음: ${articleId}`);
            res.status(404).send(generateNotFoundHTML(articleId));
            return;
        }

        const articleData = articleDoc.data();

        // 발행되지 않은 기사는 404 처리
        if (articleData.status !== 'published') {
            console.log(`🚫 미발행 기사: ${articleId} (status: ${articleData.status})`);
            res.status(404).send(generateNotFoundHTML(articleId));
            return;
        }

        // 조회수 증가 (비동기)
        db.collection('articles').doc(articleId).update({
            views: (articleData.views || 0) + 1,
            updatedAt: new Date().toISOString()
        }).catch(error => {
            console.error('조회수 업데이트 실패:', error);
        });

        // HTML 생성 및 반환
        const html = generateArticleHTML({ id: articleId, ...articleData });

        // 캐시 헤더 설정
        res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
        res.set('Content-Type', 'text/html; charset=utf-8');

        console.log(`✅ 기사 프리렌더링 완료: ${articleId}`);
        res.send(html);

    } catch (error) {
        console.error('🚨 프리렌더링 오류:', error);
        res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>⚠️ 일시적인 오류가 발생했습니다</h1>
          <p>잠시 후 다시 시도해주세요.</p>
          <a href="${SITE_URL}">홈으로 돌아가기</a>
          <div id="root"></div>
          <script type="module" crossorigin src="/assets/js/index-Bb0Hm0T9.js"></script>
          <link rel="modulepreload" crossorigin href="/assets/js/react-vendor-Dz8DRwSR.js">
          <link rel="modulepreload" crossorigin href="/assets/js/mui-core-CgHrKOaS.js">
        </body>
      </html>
    `);
    }
});