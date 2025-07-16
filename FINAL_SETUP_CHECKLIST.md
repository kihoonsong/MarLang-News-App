# ✅ 예약 발행 시스템 최종 설정 체크리스트

## 🎯 현재 완료된 작업들

### ✅ 완료된 기능들
- [x] Firebase Functions 배포 완료
- [x] 시간 처리 로직 UTC 기준으로 통일
- [x] 예약 발행 함수 정상 작동 확인
- [x] 웹 인터페이스 예약 발행 UI 구현
- [x] 테스트 스크립트 및 모니터링 도구 완성

### ⏳ 남은 작업 (5분 소요)
- [ ] Cloud Scheduler 설정 (수동 설정 필요)

## 🚀 Cloud Scheduler 설정 (마지막 단계)

### 1단계: Google Cloud Console 접속
```
🔗 https://console.cloud.google.com/cloudscheduler?project=marlang-app
```

### 2단계: 새 작업 만들기
1. **"작업 만들기"** 버튼 클릭
2. 다음 정보 정확히 입력:

```
📝 작업 정보:
이름: publish-scheduled-articles
지역: us-central1 (함수와 동일한 지역)
설명: 예약 기사 자동 발행 (5분마다 실행)

⏰ 일정:
빈도: */5 * * * *
시간대: Asia/Seoul

🎯 실행 구성:
대상 유형: HTTP
URL: https://publishscheduledarticles-tdblwekz3q-uc.a.run.app
HTTP 메서드: POST
본문: {} (또는 비워두기)

📋 헤더 (선택사항):
Content-Type: application/json
```

### 3단계: 작업 생성 및 테스트
1. **"만들기"** 버튼 클릭
2. 생성된 작업 옆 **"지금 실행"** 버튼 클릭
3. 실행 결과 확인

## 🧪 설정 완료 후 전체 시스템 테스트

### 테스트 1: 즉시 실행 테스트
```bash
# 터미널에서 실행
node verify-scheduler-setup.js
```

### 테스트 2: 예약 기사 생성 테스트
1. 웹사이트 관리자 대시보드 접속
2. "기사 관리" 탭 클릭
3. "새 기사 작성" 버튼 클릭
4. 기사 내용 작성
5. **"예약 발행"** 선택
6. **현재 시간 + 5분** 설정
7. 저장 후 5분 대기
8. 자동 발행 확인

### 테스트 3: 실시간 모니터링
```
📊 모니터링 링크들:
- Firebase Console: https://console.firebase.google.com/project/marlang-app/firestore/data/articles
- Cloud Functions 로그: https://console.cloud.google.com/functions/details/us-central1/publishScheduledArticles?project=marlang-app
- Cloud Scheduler: https://console.cloud.google.com/cloudscheduler?project=marlang-app
```

## 🎉 완성된 시스템 플로우

```
1. 관리자가 웹에서 예약 기사 작성
   ↓
2. 한국 시간 입력 → UTC로 변환하여 Firestore에 저장
   ↓
3. Cloud Scheduler가 5분마다 자동으로 함수 호출
   ↓
4. 함수가 예약 시간이 지난 기사들을 찾아서 발행 상태로 변경
   ↓
5. 웹사이트에서 발행된 기사 즉시 표시
```

## 🔧 문제 해결

### Q: Cloud Scheduler 작업 생성 시 오류가 발생하면?
A: 
1. Cloud Scheduler API가 활성화되어 있는지 확인
2. 프로젝트 권한 확인
3. 지역을 `us-central1`로 변경해보기

### Q: 함수 호출이 실패하면?
A:
1. 함수 URL이 정확한지 확인
2. 함수 권한에서 `allUsers` 호출 허용 확인
3. Cloud Functions 로그에서 오류 메시지 확인

### Q: 예약 기사가 발행되지 않으면?
A:
1. Firestore에서 기사 `status`가 `scheduled`인지 확인
2. `publishedAt` 시간이 UTC 기준으로 올바른지 확인
3. Firestore 인덱스가 활성화되었는지 확인

## 🎯 성공 확인 방법

### ✅ 설정이 성공적으로 완료되었다면:
1. Cloud Scheduler에서 작업이 5분마다 실행됨
2. 예약 기사 생성 후 지정된 시간에 자동 발행됨
3. 웹사이트에서 발행된 기사가 즉시 표시됨
4. Firebase Console에서 기사 상태가 `scheduled` → `published`로 변경됨

### 📞 추가 지원이 필요하면:
- Firebase Console 로그 확인
- Cloud Functions 로그 확인
- 테스트 스크립트 실행 결과 확인

---

**🚀 이제 Cloud Scheduler만 설정하면 예약 발행 시스템이 완전히 자동화됩니다!**