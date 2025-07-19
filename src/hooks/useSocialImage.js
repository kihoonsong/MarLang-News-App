// 소셜 이미지 생성 및 관리를 위한 커스텀 훅
import { useState, useEffect, useCallback } from 'react';
import { 
  generateSocialImage, 
  blobToDataURL, 
  getCachedSocialImage, 
  setCachedSocialImage 
} from '../utils/socialImageGenerator';

export const useSocialImage = (article) => {
  const [socialImageUrl, setSocialImageUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // 소셜 이미지 생성 함수
  const generateImage = useCallback(async () => {
    if (!article || !article.id) return;

    // 캐시된 이미지가 있는지 확인
    const cachedImage = getCachedSocialImage(article.id);
    if (cachedImage) {
      setSocialImageUrl(cachedImage);
      return cachedImage;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // 이미지 생성
      const imageBlob = await generateSocialImage(article);
      
      if (imageBlob) {
        // Blob을 Data URL로 변환
        const dataUrl = await blobToDataURL(imageBlob);
        
        // 캐시에 저장
        setCachedSocialImage(article.id, dataUrl);
        setSocialImageUrl(dataUrl);
        
        return dataUrl;
      } else {
        throw new Error('이미지 생성 실패');
      }
    } catch (err) {
      console.error('소셜 이미지 생성 오류:', err);
      setError(err.message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [article]);

  // 기사가 변경되면 자동으로 이미지 생성
  useEffect(() => {
    if (article && article.id) {
      generateImage();
    }
  }, [article?.id, generateImage]);

  // 수동으로 이미지 재생성
  const regenerateImage = useCallback(async () => {
    if (article?.id) {
      // 캐시 삭제 후 재생성
      setCachedSocialImage(article.id, null);
      return await generateImage();
    }
  }, [article?.id, generateImage]);

  return {
    socialImageUrl,
    isGenerating,
    error,
    generateImage,
    regenerateImage
  };
};