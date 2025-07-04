# 구글 애드센스 설정 가이드

## 1. 구글 애드센스 계정 생성 및 승인

### 1.1 애드센스 계정 신청
1. **[Google AdSense 공식 사이트](https://www.google.com/adsense)** 방문
2. **"시작하기"** 버튼 클릭
3. **구글 계정**으로 로그인 (없으면 생성 필요)
4. **웹사이트 정보** 입력:
   - 웹사이트 URL: `https://your-domain.com`
   - 국가/지역: 대한민국 선택
   - 결제 통화: KRW (원화) 선택
5. **AdSense 서비스 약관** 동의
6. **결제 정보** 입력 (나중에 설정 가능)

### 1.1.1 사이트 소유권 확인 방법 선택

구글 애드센스에서 사이트 소유권을 확인하는 세 가지 방법이 있습니다:

#### 🎯 **권장: 애드센스 코드 스니펫** (추천)
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_CLIENT_ID"
     crossorigin="anonymous"></script>
```

**장점:**
- ✅ 가장 간단하고 확실한 방법
- ✅ 승인 후 바로 광고 표시 가능
- ✅ 자동 광고 기능 사용 가능
- ✅ 실시간 광고 성과 추적

**단점:**
- ❌ 승인 전까지 빈 공간 또는 플레이스홀더 표시

**우리 프로젝트에 적용:**
이미 `index.html`에 추가되어 있습니다:
```html
<!-- index.html -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_CLIENT_ID"
     crossorigin="anonymous"></script>
```

#### 📄 **Ads.txt 스니펫**
```
google.com, pub-YOUR_CLIENT_ID, DIRECT, f08c47fec0942fa0
```

**장점:**
- ✅ 광고 사기 방지에 효과적
- ✅ 페이지 로딩에 영향 없음
- ✅ 승인 후 추가 설정 불필요

**단점:**
- ❌ 서버 루트 디렉토리에 파일 설치 필요
- ❌ 정적 사이트 호스팅에서 복잡할 수 있음

**적용 방법:**
```bash
# public 폴더에 ads.txt 파일 생성
echo "google.com, pub-YOUR_CLIENT_ID, DIRECT, f08c47fec0942fa0" > public/ads.txt
```

#### 🏷️ **메타 태그**
```html
<meta name="google-adsense-account" content="ca-pub-YOUR_CLIENT_ID">
```

**장점:**
- ✅ 가장 가벼운 방법
- ✅ 페이지 로딩 속도에 영향 없음
- ✅ 승인 과정에서만 필요

**단점:**
- ❌ 승인 후 별도 광고 코드 설치 필요
- ❌ 자동 광고 기능 사용 불가

**우리 프로젝트에 적용:**
```html
<!-- index.html의 <head> 섹션에 추가 -->
<meta name="google-adsense-account" content="ca-pub-YOUR_CLIENT_ID">
```

### 🏆 **최적 선택: 애드센스 코드 스니펫**

**React/Vite 프로젝트에서는 애드센스 코드 스니펫을 권장합니다:**

1. **이미 구현 완료**: 우리 프로젝트에서는 이미 설정되어 있습니다
2. **원스톱 솔루션**: 승인과 광고 표시를 한 번에 처리
3. **자동 광고**: 구글이 자동으로 최적 위치에 광고 배치
4. **실시간 최적화**: 광고 성과에 따른 자동 최적화

### 🛠️ 추가 설정 (모든 방법 공통)

승인 확률을 높이기 위해 **ads.txt도 함께 설정**하는 것을 권장합니다:

### 1.2 사이트 승인 절차 상세

#### 🔍 승인 조건 및 요구사항
1. **콘텐츠 품질**:
   - 독창적이고 유용한 콘텐츠
   - 정기적인 업데이트
   - 최소 20-30개의 고품질 포스트/기사
   - 저작권 침해 없는 콘텐츠

2. **웹사이트 기술 요구사항**:
   - SSL 인증서 설치 (HTTPS)
   - 모바일 친화적 반응형 디자인
   - 빠른 로딩 속도
   - 명확한 내비게이션 구조

3. **필수 페이지**:
   - **개인정보 처리방침** (Privacy Policy)
   - **이용약관** (Terms of Service)
   - **연락처 정보** (Contact Us)
   - **사이트맵** (Sitemap)

4. **트래픽 요구사항**:
   - 일일 최소 100-500명 방문자
   - 자연스러운 트래픽 (구매 트래픽 금지)
   - 다양한 트래픽 소스

#### ⏰ 승인 대기 시간
- **일반적인 승인 시간**: 1-14일
- **복잡한 경우**: 최대 30일
- **승인 결과**: 이메일로 통지

#### 📋 승인 체크리스트
승인 신청 전에 다음 사항들을 확인하세요:

- [ ] 웹사이트가 완전히 구축되어 있음
- [ ] 최소 15-20개의 고품질 콘텐츠 페이지
- [ ] 개인정보 처리방침 페이지 추가
- [ ] 이용약관 페이지 추가
- [ ] 연락처 정보 페이지 추가
- [ ] SSL 인증서 설치됨 (HTTPS)
- [ ] 모바일 반응형 디자인 적용
- [ ] 내비게이션 메뉴 구성
- [ ] 검색 기능 구현
- [ ] 404 에러 페이지 설정
- [ ] 사이트맵 생성 및 제출
- [ ] Google Analytics 설치
- [ ] 정기적인 콘텐츠 업데이트

### 1.3 승인 거부 시 대응 방법

#### 일반적인 거부 사유
1. **불충분한 콘텐츠**
   - 해결방법: 더 많은 고품질 콘텐츠 추가
   - 최소 30개 이상의 유용한 기사 권장

2. **내비게이션 문제**
   - 해결방법: 명확한 메뉴 구조 개선
   - 사용자가 쉽게 찾을 수 있는 페이지 구성

3. **필수 페이지 누락**
   - 해결방법: 개인정보 처리방침, 이용약관 등 추가
   - 연락처 정보 명확히 표시

4. **트래픽 부족**
   - 해결방법: SEO 최적화, 소셜 미디어 활용
   - 자연스러운 트래픽 증가 노력

#### 재신청 방법
1. 거부 사유 해결 후 **최소 1주일** 대기
2. 개선 사항 체크리스트 재확인
3. **[AdSense 계정](https://www.google.com/adsense)**에서 재신청
4. 새로운 검토 요청 제출

### 1.4 유용한 공식 링크

#### 🔗 필수 링크들
- **[Google AdSense 공식 사이트](https://www.google.com/adsense)**
- **[AdSense 도움말 센터](https://support.google.com/adsense)**
- **[AdSense 정책 센터](https://support.google.com/adsense/answer/48182)**
- **[AdSense 커뮤니티](https://support.google.com/adsense/community)**

#### 📚 승인 가이드 링크들
- **[AdSense 승인 가이드](https://support.google.com/adsense/answer/7299563)**
- **[콘텐츠 품질 가이드라인](https://support.google.com/adsense/answer/1348737)**
- **[웹사이트 요구사항](https://support.google.com/adsense/answer/1348688)**
- **[금지된 콘텐츠](https://support.google.com/adsense/answer/1282103)**

#### 🛠️ 도구 및 리소스
- **[Google PageSpeed Insights](https://pagespeed.web.dev/)**
- **[Google Search Console](https://search.google.com/search-console)**
- **[Google Analytics](https://analytics.google.com/)**
- **[모바일 친화성 테스트](https://search.google.com/test/mobile-friendly)**

### 1.5 승인 후 해야 할 일

#### 즉시 해야 할 작업
1. **광고 단위 생성**
   - 디스플레이 광고 (기사 배너용)
   - 인피드 광고 (기사 목록용)
   - 사이드바 광고 (사이드바용)

2. **광고 코드 설치**
   - 헤더에 AdSense 코드 추가
   - 광고 단위 코드 페이지에 삽입

3. **광고 위치 최적화**
   - 사용자 경험을 해치지 않는 위치
   - 콘텐츠와 자연스럽게 조화

#### 장기적 관리
1. **수익 모니터링**
   - 일일 수익 확인
   - 광고 성과 분석
   - 최적화 제안 적용

2. **정책 준수**
   - 광고 정책 업데이트 확인
   - 클릭 유도 행위 금지
   - 자체 클릭 방지

### 1.6 한국 사용자 특별 고려사항

#### 한국 관련 요구사항
1. **개인정보보호법 준수**
   - 개인정보 처리방침 필수
   - 쿠키 사용 안내
   - 사용자 동의 절차

2. **세금 정보**
   - 소득세 신고 필요 (연 수익 기준)
   - 사업자 등록 검토
   - 부가세 관련 확인

3. **결제 정보**
   - 한국 은행 계좌 등록
   - 최소 지급 금액: $100 (약 13만원)
   - 월 1회 자동 송금

#### 한국어 지원 리소스
- **[AdSense 한국어 도움말](https://support.google.com/adsense/?hl=ko)**
- **[한국 세금 정보](https://support.google.com/adsense/answer/1714364?hl=ko)**
- **[한국 결제 가이드](https://support.google.com/adsense/answer/1714397?hl=ko)**

## 2. 애드센스 설정 파일 수정

### 2.1 클라이언트 ID 설정
`src/config/adsenseConfig.js` 파일에서 다음 값들을 수정하세요:

```javascript
export const adsenseConfig = {
  // 구글 애드센스에서 발급받은 실제 클라이언트 ID로 교체
  CLIENT_ID: 'ca-pub-YOUR_ACTUAL_CLIENT_ID',
  
  // 광고 슬롯 ID들도 실제 값으로 교체
  adSlots: {
    articleBanner: {
      slot: 'YOUR_ACTUAL_SLOT_ID_1',
      format: 'horizontal',
      responsive: true,
    },
    sidebar: {
      slot: 'YOUR_ACTUAL_SLOT_ID_2', 
      format: 'vertical',
      responsive: true,
    },
    searchResults: {
      slot: 'YOUR_ACTUAL_SLOT_ID_3',
      format: 'auto',
      responsive: true,
    }
  }
};
```

### 2.2 HTML 파일 수정
`index.html` 파일에서 클라이언트 ID를 실제 값으로 교체:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ACTUAL_CLIENT_ID"
 crossorigin="anonymous"></script>
```

## 3. 광고 슬롯 생성

### 3.1 애드센스 대시보드에서 광고 단위 생성
1. 애드센스 대시보드 → 광고 → 광고 단위별
2. "광고 단위 만들기" 클릭
3. 광고 유형 선택:
   - **디스플레이 광고**: 기사 사이 배너용
   - **인피드 광고**: 기사 목록 사이 삽입용
   - **기사 내 광고**: 기사 내용 중간 삽입용

### 3.2 광고 슬롯 설정
각 광고 위치별로 다음과 같이 설정:

#### 기사 배너 광고 (articleBanner)
- 광고 크기: 반응형
- 광고 형식: 디스플레이 광고
- 위치: 기사 목록 사이

#### 사이드바 광고 (sidebar)
- 광고 크기: 300x250 또는 160x600
- 광고 형식: 디스플레이 광고
- 위치: 사이드바 영역

#### 검색 결과 광고 (searchResults)
- 광고 크기: 반응형
- 광고 형식: 인피드 광고
- 위치: 검색 결과 중간

## 4. 개발 환경 설정

### 4.1 개발 모드에서 광고 비활성화
`src/config/adsenseConfig.js`에서 개발 환경 설정:

```javascript
development: {
  enabled: false,        // 개발 모드에서 광고 비활성화
  useTestAds: true,     // 테스트 광고 사용
}
```

### 4.2 환경 변수 설정 (선택사항)
`.env` 파일에 애드센스 설정 추가:

```
VITE_ADSENSE_CLIENT_ID=ca-pub-YOUR_CLIENT_ID
VITE_ADSENSE_ENABLED=true
```

## 5. 광고 표시 정책 설정

### 5.1 사용자별 광고 표시 설정
`src/config/adsenseConfig.js`에서 표시 규칙 수정:

```javascript
displayRules: {
  // 로그인 사용자에게 광고 표시 여부
  showToLoggedInUsers: true,
  
  // 프리미엄 사용자에게 광고 표시 여부  
  showToPremiumUsers: false,
  
  // 모바일에서 광고 표시 여부
  showOnMobile: true,
}
```

### 5.2 광고 빈도 설정
`src/config/membershipConfig.js`에서 광고 빈도 조정:

```javascript
export const membershipConfig = {
  ads: {
    enabled: true,
    frequency: 3, // N개 기사마다 광고 표시
  }
};
```

## 6. 광고 컴포넌트 사용법

### 6.1 기본 AdCard 사용
```jsx
import AdCard from '../components/AdCard';

// 기본 사용법
<AdCard />

// 커스텀 설정
<AdCard 
  adSlot="articleBanner"
  minHeight="200px"
  showLabel={true}
/>
```

### 6.2 전용 광고 컴포넌트 사용
```jsx
import { 
  SidebarAdComponent,
  SearchResultAdComponent,
  ArticleDetailAdComponent,
  InlineAdComponent,
  MobileAdComponent,
  TopBannerAdComponent
} from '../components/AdComponents';

// 사이드바 광고
<SidebarAdComponent />

// 검색 결과 광고
<SearchResultAdComponent />

// 기사 상세 페이지 광고
<ArticleDetailAdComponent />
```

### 6.3 조건부 광고 표시
```jsx
import { AdWrapper } from '../components/AdComponents';

<AdWrapper position="articleBanner">
  <div>광고가 표시될 수 있는 콘텐츠</div>
</AdWrapper>
```

## 7. 성능 최적화

### 7.1 지연 로딩 설정
광고 스크립트가 페이지 로드 시 지연 로딩되도록 설정:

```javascript
// 스크립트 지연 로딩
const loadAdsenseScript = () => {
  return new Promise((resolve, reject) => {
    if (window.adsbygoogle) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    script.onload = resolve;
    script.onerror = reject;
    
    document.head.appendChild(script);
  });
};
```

### 7.2 광고 로딩 상태 표시
사용자 경험을 위해 광고 로딩 상태를 표시:

```jsx
{isLoading && (
  <LoadingContainer>
    <CircularProgress size={24} />
    <Typography>광고 로딩 중...</Typography>
  </LoadingContainer>
)}
```

## 8. 문제 해결

### 8.1 광고가 표시되지 않는 경우
1. 클라이언트 ID가 올바른지 확인
2. 광고 슬롯 ID가 올바른지 확인
3. 애드센스 계정 승인 상태 확인
4. 브라우저 광고 차단기 비활성화
5. 개발자 도구에서 에러 메시지 확인

### 8.2 개발 환경에서 테스트
```javascript
// 개발 환경에서 테스트 광고 사용
development: {
  enabled: true,
  useTestAds: true,
}
```

### 8.3 일반적인 오류 해결
- **AdSense 스크립트 로드 실패**: 네트워크 연결 확인
- **광고 슬롯 없음**: 애드센스 대시보드에서 광고 단위 생성
- **정책 위반**: 애드센스 정책 준수 확인

## 9. 모니터링 및 분석

### 9.1 애드센스 대시보드 활용
- 수익 추적
- 광고 성과 분석
- 최적화 제안 확인

### 9.2 A/B 테스트
다양한 광고 위치와 크기로 테스트:

```javascript
// 광고 설정을 동적으로 변경
const experimentalAdConfig = {
  articleBanner: {
    slot: 'experimental-slot-id',
    format: 'auto',
    responsive: true,
  }
};
```

## 10. 법적 고려사항

### 10.1 개인정보 보호
- 쿠키 동의 배너 설치
- 개인정보 처리방침 업데이트
- GDPR 준수 (EU 사용자 대상)

### 10.2 광고 표시 정책
- 광고임을 명시 (AdCard에 '광고' 라벨 표시)
- 콘텐츠와 광고 구분
- 애드센스 정책 준수

---

## 참고 자료

- [Google AdSense 도움말](https://support.google.com/adsense)
- [애드센스 정책 센터](https://support.google.com/adsense/answer/48182)
- [애드센스 최적화 가이드](https://support.google.com/adsense/answer/9274516)

이 가이드를 따라 설정하면 구글 애드센스를 성공적으로 통합할 수 있습니다. 추가 질문이 있으시면 언제든지 문의해주세요! 