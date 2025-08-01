import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const CategoryKakaoAd = ({ adUnit, position = 'middle' }) => {
  const adRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    const loadKakaoAd = () => {
      try {
        // 스크립트가 이미 로드되었는지 확인
        if (!scriptLoadedRef.current) {
          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
          script.async = true;
          document.head.appendChild(script);
          scriptLoadedRef.current = true;
        }

        // 광고 초기화
        if (window.adsbygoogle) {
          window.adsbygoogle.push({});
        }
      } catch (error) {
        console.error('카카오 광고 로드 오류:', error);
      }
    };

    // 컴포넌트 마운트 후 광고 로드
    const timer = setTimeout(loadKakaoAd, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, [adUnit]);

  return (
    <AdContainer position={position}>
      <AdLabel>광고</AdLabel>
      <ins
        ref={adRef}
        className="kakao_ad_area"
        style={{ display: 'none' }}
        data-ad-unit={adUnit}
        data-ad-width="300"
        data-ad-height="250"
      />
    </AdContainer>
  );
};

const AdContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: ${props => props.position === 'middle' ? '1.5rem 0' : '2rem 0'};
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  min-height: 280px;
  
  @media (max-width: 768px) {
    margin: ${props => props.position === 'middle' ? '1rem 0' : '1.5rem 0'};
    padding: 0.75rem;
  }
`;

const AdLabel = styled.span`
  font-size: 0.75rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export default CategoryKakaoAd;