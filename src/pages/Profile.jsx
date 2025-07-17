import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';
import { getColor } from '../utils/designTokens';
// Profile 컴포넌트들
import ProfileHeader from '../components/Profile/ProfileHeader';
import LearningStats from '../components/Profile/LearningStats';
import QuickActions from '../components/Profile/QuickActions';
// import RecentActivity from '../components/Profile/RecentActivity';
import UserSettings from '../components/Profile/UserSettings';
import AnnouncementList from '../components/Profile/AnnouncementList';
import AnnouncementModal from '../components/Profile/AnnouncementModal';
import AnnouncementForm from '../components/Profile/AnnouncementForm';

// 다국어 번역 데이터
const translations = {
  ko: {
    admin: '👑 관리자',
    user: '👤 일반 사용자',
    logout: '로그아웃',
    learningStats: '📊 학습 통계',
    savedWords: '저장 단어',
    likedArticles: '좋아요 기사',
    thisWeekWords: '이번 주 단어',
    quickActions: '🚀 빠른 액션',
    viewWordbook: '📚 단어장 보기',
    viewLikedArticles: '❤️ 좋아요 기사',
    adminDashboard: '🔧 관리자 대시보드',
    announcements: '📢 공지사항',
    addAnnouncement: '공지 작성',
    noAnnouncements: '아직 공지사항이 없습니다.',
    loading: '로딩 중...',
    urgent: '긴급',
    update: '업데이트',
    maintenance: '점검',
    general: '일반',
    pinned: '고정됨'
  },
  en: {
    admin: '👑 Administrator',
    user: '👤 User',
    logout: 'Logout',
    learningStats: '📊 Learning Statistics',
    savedWords: 'Saved Words',
    likedArticles: 'Liked Articles',
    thisWeekWords: 'This Week Words',
    quickActions: '🚀 Quick Actions',
    viewWordbook: '📚 View Wordbook',
    viewLikedArticles: '❤️ Liked Articles',
    adminDashboard: '🔧 Admin Dashboard',
    announcements: '📢 Announcements',
    addAnnouncement: 'Add Announcement',
    noAnnouncements: 'No announcements yet.',
    loading: 'Loading...',
    urgent: 'Urgent',
    update: 'Update',
    maintenance: 'Maintenance',
    general: 'General',
    pinned: 'Pinned'
  },
  ja: {
    admin: '👑 管理者',
    user: '👤 ユーザー',
    logout: 'ログアウト',
    learningStats: '📊 学習統計',
    savedWords: '保存された単語',
    likedArticles: 'いいねした記事',
    thisWeekWords: '今週の単語',
    quickActions: '🚀 クイックアクション',
    viewWordbook: '📚 単語帳を見る',
    viewLikedArticles: '❤️ いいねした記事',
    adminDashboard: '🔧 管理者ダッシュボード',
    announcements: '📢 お知らせ',
    addAnnouncement: 'お知らせ作成',
    noAnnouncements: 'まだお知らせがありません。',
    loading: '読み込み中...',
    urgent: '緊急',
    update: 'アップデート',
    maintenance: 'メンテナンス',
    general: '一般',
    pinned: '固定'
  }
};


