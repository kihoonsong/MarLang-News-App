import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  Box, IconButton, Button, Snackbar, Alert, Typography, Tooltip
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShareIcon from '@mui/icons-material/Share';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const ActionsContainer = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-top: 1px solid ${props => props.theme.palette.divider};
  margin-top: 32px;
  gap: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const LeftActions = styled(Box)`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const RightActions = styled(Box)`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const NavigationActions = styled(Box)`
  display: flex;
  align-items: center;
  gap: 8px;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const LikeButton = styled(IconButton)`
  color: ${props => props.$isLiked ? props.theme.palette.error.main : props.theme.palette.action.active};
  transition: all 0.3s ease;
  
  &:hover {
    color: ${props => props.theme.palette.error.main};
    transform: scale(1.1);
  }
`;

const ShareButton = styled(IconButton)`
  color: ${props => props.theme.palette.primary.main};
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const NavButton = styled(Button)`
  border-radius: 8px;
  text-transform: none;
  min-width: 120px;
  
  @media (max-width: 768px) {
    min-width: 80px;
    font-size: 0.8rem;
  }
`;

const LikeCount = styled(Typography)`
  margin-left: 8px;
  color: ${props => props.theme?.palette?.text?.secondary || '#666666'};
  font-weight: 500;
`;

const ArticleActions = ({ 
  article,
  isLiked,
  likeCount,
  onLikeToggle,
  onNavigatePrev,
  onNavigateNext,
  hasNextArticle,
  hasPrevArticle 
}) => {
  const [shareSnackbar, setShareSnackbar] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        // 네이티브 공유 API 사용 (모바일)
        await navigator.share({
          title: article.title,
          text: article.summary || 'Check out this article',
          url: window.location.href
        });
      } else {
        // 폴백: 클립보드에 복사
        await navigator.clipboard.writeText(window.location.href);
        setShareSnackbar(true);
      }
    } catch (error) {
      console.error('공유 실패:', error);
      // 폴백: 클립보드에 복사 시도
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShareSnackbar(true);
      } catch (clipboardError) {
        console.error('클립보드 복사 실패:', clipboardError);
      }
    }
  };

  const handleLike = () => {
    onLikeToggle(article.id, !isLiked);
  };

  return (
    <>
      <ActionsContainer>
        <LeftActions>
          <Box display="flex" alignItems="center">
            <Tooltip title={isLiked ? "Remove from favorites" : "Add to favorites"}>
              <LikeButton 
                $isLiked={isLiked}
                onClick={handleLike}
                size="large"
              >
                {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </LikeButton>
            </Tooltip>
            {likeCount > 0 && (
              <LikeCount variant="body2">
                {likeCount}
              </LikeCount>
            )}
          </Box>

          <Tooltip title="Share article">
            <ShareButton 
              onClick={handleShare}
              size="large"
            >
              <ShareIcon />
            </ShareButton>
          </Tooltip>
        </LeftActions>

        <NavigationActions>
          <NavButton
            variant="outlined"
            startIcon={<ArrowBackIosIcon />}
            onClick={onNavigatePrev}
            disabled={!hasPrevArticle}
            size="medium"
          >
            Previous
          </NavButton>

          <NavButton
            variant="outlined"
            endIcon={<ArrowForwardIosIcon />}
            onClick={onNavigateNext}
            disabled={!hasNextArticle}
            size="medium"
          >
            Next
          </NavButton>
        </NavigationActions>
      </ActionsContainer>

      <Snackbar
        open={shareSnackbar}
        autoHideDuration={3000}
        onClose={() => setShareSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShareSnackbar(false)}>
          Link copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
};

export default ArticleActions;