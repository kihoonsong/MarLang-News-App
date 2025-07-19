// 소셜 공유 버튼 컴포넌트
import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import { shareArticle } from '../utils/shareUtils';

const SocialShareButton = ({ article, size = 'medium', color = 'default' }) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleDirectShare = async () => {
    setIsSharing(true);

    try {
      // 기사 이미지 URL 준비 (메타데이터와 실제 공유용)
      const socialImageUrl = article.image ? 
        (article.image.startsWith('http') ? article.image : `${window.location.origin}${article.image}`) : 
        null;
      
      // 네이티브 공유 우선 시도, 실패하면 링크 복사
      await shareArticle(article, socialImageUrl, 'native') || await shareArticle(article, socialImageUrl, 'copy');
    } catch (error) {
      console.error('공유 오류:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Tooltip title="공유하기">
      <IconButton
        onClick={handleDirectShare}
        size={size}
        color={color}
        disabled={isSharing || !article}
      >
        {isSharing ? (
          <CircularProgress size={20} />
        ) : (
          <ShareIcon />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default SocialShareButton;