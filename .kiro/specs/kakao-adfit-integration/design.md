# 카카오 애드핏 광고 통합 설계

## 개요

MarLang 영어 뉴스 학습 플랫폼에 카카오 애드핏 광고를 통합하여 수익화를 구현합니다. 기존 Google AdSense와 함께 운영하면서 사용자 경험을 해치지 않는 자연스러운 광고 배치를 목표로 합니다.

## 아키텍처

### 전체 구조
```
MarLang App
├── AdFit Integration Layer
│   ├── AdFit Script Loader
│   ├── Ad Unit Components
│   ├── Ad Position Manager
│   └── Performance Monitor
├── Existing Ad System (Google AdSense)
├── Content Management
└── User Interface
```

### 컴포넌트 계층구조
```
App
├── AdFitProvider (Context)
├── Pages
│   ├── Home
│   │   ├── ArticleGrid
│   │   │   ├── ArticleCard
│   │   │   ├── AdCard (카드 형태 광고)
│   │   │   ├── ArticleCard
│   │   │   ├── ArticleCard
│   │   │   ├── AdCard (카드 형태 광고)
│   │   │   └── ...
│   │   └── SidebarAd (300x250) - 데스크톱만
│   ├── ArticleDetail
│   │   ├── ArticleContent
│   │   ├── InlineAdCard (본문 중간)
│   │   ├── ArticleBottomBanner (기사 하단 배너)
│   │   └── RelatedArticles
│   │       ├── ArticleCard
│   │       ├── AdCard
│   │       └── ArticleCard
│   └── Search
│       ├── SearchResults
│       │   ├── ArticleCard
│       │   ├── AdCard
│       │   ├── ArticleCard
│       │   └── ...
└── MobileFixedAd (320x50) - 선택적
```

## 컴포넌트 설계

### 1. AdFitProvider (Context)
광고 관련 전역 상태와 설정을 관리하는 Context Provider

```typescript
interface AdFitContextType {
  isAdFitLoaded: boolean;
  adUnits: AdUnit[];
  loadAdFit: () => Promise<void>;
  registerAdUnit: (unit: AdUnit) => void;
  unregisterAdUnit: (unitId: string) => void;
}

interface AdUnit {
  id: string;
  size: AdSize;
  position: AdPosition;
  isLoaded: boolean;
  element?: HTMLElement;
}
```

### 2. AdFitScript 컴포넌트
카카오 애드핏 스크립트를 동적으로 로드하는 컴포넌트

```typescript
interface AdFitScriptProps {
  onLoad?: () => void;
  onError?: (error: Error) => void;
}
```

### 3. AdFitUnit 컴포넌트
개별 광고 단위를 렌더링하는 재사용 가능한 컴포넌트

```typescript
interface AdFitUnitProps {
  unitId: string;
  size: AdSize;
  className?: string;
  lazy?: boolean;
  fallback?: React.ReactNode;
}

type AdSize = 
  | '300x250'  // 카드형 광고 (주력)
  | '320x250'  // 모바일 카드형
  | '728x90'   // 데스크톱 배너 (기사 하단, 사이드바)
  | '320x50'   // 모바일 배너 (기사 하단, 하단 고정)
  | '250x250'  // 정사각형 카드
```

### 4. 카드 형태 광고 컴포넌트

#### AdCard (메인 카드형 광고)
```typescript
interface AdCardProps {
  className?: string;
  lazy?: boolean;
  index?: number; // 그리드에서의 위치
}

const AdCard: React.FC<AdCardProps> = ({ className, lazy = true, index }) => {
  return (
    <Card className={`ad-card ${className}`}>
      <CardHeader>
        <AdLabel>광고</AdLabel>
      </CardHeader>
      <CardContent>
        <AdFitUnit 
          unitId={`card-ad-${index || 'default'}`}
          size="300x250"
          lazy={lazy}
          fallback={<AdCardSkeleton />}
        />
      </CardContent>
    </Card>
  );
};
```

