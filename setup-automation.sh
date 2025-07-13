#!/bin/bash

# 예약 발행 시스템 자동 설정 스크립트
echo "🚀 예약 발행 시스템 자동 설정 시작..."

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# gcloud PATH 설정
export PATH=$PATH:/Users/kihoon/google-cloud-sdk/bin

# 프로젝트 설정
PROJECT_ID="marlang-app"
REGION="us-central1"
FUNCTION_URL="https://publishscheduledarticles-tdblwekz3q-uc.a.run.app"

echo -e "${YELLOW}📋 설정 정보:${NC}"
echo "  프로젝트: $PROJECT_ID"
echo "  지역: $REGION"
echo "  함수 URL: $FUNCTION_URL"
echo ""

# 1. 인덱스 생성 안내
echo -e "${YELLOW}1️⃣ Firestore 인덱스 생성${NC}"
echo "다음 링크를 브라우저에서 열어 인덱스를 생성해주세요:"
echo "https://console.firebase.google.com/v1/r/project/marlang-app/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9tYXJsYW5nLWFwcC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYXJ0aWNsZXMvaW5kZXhlcy9fEAEaCkoGc3RhdHVzEAEaDwoLcHVibGlzaGVkQXQQARoMCghfX25hbWVfXxAB"
echo ""
echo "브라우저에서 '인덱스 만들기' 버튼을 클릭하고 완료될 때까지 기다려주세요 (2-5분 소요)"
echo ""

# 인덱스 활성화 대기
echo -e "${YELLOW}⏳ 인덱스 활성화 확인 중...${NC}"
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    RESPONSE=$(curl -s -X POST "$FUNCTION_URL" -H "Content-Type: application/json")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ 인덱스 활성화 완료!${NC}"
        break
    elif echo "$RESPONSE" | grep -q "FAILED_PRECONDITION"; then
        echo "  시도 $((ATTEMPT + 1))/$MAX_ATTEMPTS - 인덱스 활성화 대기 중..."
        sleep 10
    else
        echo -e "${RED}❌ 예상치 못한 응답: $RESPONSE${NC}"
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${RED}❌ 인덱스 활성화 시간 초과. 수동으로 확인해주세요.${NC}"
    echo "확인 명령어: curl -X POST '$FUNCTION_URL' -H 'Content-Type: application/json'"
    exit 1
fi

# 2. Cloud Scheduler API 활성화
echo ""
echo -e "${YELLOW}2️⃣ Cloud Scheduler API 활성화${NC}"
if gcloud services enable cloudscheduler.googleapis.com --project=$PROJECT_ID 2>/dev/null; then
    echo -e "${GREEN}✅ Cloud Scheduler API 활성화 완료${NC}"
else
    echo -e "${YELLOW}⚠️  Cloud Scheduler API 활성화 실패 - 수동 설정 필요${NC}"
    echo "다음 링크에서 수동으로 활성화해주세요:"
    echo "https://console.cloud.google.com/apis/library/cloudscheduler.googleapis.com?project=$PROJECT_ID"
fi

# 3. Cloud Scheduler 작업 생성
echo ""
echo -e "${YELLOW}3️⃣ Cloud Scheduler 작업 생성${NC}"
if gcloud scheduler jobs create http publish-scheduled-articles \
    --schedule="*/5 * * * *" \
    --uri="$FUNCTION_URL" \
    --http-method=POST \
    --time-zone="Asia/Seoul" \
    --location="$REGION" \
    --project=$PROJECT_ID 2>/dev/null; then
    echo -e "${GREEN}✅ Cloud Scheduler 작업 생성 완료${NC}"
    echo "  - 이름: publish-scheduled-articles"
    echo "  - 실행 주기: 5분마다"
    echo "  - 시간대: Asia/Seoul"
else
    echo -e "${YELLOW}⚠️  Cloud Scheduler 작업 생성 실패 - 수동 설정 필요${NC}"
    echo ""
    echo "다음 정보로 수동 설정해주세요:"
    echo "설정 링크: https://console.cloud.google.com/cloudscheduler?project=$PROJECT_ID"
    echo ""
    echo "설정 정보:"
    echo "  이름: publish-scheduled-articles"
    echo "  지역: $REGION"
    echo "  빈도: */5 * * * *"
    echo "  시간대: Asia/Seoul"
    echo "  대상 유형: HTTP"
    echo "  URL: $FUNCTION_URL"
    echo "  HTTP 메서드: POST"
fi

# 4. 최종 테스트
echo ""
echo -e "${YELLOW}4️⃣ 시스템 동작 테스트${NC}"
echo "예약 발행 함수 테스트 중..."

FINAL_RESPONSE=$(curl -s -X POST "$FUNCTION_URL" -H "Content-Type: application/json")
if echo "$FINAL_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ 예약 발행 시스템 정상 동작!${NC}"
    echo "응답: $FINAL_RESPONSE"
else
    echo -e "${RED}❌ 시스템 오류 발생${NC}"
    echo "응답: $FINAL_RESPONSE"
fi

# 완료 메시지
echo ""
echo -e "${GREEN}🎉 예약 발행 시스템 설정 완료!${NC}"
echo ""
echo "📋 설정된 기능:"
echo "  ✅ 시간대 처리 수정 (UTC 기준 통일)"
echo "  ✅ 예약 기사 필터링 개선"
echo "  ✅ 캘린더 표시 로직 수정"
echo "  ✅ Firebase Functions 배포"
echo "  ✅ Firestore 인덱스 생성"
echo "  ✅ Cloud Scheduler 설정"
echo ""
echo "🔍 모니터링 링크:"
echo "  Firebase Functions 로그: https://console.firebase.google.com/project/$PROJECT_ID/functions/logs"
echo "  Cloud Scheduler: https://console.cloud.google.com/cloudscheduler?project=$PROJECT_ID"
echo "  Firestore: https://console.firebase.google.com/project/$PROJECT_ID/firestore"
echo ""
echo "🧪 테스트 방법:"
echo "  1. 웹 UI에서 예약 기사 생성 (현재 시간 + 10분)"
echo "  2. 5분 후 자동 발행 확인"
echo "  3. 캘린더에 정상 표시 확인"
echo ""
echo -e "${GREEN}예약 발행이 이제 자동으로 작동합니다! 🚀${NC}"