# Firebase Authentication 설정 가이드

## 문제 해결 완료 사항

1. ✅ Firebase 프로젝트 설정 확인 (marlang-app)
2. ✅ 실제 Firebase 설정값으로 `.env` 파일 업데이트
3. ✅ Google OAuth 공급자 설정 개선
4. ✅ 에러 처리 및 로깅 추가

## 남은 설정 작업

Firebase 콘솔에서 다음 설정을 확인/활성화해야 합니다:

### 1. Authentication 활성화
1. [Firebase Console](https://console.firebase.google.com/project/marlang-app/authentication) 접속
2. "시작하기" 클릭하여 Authentication 활성화

### 2. Google 로그인 공급자 설정
1. Authentication > Sign-in method 탭으로 이동
2. "Google" 공급자 클릭
3. "사용 설정" 토글 활성화
4. 프로젝트 지원 이메일 설정
5. "저장" 클릭

### 3. 승인된 도메인 추가
Authentication > Settings > 승인된 도메인에서:
- `localhost` (이미 있을 것)
- 프로덕션 도메인 (있는 경우)

### 4. Firestore 데이터베이스 설정
1. [Firestore Console](https://console.firebase.google.com/project/marlang-app/firestore) 접속
2. "데이터베이스 만들기" 클릭
3. 보안 규칙: 테스트 모드로 시작 (나중에 수정)
4. 위치: asia-northeast3 (서울) 권장

## 테스트 방법
1. 개발 서버 실행: `npm run dev`
2. 브라우저에서 http://localhost:3001 접속
3. 로그인 버튼 클릭하여 Google 로그인 테스트
4. 브라우저 개발자 도구 콘솔에서 로그 확인

## 문제 발생 시 확인사항
- Firebase 콘솔에서 Authentication이 활성화되었는지 확인
- Google 로그인 공급자가 활성화되었는지 확인  
- 브라우저 콘솔에서 에러 메시지 확인
- 개발자 도구 Network 탭에서 Firebase API 호출 확인