#### InlineAdCard (기사 본문 내 광고)
```typescript
interface InlineAdCardProps {
  position: 'middle';
  articleId?: string;
}

const InlineAdCard: React.FC<InlineAdCardProps> = ({ position, articleId }) => {
  return (
    <InlineAdContainer>
      <AdLabel>광고</AdLabel>
      <Card className="inline-ad-card">
        <CardContent>
          <AdFitUnit 
            unitId={`inline-${position}-${articleId}`}
            size="300x250"
            lazy={false}
          />
        </CardContent>
      </Card>
    </InlineAdContainer>
  );
};
```

#### ArticleBottomBanner (기사 하단 배너 광고)
```typescript
interface ArticleBottomBannerProps {
  articleId?: string;
  className?: string;
}

const ArticleBottomBanner: React.FC<ArticleBottomBannerProps> = ({ 
  articleId, 
  className 
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const bannerSize = isMobile ? '320x50' : '728x90';
  
  return (
    <BottomBannerContainer className={className}>
      <AdLabel>광고</AdLabel>
      <BannerAdWrapper>
        <AdFitUnit 
          unitId={`article-bottom-${articleId}`}
          size={bannerSize}
          lazy={true}
          fallback={<BannerAdSkeleton size={bannerSize} />}
        />
      </BannerAdWrapper>
    </BottomBannerContainer>
  );
};
```

#### BannerAdSkeleton (배너 광고 로딩 상태)
```typescript
interface BannerAdSkeletonProps {
  size: '728x90' | '320x50';
}

const BannerAdSkeleton: React.FC<BannerAdSkeletonProps> = ({ size }) => {
  const [width, height] = size.split('x').map(Number);
  
  return (
    <Box sx={{ 
      width: width,
      height: height,
      maxWidth: '100%',
      bgcolor: 'grey.100',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 1,
      mx: 'auto'
    }}>
      <Typography variant="caption" color="text.secondary">
        광고 로딩 중...
      </Typography>
    </Box>
  );
};
```

#### AdCardSkeleton (로딩 상태)
```typescript
const AdCardSkeleton: React.FC = () => {
  return (
    <Card className="ad-card-skeleton">
      <CardContent>
        <Box sx={{ 
          width: '100%', 
          height: 250, 
          bgcolor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 1
        }}>
          <Typography variant="body2" color="text.secondary">
            광고 로딩 중...
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
```

#### ContentWithAds (콘텐츠와 광고 믹싱)
```typescript
interface ContentWithAdsProps {
  articles: Article[];
  adInterval?: number; // 몇 개 콘텐츠마다 광고 삽입
  maxAds?: number; // 최대 광고 개수
}

const ContentWithAds: React.FC<ContentWithAdsProps> = ({ 
  articles, 
  adInterval = 4, 
  maxAds = 3 
}) => {
  const mixedContent = useMemo(() => {
    const mixed: (Article | 'ad')[] = [];
    let adCount = 0;
    
    articles.forEach((article, index) => {
      mixed.push(article);
      
      // 광고 삽입 조건: 간격마다, 최대 개수 미만, 마지막 아이템 아님
      if (
        (index + 1) % adInterval === 0 && 
        adCount < maxAds && 
        index < articles.length - 1
      ) {
        mixed.push('ad');
        adCount++;
      }
    });
    
    return mixed;
  }, [articles, adInterval, maxAds]);

  return (
    <Grid container spacing={3}>
      {mixedContent.map((item, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          {item === 'ad' ? (
            <AdCard index={index} lazy={index > 2} />
          ) : (
            <ArticleCard article={item} />
          )}
        </Grid>
      ))}
    </Grid>
  );
};
```

## 데이터 모델

