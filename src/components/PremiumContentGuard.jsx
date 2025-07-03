import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const PremiumContentGuard = ({ children }) => {
  const { user } = useAuth();

  // TODO: 나중에 여기에 실제 유료 사용자 확인 로직 추가
  // const isPremium = checkUserPremiumStatus(user);
  // const freeTierLimitReached = checkFreeTierLimit(user);
  // if (!isPremium && freeTierLimitReached) {
  //   return <Paywall />;
  // }

  return <>{children}</>;
};

export default PremiumContentGuard;
