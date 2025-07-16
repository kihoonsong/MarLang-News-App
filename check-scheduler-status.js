#!/usr/bin/env node

// Cloud Scheduler 상태 확인 스크립트
import axios from 'axios';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

const log = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

async function checkSchedulerStatus() {
  log('cyan', '🔍 Cloud Scheduler 설정 상태 확인');
  log('cyan', '='.repeat(50));
  
  // 현재 시간 표시
  const now = new Date();
  const kstTime = now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  console.log(`⏰ 현재 시간 (KST): ${kstTime}`);
  console.log(`⏰ 현재 시간 (UTC): ${now.toISOString()}`);
  
  // 함수 호출 테스트
  try {
    log('blue', '\n📡 예약 발행 함수 테스트...');
    const response = await axios.post('https://publishscheduledarticles-tdblwekz3q-uc.a.run.app', {}, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.status === 200) {
      log('green', '✅ 함수 정상 작동!');
      console.log(`📊 응답: ${response.data.message}`);
      
      if (response.data.publishedCount > 0) {
        log('green', `🚀 ${response.data.publishedCount}개 기사가 발행되었습니다!`);
      }
    }
  } catch (error) {
    log('red', '❌ 함수 호출 실패:');
    console.error(error.message);
  }
  
  // Cloud Scheduler 설정 확인 가이드
  log('yellow', '\n📋 Cloud Scheduler 설정 확인 방법:');
  console.log('1. https://console.cloud.google.com/cloudscheduler?project=marlang-app 접속');
  console.log('2. "publish-scheduled-articles" 작업이 있는지 확인');
  console.log('3. 작업 상태가 "사용 설정됨"인지 확인');
  console.log('4. "지금 실행" 버튼으로 수동 테스트');
  
  log('cyan', '\n🧪 예약 발행 테스트 방법:');
  console.log('1. https://marlang-app.web.app/dashboard 접속');
  console.log('2. 기사 관리 → 새 기사 작성');
  console.log('3. "예약 발행" 선택, 현재 시간 + 10분 설정');
  console.log('4. 저장 후 10분 대기');
  console.log('5. 자동 발행 확인');
  
  log('blue', '\n📊 모니터링 링크:');
  console.log('• Cloud Scheduler: https://console.cloud.google.com/cloudscheduler?project=marlang-app');
  console.log('• Functions 로그: https://console.cloud.google.com/functions/details/us-central1/publishScheduledArticles?project=marlang-app');
  console.log('• Firestore DB: https://console.firebase.google.com/project/marlang-app/firestore/data/articles');
  
  // 다음 실행 시간 예측
  const nextRun = new Date(now.getTime() + (5 * 60 * 1000));
  const nextRunKST = nextRun.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  
  log('green', `\n⏰ 다음 자동 실행 예정 시간: ${nextRunKST}`);
  log('green', '🎯 Cloud Scheduler가 설정되었다면 5분마다 자동 실행됩니다!');
}

checkSchedulerStatus().catch(console.error);