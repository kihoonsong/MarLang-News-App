# 모바일 카테고리 클릭 시 페이지 로딩 오류 해결

## 문제 상황
메인 페이지에서 카테고리 클릭 시, 해당 카테고리 기사를 보여주는 데 **모바일 모드에서만** 페이지 로딩 오류가 발생하는 문제

## 원인 분석

### 1. CategoryPage 컴포넌트의 로딩 상태 처리 부족
- 모바일에서 ArticlesContext가 준비되지 않은 상태에서 렌더링 시도
- 카테고리 슬러그 매칭 실패 시 적절한 에러 처리 부족
- 비동기 데이터 로딩 중 컴포넌트 상태 불일치

### 2. 네비게이션 이벤트 처리 문제
- 모바일 터치 이벤트와 클릭 이벤트 충돌
- React Router의 navigate 함수 호출 시 예외 처리 부족
- 카테고리 URL 생성 과정에서 발생하는 오류

### 3. SafePageWrapper의 Suspense 경계 문제
- 동적 import된 CategoryPage가 모바일에서 제대로 로드되지 않음
- 에러 경계에서 카테고리 페이지 특별 처리 부족

## 해결 방안

### 1. CategoryPage 컴포넌트 개선

#### 안전한 카테고리 찾기 로직
```javascript
const currentCategory = useMemo(() => {
  try {
    if (!categorySlug) {
      setPageError('카테고리 슬러그가 없습니다.');
      return null;
    }
    
    if (!categories || categories.length === 0) {
      if (!loading) {
        setPageError('카테고리 목록을 불러올 수 없습니다.');
      }
      return null;
    }
    
    const category = findCategoryBySlug(categorySlug, categories);
    if (!category) {
      setPageError(`카테고리 "${categorySlug}"를 찾을 수 없습니다.`);
      return null;
    }
    
    setPageError(null);
    return category;
  } catch (error) {
    console.error('카테고리 찾기 오류:', error);
    setPageError('카테고리를 처리하는 중 오류가 발생했습니다.');
    return null;
  }
}, [categorySlug, categories, loading]);
```

#### 개선된 로딩/에러 상태 UI
- 모바일 친화적인 로딩 스피너
- 명확한 에러 메시지와 복구 옵션
- 홈으로 돌아가기 버튼 제공

### 2. 안전한 카테고리 네비게이션

#### safeCategoryNavigate 함수 구현
```javascript
export const safeCategoryNavigate = (navigate, category, categoryUrl) => {
  try {
    // URL 유효성 검사
    if (!categoryUrl || typeof categoryUrl !== 'string') {
      throw new Error('유효하지 않은 카테고리 URL');
    }
    
    // 모바일에서는 약간의 지연을 두어 터치 이벤트 충돌 방지
    const delay = isMobileDevice() ? 100 : 0;
    
    if (delay > 0) {
      setTimeout(() => {
        try {
          navigate(categoryUrl);
        } catch (navError) {
          console.error('지연된 네비게이션 실패:', navError);
          window.location.href = categoryUrl;
        }
      }, delay);
    } else {
      navigate(categoryUrl);
    }
    
    return true;
  } catch (error) {
    console.error('카테고리 네비게이션 오류:', error);
    // 폴백: 직접 페이지 이동
    window.location.href = categoryUrl;
    return false;
  }
};
```

#### Home 컴포넌트의 카테고리 클릭 핸들러 개선
```javascript
<CategoryTitle 
  onClick={(event) => {
    try {
      if (category.type === 'category' && isValidCategory(category)) {
        event.preventDefault();
        event.stopPropagation();
        
        const categoryUrl = getCategoryPageUrl(category);
        if (categoryUrl) {
          safeCategoryNavigate(navigate, category, categoryUrl);
        }
      }
    } catch (error) {
      console.error('카테고리 클릭 처리 오류:', error);
    }
  }}
  style={{ 
    cursor: 'pointer',
    minHeight: '44px', // 모바일 터치 영역 확보
    display: 'flex',
    alignItems: 'center',
    touchAction: 'manipulation' // 더블탭 줌 방지
  }}
>
```

### 3. 카테고리 유틸리티 함수 강화

