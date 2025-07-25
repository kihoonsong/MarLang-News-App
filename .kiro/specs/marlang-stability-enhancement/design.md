# Design Document

## Overview

이 설계는 개별 기사 URL 직접 접근 문제를 안전하게 해결하면서 기존 시스템의 모든 기능과 디자인을 완전히 보존하는 것을 목표로 합니다. 현재 구현된 프리렌더링 시스템을 기반으로 하여 점진적이고 안전한 개선을 통해 사용자 경험을 향상시킵니다.

## Architecture

### Current System Analysis

현재 시스템은 다음과 같은 구조로 되어 있습니다:

1. **Firebase Hosting + Functions**
   - `/article/**` 경로는 `prerenderArticle` 함수로 라우팅
   - 정적 HTML 생성 후 React 앱 하이드레이션
   - SEO 최적화된 메타데이터 포함

2. **React SPA**
   - Vite 기반 빌드 시스템
   - React Router를 통한 클라이언트 사이드 라우팅
   - Context API를 통한 상태 관리

3. **Data Flow**
   - Firestore에서 기사 데이터 로드
   - 프리렌더된 데이터는 `window.__PRERENDERED_ARTICLE__`로 전달
   - React 앱에서 프리렌더 데이터 우선 사용

### Enhanced Architecture

기존 아키텍처를 유지하면서 다음 영역을 개선합니다:

```
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Hosting                         │
├─────────────────────────────────────────────────────────────┤
│  /article/[id] → prerenderArticle Function (Enhanced)      │
│  ├─ User-Agent Detection (Crawler vs Browser)              │
│  ├─ Static HTML Generation (SEO)                           │
│  ├─ Data Hydration Preparation                             │
│  └─ Fallback Handling                                      │
├─────────────────────────────────────────────────────────────┤
│                    React SPA (Preserved)                   │
│  ├─ Existing Components (No Changes)                       │
│  ├─ Enhanced Data Loading (Prerender-aware)                │
│  ├─ Improved Error Handling                                │
│  └─ Backward Compatibility Layer                           │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Enhanced Prerender System

**Current Implementation:**
- `functions/prerenderArticle.js`: 기본적인 HTML 생성
- 크롤러와 브라우저 구분 없이 동일한 응답

**Enhanced Design:**
```javascript
// Enhanced prerenderArticle.js
const generateEnhancedHTML = (article, userAgent) => {
  const isCrawler = detectCrawler(userAgent);
  const isDirectAccess = !hasReferrer(request);
  
  return {
    staticHTML: generateStaticContent(article),
    hydrationData: prepareHydrationData(article),
    loadingStrategy: determineLoadingStrategy(isCrawler, isDirectAccess)
  };
};
```

### 2. Safe Data Hydration

**Interface:**
```javascript
// Enhanced data hydration
window.__MARLANG_HYDRATION__ = {
  article: {
    id: string,
    title: string,
    content: object | string,
    metadata: object
  },
  loadingState: {
    isPrerendered: boolean,
    dataSource: 'prerender' | 'api' | 'cache',
    timestamp: string
  },
  compatibility: {
    version: string,
    fallbackEnabled: boolean
  }
};
```

### 3. Backward Compatibility Layer

**Component Structure:**
```javascript
// Enhanced ArticleDetail.jsx
const ArticleDetail = () => {
  // 1. 기존 상태 관리 유지
  const [articleData, setArticleData] = useState(null);
  
  // 2. 프리렌더 데이터 감지 및 처리
  const hydratedData = usePrerenderedData();
  
  // 3. 폴백 메커니즘
  const fallbackData = useFallbackData();
  
  // 4. 기존 로직 완전 보존
  return <ExistingArticleComponent data={articleData} />;
};
```

## Data Models

### Enhanced Article Data Structure

기존 데이터 구조를 완전히 보존하면서 메타데이터만 추가:

```javascript
// 기존 구조 (완전 보존)
const existingArticle = {
  id: string,
  title: string,
  summary: string,
  content: string | object,
  category: string,
  publishedAt: string,
  image: string,
  // ... 기존 모든 필드 유지
};

