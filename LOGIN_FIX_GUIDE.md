# 🔧 로그인 기능 수정 가이드

## ❌ 현재 문제 상황
로그인 버튼을 클릭해도 Google 로그인이 작동하지 않음

## 🎯 해결해야 할 설정들

### 1. Firebase Console - Authentication 설정
**URL:** https://console.firebase.google.com/project/marlang-app/authentication/providers

**필요한 작업:**
1. "Sign-in method" 탭 클릭
2. "Google" 공급자 클릭
3. "사용 설정" 토글을 ON으로 변경
4. 프로젝트 지원 이메일 설정
5. "저장" 클릭

### 2. Google Cloud Console - OAuth 설정  
**URL:** https://console.cloud.google.com/apis/credentials?project=marlang-app

**필요한 작업:**
1. OAuth 2.0 클라이언트 ID 선택 (현재 ID: `210532533142-k4bk58r4raivgs0quk9o9o46952bq0vp.apps.googleusercontent.com`)
2. "승인된 JavaScript 원본"에 추가:
   - `https://marlang-app.web.app`
   - `https://marlang-app.firebaseapp.com`
   - `http://localhost:3000` (개발용)
   - `http://localhost:3001` (개발용)
3. "승인된 리디렉션 URI"에 추가:
   - `https://marlang-app.web.app/__/auth/handler`
   - `https://marlang-app.firebaseapp.com/__/auth/handler`
4. "저장" 클릭

### 3. Firebase Console - 승인된 도메인 설정
**URL:** https://console.firebase.google.com/project/marlang-app/authentication/settings

**필요한 작업:**
1. "승인된 도메인" 섹션에서 다음 도메인들이 있는지 확인:
   - `marlang-app.web.app`
   - `marlang-app.firebaseapp.com`
   - `localhost` (개발용)
2. 없으면 "도메인 추가" 버튼으로 추가

## 🧪 테스트 방법

### 관리자 로그인 테스트 (우선)
1. 사이트 접속: https://marlang-app.web.app/
2. 로그인 버튼 클릭
3. "관리자 로그인" 아코디언 펼치기
4. 다음 정보로 로그인:
   - 이메일: `admin@marlang.com`
   - 비밀번호: `admin123`

### Google 로그인 테스트 (이후)
1. 위 설정 완료 후
2. "Google 계정으로 시작하기" 버튼 클릭
3. Google 로그인 창이 나타나는지 확인

## 🔍 문제 진단 방법

### 브라우저 콘솔 확인
1. F12 눌러서 개발자 도구 열기
2. Console 탭에서 에러 메시지 확인
3. Network 탭에서 Firebase API 호출 상태 확인

### 예상 에러 메시지들
- `auth/operation-not-allowed`: Google 로그인이 Firebase에서 비활성화됨
- `auth/unauthorized-domain`: 도메인이 승인되지 않음
- `auth/popup-blocked`: 팝업이 차단됨 (signInWithRedirect 사용으로 해결됨)

## ⚡ 긴급 해결 방법

위 설정이 완료될 때까지 **관리자 로그인**을 사용하여 대시보드에 접근할 수 있습니다:
- 이메일: `admin@marlang.com`
- 비밀번호: `admin123`

이 계정으로 로그인하면 모든 관리자 기능에 접근할 수 있습니다.