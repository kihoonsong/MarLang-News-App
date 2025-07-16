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
  
  // 현재 UTC 시간
  const nowUTC = new Date();
  
  // 2분 후 예약 발행 시간 설정 (테스트를 위해 짧게)
  const scheduledTimeUTC = new Date(nowUTC.getTime() + (2 * 60 * 1000)); // 2분 후
  const scheduledTimeISO = scheduledTimeUTC.toISOString();
  
  // 한국 시간으로 표시용
  const nowKST = new Date(nowUTC.getTime() + (9 * 60 * 60 * 1000));
  const scheduledTimeKST = new Date(scheduledTimeUTC.getTime() + (9 * 60 * 60 * 1000));
  
  console.log(`현재 시간 - UTC: ${nowUTC.toISOString()}, KST: ${nowKST.toLocaleString('ko-KR')}`);
  console.log(`예약 시간 - UTC: ${scheduledTimeISO}, KST: ${scheduledTimeKST.toLocaleString('ko-KR')}`);
  
  const testArticle = {
    title: '[테스트] 예약 발행 기능 테스트',
    content: `이 기사는 예약 발행 시스템 테스트를 위해 생성되었습니다.

📅 예약 시간 (한국): ${scheduledTimeKST.toLocaleString('ko-KR')}
📅 예약 시간 (UTC): ${scheduledTimeISO}
🕐 생성 시간 (한국): ${nowKST.toLocaleString('ko-KR')}
🕐 생성 시간 (UTC): ${nowUTC.toISOString()}

시스템이 정상 작동한다면 이 기사는 예약된 시간에 자동으로 발행됩니다.

테스트 절차:
1. 이 기사가 'scheduled' 상태로 저장됨
2. Cloud Scheduler가 5분마다 publishScheduledArticles 함수 호출
3. 예약 시간이 지나면 자동으로 'published' 상태로 변경
4. actualPublishedAt 필드에 실제 발행 시간 기록`,
    category: 'Technology',
    status: 'scheduled',
    publishedAt: scheduledTimeISO, // UTC 시간으로 저장
    createdAt: nowUTC.toISOString(),
    updatedAt: nowUTC.toISOString(),
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