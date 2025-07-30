# 소셜 미디어 메타데이터 디버깅 가이드

## 🔍 문제 진단

### 1. 현재 상황
- 모바일 소셜미디어 공유 시 메타데이터(이미지, 텍스트)가 생성되지 않음
- 기본 메타데이터만 표시됨

### 2. 테스트 방법

#### A. 소셜 크롤러 테스트
```bash
# Facebook 크롤러로 테스트
curl -s "https://marlang-app.web.app/social/article/[기사ID]" \
  -H "User-Agent: facebookexternalhit/1.1" | head -20

# Twitter 크롤러로 테스트  
curl -s "https://marlang-app.web.app/social/article/[기사ID]" \
  -H "User-Agent: Twitterbot/1.0" | head -20
```

#### B. 실제 기사 ID 확인
Firebase Console에서 articles 컬렉션 확인 필요

### 3. 디버깅 단계

#### Step 1: 기사 데이터 존재 확인
- Firebase Console → Firestore → articles 컬렉션
- 발행된 기사(status: 'published') 확인

#### Step 2: 소셜 크롤러 테스트
```bash
# 실제 기사 ID로 테스트 (예: sample-article-123)
curl -s "https://marlang-app.web.app/social/article/sample-article-123" \
  -H "User-Agent: facebookexternalhit/1.1"
```

#### Step 3: 메타데이터 확인
- og:title: 기사 제목이 표시되는지
- og:description: 기사 요약이 표시되는지  
- og:image: 기사 이미지 또는 기본 이미지가 표시되는지

### 4. 소셜 미디어 디버깅 도구

#### Facebook 디버거
https://developers.facebook.com/tools/debug/

#### Twitter Card Validator  
https://cards-dev.twitter.com/validator

#### LinkedIn Post Inspector
https://www.linkedin.com/post-inspector/

### 5. 예상 문제점 및 해결책

#### 문제 1: 기사 데이터 없음
- **원인**: Firestore에 발행된 기사가 없음
- **해결**: 테스트용 기사 데이터 생성 필요

#### 문제 2: 소셜 URL 잘못 설정
- **원인**: SocialShareMeta에서 잘못된 URL 사용
- **해결**: canonicalUrl 사용하도록 수정 완료

#### 문제 3: 이미지 경로 문제
- **원인**: 상대 경로 또는 잘못된 이미지 URL
- **해결**: 절대 URL 사용 및 기본 이미지 폴백

### 6. 현재 적용된 수정사항

#### ✅ SocialShareMeta 수정
```javascript
// Before: 소셜 전용 URL 사용
updateMetaTag('meta[property="og:url"]', 'property', socialUrl);

// After: 실제 기사 URL 사용  
updateMetaTag('meta[property="og:url"]', 'property', canonicalUrl);
```

#### ✅ socialPrerender 함수 디버깅 강화
- 기사 데이터 조회 로그 추가
- 발행 상태 확인 로직 추가
- 이미지 필드 다중 확인

### 7. 다음 단계

1. **실제 기사 데이터 확인**: Firebase Console에서 기사 존재 여부 확인
2. **테스트 기사 생성**: 필요 시 테스트용 기사 데이터 생성
3. **소셜 크롤러 테스트**: 실제 기사 ID로 메타데이터 생성 확인
4. **소셜 미디어 캐시 무효화**: 기존 캐시 클리어

---

**업데이트**: 2025-07-30 10:45 KST
**상태**: 🔧 디버깅 진행 중