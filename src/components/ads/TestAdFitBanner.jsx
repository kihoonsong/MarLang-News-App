import React, { useEffect, useRef } from 'react';

const TestAdFitBanner = ({ 
  adUnitId = 'DAN-RNzVkjnBfLSGDxqM',
  width = 320,
  height = 100 
}) => {
  const adRef = useRef(null);

  useEffect(() => {
    console.log('🧪 테스트 광고 시작:', {
      adUnitId,
      width,
      height,
      userAgent: navigator.userAgent,
      domain: window.location.hostname,
      protocol: window.location.protocol,
      scriptExists: !!document.querySelector('script[src*="kas/static/ba.min.js"]')
    });

    // 1초 후 광고 영역 생성
    const timer = setTimeout(() => {
      if (adRef.current) {
        // 기존 광고 제거
        adRef.current.innerHTML = '';
        
        // 새 광고 영역 생성
        const adArea = document.createElement('ins');
        adArea.className = 'kakao_ad_area';
        adArea.style.display = 'block';
        adArea.setAttribute('data-ad-unit', adUnitId);
        adArea.setAttribute('data-ad-width', width.toString());
        adArea.setAttribute('data-ad-height', height.toString());
        
        adRef.current.appendChild(adArea);
        
        console.log('🧪 광고 영역 생성:', {
          element: adArea,
          attributes: {
            'data-ad-unit': adArea.getAttribute('data-ad-unit'),
            'data-ad-width': adArea.getAttribute('data-ad-width'),
            'data-ad-height': adArea.getAttribute('data-ad-height')
          }
        });

        // 2초 후 상태 체크
        setTimeout(() => {
          console.log('🧪 광고 상태 체크:', {
            childrenCount: adArea.children.length,
            innerHTML: adArea.innerHTML.substring(0, 200),
            offsetWidth: adArea.offsetWidth,
            offsetHeight: adArea.offsetHeight,
            computedStyle: window.getComputedStyle(adArea).display
          });
        }, 2000);

        // 5초 후 최종 체크
        setTimeout(() => {
          console.log('🧪 최종 광고 상태:', {
            childrenCount: adArea.children.length,
            hasContent: adArea.innerHTML.trim() !== '',
            dimensions: `${adArea.offsetWidth}x${adArea.offsetHeight}`,
            visible: adArea.offsetWidth > 0 && adArea.offsetHeight > 0
          });
        }, 5000);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [adUnitId, width, height]);

  return (
    <div style={{
      margin: '20px 0',
      padding: '10px',
      border: '2px dashed #ff6b6b',
      borderRadius: '8px',
      backgroundColor: '#fff5f5'
    }}>
      <div style={{
        fontSize: '12px',
        color: '#ff6b6b',
        textAlign: 'center',
        marginBottom: '10px',
        fontWeight: 'bold'
      }}>
        🧪 테스트 광고 (개발자 도구 Console 확인)
      </div>
      
      <div
        ref={adRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          maxWidth: '100%',
          margin: '0 auto',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ddd',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#666'
        }}
      >
        테스트 광고 로딩 중...
      </div>
      
      <div style={{
        fontSize: '10px',
        color: '#666',
        textAlign: 'center',
        marginTop: '8px',
        fontFamily: 'monospace'
      }}>
        AdUnit: {adUnitId} | Size: {width}x{height}
      </div>
    </div>
  );
};

export default TestAdFitBanner;