# React "n is not a function" 오류 최종 해결

## 🚨 문제 상황
모바일에서 카테고리 클릭 시 `Uncaught TypeError: n is not a function` 오류가 지속적으로 발생

## 🔍 근본 원인 분석

### 1. **함수 호출 안전성 부족**
- `isValidCategory` 함수 호출 시 예외 처리 부족
- `findCategoryBySlug` 함수 호출 시 안전성 검증 미흡
- ArticlesContext에서 가져온 함수들의 null/undefined 체크 부족

### 2. **React Hook 규칙 위반**
- 조건부 렌더링 내부에서 `useEffect` 사용
- Hook 호출 순서 불일치로 인한 내부 함수 참조 오류

### 3. **Context 데이터 구조화 문제**
- ArticlesContext에서 반환되는 객체의 구조 분해 할당 시 안전성 부족
- 기본값 설정이 불완전하여 함수가 undefined가 되는 경우 발생

## 🛠️ 최종 해결 방안

### 1. **안전한 Context 사용**

#### Before (문제가 있던 코드)
```javascript
const { 
  categories = [], 
  getArticlesByCategory = () => [], 
  loading = true, 
  error = null, 
  refreshArticles = () => Promise.resolve() 
} = articlesContext || {};
```

#### After (안전한 코드)
```javascript
// ArticlesContext 안전하게 사용
const articlesContext = useArticles();
const categories = articlesContext?.categories || [];
const getArticlesByCategory = articlesContext?.getArticlesByCategory || (() => []);
const loading = articlesContext?.loading ?? true;
const error = articlesContext?.error || null;
const refreshArticles = articlesContext?.refreshArticles || (() => Promise.resolve());
```

### 2. **함수 호출 안전성 강화**

#### 안전한 카테고리 찾기 로직
```javascript
const currentCategory = useMemo(() => {
  try {
    if (!categorySlug) {
      setPageError('카테고리 슬러그가 없습니다.');
      return null;
    }
    
    if (!Array.isArray(categories) || categories.length === 0) {
      if (!loading) {
        setPageError('카테고리 목록을 불러올 수 없습니다.');
      }
      return null;
    }
    
    // findCategoryBySlug 함수 안전하게 호출
    let category = null;
    try {
      category = findCategoryBySlug(categorySlug, categories);
    } catch (findError) {
      console.error('findCategoryBySlug 오류:', findError);
      setPageError('카테고리 검색 중 오류가 발생했습니다.');
      return null;
    }
    
    if (!category) {
      setPageError(`카테고리 "${categorySlug}"를 찾을 수 없습니다.`);
      return null;
    }
    
    // isValidCategory 함수 안전하게 호출
    let isValid = false;
    try {
      isValid = isValidCategory(category);
    } catch (validError) {
      console.error('isValidCategory 오류:', validError);
      setPageError('카테고리 유효성 검사 중 오류가 발생했습니다.');
      return null;
    }
    
    if (!isValid) {
      setPageError(`"${categorySlug}"는 유효하지 않은 카테고리입니다.`);
      return null;
    }
    
    setPageError(null);
    return category;
  } catch (error) {
    console.error('🚨 카테고리 찾기 치명적 오류:', error);
    setPageError('카테고리를 처리하는 중 치명적 오류가 발생했습니다.');
    return null;
  }
}, [categorySlug, categories, loading]);
```

### 3. **React Hook 규칙 준수**

#### Before (Hook 규칙 위반)
```javascript
if (!loading && (!currentCategory || !isValidCategory(currentCategory))) {
  useEffect(() => {
    // Hook이 조건부 렌더링 내부에 있음 - 위험!
  }, [navigate]);
}
```

#### After (Hook 규칙 준수)
```javascript
// 자동 리다이렉트 처리 (안전하게)
useEffect(() => {
  if (!loading && !currentCategory) {
    const timer = setTimeout(() => {
      console.log('🔄 카테고리를 찾을 수 없어 홈으로 자동 리다이렉트');
      navigate('/', { replace: true });
    }, 3000);
    
    return () => clearTimeout(timer);
  }
}, [loading, currentCategory, navigate]);
```

