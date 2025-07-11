import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Auth 초기화
export const auth = getAuth(app);

// Firestore 초기화
export const db = getFirestore(app);

// Storage 초기화
export const storage = getStorage(app); 

// Google OAuth 공급자 설정
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// 개발 환경에서 Firebase 설정 상태 확인 (민감 정보 제외)
if (import.meta.env.DEV) {
  const hasRequiredConfigs = firebaseConfig.projectId && firebaseConfig.authDomain && firebaseConfig.apiKey;
  console.log('🔥 Firebase config status:', {
    configured: hasRequiredConfigs ? '✓' : '✗',
    projectId: firebaseConfig.projectId ? '✓' : '✗',
    authDomain: firebaseConfig.authDomain ? '✓' : '✗',
    apiKey: firebaseConfig.apiKey ? '✓' : '✗',
    storageSet: firebaseConfig.storageBucket ? '✓' : '✗',
    messagingSet: firebaseConfig.messagingSenderId ? '✓' : '✗',
    appIdSet: firebaseConfig.appId ? '✓' : '✗'
  });
  
  if (!hasRequiredConfigs) {
    console.warn('⚠️ Firebase config incomplete. Check environment variables.');
  }
}