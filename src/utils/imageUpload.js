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

    // 파일명 생성 (중복 방지)
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomId}.${extension}`;

    // Storage 참조 생성
    const storageRef = ref(storage, `${path}/${fileName}`);

    // 파일 업로드
    const snapshot = await uploadBytes(storageRef, file);
    
    // 다운로드 URL 획득
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      fileName: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
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