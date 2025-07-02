# 🔧 API 키 도메인 차단 문제 해결 가이드

## ❌ 현재 에러 상황
```
Requests from referer https://marlang-app.firebaseapp.com/ are blocked.
API_KEY_HTTP_REFERRER_BLOCKED
```

## 🎯 해결 방법

### 1. Google Cloud Console - API 키 설정 수정
**URL:** https://console.cloud.google.com/apis/credentials?project=marlang-app

**단계별 해결:**

1. **API 키 찾기**
   - API 키: `AIzaSyAClE82R67DQsOTT_U_Yvi5YDRc2R_8WWQ`
   - 해당 API 키 클릭

2. **애플리케이션 제한사항 설정**
   - "애플리케이션 제한사항" 섹션에서
   - "HTTP 리퍼러(웹사이트)" 선택

3. **웹사이트 제한사항에 도메인 추가**
   다음 도메인들을 모두 추가:
   ```
   https://marlang-app.web.app/*
   https://marlang-app.firebaseapp.com/*
   https://*.firebaseapp.com/*
   http://localhost:3000/*
   http://localhost:3001/*
   http://localhost:5173/*
   ```

4. **API 제한사항 설정**
   - "API 제한사항" 섹션에서
   - "키 제한" 선택
   - 다음 API들을 선택:
     - Identity Toolkit API
     - Firebase Authentication API
     - Cloud Firestore API
     - Firebase Management API

5. **저장** 버튼 클릭

### 2. Firebase Console - 승인된 도메인 확인
**URL:** https://console.firebase.google.com/project/marlang-app/authentication/settings

**확인할 도메인들:**
- `marlang-app.web.app`
- `marlang-app.firebaseapp.com`
- `localhost` (개발용)

### 3. OAuth 2.0 클라이언트 ID 설정
**URL:** https://console.cloud.google.com/apis/credentials?project=marlang-app

**OAuth 클라이언트 설정:**
1. OAuth 2.0 클라이언트 ID 클릭
2. "승인된 JavaScript 원본"에 추가:
   ```
   https://marlang-app.web.app
   https://marlang-app.firebaseapp.com
   http://localhost:3000
   http://localhost:3001
   ```
3. "승인된 리디렉션 URI"에 추가:
   ```
   https://marlang-app.web.app/__/auth/handler
   https://marlang-app.firebaseapp.com/__/auth/handler
   ```

## ⚡ 즉시 해결 (임시 방법)

만약 위 설정이 바로 적용되지 않으면:

1. **API 키 제한 해제 (임시)**
   - Google Cloud Console > API 키 설정
   - "애플리케이션 제한사항"을 "없음"으로 설정
   - **주의: 보안상 임시로만 사용하고 나중에 다시 설정해야 함**

2. **새 API 키 생성**
   - Google Cloud Console에서 새 API 키 생성
   - 올바른 도메인 제한사항 설정
   - `.env` 파일의 `VITE_FIREBASE_API_KEY` 업데이트

## 🔍 설정 확인 방법

1. **브라우저 개발자 도구**
   - Console 탭에서 에러 메시지 확인
   - Network 탭에서 API 호출 상태 확인

2. **테스트 순서**
   - 관리자 로그인 테스트 (먼저)
   - Google 로그인 테스트 (설정 완료 후)

## 📝 설정 체크리스트

- [ ] Google Cloud Console API 키 HTTP 리퍼러 설정
- [ ] Firebase Console 승인된 도메인 설정  
- [ ] OAuth 2.0 클라이언트 ID 도메인 설정
- [ ] Firebase Authentication Google 공급자 활성화
- [ ] 설정 변경 후 5-10분 대기 (전파 시간)
- [ ] 브라우저 캐시 클리어 후 테스트

## ⏰ 예상 해결 시간
- 설정 변경: 5분
- 변경사항 전파: 5-10분
- 총 소요시간: 10-15분