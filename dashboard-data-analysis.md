# 대시보드 조회수 데이터 분석 보고서

## 🔍 현재 시스템의 조회수 데이터 흐름

### 1. 조회수 데이터 저장 방식

#### A. 기사별 조회수 (articles 컬렉션)
- **위치**: `articles/{articleId}.views`
- **업데이트 시점**: 사용자가 기사를 조회할 때마다 +1
- **업데이트 조건**: 로그인된 사용자만
- **코드 위치**: `src/contexts/ArticlesContext.jsx` - `incrementArticleViews()`

```javascript
// ArticlesContext.jsx - incrementArticleViews()
const incrementArticleViews = useCallback(async (articleId) => {
  const articleDocRef = doc(db, 'articles', articleId);
  const articleDoc = await getDoc(articleDocRef);
  
  if (articleDoc.exists()) {
    const currentViews = articleDoc.data().views || 0;
    await updateDoc(articleDocRef, { 
      views: currentViews + 1,
      updatedAt: new Date().toISOString()
    });
  }
});
```

#### B. 사용자별 조회 기록 (users 컬렉션)
- **위치**: `users/{userId}/data/viewRecords.records[]`
- **업데이트 시점**: 사용자가 기사를 조회할 때마다 기록 추가
- **업데이트 조건**: 로그인된 사용자만
- **코드 위치**: `src/contexts/DataContext.jsx` - `addViewRecord()`

```javascript
// DataContext.jsx - addViewRecord()
const addViewRecord = async (articleData) => {
  const newRecord = {
    articleId: articleData.id,
    title: articleData.title,
    category: articleData.category,
    viewedAt: new Date().toISOString(),
    summary: articleData.summary,
  };
  
  const updatedRecords = [newRecord, ...viewRecords.filter(r => r.articleId !== articleData.id)].slice(0, 100);
  setViewRecords(updatedRecords);
  await saveData('viewRecords', updatedRecords);
};
```

### 2. 대시보드에서 조회수 계산 방식

#### 현재 구현 (BlogStyleDashboard.jsx)
```javascript
// 사용자별 조회 기록을 합산하여 총 조회수 계산
let totalViewRecords = 0;

for (const userData of allUsers) {
  const likesRef = collection(db, 'users', userData.id, 'data');
  const likesSnap = await getDocs(likesRef);
  
  likesSnap.docs.forEach(doc => {
    if (doc.id === 'viewRecords' && data.records) {
      userViews = data.records.length;
      totalViewRecords += userViews;  // 사용자별 조회 기록 수를 합산
    }
  });
}

setDashboardStats({
  totalViews: totalViewRecords,  // 사용자 조회 기록 기반
  // ...
});
```

### 3. 🚨 발견된 문제점

#### A. 데이터 불일치 가능성
1. **기사 조회수 vs 사용자 조회 기록**
   - 기사별 `views` 필드: 각 기사의 실제 조회수
   - 사용자별 `viewRecords`: 사용자가 조회한 기사 목록
   - **문제**: 같은 사용자가 같은 기사를 여러 번 조회해도 `viewRecords`에는 1개만 저장됨

2. **중복 제거 로직**
   ```javascript
   // DataContext.jsx - addViewRecord()
   const updatedRecords = [newRecord, ...viewRecords.filter(r => r.articleId !== articleData.id)].slice(0, 100);
   ```
   - 같은 기사를 다시 조회하면 이전 기록을 제거하고 새 기록을 추가
   - 결과: 사용자당 기사별 최대 1개 기록만 유지

#### B. 비로그인 사용자 조회수 누락
- 현재 시스템은 로그인된 사용자의 조회만 카운트
- 비로그인 사용자의 조회는 기록되지 않음
- 프리렌더링 시 조회수 증가는 발생하지만 사용자 기록에는 반영되지 않음

### 4. 📊 실제 데이터 검증 필요 사항

#### A. 확인해야 할 데이터
1. **기사별 실제 조회수**
   ```javascript
   // Firebase Console에서 확인
   articles/{articleId}.views
   ```

2. **사용자별 조회 기록 수**
   ```javascript
   // Firebase Console에서 확인
   users/{userId}/data/viewRecords.records.length
   ```

3. **대시보드 표시 값**
   - 현재 https://marlang-app.web.app/dashboard 에서 표시되는 "총 조회수"

#### B. 예상되는 결과
- **기사 조회수 합계** > **사용자 조회 기록 합계**
- 이유: 같은 사용자의 중복 조회가 기사 조회수에는 반영되지만 사용자 기록에는 1개만 저장

### 5. 🔧 권장 해결 방안

#### A. 즉시 수정 (단기)
1. **대시보드 계산 방식 변경**
   ```javascript
   // 기사별 조회수를 직접 합산하는 방식으로 변경
   let totalArticleViews = 0;
   allArticles.forEach(article => {
     totalArticleViews += article.views || 0;
   });
   
   setDashboardStats({
     totalViews: totalArticleViews,  // 기사 조회수 기반
     // ...
   });
   ```

#### B. 장기 개선 방안
1. **조회수 시스템 통합**
   - 기사 조회수와 사용자 조회 기록을 동기화
   - 중복 조회도 별도 카운트 (일일 조회수 제한 등 고려)

2. **비로그인 사용자 조회수 추가**
   - Google Analytics 연동
   - 서버 사이드 조회수 추적

3. **실시간 동기화**
   - Firebase Functions를 통한 자동 동기화
   - 데이터 일관성 보장

### 6. 🎯 즉시 적용 가능한 수정

현재 대시보드의 조회수가 실제 데이터를 반영하도록 하려면:

1. `src/pages/BlogStyleDashboard.jsx`의 `calculateRealStats()` 함수 수정
2. 사용자 조회 기록 대신 기사별 조회수 직접 합산
3. 카테고리별 통계도 기사 데이터 기반으로 변경

이렇게 수정하면 대시보드가 실제 기사 조회수를 정확히 반영하게 됩니다.