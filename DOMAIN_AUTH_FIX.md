# 🚨 Firebase 도메인 승인 오류 해결

## ❌ 현재 에러
```
Unable to verify that the app domain is authorized
handler.js:220
```

## 🎯 즉시 해결 방법

### 1. Firebase Console - 승인된 도메인 설정
**URL:** https://console.firebase.google.com/project/marlang-app/authentication/settings

**단계:**
1. 페이지 하단 "승인된 도메인" 섹션으로 스크롤
2. "도메인 추가" 버튼 클릭
3. 다음 도메인들을 하나씩 추가:
   - `marlang-app.web.app`
   - `marlang-app.firebaseapp.com`
4. 각각 추가 후 "완료" 클릭

### 2. Firebase Console - Google 로그인 활성화
**URL:** https://console.firebase.google.com/project/marlang-app/authentication/providers

**단계:**
1. "Sign-in method" 탭 클릭
2. "Google" 공급자 찾기
3. "Google" 클릭
4. "사용 설정" 토글을 **ON**으로 변경
5. "프로젝트 지원 이메일" 선택 (본인 Gmail)
6. "저장" 클릭

### 3. Google Cloud Console - OAuth 설정
**URL:** https://console.cloud.google.com/apis/credentials?project=marlang-app

**OAuth 2.0 클라이언트 ID 설정:**
1. 클라이언트 ID 클릭: `210532533142-k4bk58r4raivgs0quk9o9o46952bq0vp.apps.googleusercontent.com`
2. "승인된 JavaScript 원본" 섹션에 추가:
   ```
   https://marlang-app.web.app
   https://marlang-app.firebaseapp.com
   ```
3. "승인된 리디렉션 URI" 섹션에 추가:
   ```
   https://marlang-app.web.app/__/auth/handler
   https://marlang-app.firebaseapp.com/__/auth/handler
   ```
4. "저장" 클릭

### 4. API 키 제한 설정
**URL:** https://console.cloud.google.com/apis/credentials?project=marlang-app

**API 키 설정 (`AIzaSyAClE82R67DQsOTT_U_Yvi5YDRc2R_8WWQ`):**
1. API 키 클릭
2. "애플리케이션 제한사항" → "HTTP 리퍼러(웹사이트)" 선택
3. "웹사이트 제한사항"에 추가:
   ```
   https://marlang-app.web.app/*
   https://marlang-app.firebaseapp.com/*
   http://localhost:*
   ```
4. "저장" 클릭

## ⚡ 설정 완료 체크리스트

- [ ] Firebase Console: 승인된 도메인 2개 추가
- [ ] Firebase Console: Google 로그인 공급자 활성화
- [ ] Google Cloud: OAuth 클라이언트 도메인 추가
- [ ] Google Cloud: API 키 HTTP 리퍼러 설정
- [ ] 5-10분 대기 (설정 전파)
- [ ] 브라우저 새로고침으로 테스트

## 🔍 설정 확인 방법

1. **Firebase Console 확인:**
   - Authentication > Settings에서 도메인 목록 확인
   - Authentication > Sign-in method에서 Google 상태 확인

2. **테스트:**
   - 관리자 로그인: `admin@marlang.com` / `admin123`
   - Google 로그인 버튼 클릭

## ⏱️ 예상 해결 시간
- 설정 작업: 10분
- 설정 전파: 5-10분
- **총 소요시간: 15-20분**

설정 완료 후 Google 로그인이 정상 작동할 것입니다!