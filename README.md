# NewStep Eng News

최신 영어 뉴스를 통해 영어를 배우고, AI 기반 번역과 단어장 기능으로 영어 실력을 향상시키는 웹 애플리케이션입니다.

## 🚀 주요 기능

- **실시간 영어 뉴스**: 다양한 카테고리의 최신 영어 뉴스 제공
- **AI 번역**: Gemini API를 활용한 고품질 번역 기능
- **단어장**: 모르는 단어를 저장하고 학습할 수 있는 개인화된 단어장
- **음성 읽기**: 텍스트를 음성으로 들을 수 있는 TTS 기능
- **카테고리 관리**: 사용자 맞춤형 뉴스 카테고리 설정
- **구글 애드센스 통합**: 수익화를 위한 광고 표시 기능
- **Firebase 인증**: 안전한 사용자 인증 시스템

## 📋 요구사항

- Node.js 18.0 이상
- npm 또는 yarn
- Firebase 프로젝트 설정
- Google Gemini API 키
- Google AdSense 계정 (선택사항)

## 🛠️ 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd NewStep-Gemini-CLI
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 추가하세요:
```bash
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_NEWS_API_KEY=your-news-api-key
```

### 4. 개발 서버 실행
```bash
npm run dev
```

## 📱 구글 애드센스 설정

### 자동 설정 (권장)
```bash
npm run setup-adsense
```

이 스크립트는 대화형으로 애드센스 설정을 도와줍니다:
- 클라이언트 ID 설정
- 광고 슬롯 ID 설정  
- 광고 표시 정책 설정
- **소유권 확인 방법 선택** (코드 스니펫/메타 태그/둘 다)
- ads.txt 파일 자동 생성
- 개발 환경 설정

### 수동 설정
자세한 수동 설정 방법은 [GOOGLE_ADSENSE_SETUP_GUIDE.md](./GOOGLE_ADSENSE_SETUP_GUIDE.md)를 참고하세요.

## 🎯 광고 컴포넌트 사용법

### 기본 광고 컴포넌트
```jsx
import AdCard from '../components/AdCard';

<AdCard 
  adSlot="articleBanner"
  minHeight="200px"
  showLabel={true}
/>
```

### 전용 광고 컴포넌트
```jsx
import { 
  SidebarAdComponent,
  SearchResultAdComponent,
  ArticleDetailAdComponent
} from '../components/AdComponents';

// 사이드바 광고
<SidebarAdComponent />

// 검색 결과 광고
<SearchResultAdComponent />

// 기사 상세 페이지 광고
<ArticleDetailAdComponent />
```

## 🔧 스크립트 명령어

- `npm run dev`: 개발 서버 실행
- `npm run build`: 프로덕션 빌드
- `npm run preview`: 빌드 결과 미리보기
- `npm run lint`: ESLint 실행
- `npm run test`: 테스트 실행
- `npm run setup-adsense`: 애드센스 설정 도우미

## 📁 프로젝트 구조

```
NewStep-Gemini-CLI/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── AdCard.jsx      # 기본 광고 컴포넌트
│   │   ├── AdComponents.jsx # 전용 광고 컴포넌트들
│   │   └── ...
│   ├── config/             # 설정 파일
│   │   ├── adsenseConfig.js # 애드센스 설정
│   │   ├── firebase.js     # Firebase 설정
│   │   └── membershipConfig.js # 멤버십 설정
│   ├── hooks/              # React Hooks
│   │   ├── useAdInjector.js # 광고 삽입 훅
│   │   └── ...
│   ├── pages/              # 페이지 컴포넌트
│   └── utils/              # 유틸리티 함수
├── scripts/
│   └── setup-adsense.js    # 애드센스 설정 스크립트
├── public/                 # 정적 파일
├── functions/              # Firebase Functions
└── tests/                  # 테스트 파일
```

## 🎨 주요 기능 상세

### 광고 시스템
- **자동 광고 삽입**: 기사 목록 사이에 자동으로 광고 삽입
- **반응형 광고**: 모바일과 데스크톱에 최적화된 광고 표시
- **사용자별 광고 정책**: 로그인/프리미엄 사용자별 광고 표시 제어
- **성능 최적화**: 지연 로딩으로 페이지 성능 향상

### 뉴스 시스템
- **실시간 뉴스**: NewsAPI를 통한 실시간 뉴스 데이터
- **카테고리별 분류**: 기술, 과학, 비즈니스 등 다양한 카테고리
- **검색 기능**: 키워드 기반 뉴스 검색
- **즐겨찾기**: 관심 있는 기사 저장 기능

### 학습 도구
- **AI 번역**: Gemini API를 활용한 정확한 번역
- **단어장**: 모르는 단어 자동 저장 및 학습
- **음성 읽기**: 브라우저 TTS API를 활용한 음성 지원
- **발음 도우미**: 단어 발음 가이드 제공

## 🔐 보안 및 인증

- **Firebase Authentication**: 구글 OAuth 2.0 인증
- **보안 규칙**: Firestore 보안 규칙 적용
- **환경 변수**: 민감한 정보 환경 변수 관리
- **CORS 설정**: 안전한 API 통신 설정

## 🌍 배포

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Vercel
```bash
npm run build
vercel --prod
```

## 📊 모니터링

### 애드센스 수익
- 애드센스 대시보드에서 수익 확인
- 광고 성과 분석
- 최적화 제안 활용

### 사용자 분석
- Firebase Analytics 통합
- 사용자 행동 분석
- 콘텐츠 성과 추적

## 🤝 기여하기

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다.

## 🙋‍♂️ 지원 및 문의

문제가 발생했거나 질문이 있으시면 다음 문서들을 참고하세요:

- [애드센스 설정 가이드](./GOOGLE_ADSENSE_SETUP_GUIDE.md)
- [Firebase 설정 가이드](./firebase-auth-setup.md)
- [구글 OAuth 설정 가이드](./GOOGLE_OAUTH_SETUP.md)
- [로그인 문제 해결](./LOGIN_FIX_GUIDE.md)
- [API 키 설정 가이드](./API_KEY_FIX_GUIDE.md)

---

**NewStep Eng News**로 영어 실력을 향상시키고 최신 뉴스를 만나보세요! 🚀 