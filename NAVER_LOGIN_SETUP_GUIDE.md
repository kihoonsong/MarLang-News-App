# 네이버 로그인 설정 가이드

## 1. 네이버 개발자 센터 설정

### 1-1. 네이버 개발자 센터 접속
1. https://developers.naver.com/main/ 접속
2. 네이버 계정으로 로그인

### 1-2. 애플리케이션 등록
1. "Application" → "애플리케이션 등록" 클릭
2. 애플리케이션 정보 입력:
   - **애플리케이션 이름**: MarLang Eng News
   - **사용 API**: 네이버 로그인
   - **환경**: PC웹
   - **서비스 URL**: https://marlang-app.web.app
   - **네이버아이디로로그인 Callback URL**: https://marlang-app.web.app/auth/naver/callback

### 1-3. 클라이언트 정보 확인
등록 완료 후 다음 정보를 확인:
- **Client ID**: 애플리케이션의 고유 식별자
- **Client Secret**: 애플리케이션의 비밀키

## 2. 환경변수 설정

### 2-1. 프론트엔드 환경변수 (.env 파일)
```env
# 네이버 로그인 설정
VITE_NAVER_CLIENT_ID=your_naver_client_id_here
```

### 2-2. Firebase Functions 환경변수
```bash
# Firebase CLI로 환경변수 설정
firebase functions:config:set naver.client_id="your_naver_client_id_here"
firebase functions:config:set naver.client_secret="your_naver_client_secret_here"
firebase functions:config:set jwt.secret="your_jwt_secret_here"

# 또는 .env 파일 사용 (functions/.env)
NAVER_CLIENT_ID=your_naver_client_id_here
NAVER_CLIENT_SECRET=your_naver_client_secret_here
JWT_SECRET=your_jwt_secret_here
```

## 3. 코드 수정사항

현재 코드는 이미 네이버 로그인을 지원하도록 구현되어 있습니다:
- ✅ AuthContext에서 네이버 로그인 처리
- ✅ NaverCallback 페이지에서 콜백 처리
- ✅ Firebase Functions에서 네이버 OAuth 처리
- ✅ AuthModal에서 네이버 로그인 버튼

## 4. 테스트 방법

1. 환경변수 설정 후 애플리케이션 재시작
2. 로그인 모달에서 "네이버 계정으로 시작하기" 버튼 클릭
3. 네이버 로그인 페이지로 리디렉션 확인
4. 로그인 후 콜백 URL로 정상 리턴 확인
5. 사용자 정보가 정상적으로 저장되는지 확인

## 5. 문제 해결

### 일반적인 오류들:
- **"OAuth credentials not configured"**: 환경변수가 설정되지 않음
- **"Redirect URI mismatch"**: 네이버 개발자 센터의 콜백 URL과 실제 URL이 다름
- **"Invalid client"**: Client ID나 Secret이 잘못됨

### 디버깅 방법:
1. 브라우저 개발자 도구 콘솔 확인
2. Firebase Functions 로그 확인: `firebase functions:log`
3. 네이버 개발자 센터에서 API 호출 통계 확인