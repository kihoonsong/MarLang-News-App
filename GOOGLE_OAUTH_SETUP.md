# Google OAuth 설정 가이드

현재 Google 로그인은 시뮬레이션 모드로 작동하고 있습니다. 실제 Google OAuth를 사용하려면 다음 단계를 따라주세요.

## 1. Google Cloud Console 설정

### 1단계: Google Cloud Console 접속
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택

### 2단계: Google+ API 활성화
1. "API 및 서비스" > "라이브러리" 이동
2. "Google+ API" 검색 후 활성화
3. "People API"도 활성화

### 3단계: OAuth 동의 화면 설정
1. "API 및 서비스" > "OAuth 동의 화면" 이동
2. 사용자 유형: "외부" 선택
3. 앱 정보 입력:
   - 앱 이름: "MarLang News"
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처 정보: 본인 이메일
4. 범위 추가: `email`, `profile`, `openid`
5. 테스트 사용자 추가 (본인 Gmail 계정)

### 4단계: OAuth 클라이언트 ID 생성
1. "API 및 서비스" > "사용자 인증 정보" 이동
2. "+ 사용자 인증 정보 만들기" > "OAuth 클라이언트 ID"
3. 애플리케이션 유형: "웹 애플리케이션"
4. 이름: "MarLang News Web Client"
5. 승인된 자바스크립트 원본:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
6. 승인된 리디렉션 URI:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`

## 2. 환경변수 설정

### .env 파일 수정
```bash
VITE_GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_HERE
```

생성된 클라이언트 ID를 위 파일의 `YOUR_ACTUAL_CLIENT_ID_HERE` 부분에 입력하세요.

## 3. 코드 수정

### AuthContext.jsx 수정
`src/contexts/AuthContext.jsx` 파일에서 시뮬레이션 모드를 실제 OAuth로 변경:

```javascript
// 현재 (시뮬레이션 모드)
const signInWithGoogle = () => {
  // 시뮬레이션 코드...
};

// 실제 OAuth로 변경
const signInWithGoogle = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = 'http://localhost:5173';
  const scope = 'openid email profile';
  
  const authUrl = `https://accounts.google.com/oauth/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=token&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=google_login`;
    
  window.location.href = authUrl;
};
```

## 4. 테스트

1. 개발 서버 재시작: `npm run dev`
2. http://localhost:5173 접속
3. "Google로 로그인" 버튼 클릭
4. Google 계정으로 로그인 테스트

## 현재 상태

- ✅ 시뮬레이션 모드 작동 중
- ⏳ 실제 OAuth 설정 필요
- 📝 위 가이드를 따라 설정하면 실제 Google 로그인 사용 가능

## 문제 해결

### 일반적인 오류들

1. **404 Error**: 클라이언트 ID가 잘못되었거나 존재하지 않음
2. **redirect_uri_mismatch**: 리다이렉트 URI가 Google Cloud Console 설정과 일치하지 않음
3. **access_denied**: OAuth 동의 화면에서 거부했거나 권한 부족

### 디버깅 팁

브라우저 콘솔에서 다음 로그들을 확인하세요:
- `🚀 Google OAuth 로그인 시작`
- `🔑 사용할 클라이언트 ID`
- `🔗 리다이렉트 URI`
- `🔗 생성된 OAuth URL`