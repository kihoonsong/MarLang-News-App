# 개별 기사 URL 인터랙티브 전환 문제 해결

## 🎯 문제 상황
- 개별 기사 URL로 직접 접속 시 인터랙티브 버전(React 앱)으로 전환되지 않음
- 정적 HTML만 표시되고 React 앱이 로드되지 않음

## 🔧 해결 방법

### 1. prerenderArticle 함수 수정
- **소셜 크롤러 감지 로직 추가**
- **일반 사용자는 React 앱으로 리다이렉트**
- **소셜 크롤러만 정적 HTML 제공**

```javascript
// 소셜 크롤러 감지 함수 추가
const isSocialCrawler = (userAgent) => {
  const crawlers = [
    'facebookexternalhit', 'Twitterbot', 'LinkedInBot', 
    'WhatsApp', 'TelegramBot', 'SkypeUriPreview', 
    'SlackBot', 'DiscordBot', 'Applebot', 'GoogleBot'
  ];
  return crawlers.some(crawler => 
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
};

// 일반 사용자는 React 앱으로 리다이렉트
if (!isSocialCrawler(userAgent)) {
  return res.redirect(301, `${SITE_URL}/article/${articleId}`);
}
```

### 2. 배포 완료
✅ Firebase Functions 배포 완료
✅ prerenderArticle 함수 업데이트 완료

## 🧪 테스트 방법

### 1. 일반 사용자 테스트
```bash
# 일반 브라우저 User-Agent로 테스트
curl -I "https://marlang-app.web.app/article/[실제기사ID]" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
# 결과: 301 리다이렉트 → React 앱으로 이동
```

### 2. 소셜 크롤러 테스트
```bash
# Facebook 크롤러로 테스트
curl -I "https://marlang-app.web.app/article/[실제기사ID]" \
  -H "User-Agent: facebookexternalhit/1.1"
# 결과: 200 OK → 정적 HTML 제공 (SEO 최적화)
```

## 📱 실제 테스트 방법

### 브라우저에서 직접 테스트:
1. **Chrome 개발자 도구 열기** (F12)
2. **Network 탭 확인**
3. **기사 URL 직접 입력**: `https://marlang-app.web.app/article/[기사ID]`
4. **확인사항**:
   - 301 리다이렉트 발생 여부
   - React 앱 정상 로드 여부
   - 인터랙티브 기능 작동 여부

### 모바일에서 테스트:
1. **모바일 브라우저에서 기사 URL 직접 접속**
2. **TTS 버튼, 좋아요 버튼 등 인터랙티브 기능 테스트**
3. **단어 클릭 시 사전 팝업 확인**

## 🔍 동작 원리

### Before (문제 상황):
```
사용자 → /article/123 → prerenderArticle 함수 → 정적 HTML 반환
                                                ↓
                                        React 앱 로드 실패
```

### After (해결 후):
```
일반 사용자 → /article/123 → prerenderArticle 함수 → 301 리다이렉트
                                                    ↓
                                            React 앱 직접 로드

소셜 크롤러 → /article/123 → prerenderArticle 함수 → 정적 HTML (SEO)
```

## ✅ 예상 결과

### 일반 사용자:
- ✅ 기사 URL 직접 접속 시 React 앱으로 즉시 전환
- ✅ 모든 인터랙티브 기능 정상 작동
- ✅ TTS, 단어장, 좋아요 등 기능 사용 가능

### 소셜 크롤러:
- ✅ SEO 최적화된 정적 HTML 제공
- ✅ Open Graph 메타 태그 정상 작동
- ✅ 소셜 미디어 공유 시 올바른 미리보기 표시

## 🚀 추가 개선사항

### 1. 성능 최적화
- React 앱 초기 로딩 속도 개선
- 코드 스플리팅으로 번들 크기 최적화

### 2. SEO 개선
- 구조화된 데이터 추가
- 메타 태그 최적화

### 3. 사용자 경험 개선
- 로딩 상태 표시
- 오프라인 지원

## 📞 문제 발생 시

만약 여전히 문제가 발생한다면:

1. **브라우저 캐시 클리어**
2. **시크릿 모드에서 테스트**
3. **다른 기사 URL로 테스트**
4. **개발자 도구에서 네트워크 로그 확인**

---

**배포 시간**: 2025-07-30 04:46 KST
**상태**: ✅ 배포 완료 및 테스트 준비