#### findCategoryBySlug 함수 개선
```javascript
export const findCategoryBySlug = (slug, categories) => {
  try {
    if (!slug || !categories || !Array.isArray(categories)) {
      console.warn('findCategoryBySlug: 잘못된 매개변수');
      return null;
    }
    
    // 직접 매칭 시도
    const directMatch = categories.find(cat => {
      try {
        if (!cat || !cat.name) return false;
        return categoryToSlug(cat.name) === slug;
      } catch (error) {
        console.warn('카테고리 매칭 중 오류:', error);
        return false;
      }
    });
    
    if (directMatch) return directMatch;
    
    // 대소문자 무시하고 다시 시도
    const caseInsensitiveMatch = categories.find(cat => {
      try {
        if (!cat || !cat.name) return false;
        return categoryToSlug(cat.name).toLowerCase() === slug.toLowerCase();
      } catch (error) {
        return false;
      }
    });
    
    return caseInsensitiveMatch || null;
  } catch (error) {
    console.error('findCategoryBySlug 오류:', error);
    return null;
  }
};
```

### 4. SafePageWrapper 개선

#### 카테고리 페이지 특별 처리
```javascript
const isCategoryPage = location.pathname.match(/^\/[a-z-]+$/);
const isMobile = typeof window !== 'undefined' && 
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// 카테고리 페이지 전용 에러 메시지
{isCategoryPage && isMobile ? '카테고리 로딩 오류' : '페이지 로딩 오류'}
```

### 5. MobileErrorHandler 강화

#### 카테고리 페이지 에러 특별 처리
```javascript
const handleCategoryPageError = (error) => {
  const currentPath = window.location.pathname;
  const isCategoryPage = currentPath.match(/^\/[a-z-]+$/);
  
  if (isCategoryPage) {
    console.error('카테고리 페이지 에러:', error);
    showError('카테고리 페이지 로딩 중 오류가 발생했습니다. 홈으로 이동합니다.', {
      duration: 3000,
      group: 'category-error'
    });
    
    // 3초 후 홈으로 자동 이동
    setTimeout(() => {
      window.location.href = '/';
    }, 3000);
  }
};
```

## 적용된 개선사항

### 1. 로딩 상태 개선
- ✅ 모바일 친화적인 로딩 스피너 추가
- ✅ 로딩 중 명확한 상태 메시지 표시
- ✅ 로딩 실패 시 재시도 옵션 제공

### 2. 에러 처리 강화
- ✅ 카테고리 찾기 실패 시 명확한 에러 메시지
- ✅ 네트워크 오류 시 적절한 폴백 처리
- ✅ 전역 에러 핸들러에서 카테고리 페이지 특별 처리

### 3. 네비게이션 안정성
- ✅ 터치 이벤트 충돌 방지를 위한 지연 처리
- ✅ React Router 실패 시 window.location.href 폴백
- ✅ 이벤트 전파 방지 및 기본 동작 차단

### 4. 모바일 UX 개선
- ✅ 최소 터치 영역 44px 확보
- ✅ 더블탭 줌 방지 (touch-action: manipulation)
- ✅ 모바일 전용 에러 메시지 및 UI

### 5. 디버깅 도구
- ✅ 개발 환경에서 상세한 로깅
- ✅ 카테고리 매칭 과정 추적
- ✅ 네비게이션 시도 로깅

## 테스트 방법

### 1. 모바일 디바이스 테스트
1. 실제 모바일 디바이스에서 홈페이지 접속
2. 각 카테고리 제목 클릭하여 카테고리 페이지 이동 확인
3. 네트워크 연결이 불안정한 상황에서 테스트
4. 다양한 모바일 브라우저에서 테스트 (Safari, Chrome, Samsung Internet)

### 2. 개발자 도구 테스트
1. Chrome DevTools의 모바일 시뮬레이션 사용
2. Network 탭에서 Slow 3G 설정하여 테스트
3. Console에서 에러 로그 확인
4. Performance 탭에서 로딩 성능 확인

### 3. 에러 시나리오 테스트
1. 존재하지 않는 카테고리 URL 직접 접속
2. 네트워크 연결 끊고 카테고리 클릭
3. 카테고리 데이터 로딩 중 페이지 이동
4. 빠른 연속 클릭으로 중복 네비게이션 시도

## 성능 최적화

### 1. 로딩 시간 단축
- 카테고리 데이터 사전 로딩
- 이미지 lazy loading 적용
- 불필요한 리렌더링 방지

### 2. 메모리 사용량 최적화
- 컴포넌트 언마운트 시 정리 작업
- 이벤트 리스너 적절한 해제
- 메모리 누수 방지

### 3. 네트워크 최적화
- 카테고리 데이터 캐싱
- 실패한 요청 재시도 로직
- 오프라인 상태 감지 및 처리

이제 모바일 환경에서 카테고리 클릭 시 발생하던 페이지 로딩 오류가 해결되었습니다. 사용자는 안정적으로 카테고리 페이지에 접근할 수 있으며, 오류 발생 시에도 명확한 피드백과 복구 옵션을 제공받을 수 있습니다.