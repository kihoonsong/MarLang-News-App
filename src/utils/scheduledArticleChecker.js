// 예약 기사 자동 발행 로직 (한국 시간 기준)
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getKoreanTimeISOString, isAfterKoreanTime } from './timeUtils';

/**
 * 예약 시간이 지난 기사들을 찾아서 자동으로 발행 상태로 변경
 * 한국 시간 기준으로 동작하는 클라이언트 사이드 체크 로직
 */
export const checkAndPublishScheduledArticles = async () => {
  try {
    const koreanNow = getKoreanTimeISOString();
    
    // scheduled 상태이면서 발행 시간이 지난 기사들 조회
    const articlesRef = collection(db, 'articles');
    const q = query(
      articlesRef,
      where('status', '==', 'scheduled'),
      where('publishedAt', '<=', koreanNow)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('📅 발행할 예약 기사가 없습니다.');
      return 0;
    }
    
    let publishedCount = 0;
    
    // 각 기사의 상태를 published로 변경
    const updatePromises = querySnapshot.docs.map(async (docSnapshot) => {
      const articleData = docSnapshot.data();
      const docRef = doc(db, 'articles', docSnapshot.id);
      
      // 한국 시간 기준으로 실제 발행 시간이 지났는지 다시 확인
      if (!isAfterKoreanTime(articleData.publishedAt)) {
        return; // 아직 발행 시간이 안 됨
      }
      
      try {
        await updateDoc(docRef, {
          status: 'published',
          actualPublishedAt: getKoreanTimeISOString(), // 실제 발행된 시간 기록 (한국 시간)
          updatedAt: getKoreanTimeISOString()
        });
        
        console.log(`✅ 예약 기사 자동 발행 (한국 시간): ${articleData.title}`);
        publishedCount++;
        
        // 전역 이벤트 발생으로 다른 컴포넌트에 알림
        window.dispatchEvent(new CustomEvent('articleUpdated', {
          detail: { 
            type: 'scheduled-publish', 
            article: { ...articleData, id: docSnapshot.id, status: 'published' }
          }
        }));
        
      } catch (error) {
        console.error(`❌ 예약 기사 발행 실패: ${articleData.title}`, error);
      }
    });
    
    await Promise.all(updatePromises);
    
    if (publishedCount > 0) {
      console.log(`🚀 총 ${publishedCount}개의 예약 기사가 자동 발행되었습니다.`);
    }
    
    return publishedCount;
    
  } catch (error) {
    console.error('🚨 예약 기사 체크 중 오류 발생:', error);
    return 0;
  }
};

/**
 * 주기적으로 예약 기사를 체크하는 함수
 * 5분마다 실행
 */
export const startScheduledArticleChecker = () => {
  // 즉시 한번 실행
  checkAndPublishScheduledArticles();
  
  // 5분마다 체크
  const interval = setInterval(() => {
    checkAndPublishScheduledArticles();
  }, 5 * 60 * 1000); // 5분 = 300,000ms
  
  console.log('⏰ 예약 기사 자동 발행 체크 시작 (5분 간격, 한국 시간 기준)');
  
  // 정리 함수 반환
  return () => {
    clearInterval(interval);
    console.log('⏰ 예약 기사 자동 발행 체크 중지');
  };
};