### AdUnit Configuration
```typescript
interface AdUnitConfig {
  id: string;
  name: string;
  size: AdSize;
  positions: AdPosition[];
  isActive: boolean;
  code: string; // 카카오 애드핏에서 발급받은 코드
  createdAt: Date;
  updatedAt: Date;
}

type AdPosition = 
  | 'card-grid'        // 메인 그리드 내 카드형 광고
  | 'article-inline'   // 기사 본문 내 인라인 광고
  | 'article-bottom'   // 기사 하단 배너 (네비게이션 바 위)
  | 'search-result'    // 검색 결과 내 카드형 광고
  | 'related-articles' // 관련 기사 섹션 내 광고
  | 'sidebar'          // 사이드바 (데스크톱만)
  | 'mobile-fixed';    // 모바일 하단 고정
```

### Ad Performance Tracking
```typescript
interface AdPerformance {
  unitId: string;
  impressions: number;
  clicks: number;
  ctr: number;
  revenue: number;
  date: Date;
}
```

## 인터페이스 설계

### 1. AdFit API Integration
```typescript
// 카카오 애드핏 스크립트 로드
declare global {
  interface Window {
    adfit?: {
      display: (unitId: string) => void;
      refresh: (unitId: string) => void;
      destroy: (unitId: string) => void;
    };
  }
}

// AdFit 스크립트 로더
class AdFitLoader {
  private static instance: AdFitLoader;
  private isLoaded = false;
  private loadPromise?: Promise<void>;

  static getInstance(): AdFitLoader {
    if (!AdFitLoader.instance) {
      AdFitLoader.instance = new AdFitLoader();
    }
    return AdFitLoader.instance;
  }

  async load(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = this.loadScript();
    return this.loadPromise;
  }

  private loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://t1.daumcdn.net/adfit/static/kp.js';
      script.async = true;
      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}
```

### 2. Ad Management Service
```typescript
class AdManagementService {
  private adUnits: Map<string, AdUnitConfig> = new Map();

  registerAdUnit(config: AdUnitConfig): void {
    this.adUnits.set(config.id, config);
  }

  unregisterAdUnit(unitId: string): void {
    this.adUnits.delete(unitId);
  }

  getAdUnit(unitId: string): AdUnitConfig | undefined {
    return this.adUnits.get(unitId);
  }

  async displayAd(unitId: string): Promise<void> {
    const unit = this.getAdUnit(unitId);
    if (!unit || !unit.isActive) return;

    await AdFitLoader.getInstance().load();
    
    if (window.adfit) {
      window.adfit.display(unitId);
    }
  }
}
```

## 에러 처리

### 1. 광고 로딩 실패 처리
```typescript
const AdFitUnit: React.FC<AdFitUnitProps> = ({ unitId, size, fallback }) => {
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAd = async () => {
      try {
        await AdManagementService.displayAd(unitId);
        setIsLoading(false);
      } catch (error) {
        console.error(`AdFit unit ${unitId} failed to load:`, error);
        setIsError(true);
        setIsLoading(false);
      }
    };

    loadAd();
  }, [unitId]);

  if (isError) {
    return fallback || <AdPlaceholder size={size} />;
  }

  if (isLoading) {
    return <AdSkeleton size={size} />;
  }

  return <div id={unitId} className={`adfit-unit adfit-${size}`} />;
};
```

### 2. 광고 차단기 대응
```typescript
const useAdBlockDetection = () => {
  const [isAdBlocked, setIsAdBlocked] = useState(false);

  useEffect(() => {
    const detectAdBlock = () => {
      const testAd = document.createElement('div');
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox';
      testAd.style.position = 'absolute';
      testAd.style.left = '-10000px';
      document.body.appendChild(testAd);

      setTimeout(() => {
        const isBlocked = testAd.offsetHeight === 0;
        setIsAdBlocked(isBlocked);
        document.body.removeChild(testAd);
      }, 100);
    };

    detectAdBlock();
  }, []);

  return isAdBlocked;
};
```

## 테스트 전략

### 1. 단위 테스트
- AdFitUnit 컴포넌트 렌더링 테스트
- AdFitLoader 스크립트 로딩 테스트
- AdManagementService 기능 테스트

### 2. 통합 테스트
- 전체 페이지에서 광고 표시 테스트
- 모바일/데스크톱 반응형 테스트
- 광고 차단기 환경 테스트

