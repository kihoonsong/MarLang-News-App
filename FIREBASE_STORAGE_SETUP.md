# 🔥 Firebase Storage 설정 가이드

## 📋 Firebase Storage 활성화

### 1단계: Firebase Console 접속
👉 [Firebase Storage 콘솔](https://console.firebase.google.com/project/marlang-app/storage)

### 2단계: Storage 시작하기
1. **"시작하기"** 버튼 클릭
2. **보안 규칙 설정**:
   - "테스트 모드에서 시작" 선택 (임시)
   - "다음" 클릭
3. **Storage 위치 선택**:
   - `asia-northeast3 (Seoul)` 선택 (권장)
   - "완료" 클릭

### 3단계: 보안 규칙 업데이트
Storage가 생성되면 자동으로 보안 규칙이 배포됩니다.

## 🧪 설정 완료 확인

### 방법 1: Firebase Console 확인
- Storage 탭에서 버킷이 생성되었는지 확인
- 규칙 탭에서 보안 규칙이 적용되었는지 확인

### 방법 2: 웹사이트에서 테스트
1. https://marlang-app.web.app/dashboard 접속
2. 새 기사 작성
3. 이미지 파일 업로드 테스트
4. 성공 메시지 확인

## 🚨 문제 해결

### Storage 권한 오류 시
```
Error: Firebase Storage has not been set up
```
→ 위의 1-3단계를 다시 수행하세요.

### 업로드 권한 오류 시
```
Error: storage/unauthorized
```
→ 관리자 권한으로 로그인했는지 확인하세요.

## ✅ 설정 완료 후
- 이미지가 포함된 기사 작성 가능
- 예약 발행 및 즉시 발행 모두 정상 작동
- 업로드된 이미지는 Firebase Storage에 안전하게 저장