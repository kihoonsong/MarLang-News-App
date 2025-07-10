import React, { useState } from 'react';
import styled from 'styled-components';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PushPinIcon from '@mui/icons-material/PushPin';
import { useAuth } from '../../contexts/AuthContext';

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
  border-radius: 20px;
  width: 100%;
  max-width: 650px;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
  border: 1px solid #f1f5f9;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 32px 32px 20px;
  border-bottom: 1px solid #f1f5f9;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  border-radius: 20px 20px 0 0;
`;

const ModalTitle = styled.h2`
  color: #1e293b;
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
  flex: 1;
  padding-right: 20px;
  letter-spacing: -0.025em;
  white-space: normal;
  word-break: break-all;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #999;
  border-radius: 50%;
  flex-shrink: 0;
  font-weight: bold;
  
  & .MuiSvgIcon-root {
    font-size: 16px;
    color: #999;
  }
  
  &:hover {
    color: ${props => props.variant === 'danger' ? '#f44336' : '#666'};
    transform: scale(1.15);
    
    & .MuiSvgIcon-root {
      color: ${props => props.variant === 'danger' ? '#f44336' : '#666'};
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #999;
  border-radius: 50%;
  flex-shrink: 0;
  font-weight: bold;
  
  & .MuiSvgIcon-root {
    font-size: 18px;
    color: #999;
  }

  &:hover {
    color: #666;
    transform: scale(1.15);
    
    & .MuiSvgIcon-root {
      color: #666;
    }
  }
`;

const ModalBody = styled.div`
  padding: 32px;
`;

const AnnouncementMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  
  svg {
    opacity: 0.7;
  }
`;

const TypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  background: ${props => {
    switch (props.type) {
      case 'urgent': return 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
      case 'update': return 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
      case 'maintenance': return 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)';
      default: return 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'urgent': return '#dc2626';
      case 'update': return '#2563eb';
      case 'maintenance': return '#c2185b';
      default: return '#059669';
    }
  }};
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.025em;
  border: 1px solid ${props => {
    switch (props.type) {
      case 'urgent': return '#fecaca';
      case 'update': return '#bfdbfe';
      case 'maintenance': return '#fbcfe8';
      default: return '#d1fae5';
    }
  }};
`;

const PinBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #fecaca;
  
  svg {
    opacity: 1;
  }
`;

const AnnouncementContent = styled.div`
  color: #334155;
  font-size: 16px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  font-weight: 400;

  img {
    max-width: 100%;
    height: auto;
    border-radius: 12px;
    margin: 20px 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  p {
    margin: 0 0 20px 0;
    &:last-child {
      margin-bottom: 0;
    }
  }

  h1, h2, h3, h4, h5, h6 {
    color: #1e293b;
    margin: 32px 0 20px 0;
    font-weight: 600;
    letter-spacing: -0.025em;
    &:first-child {
      margin-top: 0;
    }
  }

  ul, ol {
    margin: 20px 0;
    padding-left: 28px;
  }

  li {
    margin: 12px 0;
    line-height: 1.6;
  }

  blockquote {
    margin: 24px 0;
    padding: 20px 24px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-left: 4px solid #667eea;
    border-radius: 12px;
    font-style: italic;
    color: #475569;
  }

  code {
    background: #f1f5f9;
    color: #e11d48;
    padding: 3px 8px;
    border-radius: 6px;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    font-size: 14px;
    font-weight: 500;
  }

  pre {
    background: #f8fafc;
    padding: 20px;
    border-radius: 12px;
    overflow-x: auto;
    margin: 24px 0;
    border: 1px solid #e2e8f0;
    
    code {
      background: none;
      color: #334155;
      padding: 0;
    }
  }
`;

const AnnouncementModal = ({ 
  announcement, 
  onClose, 
  onEdit, 
  onDelete,
  translations 
}) => {
  const { user: currentUser } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type) => {
    return translations?.[type] || type;
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const handleDelete = async () => {
    if (window.confirm('이 공지사항을 삭제하시겠습니까?')) {
      setIsDeleting(true);
      try {
        await onDelete(announcement.id);
        onClose();
      } catch (error) {
        console.error('삭제 실패:', error);
        alert('삭제 중 오류가 발생했습니다.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!announcement) return null;

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{announcement.title}</ModalTitle>
          <ModalActions>
            {isAdmin && (
              <>
                <ActionButton 
                  onClick={() => onEdit(announcement)}
                  title="수정"
                >
                  <EditIcon fontSize="small" />
                </ActionButton>
                <ActionButton 
                  variant="danger"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  title="삭제"
                >
                  <DeleteIcon fontSize="small" />
                </ActionButton>
              </>
            )}
            <CloseButton onClick={onClose} title="닫기">
              <CloseIcon fontSize="small" />
            </CloseButton>
          </ModalActions>
        </ModalHeader>

        <ModalBody>
          <AnnouncementMeta>
            <MetaItem>
              <TypeBadge type={announcement.type}>
                {getTypeLabel(announcement.type)}
              </TypeBadge>
            </MetaItem>
            
            {announcement.isSticky && (
              <MetaItem>
                <PinBadge>
                  <PushPinIcon fontSize="small" />
                  {translations?.pinned || '고정됨'}
                </PinBadge>
              </MetaItem>
            )}
            
            <MetaItem>
              <CalendarTodayIcon fontSize="small" />
              {formatDate(announcement.createdAt)}
            </MetaItem>
          </AnnouncementMeta>

          <AnnouncementContent>
            {announcement.content}
          </AnnouncementContent>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default AnnouncementModal;