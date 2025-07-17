import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box, Card, Typography, Button, Slider, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, IconButton, Alert
} from '@mui/material';
import {
  ZoomIn, ZoomOut, Refresh, CheckCircle, Cancel
} from '@mui/icons-material';

const ImageThumbnailPreview = ({ 
  imageFile, 
  onCropComplete, 
  onCancel,
  thumbnailSize = { width: 300, height: 200 }
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // 이미지 로드
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target.result);
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  // 크롭 완료 처리
  const handleCropComplete = () => {
    if (onCropComplete) {
      onCropComplete({
        original: imageUrl,
        thumbnail: imageUrl, // 임시로 원본 이미지 사용
        cropData: {
          position: cropPosition,
          zoom: zoom,
          thumbnailSize: thumbnailSize
        }
      });
    }
  };

  return (
    <Dialog open={!!imageFile} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight="bold">
          📸 썸네일 미리보기
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          이미지 미리보기 기능입니다. 썸네일 편집 기능은 곧 추가될 예정입니다.
        </Alert>

        {imageUrl && (
          <Box sx={{ textAlign: 'center' }}>
            <img
              src={imageUrl}
              alt="미리보기"
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                borderRadius: '8px',
                objectFit: 'contain'
              }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onCancel} startIcon={<Cancel />} color="inherit">
          취소
        </Button>
        <Button onClick={handleCropComplete} startIcon={<CheckCircle />} variant="contained" color="primary">
          이미지 적용
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageThumbnailPreview;
