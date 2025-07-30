# 소셜 공유 메타데이터 문제 해결 완료

## 🎯 문제 상황
- 개별 기사 URL 소셜 공유 시 메타데이터가 생성되지 않음
- 소셜 크롤러도 일반 React 앱 HTML을 받아서 적절한 og:title, og:description 등이 없음

## ✅ 해결 방법

### 1. Firebase 호스팅 설정 수정
```json
{
  "rewrites": [
    {
      "source": "/sitemap.xml",
      "function": "serveSitemap"
    },
    {
      "source": "/article/**",
      "function": "socialPrerender"
    },
    {
      "source": "**",
      "destination": "/index.html"
    }
  ]
}
```

### 2. socialPrerender 함수 최적화
- **소셜 크롤러**: SEO 최적화된 메타데이터 HTML 제공
- **일반 사용자**: React 앱 index.html 직접 제공 (리다이렉트 없음)

### 3. 동작 방식

#### 일반 사용자 접속:
```
사용자 → /article/123 → socialPrerender 함수 → React 앱 HTML 직접 제공
```

#### 소셜 크롤러 접속:
```
크롤러 → /article/123 → socialPrerender 함수 → 메타데이터 포함 HTML 제공
```

## 🧪 테스트 결과

### 일반 사용자 (빠른 로딩):
```bash
curl "https://marlang-app.web.app/article/test" -H "User-Agent: Mozilla/5.0"
# 결과: React 앱 HTML (빠른 로딩)
```

### 소셜 크롤러 (메타데이터 포함):
```bash
curl "https://marlang-app.web.app/article/test" -H "User-Agent: facebookexternalhit/1.1"
# 결과: 메타데이터 포함 HTML
```

## 📱 소셜 미디어 캐시 무효화

소셜 미디어 플랫폼들이 메타데이터를 캐시하므로, 새로운 기사나 업데이트된 메타데이터가 반영되지 않을 수 있습니다.

### Facebook 디버거:
https://developers.facebook.com/tools/debug/

### Twitter Card Validator:
https://cards-dev.twitter.com/validator

### LinkedIn Post Inspector:
https://www.linkedin.com/post-inspector/

## 🔍 메타데이터 확인 방법

### 1. 개발자 도구에서 확인:
```bash
curl -s "https://marlang-app.web.app/article/[기사ID]" \
  -H "User-Agent: facebookexternalhit/1.1" | grep "og:"
```

### 2. 브라우저에서 확인:
- 개발자 도구 → Network 탭
- User-Agent를 소셜 크롤러로 변경하여 테스트

## ✅ 예상 결과

### 소셜 공유 시:
- ✅ **제목**: 기사 제목이 정확히 표시
- ✅ **설명**: 기사 요약이 표시
- ✅ **이미지**: 기사 이미지 또는 기본 소셜 이미지
- ✅ **URL**: 정확한 기사 URL

### 성능:
- ✅ **일반 사용자**: 빠른 React 앱 로딩 유지
- ✅ **소셜 크롤러**: 적절한 메타데이터 제공
- ✅ **SEO**: 검색 엔진 최적화 유지

## 🚀 추가 개선사항

### 1. 동적 소셜 이미지 생성
- 기사별 맞춤 소셜 이미지 자동 생성
- 제목과 요약이 포함된 이미지

### 2. 메타데이터 최적화
- 기사 카테고리별 맞춤 메타데이터
- 다국어 메타데이터 지원

### 3. 캐시 최적화
- 소셜 미디어 캐시 TTL 최적화
- 메타데이터 버전 관리

---

**배포 완료**: 2025-07-30 05:30 KST
**상태**: ✅ 소셜 공유 메타데이터 정상 작동