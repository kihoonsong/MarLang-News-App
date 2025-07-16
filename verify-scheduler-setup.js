#!/usr/bin/env node

// Cloud Scheduler 설정 확인 및 최종 테스트 스크립트
import axios from 'axios';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// 함수 URL
const FUNCTION_URL = 'https://publishscheduledarticles-tdblwekz3q-uc.a.run.app';

// 현재 시간 정보
function displayTimeInfo() {
  const nowUTC = new Date();
  const nowKST = new Date(nowUTC.getTime() + (9 * 60 * 60 * 1000));
  
  log('cyan', '\n⏰ 현재 시간 정보:');
  console.log(`   UTC: ${nowUTC.toISOString()}`);
  console.log(`   KST: ${nowKST.toLocaleString('ko-KR')}`);
  console.log(`   Unix Timestamp: ${Math.floor(nowUTC.getTime() / 1000)}`);
}

// 함수 상태 확인
async function checkFunctionStatus() {
  log('blue', '\n🔍 예약 발행 함수 상태 확인...');
  
  try {
    const response = await axios.post(FUNCTION_URL, {}, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.status === 200) {
      log('green', '✅ 함수 정상 작동 중');
      console.log('📊 응답:', JSON.stringify(response.data, null, 2));
      return true;
    }
  } catch (error) {
    log('red', '❌ 함수 호출 실패');
    console.error('오류:', error.message);
    return false;
  }
}

// Cloud Scheduler 설정 가이드 출력
function showSchedulerSetupGuide() {
  log('bright', '\n📋 Cloud Scheduler 설정 가이드');
  log('bright', '='.repeat(50));
  
  console.log('\n1️⃣ Google Cloud Console 접속');
  console.log('   🔗 https://console.cloud.google.com/cloudscheduler?project=marlang-app');
  
  console.log('\n2️⃣ 새 작업 만들기');
  console.log('   📝 "작업 만들기" 버튼 클릭');
  
  console.log('\n3️⃣ 작업 정보 입력');
  log('yellow', '   이름: publish-scheduled-articles');
  log('yellow', '   지역: asia-northeast3 (또는 us-central1)');
  log('yellow', '   설명: 예약 기사 자동 발행 (5분마다 실행)');
  
  console.log('\n4️⃣ 일정 설정');
  log('yellow', '   빈도: */5 * * * *');
  log('yellow', '   시간대: Asia/Seoul');
  
  console.log('\n5️⃣ 실행 구성');
  log('yellow', '   대상 유형: HTTP');
  log('yellow', `   URL: ${FUNCTION_URL}`);
  log('yellow', '   HTTP 메서드: POST');
  log('yellow', '   본문: {} (또는 비워두기)');
  
  console.log('\n6️⃣ 헤더 설정 (선택사항)');
  log('yellow', '   Content-Type: application/json');
}

// 설정 완료 후 테스트 가이드
function showTestGuide() {
  log('bright', '\n🧪 설정 완료 후 테스트 방법');
  log('bright', '='.repeat(50));
  
  console.log('\n1️⃣ 즉시 테스트');
  console.log('   - Cloud Scheduler에서 "지금 실행" 버튼 클릭');
  console.log('   - 실행 결과 확인');
  
  console.log('\n2️⃣ 예약 기사 생성 테스트');
  console.log('   - 관리자 대시보드 접속');
  console.log('   - 기사 관리 → 새 기사 작성');
  console.log('   - "예약 발행" 선택, 5분 후 시간 설정');
  console.log('   - 저장 후 자동 발행 대기');
  
  console.log('\n3️⃣ 모니터링');
  console.log('   📊 Firebase Console: https://console.firebase.google.com/project/marlang-app/firestore/data/articles');
  console.log('   📊 Functions 로그: https://console.cloud.google.com/functions/details/us-central1/publishScheduledArticles?project=marlang-app');
  console.log('   📊 Scheduler 상태: https://console.cloud.google.com/cloudscheduler?project=marlang-app');
}

// 문제 해결 가이드
function showTroubleshootingGuide() {
  log('bright', '\n🔧 문제 해결 가이드');
  log('bright', '='.repeat(50));
  
  console.log('\n❌ 함수 호출 실패 시:');
  console.log('   1. 함수 URL 확인');
  console.log('   2. 함수 권한 설정 (allUsers 호출 허용)');
  console.log('   3. Cloud Functions 로그 확인');
  
  console.log('\n❌ 예약 기사가 발행되지 않을 시:');
  console.log('   1. 기사 status가 "scheduled"인지 확인');
  console.log('   2. publishedAt 시간이 UTC 기준으로 올바른지 확인');
  console.log('   3. Firestore 인덱스 활성화 확인');
  
  console.log('\n❌ 시간대 문제 시:');
  console.log('   - 모든 시간은 UTC 기준으로 저장');
  console.log('   - 한국 시간 입력 → UTC 변환 → 저장');
  console.log('   - 표시 시 UTC → 한국 시간 변환');
}

// 메인 실행 함수
async function main() {
  log('bright', '🎯 예약 발행 시스템 설정 완료 가이드');
  log('bright', '='.repeat(60));
  
  displayTimeInfo();
  
  // 함수 상태 확인
  const functionWorking = await checkFunctionStatus();
  
  if (functionWorking) {
    log('green', '\n✅ 예약 발행 함수가 정상 작동 중입니다!');
    showSchedulerSetupGuide();
    showTestGuide();
  } else {
    log('red', '\n❌ 함수에 문제가 있습니다. 먼저 함수를 수정해주세요.');
  }
  
  showTroubleshootingGuide();
  
  log('bright', '\n🎉 설정 완료 후 예약 발행 시스템이 완전히 자동화됩니다!');
}

// 스크립트 실행
main().catch(error => {
  log('red', '🚨 오류 발생:');
  console.error(error);
  process.exit(1);
});