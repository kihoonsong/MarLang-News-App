# 네이버 로그인 디버깅 가이드

## 현재 설정 상태

### 환경변수
- ✅ VITE_NAVER_CLIENT_ID: Y4ldejPFJ6JxAp95HtpR
- ✅ NAVER_CLIENT_ID: Y4ldejPFJ6JxAp95HtpR  
- ✅ NAVER_CLIENT_SECRET: dz0e72Lrva

### Firebase Functions
- ✅ naverAuth 함수 배포 완료
- ✅ 환경변수 로드 완료

### 프론트엔드
- ✅ 빌드 및 배포 완료
- ✅ NaverCallback 컴포넌트 포함됨

## 네이버 개발자 센터 설정 확인

### 필수 설정값
```
서비스 URL: https://marlang-app.web.app
콜백 URL: https://marlang-app.web.app/auth/naver/callback
```

### 테스트 URL
직접 테스트해볼 수 있는 URL:
```
https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=Y4ldejPFJ6JxAp95HtpR&redirect_uri=https://marlang-app.web.app/auth/naver/callback&state=test123
```

## 로컬 개발 환경 설정

1. 네이버 개발자 센터에서 추가 콜백 URL 등록:
   ```
   http://localhost:5173/auth/naver/callback
   ```
2. 개발 서버 실행:
   ```bash
   npm run dev
   ```

## 문제 해결 체크리스트

### 1. 네이버 개발자 센터 확인
- [ ] 애플리케이션이 승인 상태인지 확인
- [ ] 콜백 URL이 정확히 설정되었는지 확인
- [ ] Client ID와 Secret이 올바른지 확인

### 2. 환경변수 확인
- [x] .env 파일에 VITE_NAVER_CLIENT_ID 설정됨
- [x] functions/.env 파일에 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 설정됨

### 3. 배포 상태 확인
- [x] Firebase Functions 배포 완료
- [x] Firebase Hosting 배포 완료

## 일반적인 오류 및 해결방법

### "페이지를 찾을 수 없습니다"
- **원인**: 네이버 개발자 센터의 콜백 URL이 잘못됨
- **해결**: 콜백 URL을 `https://marlang-app.web.app/auth/naver/callback`로 정확히 설정

### "OAuth credentials not configured"
- **원인**: Firebase Functions의 환경변수가 설정되지 않음
- **해결**: functions/.env 파일 확인 및 재배포

### "Invalid client"
- **원인**: Client ID나 Secret이 잘못됨
- **해결**: 네이버 개발자 센터에서 정확한 값 확인

### "Redirect URI mismatch"
- **원인**: 요청한 redirect_uri와 등록된 콜백 URL이 다름
- **해결**: 네이버 개발자 센터에서 콜백 URL 재확인

## 테스트 방법

1. 브라우저에서 https://marlang-app.web.app 접속
2. 로그인 버튼 클릭
3. "네이버 계정으로 시작하기" 버튼 클릭
4. 네이버 로그인 페이지로 리디렉션 확인
5. 로그인 후 콜백 페이지 정상 작동 확인

## 디버깅 도구

### 브라우저 개발자 도구
- Network 탭에서 API 호출 확인
- Console 탭에서 JavaScript 오류 확인

### Firebase Functions 로그
```bash
firebase functions:log
```

### 네이버 개발자 센터
- API 호출 통계에서 요청 상태 확인