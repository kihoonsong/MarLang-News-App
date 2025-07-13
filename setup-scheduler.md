# Cloud Scheduler 설정 가이드

## 🎯 자동 예약 발행을 위한 Cloud Scheduler 설정

### 1단계: Google Cloud Console 접속
```
https://console.cloud.google.com/cloudscheduler?project=marlang-app
```

### 2단계: Cloud Scheduler API 활성화
- 처음 접속 시 "Cloud Scheduler API 사용 설정" 버튼 클릭
- API 활성화 완료까지 약 1-2분 대기

### 3단계: 새 작업 생성
```
[작업 만들기] 버튼 클릭
```

### 4단계: 기본 정보 입력
```
이름: publish-scheduled-articles
지역: us-central1
설명: 예약 기사 자동 발행 (5분마다 실행)
```

### 5단계: 스케줄 설정
```
빈도: */5 * * * *
시간대: Asia/Seoul
```

### 6단계: 실행 구성
```
대상 유형: HTTP
URL: https://publishscheduledarticles-tdblwekz3q-uc.a.run.app
HTTP 메서드: POST
```

### 7단계: 고급 설정 (선택사항)
```
헤더:
- Content-Type: application/json

재시도 구성:
- 최대 재시도 횟수: 3
- 최대 재시도 기간: 1800초
- 최소 백오프 기간: 5초
- 최대 백오프 기간: 3600초
```

### 8단계: 생성 및 활성화
```
[만들기] 버튼 클릭
→ 작업이 생성되면 자동으로 활성화됨
→ 5분마다 자동 실행 시작
```

## ✅ 완료 확인
- 작업 목록에서 "publish-scheduled-articles" 상태가 "사용 설정됨"인지 확인
- "지금 실행" 버튼으로 수동 테스트 가능

## 🔍 모니터링
- Cloud Scheduler 로그에서 실행 기록 확인
- Firebase Functions 로그에서 함수 실행 결과 확인