#!/usr/bin/env node

// 예약 발행 시스템 종합 테스트 스크립트
import axios from 'axios';

const FUNCTION_URLS = {
  auto: 'https://publishscheduledarticles-tdblwekz3q-uc.a.run.app',
  manual: 'https://publishscheduledarticlesmanual-tdblwekz3q-uc.a.run.app'
};

const PROJECT_ID = 'marlang-app';

// 색상 출력을 위한 유틸리티
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

// 현재 시간 정보 출력 (올바른 시간대 계산)
function displayCurrentTime() {
  const nowUTC = new Date();
  
  log('cyan', '\n⏰ 현재 시간 정보:');
  console.log(`   UTC: ${nowUTC.toISOString()}`);
  console.log(`   KST: ${nowUTC.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
}

// 함수 호출 테스트
async function testFunction(type = 'auto') {
  const url = FUNCTION_URLS[type];
  const functionName = type === 'auto' ? '자동 발행' : '수동 발행';
  
  log('blue', `\n🧪 ${functionName} 함수 테스트 시작...`);
  log('yellow', `📡 URL: ${url}`);
  
  try {
    const startTime = Date.now();
    const response = await axios.post(url, {}, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.status === 200) {
      log('green', `✅ ${functionName} 함수 호출 성공 (${duration}ms)`);
      console.log('📊 응답 데이터:', JSON.stringify(response.data, null, 2));
      
      if (response.data.publishedCount > 0) {
        log('green', `🚀 ${response.data.publishedCount}개 기사가 발행되었습니다!`);
        if (response.data.publishedArticles) {
          response.data.publishedArticles.forEach(article => {
            console.log(`   📰 ${article.title} (ID: ${article.id})`);
          });
        }
      } else {
        log('yellow', '📅 발행할 예약 기사가 없습니다.');
      }
    } else {
      log('red', `❌ ${functionName} 함수 호출 실패: HTTP ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    log('red', `🚨 ${functionName} 함수 호출 오류:`);
    if (error.response) {
      console.error(`   HTTP ${error.response.status}: ${error.response.statusText}`);
      console.error('   응답 데이터:', error.response.data);
    } else if (error.request) {
      console.error('   네트워크 오류: 응답을 받지 못했습니다.');
    } else {
      console.error('   오류:', error.message);
    }
    return null;
  }
}

// 메인 테스트 함수
async function runTests() {
  log('bright', '🎯 예약 발행 시스템 종합 테스트 시작');
  log('bright', '='.repeat(50));
  
  displayCurrentTime();
  
  // 1. 현재 상태 확인
  log('cyan', '\n1️⃣ 현재 예약 기사 상태 확인');
  await testFunction('auto');
  
  // 2. 수동 발행 테스트
  const runManual = process.argv.includes('--manual');
  if (runManual) {
    log('cyan', '\n2️⃣ 수동 발행 테스트');
    await testFunction('manual');
  }
  
  // 3. 모니터링 링크 제공
  log('cyan', '\n📊 모니터링 링크:');
  console.log(`   Firebase Console: https://console.firebase.google.com/project/${PROJECT_ID}/firestore/data/articles`);
  console.log(`   Cloud Functions 로그: https://console.cloud.google.com/functions/details/us-central1/publishScheduledArticles?project=${PROJECT_ID}`);
  console.log(`   Cloud Scheduler: https://console.cloud.google.com/cloudscheduler?project=${PROJECT_ID}`);
  
  log('bright', '\n✨ 테스트 완료!');
}

// 도움말 출력
function showHelp() {
  log('bright', '📖 예약 발행 시스템 테스트 도구');
  console.log('\n사용법:');
  console.log('  node test-scheduled-publishing.js [옵션]');
  console.log('\n옵션:');
  console.log('  --manual         수동 발행 테스트 실행');
  console.log('  --help           이 도움말 표시');
  console.log('\n예시:');
  console.log('  node test-scheduled-publishing.js');
  console.log('  node test-scheduled-publishing.js --manual');
}

// 스크립트 실행
if (process.argv.includes('--help')) {
  showHelp();
} else {
  runTests().catch(error => {
    log('red', '🚨 테스트 실행 중 오류 발생:');
    console.error(error);
    process.exit(1);
  });
}