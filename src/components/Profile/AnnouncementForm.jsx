import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { FiX, FiUpload, FiSave, FiImage, FiTrash2 } from 'react-icons/fi';
import { MdPushPin } from 'react-icons/md';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
`;

const ModalTitle = styled.h2`
  color: #2d3748;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: #f7fafc;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #edf2f7;
  }
`;

const Form = styled.form`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: #2d3748;
  font-size: 14px;
  font-weight: 500;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  min-height: 200px;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const ImageUploadSection = styled.div`
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: #667eea;
  }

  &.dragover {
    border-color: #667eea;
    background: #f7fafc;
  }
`;

const UploadButton = styled.button`
  type: button;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #5a67d8;
  }
`;

const ImagePreview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 16px;
`;

const ImageItem = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 120px;
  object-fit: cover;
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${props => props.variant === 'primary' && `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
  `}

  ${props => props.variant === 'secondary' && `
    background: #f7fafc;
    color: #4a5568;
    border: 1px solid #e2e8f0;
    
    &:hover:not(:disabled) {
      background: #edf2f7;
    }
  `}
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const AnnouncementForm = ({ announcement, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: announcement?.title || '',
    content: announcement?.content || '',
    type: announcement?.type || 'general',
    isSticky: announcement?.isSticky || false,
    images: announcement?.images || []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileSelect = async (files) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const { validateImageFile } = await import('../../utils/imageUpload');
      
      const validFiles = [];
      const fileArray = Array.from(files);
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const validation = validateImageFile(file);
        
        if (validation.isValid) {
          validFiles.push(file);
        } else {
          alert(`파일 "${file.name}": ${validation.error}`);
        }
      }
      
      if (validFiles.length === 0) {
        setIsUploading(false);
        return;
      }
      
      // 파일 미리보기 생성
      const newImages = [];
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const reader = new FileReader();
        
        await new Promise((resolve) => {
          reader.onload = (e) => {
            newImages.push({
              id: Date.now() + Math.random() + i,
              file: file,
              url: e.target.result,
              name: file.name,
              size: file.size,
              type: file.type
            });
            resolve();
          };
          reader.readAsDataURL(file);
        });
        
        // 진행률 업데이트
        setUploadProgress(Math.round(((i + 1) / validFiles.length) * 100));
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
      
    } catch (error) {
      console.error('파일 선택 중 오류:', error);
      alert('파일 선택 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileUpload = (e) => {
    handleFileSelect(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImage = (imageId) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('공지사항 저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            {announcement ? '공지사항 수정' : '공지사항 작성'}
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <FiX size={20} />
          </CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>제목</Label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="공지사항 제목을 입력하세요"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>내용</Label>
            <TextArea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="공지사항 내용을 입력하세요"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>유형</Label>
            <Select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
            >
              <option value="general">일반</option>
              <option value="update">업데이트</option>
              <option value="maintenance">점검</option>
              <option value="urgent">긴급</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <CheckboxGroup>
              <Checkbox
                type="checkbox"
                name="isSticky"
                checked={formData.isSticky}
                onChange={handleInputChange}
              />
              <Label>
                <MdPushPin size={16} style={{ marginRight: '4px' }} />
                상단 고정
              </Label>
            </CheckboxGroup>
          </FormGroup>

          <FormGroup>
            <Label>이미지 첨부</Label>
            <ImageUploadSection
              className={isDragOver ? 'dragover' : ''}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FiImage size={32} color="#a0aec0" />
              <p style={{ margin: '12px 0', color: '#4a5568' }}>
                이미지를 드래그하여 업로드하거나 버튼을 클릭하세요
                <br />
                <small style={{ color: '#718096' }}>
                  지원 형식: JPEG, PNG, GIF, WebP (최대 5MB)
                </small>
              </p>
              {isUploading && (
                <div style={{ margin: '12px 0' }}>
                  <div style={{ 
                    width: '100%', 
                    height: '4px', 
                    backgroundColor: '#e2e8f0', 
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div 
                      style={{ 
                        width: `${uploadProgress}%`, 
                        height: '100%', 
                        backgroundColor: '#667eea',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <p style={{ margin: '8px 0', color: '#4a5568', fontSize: '14px' }}>
                    업로드 중... {uploadProgress}%
                  </p>
                </div>
              )}
              <UploadButton 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <FiUpload size={16} />
                {isUploading ? '업로드 중...' : '이미지 선택'}
              </UploadButton>
              <HiddenFileInput
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </ImageUploadSection>

            {formData.images.length > 0 && (
              <ImagePreview>
                {formData.images.map(image => (
                  <ImageItem key={image.id}>
                    <PreviewImage src={image.url} alt={image.name} />
                    <RemoveImageButton onClick={() => removeImage(image.id)}>
                      <FiTrash2 size={12} />
                    </RemoveImageButton>
                  </ImageItem>
                ))}
              </ImagePreview>
            )}
          </FormGroup>

          <ButtonGroup>
            <Button type="button" variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={isSubmitting || isUploading}
            >
              <FiSave size={16} />
              {isSubmitting ? '저장 중...' : isUploading ? '업로드 중...' : '저장'}
            </Button>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default AnnouncementForm;