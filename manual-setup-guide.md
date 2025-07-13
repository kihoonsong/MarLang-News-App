# 🎯 예약 발행 시스템 수동 설정 가이드

## 🔥 **즉시 실행해야 할 작업들**

### ✅ **1단계: Firestore 인덱스 생성** (필수 - 2분)

**링크**: https://console.firebase.google.com/v1/r/project/marlang-app/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9tYXJsYW5nLWFwcC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYXJ0aWNsZXMvaW5kZXhlcy9fEAEaCgoGc3RhdHVzEAEaDwoLcHVibGlzaGVkQXQQARoMCghfX25hbWVfXxAB

**단계**:
1. 위 링크를 브라우저에서 열기
2. Google 계정으로 로그인
3. **"인덱스 만들기"** 버튼 클릭
4. 인덱스 생성 완료까지 대기 (2-5분)

**완료 확인**:
```bash
curl -X POST "https://publishscheduledarticles-tdblwekz3q-uc.a.run.app" -H "Content-Type: application/json"
```
성공 응답: `{"success":true,"publishedCount":0,"message":"발행할 예약 기사가 없습니다."}`

---

### ✅ **2단계: Cloud Scheduler 설정** (필수 - 3분)

#### **2-1. Cloud Scheduler 페이지 접속**
**링크**: https://console.cloud.google.com/cloudscheduler?project=marlang-app

#### **2-2. Cloud Scheduler API 활성화**
- 페이지에서 "API 사용 설정" 버튼 클릭 (첫 접속 시)
- 활성화 완료까지 1-2분 대기

#### **2-3. 새 작업 생성**
1. **"작업 만들기"** 버튼 클릭

2. **기본 정보 입력**:
   ```
   이름: publish-scheduled-articles
   지역: us-central1
   설명: 예약 기사 자동 발행 (5분마다)
   ```

3. **스케줄 설정**:
   ```
   빈도: */5 * * * *
   시간대: Asia/Seoul
   ```

4. **대상 구성**:
   ```
   대상 유형: HTTP
   URL: https://publishscheduledarticles-tdblwekz3q-uc.a.run.app
   HTTP 메서드: POST
   ```

5. **고급 설정** (선택사항):
   ```
   헤더:
   - Content-Type: application/json
   
   재시도 구성:
   - 최대 재시도 횟수: 3
   - 최대 재시도 기간: 1800초
   ```

6. **"만들기"** 버튼 클릭

#### **2-4. 작업 활성화 확인**
- 작업 목록에서 상태가 **"사용 설정됨"**인지 확인
- **"지금 실행"** 버튼으로 수동 테스트 가능

---

## 🧪 **테스트 및 검증**

### **3단계: 시스템 동작 테스트**

#### **3-1. 예약 기사 생성 테스트**
1. 웹 애플리케이션 접속
2. 기사 작성 페이지로 이동
3. **"예약 발행"** 옵션 선택
4. 현재 시간 + 10분 후로 설정
5. 기사 저장

#### **3-2. 자동 발행 확인**
1. Cloud Scheduler에서 5분마다 실행 확인
2. Firebase Functions 로그 모니터링
3. 예약 시간 도달 시 기사 상태 변화 확인

#### **3-3. UI 동작 확인**
- ✅ 예약 기사가 예약 목록에 표시
- ✅ 발행 후 메인 페이지에 즉시 표시
- ✅ 캘린더에 정확한 날짜로 표시
- ✅ 원래 예약 시간 정보 유지

---

## 📊 **모니터링 링크**

### **Firebase Functions 로그**
https://console.firebase.google.com/project/marlang-app/functions/logs

### **Cloud Scheduler 실행 기록**
https://console.cloud.google.com/cloudscheduler?project=marlang-app

### **Firestore 데이터베이스**
https://console.firebase.google.com/project/marlang-app/firestore

---

## 🔧 **트러블슈팅**

### **문제 1: 인덱스 오류**
**증상**: `query requires an index` 오류
**해결**: 1단계 인덱스 링크에서 수동 생성

### **문제 2: Cloud Scheduler 권한 오류**
**증상**: API 활성화 실패
**해결**: 프로젝트 소유자/편집자 권한 확인

### **문제 3: 함수 응답 오류**
**해결**: Firebase Functions 로그에서 상세 오류 확인

---

## ✅ **완료 체크리스트**

- [ ] Firestore 인덱스 생성 완료
- [ ] Cloud Scheduler API 활성화 완료  
- [ ] Cloud Scheduler 작업 생성 완료
- [ ] 작업 상태 "사용 설정됨" 확인
- [ ] 테스트 예약 기사 생성
- [ ] 5분 후 자동 발행 확인
- [ ] UI에서 정상 표시 확인

---

## 🎉 **완료 후 결과**

모든 설정 완료 시:
- 🔄 **5분마다 자동 예약 발행 체크**
- ⏰ **정확한 한국 시간 기준 발행**  
- 📅 **캘린더에 정확한 날짜 표시**
- 🎯 **발행 시간 지난 예약 기사 자동 노출**

**예약 발행 시스템이 완전 자동화됩니다!** 🚀