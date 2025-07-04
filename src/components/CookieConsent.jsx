import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

// 구글 CMP (동의 관리 플랫폼) 컴포넌트
const CookieConsent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadGoogleCMP = async () => {
      try {
        // 구글 CMP 스크립트 로드
        if (!window.googlefc) {
          const script = document.createElement('script');
          script.src = 'https://fundingchoicesmessages.google.com/i/pub-6930662244421305?ers=1';
          script.async = true;
          script.crossOrigin = 'anonymous';
          
          script.onload = () => {
            setIsLoading(false);
            // CMP 초기화
            if (window.googlefc && window.googlefc.callbackQueue) {
              window.googlefc.callbackQueue.push({
                'CONSENT_DATA_READY': () => {
                  console.log('CMP 동의 데이터 준비 완료');
                }
              });
            }
          };
          
          script.onerror = () => {
            setError('CMP 로드 실패');
            setIsLoading(false);
          };
          
          document.head.appendChild(script);
        } else {
          setIsLoading(false);
        }
        
        // 구글 CMP 설정
        window.googlefc = window.googlefc || {};
        window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
        
        // CMP 콜백 설정
        window.googlefc.callbackQueue.push({
          'CONSENT_DATA_READY': () => {
            // 동의 상태에 따른 처리
            const consentData = window.googlefc.getConsentData();
            handleConsentChange(consentData);
          },
          'CONSENT_DATA_UPDATED': (consentData) => {
            // 동의 상태 변경 시 처리
            handleConsentChange(consentData);
          }
        });

      } catch (err) {
        console.error('CMP 초기화 오류:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    loadGoogleCMP();
  }, []);

  // 동의 상태 변경 처리
  const handleConsentChange = (consentData) => {
    if (consentData) {
      // 광고 개인화 동의 상태
      const adStorageConsent = consentData.gdprApplies && consentData.tcString;
      const analyticsConsent = consentData.gdprApplies && consentData.tcString;
      
      // Google Analytics 동의 상태 업데이트
      if (window.gtag) {
        window.gtag('consent', 'update', {
          'ad_storage': adStorageConsent ? 'granted' : 'denied',
          'analytics_storage': analyticsConsent ? 'granted' : 'denied',
          'ad_user_data': adStorageConsent ? 'granted' : 'denied',
          'ad_personalization': adStorageConsent ? 'granted' : 'denied'
        });
      }

      // 애드센스 동의 상태 업데이트
      if (window.adsbygoogle) {
        window.adsbygoogle.push({
          params: {
            'gdpr': consentData.gdprApplies ? '1' : '0',
            'gdpr_consent': consentData.tcString || ''
          }
        });
      }

      // 로컬 스토리지에 동의 상태 저장
      localStorage.setItem('cmp_consent_data', JSON.stringify({
        timestamp: Date.now(),
        gdprApplies: consentData.gdprApplies,
        tcString: consentData.tcString,
        adConsent: adStorageConsent,
        analyticsConsent: analyticsConsent
      }));

      console.log('동의 상태 업데이트:', {
        adConsent: adStorageConsent,
        analyticsConsent: analyticsConsent
      });
    }
  };

  // 동의 설정 다시 열기
  const reopenConsentModal = () => {
    if (window.googlefc && window.googlefc.showRevocationMessage) {
      window.googlefc.showRevocationMessage();
    }
  };

  if (error) {
    return (
      <CMPErrorContainer>
        <p>개인정보 설정을 불러올 수 없습니다.</p>
        <button onClick={() => window.location.reload()}>새로고침</button>
      </CMPErrorContainer>
    );
  }

  return (
    <>
      {/* CMP는 구글에서 자동으로 모달을 표시하므로 별도 UI 불필요 */}
      
      {/* 개인정보 설정 재오픈 버튼 (푸터 등에 배치) */}
      <ConsentSettingsButton onClick={reopenConsentModal}>
        🍪 개인정보 설정
      </ConsentSettingsButton>
    </>
  );
};

// 스타일드 컴포넌트
const CMPErrorContainer = styled.div`
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  background: #f44336;
  color: white;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  z-index: 10000;

  button {
    background: white;
    color: #f44336;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    margin-top: 0.5rem;
    cursor: pointer;
    font-weight: bold;

    &:hover {
      background: #f5f5f5;
    }
  }
`;

const ConsentSettingsButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #1976d2;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.9rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  transition: all 0.3s ease;

  &:hover {
    background: #1565c0;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 768px) {
    bottom: 10px;
    right: 10px;
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
  }
`;

export default CookieConsent; 