const Profile = () => {
  const { user, logout, isAdmin, isAuthenticated, signInWithGoogle } = useAuth();
  const { 
    userSettings, 
    getStats, 
    savedWords, 
    likedArticles,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
  } = useData();
  const navigate = useNavigate();
  
  // 공지사항 모달 상태
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // const [recentWords, setRecentWords] = useState([]);
  // const [recentArticles, setRecentArticles] = useState([]);

  // 현재 언어의 번역 텍스트 (안전 fallback 포함)
  const currentTranslations = translations[userSettings?.language || 'en'] || translations.en;
  const stats = getStats();

  // 최근 활동 데이터 준비
  // useEffect(() => {
  //   // 최근 5개 단어
  //   const recent = [...savedWords]
  //     .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
  //     .slice(0, 5);
  //   setRecentWords(recent);

  //   // 최근 5개 좋아요 기사
  //   const recentLiked = [...likedArticles]
  //     .sort((a, b) => new Date(b.likedAt) - new Date(a.likedAt))
  //     .slice(0, 5);
  //   setRecentArticles(recentLiked);
  // }, [savedWords, likedArticles]);

  // 로그인 확인
  if (!isAuthenticated) {
    return (
      <>
        <MobileNavigation />
        <MobileContentWrapper>
          <PageContainer>
            <LoginPrompt>
              <LoginIcon>🔐</LoginIcon>
              <LoginTitle>Login Required</LoginTitle>
              <LoginMessage>Please log in to view your profile.</LoginMessage>
              <LoginButton onClick={signInWithGoogle}>
                Sign in with Google
              </LoginButton>
            </LoginPrompt>
          </PageContainer>
        </MobileContentWrapper>
      </>
    );
  }


  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // 공지사항 관련 핸들러
  const handleAnnouncementClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowAnnouncementModal(true);
  };

  const handleAddAnnouncement = () => {
    setEditingAnnouncement(null);
    setShowAnnouncementForm(true);
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setShowAnnouncementForm(true);
    setShowAnnouncementModal(false);
  };

  const handleSubmitAnnouncement = async (formData) => {
    try {
      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, formData);
      } else {
        await createAnnouncement(formData);
      }
      setShowAnnouncementForm(false);
      setEditingAnnouncement(null);
      // 공지사항 목록 새로고침을 위해 상태 업데이트
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('공지사항 저장 실패:', error);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    try {
      await deleteAnnouncement(announcementId);
      // 공지사항 목록 새로고침을 위해 상태 업데이트
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
    }
  };

  // 시간 형식 함수
  // const formatTimeAgo = (dateString) => {
  //   const now = new Date();
  //   const past = new Date(dateString);
  //   const diffInMinutes = Math.floor((now - past) / (1000 * 60));
    
  //   if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
  //   if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
  //   return `${Math.floor(diffInMinutes / 1440)}일 전`;
  // };

  return (
    <>
      <MobileNavigation />
      <MobileContentWrapper>
          <PageContainer>
          <ProfileContainer>
            <ProfileHeader 
              user={user}
              isAdmin={isAdmin}
              translations={currentTranslations}
              onLogout={handleLogout}
            />
            
            <UserSettings />
            
            <AnnouncementList 
              onAnnouncementClick={handleAnnouncementClick}
              onAddClick={handleAddAnnouncement}
              refreshTrigger={refreshTrigger}
              translations={currentTranslations}
            />
            
            <LearningStats 
              stats={stats}
              translations={currentTranslations}
            />
            
            <QuickActions 
              translations={currentTranslations}
              isAdmin={isAdmin}
            />
            
            {/* <RecentActivity 
              recentWords={recentWords}
              recentArticles={recentArticles}
              translations={currentTranslations}
              formatTimeAgo={formatTimeAgo}
            /> */}
            
          </ProfileContainer>
          </PageContainer>
      </MobileContentWrapper>
      
      {/* 공지사항 모달 */}
      {showAnnouncementModal && selectedAnnouncement && (
        <AnnouncementModal
          announcement={selectedAnnouncement}
          onClose={() => {
            setShowAnnouncementModal(false);
            setSelectedAnnouncement(null);
          }}
          onEdit={handleEditAnnouncement}
          onDelete={handleDeleteAnnouncement}
          translations={currentTranslations}
        />
      )}
      
      {/* 공지사항 작성/수정 폼 */}
      {showAnnouncementForm && (
        <AnnouncementForm
          announcement={editingAnnouncement}
          onSubmit={handleSubmitAnnouncement}
          onClose={() => {
            setShowAnnouncementForm(false);
            setEditingAnnouncement(null);
          }}
        />
      )}
    </>
  );
};

const ProfileContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
`;

const LoginPrompt = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  background: ${getColor('background.paper')};
  border-radius: 16px;
  padding: 3rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid ${getColor('border')};
`;

const LoginIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const LoginTitle = styled.h2`
  margin: 0 0 1rem 0;
  color: ${getColor('text.primary')};
  font-size: 1.5rem;
`;

const LoginMessage = styled.p`
  margin: 0 0 2rem 0;
  color: ${getColor('text.secondary')};
  font-size: 1rem;
`;

const LoginButton = styled.button`
  background: ${getColor('primary')};
  color: ${getColor('background')};
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${getColor('primaryDark')};
    transform: translateY(-2px);
  }
`;

export default Profile; 