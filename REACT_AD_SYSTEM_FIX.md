# 리액트 페이지 광고 시스템 수정 완료

## 문제점 분석

### 1. 기존 시스템의 문제점
- **복잡한 광고 로딩 시스템**: AdLoadingManager, AdFitContext, AdFitUnit 등 여러 레이어로 구성된 복잡한 시스템
- **실제 광고 표시 로직 누락**: 상태 관리만 하고 실제 카카오 애드핏 광고 표시 코드가 없음
- **타이밍 이슈**: 스크립트 로드와 DOM 준비 상태 간의 동기화 문제
- **크롤링 페이지와 리액트 페이지 광고 단위 혼용**: 같은 광고 단위 ID 사용으로 인한 충돌

### 2. 근본적 원인
- 카카오 애드핏의 기본 구조(`<ins class="kakao_ad_area">`)를 제대로 구현하지 않음
- 스크립트 로드 후 광고 영역 초기화 과정이 누락됨
- 복잡한 상태 관리로 인한 디버깅 어려움

## 해결 방안

### 1. 간단하고 직접적인 광고 컴포넌트 생성
- `SimpleAdFitBanner` 컴포넌트 생성
- 카카오 애드핏의 기본 구조를 정확히 따름
- 최소한의 상태 관리로 안정성 확보

### 2. 리액트 페이지 전용 광고 단위 ID 사용
- 크롤링 페이지: `DAN-RNzVkjnBfLSGDxqM`
- 리액트 페이지: `DAN-ks07LuYMpBfOqPPa`
- 환경 변수: `VITE_ADFIT_REACT_BANNER_MOBILE`

### 3. 단계별 광고 로딩 프로세스
1. 카카오 애드핏 스크립트 로드 확인/로드
2. DOM 준비 상태 확인
3. `<ins class="kakao_ad_area">` 요소 생성
4. 광고 속성 설정 (`data-ad-unit`, `data-ad-width`, `data-ad-height`)
5. 광고 영역 표시

## 적용된 변경사항

### 1. 새로운 컴포넌트
- `src/components/ads/SimpleAdFitBanner.jsx`: 간단하고 안정적인 광고 컴포넌트

### 2. 수정된 파일들
- `src/pages/ArticleDetail.jsx`: SimpleAdFitBanner 사용
- `src/components/ads/AdCard.jsx`: SimpleAdFitBanner 사용
- `src/utils/AdLoadingManager.js`: 실제 광고 로딩 로직 구현

### 3. 환경 변수 활용
```env
# 리액트 페이지 전용 광고 단위 ID
VITE_ADFIT_REACT_BANNER_MOBILE=DAN-ks07LuYMpBfOqPPa
```

## SimpleAdFitBanner 컴포넌트 특징

### 1. 간단한 구조
```jsx
<SimpleAdFitBanner 
  adUnitId="DAN-ks07LuYMpBfOqPPa"
  width={320}
  height={100}
  debug={true}
/>
```

### 2. 자동 스크립트 관리
- 스크립트 중복 로드 방지
- 로드 상태 추적
- 에러 처리

### 3. 표준 카카오 애드핏 구조
```html
<ins class="kakao_ad_area" 
     data-ad-unit="DAN-ks07LuYMpBfOqPPa"
     data-ad-width="320" 
     data-ad-height="100">
</ins>
```

### 4. 상태별 UI 제공
- 로딩 상태: 스피너와 "광고 로딩 중..." 메시지
- 에러 상태: "광고를 불러올 수 없습니다" 메시지
- 성공 상태: 실제 광고 표시

## 디버깅 기능

### 1. 개발 환경 로깅
```javascript
debug={import.meta.env.DEV}
```

### 2. 상세 로그 출력
- 스크립트 로드 상태
- 광고 초기화 과정
- 에러 발생 시 상세 정보

## 테스트 방법

### 1. 개발 환경에서 확인
1. `npm run dev` 실행
2. 기사 상세 페이지 접속
3. 개발자 도구 콘솔에서 광고 로딩 로그 확인
4. 광고 영역에 실제 광고 표시 확인

### 2. 프로덕션 환경에서 확인
1. `npm run build && npm run preview` 실행
2. 실제 광고 표시 여부 확인
3. 네트워크 탭에서 카카오 애드핏 요청 확인

## 성능 최적화

### 1. 스크립트 중복 로드 방지
- 이미 로드된 스크립트 재사용
- 메모리 효율성 개선

### 2. 지연 로딩 지원
- 필요시 지연 로딩 구현 가능
- 페이지 로딩 성능 개선

### 3. 에러 복구
- 스크립트 로드 실패 시 재시도
- 사용자 경험 개선

## 향후 개선 사항

### 1. A/B 테스트 지원
- 다양한 광고 단위 ID 테스트
- 성과 측정 및 최적화

### 2. 광고 차단기 대응
- 광고 차단기 감지
- 대체 콘텐츠 표시

### 3. 반응형 광고 크기
- 화면 크기에 따른 광고 크기 조정
- 모바일/데스크톱 최적화

이제 리액트 페이지에서 광고가 정상적으로 표시될 것입니다!