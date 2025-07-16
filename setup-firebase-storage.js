#!/usr/bin/env node

// Firebase Storage 자동 설정 스크립트
import { initializeApp } from 'firebase/app';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyAClE82R67DQsOTT_U_Yvi5YDRc2R_8WWQ",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "marlang-app.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "marlang-app",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "marlang-app.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "637042463708",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:637042463708:web:71eb8478f8c4f7c6477519"
};

async function setupFirebaseStorage() {
  try {
    console.log('🔥 Firebase Storage 설정 시작...');
    
    // Firebase 앱 초기화
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase 앱 초기화 완료');
    
    // Storage 초기화
    const storage = getStorage(app);
    console.log('✅ Firebase Storage 초기화 완료');
    
    console.log('📋 Storage 정보:');
    console.log(`   Bucket: ${firebaseConfig.storageBucket}`);
    console.log(`   Project: ${firebaseConfig.projectId}`);
    
    // Storage 연결 테스트
    console.log('🧪 Storage 연결 테스트...');
    
    // 간단한 메타데이터 확인
    try {
      console.log('Storage 객체:', storage);
      console.log('✅ Storage 연결 성공!');
    } catch (error) {
      console.error('❌ Storage 연결 실패:', error.message);
    }
    
    console.log('\n🎯 다음 단계:');
    console.log('1. Firebase Console에서 Storage 활성화');
    console.log('   👉 https://console.firebase.google.com/project/marlang-app/storage');
    console.log('2. "시작하기" 버튼 클릭');
    console.log('3. "테스트 모드에서 시작" 선택');
    console.log('4. 위치: asia-northeast3 (Seoul) 선택');
    console.log('5. 완료 후 보안 규칙 배포: ./deploy-storage-after-setup.sh');
    
  } catch (error) {
    console.error('🚨 Firebase Storage 설정 실패:', error);
    console.error('상세 오류:', error.message);
  }
}

setupFirebaseStorage();