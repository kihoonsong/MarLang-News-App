import React, { useEffect, useRef, useState } from 'react';

const SimpleAdFitBanner = ({ 
  adUnitId = 'DAN-RNzVkjnBfLSGDxqM',
  width = 320,
  height = 100,
  className = '',
  debug = import.meta.env.DEV
}) => {
  const adContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // 카카오 애드핏 스크립트 로드
  useEffect(() => {
    const loadScript = async () => {
      try {
        // 이미 스크립트가 로드되어 있는지 확인
        const existingScript = document.querySelector('script[src*="kas/static/ba.min.js"]');
        if (existingScript) {
          if (debug) console.log('✅ 카카오 애드핏 스크립트 이미 존재');
          setIsScriptLoaded(true);
          return;
        }

        if (debug) console.log('📥 카카오 애드핏 스크립트 로딩 시작');

        // 스크립트 생성 및 로드
        const script = document.createElement('script');
        script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          if (debug) console.log('✅ 카카오 애드핏 스크립트 로드 완료');
          setIsScriptLoaded(true);
        };
        
        script.onerror = () => {
          console.error('❌ 카카오 애드핏 스크립트 로드 실패');
          setHasError(true);
          setIsLoading(false);
        };
        
        document.head.appendChild(script);
        
      } catch (error) {
        console.error('스크립트 로드 중 오류:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    loadScript();
  }, [debug]);

  // 광고 초기화
  useEffect(() => {
    if (!isScriptLoaded || !adContainerRef.current) return;

    const initializeAd = async () => {
      try {
        if (debug) console.log('🎯 광고 초기화 시작:', { adUnitId, width, height });

        // 광고 영역이 이미 존재하는지 확인
        const existingAd = adContainerRef.current.querySelector('.kakao_ad_area');
        if (existingAd) {
          if (debug) console.log('✅ 광고 영역 이미 존재');
          setIsLoading(false);
          return;
        }

        // 새 광고 영역 생성
        const adArea = document.createElement('ins');
        adArea.className = 'kakao_ad_area';
        adArea.style.display = 'none';
        adArea.setAttribute('data-ad-unit', adUnitId);
        adArea.setAttribute('data-ad-width', width.toString());
        adArea.setAttribute('data-ad-height', height.toString());
        
        adContainerRef.current.appendChild(adArea);

        // 광고 표시 (먼저 표시해야 카카오 애드핏이 감지함)
        adArea.style.display = 'block';
        
        // 카카오 애드핏 스크립트 실행 대기
        await waitForAdFitReady();
        
        // 카카오 애드핏 강제 실행 (중요!)
        if (window.adfit && window.adfit.refresh) {
          try {
            window.adfit.refresh();
            if (debug) console.log('🔄 카카오 애드핏 강제 새로고침 실행');
          } catch (refreshError) {
            if (debug) console.warn('애드핏 새로고침 실패:', refreshError);
          }
        }
        
        // 광고 로딩 완료 확인
        let checkAttempts = 0;
        const maxCheckAttempts = 20; // 2초 동안 체크
        
        const checkAdLoaded = () => {
          checkAttempts++;
          const adContent = adArea.querySelector('iframe') || 
                           adArea.querySelector('div[id*="kakao"]') ||
                           adArea.querySelector('script') ||
                           (adArea.children.length > 0);
          
          if (adContent) {
            if (debug) console.log('✅ 광고 콘텐츠 로드 완료');
            setIsLoading(false);
          } else if (checkAttempts >= maxCheckAttempts) {
            if (debug) console.log('⚠️ 광고 콘텐츠 로드 타임아웃');
            setIsLoading(false);
          } else {
            setTimeout(checkAdLoaded, 100);
          }
        };
        
        setTimeout(checkAdLoaded, 500);

      } catch (error) {
        console.error('광고 초기화 실패:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    // DOM이 완전히 준비된 후 초기화
    if (document.readyState === 'complete') {
      setTimeout(initializeAd, 100);
    } else {
      window.addEventListener('load', () => {
        setTimeout(initializeAd, 100);
      }, { once: true });
    }
  }, [isScriptLoaded, adUnitId, width, height, debug]);

  // 카카오 애드핏 준비 상태 대기 및 강제 실행
  const waitForAdFitReady = () => {
    return new Promise((resolve) => {
      const maxAttempts = 50; // 5초 최대 대기
      let attempts = 0;
      
      const checkReady = () => {
        attempts++;
        
        // 스크립트가 로드되었는지 확인
        const scriptLoaded = document.querySelector('script[src*="kas/static/ba.min.js"]');
        
        if (scriptLoaded) {
          // 스크립트가 로드되었으면 카카오 애드핏 강제 실행
          try {
            // 카카오 애드핏 스크립트 강제 실행
            if (window.adfit) {
              if (debug) console.log('🔄 window.adfit 발견, 강제 실행');
              resolve();
              return;
            }
            
            // 전역 스코프에서 카카오 애드핏 함수 찾기
            const scripts = document.querySelectorAll('script');
            scripts.forEach(script => {
              if (script.src.includes('kas/static/ba.min.js')) {
                if (debug) console.log('📜 카카오 애드핏 스크립트 발견');
              }
            });
            
            // 카카오 애드핏 영역 강제 처리
            const adAreas = document.querySelectorAll('.kakao_ad_area');
            if (adAreas.length > 0) {
              if (debug) console.log('🎯 광고 영역 발견:', adAreas.length);
              
              // 각 광고 영역에 대해 강제 처리
              adAreas.forEach((area, index) => {
                if (!area.hasAttribute('data-processed')) {
                  area.setAttribute('data-processed', 'true');
                  if (debug) console.log(`🔧 광고 영역 ${index} 처리 완료`);
                }
              });
            }
          } catch (error) {
            if (debug) console.warn('애드핏 강제 실행 중 오류:', error);
          }
          
          resolve();
          return;
        }
        
        if (attempts >= maxAttempts) {
          if (debug) console.warn('⏰ 카카오 애드핏 대기 타임아웃');
          resolve(); // 타임아웃이어도 resolve
          return;
        }
        
        setTimeout(checkReady, 100);
      };
      
      checkReady();
    });
  };

  // 로딩 상태 렌더링
  if (isLoading) {
    return (
      <div 
        className={`simple-adfit-banner loading ${className}`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          maxWidth: '100%',
          margin: '16px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          border: '1px dashed #ddd',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#666'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid #e0e0e0',
              borderTop: '2px solid #666',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
          </div>
          <div>광고 로딩 중...</div>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // 에러 상태 렌더링
  if (hasError) {
    return (
      <div 
        className={`simple-adfit-banner error ${className}`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          maxWidth: '100%',
          margin: '16px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffebee',
          border: '1px solid #ffcdd2',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#d32f2f',
          textAlign: 'center'
        }}
      >
        <div>
          <div style={{ marginBottom: '4px', fontWeight: '500' }}>
            광고를 불러올 수 없습니다
          </div>
          <div style={{ fontSize: '10px' }}>
            네트워크 연결을 확인해주세요
          </div>
        </div>
      </div>
    );
  }

  // 광고 컨테이너 렌더링
  return (
    <div className={`simple-adfit-banner ${className}`}>
      {/* 광고 라벨 */}
      <div style={{
        fontSize: '10px',
        color: '#999',
        textAlign: 'center',
        marginBottom: '8px',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        광고
      </div>
      
      {/* 광고 컨테이너 */}
      <div 
        ref={adContainerRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          maxWidth: '100%',
          margin: '0 auto',
          minHeight: `${height}px`,
          backgroundColor: 'transparent'
        }}
      />
      
      {debug && (
        <div style={{
          fontSize: '10px',
          color: '#666',
          textAlign: 'center',
          marginTop: '8px',
          fontFamily: 'monospace',
          backgroundColor: '#f0f0f0',
          padding: '4px',
          borderRadius: '2px'
        }}>
          AdUnit: {adUnitId} | Size: {width}x{height}
        </div>
      )}
    </div>
  );
};

export default SimpleAdFitBanner;