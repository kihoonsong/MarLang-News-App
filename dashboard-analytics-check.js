// 대시보드 조회수 데이터 검증 스크립트
// https://marlang-app.web.app/dashboard 의 조회수 데이터가 실제 데이터를 반영하는지 확인

const admin = require('firebase-admin');
const serviceAccount = require('./functions/service-account-key.json');

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://marlang-app-default-rtdb.firebaseio.com"
  });
}

const db = admin.firestore();

async function checkDashboardAnalytics() {
  console.log('🔍 대시보드 조회수 데이터 검증 시작...\n');

  try {
    // 1. 모든 기사의 조회수 데이터 확인
    console.log('📰 기사별 조회수 데이터 확인:');
    const articlesSnapshot = await db.collection('articles').get();
    let totalArticleViews = 0;
    let articlesWithViews = 0;
    
    articlesSnapshot.docs.forEach(doc => {
      const article = doc.data();
      const views = article.views || 0;
      totalArticleViews += views;
      if (views > 0) articlesWithViews++;
      
      console.log(`  - ${article.title?.substring(0, 50)}... : ${views} views`);
    });
    
    console.log(`\n📊 기사 조회수 요약:`);
    console.log(`  - 총 기사 수: ${articlesSnapshot.docs.length}`);
    console.log(`  - 조회수가 있는 기사: ${articlesWithViews}`);
    console.log(`  - 총 기사 조회수: ${totalArticleViews}`);

    // 2. 사용자별 조회 기록 확인
    console.log('\n👥 사용자별 조회 기록 확인:');
    const usersSnapshot = await db.collection('users').get();
    let totalUserViewRecords = 0;
    let usersWithViewRecords = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      try {
        const viewRecordsDoc = await db
          .collection('users')
          .doc(userDoc.id)
          .collection('data')
          .doc('viewRecords')
          .get();
        
        if (viewRecordsDoc.exists()) {
          const viewData = viewRecordsDoc.data();
          const records = viewData.records || [];
          totalUserViewRecords += records.length;
          if (records.length > 0) usersWithViewRecords++;
          
          console.log(`  - 사용자 ${userDoc.id}: ${records.length} 조회 기록`);
        }
      } catch (error) {
        console.warn(`  - 사용자 ${userDoc.id}: 조회 기록 확인 실패`);
      }
    }
    
    console.log(`\n📊 사용자 조회 기록 요약:`);
    console.log(`  - 총 사용자 수: ${usersSnapshot.docs.length}`);
    console.log(`  - 조회 기록이 있는 사용자: ${usersWithViewRecords}`);
    console.log(`  - 총 사용자 조회 기록: ${totalUserViewRecords}`);

    // 3. 데이터 일치성 검증
    console.log('\n🔍 데이터 일치성 분석:');
    console.log(`  - 기사 조회수 합계: ${totalArticleViews}`);
    console.log(`  - 사용자 조회 기록 합계: ${totalUserViewRecords}`);
    
    if (totalArticleViews === totalUserViewRecords) {
      console.log('  ✅ 데이터 일치: 기사 조회수와 사용자 조회 기록이 일치합니다.');
    } else {
      console.log('  ⚠️ 데이터 불일치 발견:');
      console.log(`     - 차이: ${Math.abs(totalArticleViews - totalUserViewRecords)}`);
      
      if (totalArticleViews > totalUserViewRecords) {
        console.log('     - 기사 조회수가 사용자 조회 기록보다 많습니다.');
        console.log('     - 가능한 원인: 비로그인 사용자 조회, 프리렌더링 조회수 증가');
      } else {
        console.log('     - 사용자 조회 기록이 기사 조회수보다 많습니다.');
        console.log('     - 가능한 원인: 중복 조회 기록, 삭제된 기사의 조회 기록');
      }
    }

    // 4. 대시보드에서 사용하는 계산 방식 검증
    console.log('\n📊 대시보드 계산 방식 검증:');
    console.log('  현재 대시보드는 사용자 조회 기록(viewRecords)을 기반으로 총 조회수를 계산합니다.');
    console.log(`  - 대시보드 표시 예상값: ${totalUserViewRecords}`);
    console.log(`  - 실제 기사 조회수 합계: ${totalArticleViews}`);

    // 5. 권장사항
    console.log('\n💡 권장사항:');
    if (totalArticleViews !== totalUserViewRecords) {
      console.log('  1. 대시보드 조회수 계산 방식 검토 필요');
      console.log('  2. 기사 조회수(articles.views)와 사용자 조회 기록(users.data.viewRecords) 동기화 확인');
      console.log('  3. 비로그인 사용자 조회수 처리 방식 검토');
    } else {
      console.log('  ✅ 현재 데이터는 일치하며, 대시보드가 정확한 데이터를 표시하고 있습니다.');
    }

  } catch (error) {
    console.error('❌ 검증 중 오류 발생:', error);
  }
}

// 스크립트 실행
checkDashboardAnalytics().then(() => {
  console.log('\n🏁 검증 완료');
  process.exit(0);
}).catch(error => {
  console.error('❌ 스크립트 실행 실패:', error);
  process.exit(1);
});