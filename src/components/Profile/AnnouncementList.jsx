import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiPlus } from 'react-icons/fi';
import { MdPushPin } from 'react-icons/md';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

const AnnouncementContainer = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 24px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  color: #2d3748;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
`;

const AnnouncementList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AnnouncementItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #667eea;
  }
`;

const PinIcon = styled.div`
  color: #e53e3e;
  font-size: 14px;
  opacity: ${props => props.isSticky ? 1 : 0};
`;

const AnnouncementContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const AnnouncementTitle = styled.h4`
  color: #2d3748;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  line-height: 1.4;
`;

const AnnouncementMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #718096;
  font-size: 12px;
`;

const TypeBadge = styled.span`
  background: ${props => {
    switch (props.type) {
      case 'urgent': return '#fed7d7';
      case 'update': return '#bee3f8';
      case 'maintenance': return '#fbb6ce';
      default: return '#e6fffa';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'urgent': return '#e53e3e';
      case 'update': return '#3182ce';
      case 'maintenance': return '#d53f8c';
      default: return '#38a169';
    }
  }};
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #718096;
  font-size: 14px;
`;

const AnnouncementListComponent = ({ onAnnouncementClick, onAddClick, refreshTrigger, translations }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getAnnouncements } = useData();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchAnnouncements();
  }, [refreshTrigger]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const announcementData = await getAnnouncements(5);
      setAnnouncements(announcementData);
    } catch (error) {
      console.error('공지사항 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const getTypeLabel = (type) => {
    return translations?.[type] || type;
  };

  if (loading) {
    return (
      <AnnouncementContainer>
        <SectionHeader>
          <SectionTitle>
            {translations?.announcements || '공지사항'}
          </SectionTitle>
        </SectionHeader>
        <EmptyState>{translations?.loading || '로딩 중...'}</EmptyState>
      </AnnouncementContainer>
    );
  }

  return (
    <AnnouncementContainer>
      <SectionHeader>
        <SectionTitle>
          {translations?.announcements || '공지사항'}
        </SectionTitle>
        {isAdmin && (
          <AddButton onClick={onAddClick}>
            <FiPlus size={16} />
            {translations?.addAnnouncement || '공지 작성'}
          </AddButton>
        )}
      </SectionHeader>

      {announcements.length === 0 ? (
        <EmptyState>
          {translations?.noAnnouncements || '아직 공지사항이 없습니다.'}
        </EmptyState>
      ) : (
        <AnnouncementList>
          {announcements.map((announcement) => (
            <AnnouncementItem
              key={announcement.id}
              onClick={() => onAnnouncementClick(announcement)}
            >
              <PinIcon isSticky={announcement.isSticky}>
                <MdPushPin />
              </PinIcon>
              <AnnouncementContent>
                <AnnouncementTitle>{announcement.title}</AnnouncementTitle>
                <AnnouncementMeta>
                  <TypeBadge type={announcement.type}>
                    {getTypeLabel(announcement.type)}
                  </TypeBadge>
                  <span>{formatDate(announcement.createdAt)}</span>
                </AnnouncementMeta>
              </AnnouncementContent>
            </AnnouncementItem>
          ))}
        </AnnouncementList>
      )}
    </AnnouncementContainer>
  );
};

export default AnnouncementListComponent;