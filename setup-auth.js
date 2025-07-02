#!/usr/bin/env node

// Firebase Authentication 설정 스크립트
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

async function setupFirebaseAuth() {
  try {
    console.log('🔄 Firebase Authentication 설정 점검 중...');
    
    // Firebase Admin 앱 초기화 (프로젝트 ID만 사용)
    const app = initializeApp({
      projectId: 'marlang-app'
    });
    
    const auth = getAuth(app);
    
    // 사용자 목록 확인
    console.log('👥 현재 등록된 사용자 확인 중...');
    const listUsers = await auth.listUsers(10);
    console.log(`✅ 총 ${listUsers.users.length}명의 사용자가 등록되어 있습니다.`);
    
    listUsers.users.forEach(user => {
      console.log(`  - ${user.email || user.uid} (${user.providerData.map(p => p.providerId).join(', ')})`);
    });
    
    console.log('\n📋 Firebase Authentication 설정 확인 완료');
    console.log('🔗 다음 단계: Firebase 콘솔에서 Google 로그인 공급자를 활성화하세요.');
    console.log('   https://console.firebase.google.com/project/marlang-app/authentication/providers');
    
  } catch (error) {
    console.error('❌ Firebase Authentication 설정 오류:', error.message);
    console.log('\n🔧 해결 방법:');
    console.log('1. Firebase CLI로 로그인: firebase login');
    console.log('2. 프로젝트 선택: firebase use marlang-app');
    console.log('3. 수동으로 Firebase 콘솔에서 Authentication 설정');
  }
}

setupFirebaseAuth();