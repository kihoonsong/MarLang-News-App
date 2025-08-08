# 모바일/아이패드 광고 문제 진단 가이드

## 🚨 현재 상황
- **데스크탑**: 광고 정상 작동 ✅
- **모바일**: 광고 로드 실패 ❌
- **아이패드**: 광고 로드 실패 ❌

## 🔍 진단 단계

### 1단계: 테스트 광고 컴포넌트 확인
개발 환경에서 기사 상세 페이지에 빨간 테두리의 "🧪 테스트 광고" 컴포넌트가 추가되었습니다.

**확인 방법:**
1. 모바일/아이패드에서 기사 상세 페이지 접속
2. 개발자 도구 > Console 탭 열기
3. 다음 로그들을 확인:

```
🧪 테스트 광고 시작: {
  adUnitId: "DAN-RNzVkjnBfLSGDxqM",
  userAgent: "...",
  domain: "marlang-app.web.app",
  protocol: "https:",
  scriptExists: true/false
}

🧪 광고 영역 생성: { ... }
🧪 광고 상태 체크: { ... }
🧪 최종 광고 상태: { ... }
```

### 2단계: 가능한 원인별 체크리스트

#### A. 카카오 애드핏 계정 문제
- [ ] **광고 단위 승인 상태**: `DAN-RNzVkjnBfLSGDxqM` 승인됨?
- [ ] **도메인 등록**: `marlang-app.web.app` 등록됨?
- [ ] **계정 상태**: 정상 활성화됨?
- [ ] **모바일 타겟팅**: 광고 단위가 모바일 디바이스 허용?

#### B. 기술적 문제
- [ ] **스크립트 로딩**: `kas/static/ba.min.js` 로드됨?
- [ ] **HTTPS 프로토콜**: 사이트가 HTTPS로 접속됨?
- [ ] **광고 차단기**: 모바일 브라우저에 광고 차단기 설치됨?
- [ ] **네트워크 연결**: 카카오 서버 접근 가능?

#### C. 디바이스별 문제
- [ ] **iOS Safari**: 특별한 제약사항 있음?
- [ ] **Android Chrome**: 정상 작동?
- [ ] **모바일 앱 브라우저**: 카카오톡, 네이버 앱 등에서 접근?

### 3단계: 네트워크 요청 확인

**모바일에서 개발자 도구 > Network 탭 확인:**
1. `kas/static/ba.min.js` 요청 상태
2. 광고 관련 추가 네트워크 요청
3. 에러 응답 (4xx, 5xx) 여부

### 4단계: 광고 단위 ID 테스트

**다른 광고 단위 ID로 테스트:**
```javascript
// 테스트할 광고 단위 ID들
const testAdUnits = [
  'DAN-RNzVkjnBfLSGDxqM',  // 현재 사용 중
  'DAN-kXEIw2QcPNjJJ79V',  // 카드형
  'DAN-ks07LuYMpBfOqPPa'   // React 전용
];
```

## 🎯 예상 원인 순위

### 1순위: 카카오 애드핏 계정 설정 문제
- 광고 단위가 모바일 디바이스를 타겟하지 않음
- 도메인 `marlang-app.web.app`가 등록되지 않음
- 계정 승인 대기 중

### 2순위: 모바일 브라우저 제약사항
- iOS Safari의 광고 스크립트 차단
- 모바일 광고 차단기 설치
- 앱 내 브라우저의 제약사항

### 3순위: 기술적 구현 문제
- 스크립트 로딩 타이밍 이슈
- DOM 조작 방식 문제
- HTTPS/보안 정책 문제

## 🔧 즉시 시도할 수 있는 해결책

### 1. 카카오 애드핏 관리자 페이지 확인
1. https://adfit.kakao.com 접속
2. 광고 단위 > `DAN-RNzVkjnBfLSGDxqM` 상태 확인
3. 설정 > 도메인 관리에서 `marlang-app.web.app` 등록 확인

### 2. 다른 광고 단위 ID 테스트
```javascript
// TestAdFitBanner에서 다른 ID 테스트
<TestAdFitBanner adUnitId="DAN-kXEIw2QcPNjJJ79V" />
```

### 3. 시크릿 모드에서 테스트
- 광고 차단기나 확장 프로그램 영향 제거
- 캐시 문제 해결

### 4. 다른 모바일 브라우저에서 테스트
- Chrome, Safari, Samsung Internet 등
- 카카오톡, 네이버 앱 내 브라우저

## 📞 카카오 애드핏 고객센터 문의 시 제공할 정보

```
사이트: https://marlang-app.web.app
광고 단위 ID: DAN-RNzVkjnBfLSGDxqM
문제: 데스크탑에서는 정상 작동하나 모바일/아이패드에서 광고 로드 실패
브라우저: iOS Safari, Android Chrome
도메인 등록 여부: 확인 필요
계정 상태: 확인 필요
```

---

**다음 단계**: 위 진단 결과를 바탕으로 구체적인 해결책 적용