# Design Document

## Overview

기사 페이지 배너 광고의 안정적인 로딩과 렌더링을 위한 강화된 시스템을 설계한다. 현재의 간헐적 광고 노출 문제를 해결하기 위해 재시도 메커니즘, 에러 핸들링, 그리고 폴백 시스템을 구현한다.

## Architecture

### Current Issues Analysis
1. **스크립트 로딩 타이밍**: 카카오 애드핏 스크립트가 DOM 준비 전에 로드되어 실패
2. **단일 시도**: 광고 로딩 실패 시 재시도 메커니즘 없음
3. **에러 핸들링 부족**: 실패 원인 파악이 어려움
4. **상태 관리 미흡**: 광고 로딩 상태를 정확히 추적하지 못함

### Proposed Solution Architecture
```
ArticleBottomBanner (Enhanced)
├── AdLoadingManager
│   ├── ScriptLoader (with retry)
│   ├── AdRenderer (with validation)
│   └── ErrorHandler (with logging)
├── LoadingStateManager
│   ├── Loading indicator
│   ├── Success state
│   └── Error/Fallback state
└── AdFallbackSystem
    ├── Retry mechanism
    └── Placeholder display
```

## Components and Interfaces

### 1. Enhanced ArticleBottomBanner Component

**Props:**
- `articleId`: string (기사 ID)
- `adUnitId`: string (광고 단위 ID, 기본값: DAN-RNzVkjnBfLSGDxqM)
- `maxRetries`: number (최대 재시도 횟수, 기본값: 3)
- `loadTimeout`: number (로딩 타임아웃, 기본값: 10000ms)

**State:**
- `loadingState`: 'loading' | 'success' | 'error' | 'fallback'
- `retryCount`: number
- `errorMessage`: string | null

### 2. AdLoadingManager Class

```javascript
class AdLoadingManager {
  constructor(options) {
    this.adUnitId = options.adUnitId;
    this.maxRetries = options.maxRetries;
    this.loadTimeout = options.loadTimeout;
    this.retryCount = 0;
  }

  async loadAd(container) {
    // 스크립트 로드 → DOM 준비 확인 → 광고 렌더링
  }

  async retryLoad(container) {
    // 재시도 로직 with exponential backoff
  }

  validateAdRender(container) {
    // 광고가 실제로 렌더링되었는지 확인
  }
}
```

### 3. ScriptLoader Utility

```javascript
class ScriptLoader {
  static async loadKakaoAdFit() {
    // 스크립트 중복 로드 방지
    // 로드 상태 추적
    // 에러 핸들링
  }

  static isScriptLoaded() {
    // 스크립트 로드 상태 확인
  }
}
```

## Data Models

### AdLoadingState
```javascript
{
  state: 'loading' | 'success' | 'error' | 'fallback',
  retryCount: number,
  errorMessage: string | null,
  loadStartTime: number,
  loadEndTime: number | null
}
```

### AdConfiguration
```javascript
{
  adUnitId: string,
  width: number,
  height: number,
  maxRetries: number,
  loadTimeout: number,
  retryDelay: number
}
```

## Error Handling

### Error Types
1. **ScriptLoadError**: 카카오 애드핏 스크립트 로드 실패
2. **AdRenderError**: 광고 렌더링 실패
3. **TimeoutError**: 로딩 타임아웃
4. **NetworkError**: 네트워크 연결 문제

### Error Recovery Strategy
1. **Immediate Retry**: 네트워크 오류 시 즉시 재시도
2. **Delayed Retry**: 스크립트 오류 시 지연 후 재시도 (exponential backoff)
3. **Fallback Display**: 모든 재시도 실패 시 대체 콘텐츠 표시

### Logging Strategy
```javascript
const AdLogger = {
  logLoadStart: (adUnitId) => {},
  logLoadSuccess: (adUnitId, loadTime) => {},
  logLoadError: (adUnitId, error, retryCount) => {},
  logFallback: (adUnitId, finalError) => {}
};
```

## Testing Strategy

### Unit Tests
- AdLoadingManager 클래스 테스트
- ScriptLoader 유틸리티 테스트
- 에러 핸들링 로직 테스트

### Integration Tests
- 전체 광고 로딩 플로우 테스트
- 재시도 메커니즘 테스트
- 다양한 에러 시나리오 테스트

### Manual Testing Scenarios
1. **정상 로딩**: 광고가 정상적으로 표시되는지 확인
2. **네트워크 지연**: 느린 네트워크에서 재시도 동작 확인
3. **스크립트 차단**: 광고 차단기 환경에서 폴백 동작 확인
4. **페이지 이동**: 빠른 페이지 이동 시 메모리 누수 없는지 확인

## Performance Considerations

### Loading Optimization
- 스크립트 중복 로드 방지
- DOM 준비 상태 확인 후 광고 초기화
- 불필요한 재렌더링 방지

### Memory Management
- 컴포넌트 언마운트 시 타이머 정리
- 이벤트 리스너 정리
- 참조 해제

### User Experience
- 로딩 인디케이터로 사용자 피드백 제공
- 레이아웃 시프트 방지
- 광고 로딩 실패 시에도 콘텐츠 접근성 유지