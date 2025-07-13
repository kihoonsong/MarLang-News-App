// 테스트용 예약 기사 생성 스크립트
const admin = require('firebase-admin');

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'marlang-app'
  });
}

const db = admin.firestore();

async function createTestScheduledArticle() {
  console.log('🧪 테스트용 예약 기사 생성 시작...');
  
  // 5분 후 예약 발행 시간 설정
  const now = new Date();
  const scheduledTime = new Date(now.getTime() + (5 * 60 * 1000)); // 5분 후
  
  // 클라이언트와 동일한 방식으로 UTC 변환
  const utcScheduledTime = new Date(scheduledTime.getTime() - (9 * 60 * 60 * 1000));
  const scheduledTimeISO = utcScheduledTime.toISOString();
  
  console.log(`현재 시간 (한국): ${now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
  console.log(`예약 시간 (한국): ${scheduledTime.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
  console.log(`저장될 시간 (UTC): ${scheduledTimeISO}`);
  
  const testArticle = {
    title: '[테스트] 예약 발행 기능 테스트',
    content: `이 기사는 예약 발행 시스템 테스트를 위해 생성되었습니다.
    
예약 시간: ${scheduledTime.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
생성 시간: ${now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
    
시스템이 정상 작동한다면 이 기사는 예약된 시간에 자동으로 발행됩니다.`,
    category: 'Technology',
    status: 'scheduled',
    publishedAt: scheduledTimeISO,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    author: 'System Test',
    likes: 0,
    views: 0,
    tags: ['test', 'scheduled-publishing', 'automation']
  };
  
  try {
    const docRef = await db.collection('articles').add(testArticle);
    console.log(`✅ 테스트 기사 생성 완료 - ID: ${docRef.id}`);
    console.log(`📅 ${scheduledTime.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}에 자동 발행 예정`);
    console.log('🔍 Firebase Console에서 상태 확인 가능:');
    console.log(`   https://console.firebase.google.com/project/marlang-app/firestore/data/articles/${docRef.id}`);
    
    return {
      id: docRef.id,
      scheduledTime: scheduledTime,
      scheduledTimeKST: scheduledTime.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      scheduledTimeUTC: scheduledTimeISO
    };
  } catch (error) {
    console.error('❌ 테스트 기사 생성 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  createTestScheduledArticle()
    .then((result) => {
      console.log('\n🎯 다음 단계:');
      console.log('1. Cloud Scheduler 설정 완료');
      console.log('2. 5분 후 자동 발행 여부 확인');
      console.log('3. Firebase Functions 로그 모니터링');
      process.exit(0);
    })
    .catch((error) => {
      console.error('테스트 기사 생성 실패:', error);
      process.exit(1);
    });
}

module.exports = { createTestScheduledArticle };