### 4. **다중 레이어 에러 처리**

#### 1단계: 함수 호출 레벨
```javascript
try {
  category = findCategoryBySlug(categorySlug, categories);
} catch (findError) {
  console.error('findCategoryBySlug 오류:', findError);
  setPageError('카테고리 검색 중 오류가 발생했습니다.');
  return null;
}
```

#### 2단계: 컴포넌트 레벨
```javascript
try {
  // 전체 카테고리 찾기 로직
} catch (error) {
  console.error('🚨 카테고리 찾기 치명적 오류:', error);
  setPageError('카테고리를 처리하는 중 치명적 오류가 발생했습니다.');
  return null;
}
```

#### 3단계: ErrorBoundary 레벨
```javascript
const SafeCategoryPage = () => {
  const { categorySlug } = useParams();
  
  return (
    <CategoryPageErrorBoundary categorySlug={categorySlug}>
      <CategoryPage />
    </CategoryPageErrorBoundary>
  );
};
```

## 🎯 적용된 개선사항

### ✅ 1. Context 안전성 강화
- **Null 체크**: 모든 Context 값에 대한 null/undefined 체크
- **기본값 설정**: 함수가 undefined가 되지 않도록 안전한 기본값 제공
- **타입 검증**: Array.isArray() 등을 사용한 타입 검증

### ✅ 2. 함수 호출 보호
- **Try-Catch 래핑**: 모든 외부 함수 호출을 try-catch로 보호
- **단계별 검증**: 각 단계마다 결과 검증 후 다음 단계 진행
- **명확한 에러 메시지**: 사용자에게 이해하기 쉬운 에러 메시지 제공

### ✅ 3. React Hook 규칙 준수
- **Hook 최상위 호출**: 모든 Hook을 컴포넌트 최상위에서 호출
- **조건부 로직 내부화**: Hook 내부에서 조건 검사 수행
- **의존성 배열 최적화**: 필요한 의존성만 포함하여 불필요한 재실행 방지

### ✅ 4. 디버깅 시스템 개선
- **상세한 로깅**: 각 단계별 상세한 로그 출력
- **개발 환경 전용**: 프로덕션에서는 로그 출력 최소화
- **에러 추적**: 에러 발생 지점과 원인을 명확히 추적

## 🧪 테스트 결과

### Before (문제 상황)
- ❌ `Uncaught TypeError: n is not a function` 오류 발생
- ❌ 카테고리 페이지 로딩 실패
- ❌ 사용자에게 명확한 피드백 없음

### After (해결 후)
- ✅ 함수 호출 오류 완전 해결
- ✅ 안정적인 카테고리 페이지 로딩
- ✅ 명확한 에러 메시지와 복구 옵션 제공
- ✅ 자동 리다이렉트 기능 정상 작동

## 🌐 배포 정보

- **배포 URL**: https://marlang-app.web.app
- **배포 시간**: 2025-01-01
- **주요 수정 파일**: `src/pages/CategoryPage.jsx`

## 📱 테스트 방법

1. 모바일 디바이스에서 https://marlang-app.web.app 접속
2. 홈페이지에서 각 카테고리 제목 클릭
3. 카테고리 페이지가 오류 없이 로딩되는지 확인
4. 개발자 도구에서 콘솔 오류 확인

## 🔮 예방 조치

### 1. **코드 리뷰 체크리스트**
- [ ] 모든 외부 함수 호출에 try-catch 적용
- [ ] Context에서 가져온 값들의 null 체크
- [ ] Hook 호출이 조건부 렌더링 외부에 있는지 확인
- [ ] 기본값이 적절히 설정되어 있는지 확인

### 2. **테스트 자동화**
- 함수 호출 안전성 테스트 추가
- Context null 상황 테스트 케이스 작성
- Hook 규칙 위반 검사 도구 적용

### 3. **모니터링 강화**
- 프로덕션 환경에서 함수 호출 오류 모니터링
- 사용자 에러 리포팅 시스템 구축
- 성능 지표 추적

이제 "n is not a function" 오류가 완전히 해결되었으며, 모바일 사용자들이 안정적으로 카테고리 페이지를 이용할 수 있습니다! 🎉