import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';

// Profile 컴포넌트들
import ProfileHeader from '../components/Profile/ProfileHeader';
import LearningStats from '../components/Profile/LearningStats';
import QuickActions from '../components/Profile/QuickActions';
// import RecentActivity from '../components/Profile/RecentActivity';
import UserSettings from '../components/Profile/UserSettings';

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
    adminDashboard: '🔧 관리자 대시보드'
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
    adminDashboard: '🔧 Admin Dashboard'
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
    adminDashboard: '🔧 管理者ダッシュボード'
  }
};


const Profile = () => {
  const { user, logout, isAdmin, isAuthenticated, signInWithGoogle } = useAuth();
  const { 
    userSettings, 
    getStats, 
    savedWords, 
    likedArticles 
  } = useData();
  const navigate = useNavigate();
  
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
            
            <LearningStats 
              stats={stats}
              translations={currentTranslations}
            />
            
            <QuickActions 
              translations={currentTranslations}
              isAdmin={isAdmin}
            />

            <UserSettings />
            
            {/* <RecentActivity 
              recentWords={recentWords}
              recentArticles={recentArticles}
              translations={currentTranslations}
              formatTimeAgo={formatTimeAgo}
            /> */}
            
          </ProfileContainer>
          </PageContainer>
      </MobileContentWrapper>
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
  background: white;
  border-radius: 16px;
  padding: 3rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
`;

const LoginIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const LoginTitle = styled.h2`
  margin: 0 0 1rem 0;
  color: #2d3748;
  font-size: 1.5rem;
`;

const LoginMessage = styled.p`
  margin: 0 0 2rem 0;
  color: #666;
  font-size: 1rem;
`;

const LoginButton = styled.button`
  background: #1976d2;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #1565c0;
    transform: translateY(-2px);
  }
`;

export default Profile; 