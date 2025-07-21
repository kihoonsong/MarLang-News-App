import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

export const uploadImage = async (file, path = 'announcements') => {
  try {
    // 파일 유효성 검사
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('유효한 이미지 파일이 아닙니다.');
    }

    // 파일 크기 제한 (5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('파일 크기가 5MB를 초과합니다.');
    }

    // Storage 초기화 확인
    if (!storage) {
      throw new Error('Firebase Storage가 초기화되지 않았습니다.');
    }
    
    // Firebase 인증 상태 확인
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('로그인이 필요합니다. 다시 로그인해 주세요.');
    }
    
    // 사용자 역할 확인 (Firestore에서 직접 가져옴)
    try {
      const { getFirestore, doc, getDoc } = await import('firebase/firestore');
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('사용자 정보를 찾을 수 없습니다. 다시 로그인해 주세요.');
      }
      
      const userData = userDoc.data();
      const userRole = userData.role;
      
      console.log('현재 사용자 정보:', {
        uid: currentUser.uid,
        email: currentUser.email,
        role: userRole,
        isAnonymous: currentUser.isAnonymous,
        emailVerified: currentUser.emailVerified
      });
      
      if (!['admin', 'super_admin'].includes(userRole)) {
        throw new Error(`이미지 업로드 권한이 없습니다. 현재 역할: ${userRole || '없음'}`);
      }
      
    } catch (firestoreError) {
      console.error('사용자 역할 확인 실패:', firestoreError);
      throw new Error(`사용자 권한 확인 실패: ${firestoreError.message}`);
    }

    // 파일명 생성 (중복 방지)
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomId}.${extension}`;

    console.log(`📸 이미지 업로드 시작: ${fileName} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Storage 참조 생성
    const storageRef = ref(storage, `${path}/${fileName}`);

    // 파일 업로드
    const snapshot = await uploadBytes(storageRef, file);
    
    // 다운로드 URL 획득
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log(`✅ 이미지 업로드 완료: ${downloadURL}`);
    
    return {
      url: downloadURL,
      fileName: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error('🚨 이미지 업로드 실패:', error);
    console.error('에러 코드:', error.code);
    console.error('에러 메시지:', error.message);
    
    // 더 구체적인 에러 메시지 제공
    if (error.code === 'storage/unauthorized') {
      throw new Error(`Firebase Storage 권한이 없습니다. 관리자에게 문의하세요. (에러: ${error.code})`);
    } else if (error.code === 'storage/unknown' || error.message.includes('Firebase Storage has not been set up')) {
      throw new Error(`Firebase Storage가 설정되지 않았습니다. 관리자에게 문의하세요. (에러: ${error.code})`);
    } else if (error.code === 'storage/quota-exceeded') {
      throw new Error('Storage 용량이 초과되었습니다. 관리자에게 문의하세요.');
    } else if (error.code === 'storage/invalid-format') {
      throw new Error('지원되지 않는 이미지 형식입니다.');
    } else if (error.code === 'storage/unauthenticated') {
      throw new Error('인증되지 않은 사용자입니다. 다시 로그인해 주세요.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('이미지 업로드가 취소되었습니다.');
    } else if (error.code === 'storage/retry-limit-exceeded') {
      throw new Error('네트워크 문제로 업로드에 실패했습니다. 인터넷 연결을 확인해 주세요.');
    } else if (error.message && error.message.includes('권한')) {
      throw new Error(`권한 오류: ${error.message}. Firebase Storage 보안 규칙을 확인해 주세요.`);
    }
    
    throw error;
  }
};

export const uploadMultipleImages = async (files, path = 'announcements') => {
  try {
    const uploadPromises = Array.from(files).map(file => uploadImage(file, path));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('다중 이미지 업로드 실패:', error);
    throw error;
  }
};

export const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: '지원되지 않는 파일 형식입니다. (JPEG, PNG, GIF, WebP만 허용)' };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: '파일 크기가 5MB를 초과합니다.' };
  }

  return { isValid: true };
};

// 사용자 권한 확인 함수 (디버깅용)
export const checkUserPermissions = async () => {
  try {
    const { getAuth } = await import('firebase/auth');
    const { getFirestore, doc, getDoc } = await import('firebase/firestore');
    
    const auth = getAuth();
    const db = getFirestore();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      return { success: false, error: '로그인되지 않음' };
    }
    
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    
    if (!userDoc.exists()) {
      return { success: false, error: '사용자 문서가 존재하지 않음' };
    }
    
    const userData = userDoc.data();
    
    return {
      success: true,
      user: {
        uid: currentUser.uid,
        email: currentUser.email,
        role: userData.role,
        isAdmin: ['admin', 'super_admin'].includes(userData.role),
        userData: userData
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};