### 3. 성능 테스트
- 페이지 로딩 속도 영향 측정
- 광고 로딩 지연 시간 측정
- 메모리 사용량 모니터링

## 배포 전략

### 1. 단계별 배포
1. **Phase 1**: AdFit 스크립트 로더 및 기본 컴포넌트 구현
2. **Phase 2**: 주요 페이지에 광고 배치 (Home, ArticleDetail)
3. **Phase 3**: 추가 페이지 및 모바일 최적화
4. **Phase 4**: 성능 최적화 및 모니터링 구현

### 2. A/B 테스트
- 광고 위치별 성과 비교
- 광고 크기별 효과 측정
- 사용자 경험 영향 분석

## 모니터링 및 분석

### 1. 성과 지표
- 광고 노출 수 (Impressions)
- 클릭 수 (Clicks)
- 클릭률 (CTR)
- 수익 (Revenue)
- 페이지 로딩 속도 영향

### 2. 사용자 경험 지표
- 페이지 이탈률
- 세션 지속 시간
- 사용자 만족도
- 광고 관련 피드백

## 보안 고려사항

### 1. 스크립트 보안
- CSP (Content Security Policy) 설정
- 스크립트 무결성 검증
- XSS 공격 방지

### 2. 개인정보 보호
- 사용자 동의 관리
- 쿠키 정책 준수
- GDPR/CCPA 컴플라이언스

## 스타일링 가이드

### 1. 카드형 광고 스타일
```scss
.ad-card {
  // 기존 ArticleCard와 동일한 스타일 적용
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background: #fff;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
  
  .ad-label {
    font-size: 12px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    opacity: 0.8;
  }
  
  .adfit-unit {
    width: 100%;
    min-height: 250px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    overflow: hidden;
  }
}

.inline-ad-card {
  margin: 24px 0;
  border: 1px solid #e0e0e0;
  background: #fafafa;
  
  .ad-label {
    text-align: center;
    margin-bottom: 12px;
    font-weight: 500;
  }
}

.bottom-banner-container {
  margin: 32px 0 24px 0;
  padding: 16px 0;
  border-top: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
  
  .ad-label {
    text-align: center;
    margin-bottom: 12px;
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  .banner-ad-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 90px; // 데스크톱 기준
    
    .adfit-unit {
      max-width: 100%;
      height: auto;
    }
  }
}

.ad-card-skeleton {
  .skeleton-content {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 2. 반응형 디자인
```scss
// 모바일
@media (max-width: 768px) {
  .ad-card {
    .adfit-unit {
      min-height: 200px; // 모바일에서 높이 조정
    }
  }
  
  .inline-ad-card {
    margin: 16px 0;
  }
  
  .bottom-banner-container {
    margin: 24px 0 16px 0;
    padding: 12px 0;
    
    .banner-ad-wrapper {
      min-height: 50px; // 모바일 배너 높이
    }
  }
}

// 태블릿
@media (min-width: 769px) and (max-width: 1024px) {
  .ad-card {
    .adfit-unit {
      min-height: 225px;
    }
  }
}

