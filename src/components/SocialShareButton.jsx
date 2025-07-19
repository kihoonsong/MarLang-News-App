// 소셜 공유 버튼 컴포넌트
import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  CircularProgress,
  Box
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import LinkIcon from '@mui/icons-material/Link';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TelegramIcon from '@mui/icons-material/Telegram';
import EmailIcon from '@mui/icons-material/Email';
import { shareArticle, getAvailablePlatforms } from '../utils/shareUtils';
import { useEnhancedToast } from './EnhancedToastProvider';

// 플랫폼별 아이콘 매핑
const platformIcons = {
  native: ShareIcon,
  copy: LinkIcon,
  facebook: FacebookIcon,
  twitter: TwitterIcon,
  linkedin: LinkedInIcon,
  whatsapp: WhatsAppIcon,
  telegram: TelegramIcon,
  email: EmailIcon
};

const SocialShareButton = ({ article, size = 'medium', color = 'default' }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const toast = useEnhancedToast();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleShare = async (platform) => {
    setIsSharing(true);
    handleClose();

    try {
      // 일반적인 공유 방식 (메타데이터 기반)
      const success = await shareArticle(article, null, platform);
      
      if (success) {
        let message = '공유되었습니다!';
        if (platform === 'copy') {
          message = '링크가 클립보드에 복사되었습니다!';
        }
        
        toast?.show({
          message,
          type: 'success',
          duration: 2000,
          position: 'bottom'
        });
      } else {
        throw new Error('공유 실패');
      }
    } catch (error) {
      console.error('공유 오류:', error);
      toast?.show({
        message: '공유에 실패했습니다. 다시 시도해주세요.',
        type: 'error',
        duration: 3000,
        position: 'bottom'
      });
    } finally {
      setIsSharing(false);
    }
  };

  const availablePlatforms = getAvailablePlatforms();

  return (
    <>
      <Tooltip title="공유하기">
        <IconButton
          onClick={handleClick}
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

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            minWidth: 200,
            maxHeight: 400,
            '& .MuiMenuItem-root': {
              py: 1,
            }
          }
        }}
      >
        {/* 공유 플랫폼 목록 */}
        {availablePlatforms.map((platform) => {
          const IconComponent = platformIcons[platform.id] || ShareIcon;
          
          return (
            <MenuItem
              key={platform.id}
              onClick={() => handleShare(platform.id)}
              disabled={isSharing}
            >
              <ListItemIcon>
                <IconComponent fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={platform.name} />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default SocialShareButton;