// 추가 메타데이터 (기존 구조에 영향 없음)
const enhancedMetadata = {
  _prerender: {
    generatedAt: string,
    version: string,
    source: 'firestore' | 'cache'
  },
  _compatibility: {
    legacySupport: true,
    dataVersion: '1.0'
  }
};
```

### Hydration State Model

```javascript
const hydrationState = {
  status: 'pending' | 'hydrated' | 'fallback' | 'error',
  dataSource: 'prerender' | 'api' | 'cache',
  timestamp: string,
  errors: array,
  retryCount: number
};
```

## Error Handling

### Layered Error Recovery

1. **Level 1: Prerender Fallback**
   ```javascript
   if (prerenderFailed) {
     return generateBasicHTML(articleId);
   }
   ```

2. **Level 2: React Hydration Fallback**
   ```javascript
   if (hydrationFailed) {
     return <LegacyArticleLoader articleId={id} />;
   }
   ```

3. **Level 3: Complete Fallback**
   ```javascript
   if (allSystemsFailed) {
     return <MinimalArticleView />;
   }
   ```

### Error Monitoring

```javascript
const errorReporting = {
  prerenderErrors: logToPrerenderService,
  hydrationErrors: logToClientService,
  fallbackActivation: logToMonitoring,
  userImpact: trackUserExperience
};
```

## Testing Strategy

### 1. Compatibility Testing

**Test Matrix:**
- ✅ 기존 URL 패턴 (`/article/[id]`)
- ✅ 직접 URL 접근
- ✅ 검색엔진 크롤러
- ✅ 소셜 미디어 크롤러
- ✅ 모바일 브라우저
- ✅ 데스크톱 브라우저

### 2. Data Integrity Testing

```javascript
// 데이터 일관성 검증
const validateDataIntegrity = (prerenderData, apiData) => {
  return {
    titleMatch: prerenderData.title === apiData.title,
    contentMatch: compareContent(prerenderData.content, apiData.content),
    metadataMatch: compareMetadata(prerenderData, apiData)
  };
};
```

### 3. Performance Testing

**Metrics to Monitor:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Cumulative Layout Shift (CLS)

### 4. Fallback Testing

```javascript
// 폴백 시나리오 테스트
const fallbackTests = [
  'prerender_function_timeout',
  'firestore_connection_failure',
  'invalid_article_id',
  'malformed_data_structure',
  'react_hydration_failure'
];
```

## Implementation Phases

### Phase 1: Enhanced Prerender Function (Safe)
- 기존 `prerenderArticle.js` 개선
- 더 나은 오류 처리
- 향상된 데이터 구조
- 기존 기능 완전 보존

### Phase 2: Improved Data Hydration (Safe)
- `ArticleDetail.jsx`에 프리렌더 데이터 감지 로직 추가
- 기존 데이터 로딩 로직 유지
- 점진적 개선

### Phase 3: Enhanced Error Handling (Safe)
- 다층 폴백 시스템 구현
- 사용자 경험 모니터링
- 성능 최적화

### Phase 4: Monitoring and Optimization (Safe)
- 실시간 모니터링 시스템
- 성능 메트릭 수집
- 지속적 개선

## Security Considerations

### 1. Input Validation
```javascript
const validateArticleId = (id) => {
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length <= 50;
};
```

### 2. XSS Prevention
```javascript
const sanitizeContent = (content) => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
    ALLOWED_ATTR: []
  });
};
```

### 3. Rate Limiting
- 기존 rate limiting 유지
- 프리렌더 함수에 추가 보호

## Performance Optimizations

### 1. Caching Strategy
```javascript
const cacheStrategy = {
  prerender: 'public, max-age=300, s-maxage=600',
  static: 'public, max-age=31536000, immutable',
  api: 'private, max-age=60'
};
```

### 2. Bundle Optimization
- 기존 Vite 설정 유지
- 추가 최적화 적용
- 코드 스플리팅 개선

### 3. Database Optimization
- Firestore 쿼리 최적화
- 인덱스 활용
- 캐싱 레이어 추가

## Monitoring and Analytics

### 1. Success Metrics
- 직접 URL 접근 성공률
- 페이지 로드 시간
- 사용자 만족도
- 검색엔진 크롤링 성공률

### 2. Error Tracking
- 프리렌더 실패율
- 하이드레이션 오류
- 폴백 활성화 빈도
- 사용자 이탈률

### 3. Performance Monitoring
- Core Web Vitals
- 서버 응답 시간
- 클라이언트 렌더링 시간
- 메모리 사용량