// 데스크톱
@media (min-width: 1025px) {
  .sidebar-ad {
    position: sticky;
    top: 100px;
    margin-bottom: 24px;
  }
}
```

### 3. 그리드 레이아웃 통합
```typescript
// 기존 ArticleCard와 동일한 그리드 시스템 사용
const useResponsiveGrid = () => {
  return {
    xs: 12,    // 모바일: 1열
    sm: 6,     // 태블릿: 2열  
    md: 4,     // 데스크톱: 3열
    lg: 3      // 대형 화면: 4열
  };
};
```

## 성능 최적화

### 1. 지연 로딩 (Lazy Loading)
```typescript
const useLazyAd = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};
```

### 2. 스크립트 최적화
- 비동기 로딩
- 중복 로딩 방지
- 에러 복구 메커니즘

## 구현 예시

### 1. Home 페이지에서 사용
```typescript
const Home: React.FC = () => {
  const { articles, loading } = useArticles();
  
  return (
    <Container>
      <HeroSection />
      
      {/* 카드 그리드에 광고 자동 삽입 */}
      <ContentWithAds 
        articles={articles}
        adInterval={4}  // 4개 기사마다 광고 1개
        maxAds={3}      // 페이지당 최대 3개 광고
      />
      
      {/* 사이드바 광고 (데스크톱만) */}
      <Hidden mdDown>
        <Sidebar>
          <AdCard className="sidebar-ad" lazy={false} />
        </Sidebar>
      </Hidden>
    </Container>
  );
};
```

### 2. ArticleDetail 페이지에서 사용
```typescript
const ArticleDetail: React.FC = () => {
  const { article } = useArticle();
  const { relatedArticles } = useRelatedArticles();
  
  return (
    <Container>
      <ArticleHeader />
      
      <ArticleContent>
        {/* 본문 중간에 인라인 광고 */}
        <Paragraph />
        <Paragraph />
        <InlineAdCard position="middle" articleId={article.id} />
        <Paragraph />
        <Paragraph />
      </ArticleContent>
      
      {/* 기사 하단 배너 광고 (네비게이션 바 위) */}
      <ArticleBottomBanner 
        articleId={article.id}
        className="article-bottom-ad"
      />
      
      {/* 관련 기사 섹션에 광고 포함 */}
      <RelatedSection>
        <ContentWithAds 
          articles={relatedArticles}
          adInterval={3}
          maxAds={1}
        />
      </RelatedSection>
    </Container>
  );
};
```

### 3. Search 페이지에서 사용
```typescript
const Search: React.FC = () => {
  const { searchResults } = useSearch();
  
  return (
    <Container>
      <SearchHeader />
      
      {/* 검색 결과에 광고 자연스럽게 삽입 */}
      <ContentWithAds 
        articles={searchResults}
        adInterval={5}  // 검색 결과는 조금 더 간격을 둠
        maxAds={2}
      />
    </Container>
  );
};
```

### 4. 광고 성과 추적
```typescript
const useAdTracking = () => {
  const trackAdImpression = useCallback((unitId: string) => {
    // 광고 노출 추적
    analytics.track('ad_impression', {
      unit_id: unitId,
      timestamp: Date.now(),
      page: window.location.pathname
    });
  }, []);

  const trackAdClick = useCallback((unitId: string) => {
    // 광고 클릭 추적
    analytics.track('ad_click', {
      unit_id: unitId,
      timestamp: Date.now(),
      page: window.location.pathname
    });
  }, []);

  return { trackAdImpression, trackAdClick };
};
```

## 카카오 애드핏 심사 준비 체크리스트

### 1. 기술적 준비사항
- [ ] 광고 코드가 모든 페이지에 정상 설치됨
- [ ] 카드형 광고가 콘텐츠 그리드에 자연스럽게 배치됨
- [ ] 기사 하단 배너 광고가 네비게이션 바 위에 정상 표시됨
- [ ] 모바일/데스크톱 반응형 동작 확인 (728x90 ↔ 320x50)
- [ ] 광고 로딩 실패 시 대체 처리 구현
- [ ] 페이지 성능에 미치는 영향 최소화

### 2. 콘텐츠 준비사항
- [ ] 충분한 양의 고품질 콘텐츠 (30개 이상 기사)
- [ ] 정기적인 콘텐츠 업데이트 (주 3-5회)
- [ ] 모든 필수 페이지 완성 (About, Privacy, Terms, Contact)
- [ ] 사이트 내비게이션 완성도 확인

### 3. 정책 준수사항
- [ ] 광고임을 명확히 표시 ("광고" 라벨)
- [ ] 광고와 콘텐츠 명확한 구분
- [ ] 클릭 유도 금지 문구 제거
- [ ] 성인/도박/불법 콘텐츠 없음 확인

이 설계를 바탕으로 카드 형태의 자연스러운 광고 통합이 가능하며, 사용자 경험을 해치지 않으면서도 효과적인 수익화를 달성할 수 있습니다.