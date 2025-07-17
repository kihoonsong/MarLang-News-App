import React from 'react';
import styled from 'styled-components';
import { getColor } from '../../utils/designTokens';

const ProfileHeader = ({ user, isAdmin, translations, onLogout: _onLogout }) => {
  return (
    <HeaderContainer>
      <UserInfo>
        <Avatar>
          {user?.profileImage ? (
            <img src={user.profileImage} alt="Profile" />
          ) : (
            <span>{user?.name?.charAt(0) || '👤'}</span>
          )}
        </Avatar>
        <UserDetails>
          <UserName>{user?.name || 'Guest User'}</UserName>
          <UserEmail>{user?.email || 'No email'}</UserEmail>
          <UserRole>
            {isAdmin ? translations.admin : translations.user}
          </UserRole>
        </UserDetails>
      </UserInfo>
      {/* 로그아웃 버튼 임시 비활성화 */}
      {/* <LogoutButton onClick={onLogout}>
        {translations.logout}
      </LogoutButton> */}
    </HeaderContainer>
  );
};

const HeaderContainer = styled.div`
  background: ${getColor('background.paper')};
  color: ${getColor('text.primary')};
  padding: 2rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid ${getColor('border')};
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Avatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${getColor('background.grey')};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  color: ${getColor('text.primary')};
  border: 2px solid ${getColor('border')};
  
  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const UserName = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: ${getColor('text.primary')};
`;

const UserEmail = styled.span`
  opacity: 0.8;
  font-size: 0.9rem;
  color: ${getColor('text.secondary')};
`;

const UserRole = styled.span`
  background: ${getColor('background.grey')};
  color: ${getColor('text.primary')};
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  width: fit-content;
  margin-top: 0.5rem;
  border: 1px solid ${getColor('border')};
`;

const _LogoutButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
`;

export default ProfileHeader;