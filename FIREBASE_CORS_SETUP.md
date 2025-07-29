# Firebase Storage CORS 설정 가이드

## 문제 상황
Firebase Storage에서 이미지를 로드할 때 CORS 에러가 발생합니다:
```
Access to image at 'https://firebasestorage.googleapis.com/...' has been blocked by CORS policy
```

## 해결 방법

### 1. Google Cloud SDK 설치
```bash
# macOS
brew install google-cloud-sdk

# 또는 직접 다운로드
curl https://sdk.cloud.google.com | bash
```

### 2. 인증 설정
```bash
gcloud auth login
gcloud config set project marlang-app
```

### 3. CORS 설정 파일 적용
```bash
gsutil cors set cors.json gs://marlang-app.firebasestorage.app
```

### 4. CORS 설정 확인
```bash
gsutil cors get gs://marlang-app.firebasestorage.app
```

## 대안 방법

### Firebase Console에서 직접 설정
1. Firebase Console → Storage → Rules
2. 다음 규칙 추가:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
    }
  }
}
```

### 코드 레벨 해결책
- `crossOrigin` 속성 제거
- 프록시 서버 사용
- Firebase Functions를 통한 이미지 프록시

## 현재 적용된 해결책
- `img.crossOrigin = 'anonymous'` 주석 처리
- Firebase Storage 이미지 직접 로드 시도
- 에러 발생 시 텍스트만 표시하는 fallback 구현