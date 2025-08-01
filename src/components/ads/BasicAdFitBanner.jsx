import React, { useEffect, useRef, useState } from 'react';

const BasicAdFitBanner = ({
  adUnitId = 'DAN-RNzVkjnBfLSGDxqM', // 기본값을 더 안정적인 ID로 변경
  width = 320,
  height = 100,
  className = ''
}) => {
  const adContainerRef = useRef(null);
  const [adStatus, setAdStatus] = useState('loading'); // loading, loaded, error, timeout, fallback
  const [debugInfo, setDebugInfo] = useState({});
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let adCheckInterval = null;

    const waitForScript = () => {
      return new Promise((resolve) => {
        const checkScript = () => {
          const scriptExists = document.querySelector('script[src*="kas/static/ba.min.js"]');
          if (scriptExists) {
            // 스크립트가 실제로 로드되었는지 확인
            if (document.readyState === 'complete') {
              setTimeout(resolve, 500); // 스크립트 실행 대기
            } else {
              window.addEventListener('load', () => setTimeout(resolve, 500), { once: true });
            }
          } else {
            setTimeout(checkScript, 100);
          }
        };
        checkScript();
      });
    };

    const initializeAd = async () => {
      if (!adContainerRef.current || !isMounted) return;

      try {
        console.log('🎯 광고 초기화 시작:', {
          adUnitId,
          width,
          height,
          env: import.meta.env.VITE_ADFIT_REACT_BANNER_MOBILE,
          scriptExists: !!document.querySelector('script[src*="kas/static/ba.min.js"]')
        });

        // 스크립트 로드 대기
        await waitForScript();

        if (!isMounted) return;

        // 기존 광고 영역 제거
        const existingAd = adContainerRef.current.querySelector('.kakao_ad_area');
        if (existingAd) {
          existingAd.remove();
        }

        // 새 광고 영역 생성 (카카오 애드핏 표준 구조)
        const adArea = document.createElement('ins');
        adArea.className = 'kakao_ad_area';
        adArea.style.display = 'block'; // 바로 표시
        adArea.setAttribute('data-ad-unit', adUnitId);
        adArea.setAttribute('data-ad-width', width.toString());
        adArea.setAttribute('data-ad-height', height.toString());

        // 컨테이너에 추가
        adContainerRef.current.appendChild(adArea);

        // 카카오 애드핏 스크립트 강제 실행
        setTimeout(() => {
          if (!isMounted) return;

          try {
            // 1. 전역 adfit 객체 확인 및 실행
            if (window.adfit && typeof window.adfit.refresh === 'function') {
              console.log('🔄 window.adfit.refresh() 실행');
              window.adfit.refresh();
            }

            // 2. 카카오 애드핏 스크립트 재실행 시도
            const script = document.querySelector('script[src*="kas/static/ba.min.js"]');
            if (script) {
              // 스크립트 재로드
              const newScript = document.createElement('script');
              newScript.src = script.src;
              newScript.async = true;
              document.head.appendChild(newScript);
              console.log('🔄 카카오 애드핏 스크립트 재로드');
            }

            // 3. DOM 이벤트 트리거
            window.dispatchEvent(new Event('load'));
            document.dispatchEvent(new Event('DOMContentLoaded'));

          } catch (error) {
            console.warn('광고 강제 실행 실패:', error);
          }
        }, 200);

        console.log('✅ 광고 영역 생성 완료:', {
          adUnitId,
          width,
          height,
          className: adArea.className
        });

        // 광고 로드 상태 모니터링 (더 관대한 조건)
        let checkCount = 0;
        const maxChecks = 30; // 15초간 체크 (더 길게)

        adCheckInterval = setInterval(() => {
          if (!isMounted || checkCount >= maxChecks) {
            clearInterval(adCheckInterval);
            if (checkCount >= maxChecks && isMounted) {
              // 타임아웃 시 대체 광고 표시
              console.warn('⚠️ 광고 로드 타임아웃, 대체 광고 표시');
              setAdStatus('fallback');
              setShowFallback(true);
              setDebugInfo({
                error: 'Ad loading timeout - showing fallback',
                adUnitId,
                finalCheck: {
                  childrenCount: adArea.children.length,
                  innerHTML: adArea.innerHTML.length,
                  offsetWidth: adArea.offsetWidth,
                  offsetHeight: adArea.offsetHeight
                }
              });
            }
            return;
          }

          checkCount++;
          const hasContent = adArea.children.length > 0 ||
            adArea.innerHTML.trim() !== '' ||
            adArea.offsetWidth > 0 && adArea.offsetHeight > 0;

          if (hasContent) {
            clearInterval(adCheckInterval);
            if (isMounted) {
              setAdStatus('loaded');
              setDebugInfo({
                childrenCount: adArea.children.length,
                hasInnerHTML: adArea.innerHTML.length > 0,
                dimensions: `${adArea.offsetWidth}x${adArea.offsetHeight}`
              });
            }
            console.log('✅ 광고 로드 완료:', {
              childrenCount: adArea.children.length,
              innerHTML: adArea.innerHTML.substring(0, 100),
              dimensions: `${adArea.offsetWidth}x${adArea.offsetHeight}`
            });
          } else {
            // 중간 체크 로그
            if (checkCount % 5 === 0) {
              console.log(`🔍 광고 로드 체크 ${checkCount}/${maxChecks}:`, {
                childrenCount: adArea.children.length,
                innerHTML: adArea.innerHTML.length,
                dimensions: `${adArea.offsetWidth}x${adArea.offsetHeight}`,
                display: adArea.style.display,
                className: adArea.className
              });
            }
          }
        }, 500);

        // 카카오 애드핏 스크립트 실행 트리거
        setTimeout(() => {
          if (!isMounted) return;

          try {
            // 스크립트가 DOM을 다시 스캔하도록 트리거
            const event = new Event('DOMContentLoaded', { bubbles: true });
            document.dispatchEvent(event);

            // 또는 window resize 이벤트로 트리거
            setTimeout(() => {
              if (isMounted) {
                window.dispatchEvent(new Event('resize'));
              }
            }, 1000);
          } catch (error) {
            console.warn('광고 트리거 실패:', error);
          }
        }, 1000);

      } catch (error) {
        console.error('❌ 광고 초기화 실패:', error);
        if (isMounted) {
          setAdStatus('error');
          setDebugInfo({ error: error.message });
        }
      }
    };

    // DOM이 완전히 로드된 후 광고 초기화
    const timer = setTimeout(initializeAd, 500);

    // 컴포넌트 언마운트 시 정리
    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (adCheckInterval) {
        clearInterval(adCheckInterval);
      }
      if (adContainerRef.current) {
        const adArea = adContainerRef.current.querySelector('.kakao_ad_area');
        if (adArea) {
          adArea.remove();
        }
      }
    };
  }, [adUnitId, width, height]);

  return (
    <div className={`basic-adfit-banner ${className}`} style={{ margin: '20px 0' }}>
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
          backgroundColor: adStatus === 'loaded' ? 'transparent' : '#f5f5f5',
          border: adStatus === 'loaded' ? 'none' : '1px solid #ddd',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#666',
          position: 'relative'
        }}
      >
        {/* 로딩/에러 상태 표시 */}
        {adStatus === 'loading' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid #ddd',
              borderTop: '2px solid #666',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            광고 로딩 중...
          </div>
        )}

        {adStatus === 'error' && (
          <div style={{ textAlign: 'center', color: '#999' }}>
            <div>광고를 불러올 수 없습니다</div>
            <div style={{ fontSize: '10px', marginTop: '4px' }}>
              광고 단위 승인 또는 도메인 등록을 확인해주세요
            </div>
            {import.meta.env.DEV && debugInfo.error && (
              <div style={{ fontSize: '10px', marginTop: '4px', color: '#666' }}>
                {debugInfo.error}
              </div>
            )}
          </div>
        )}

        {adStatus === 'timeout' && (
          <div style={{ textAlign: 'center', color: '#999' }}>
            <div>광고 로딩 중...</div>
            <div style={{ fontSize: '10px', marginTop: '4px' }}>
              카카오 애드핏 서버 응답 대기 중
            </div>
          </div>
        )}

        {adStatus === 'fallback' && (
          <div style={{
            textAlign: 'center',
            color: '#666',
            backgroundColor: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: `${height}px`
          }}>
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
              📚 NEWStep Eng News
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '12px' }}>
              매일 뉴스로 배우는 영어 학습
            </div>
            <div style={{
              fontSize: '11px',
              color: '#28a745',
              backgroundColor: '#d4edda',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #c3e6cb'
            }}>
              무료 영어 학습 서비스
            </div>
            {import.meta.env.DEV && (
              <div style={{ fontSize: '9px', color: '#999', marginTop: '8px' }}>
                Fallback Ad (AdFit ID: {adUnitId})
              </div>
            )}
          </div>
        )}
      </div>

      {import.meta.env.DEV && (
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
          AdUnit: {adUnitId} | Size: {width}x{height} | Status: {adStatus}
          {debugInfo.childrenCount !== undefined && (
            <div>Children: {debugInfo.childrenCount} | HasHTML: {debugInfo.hasInnerHTML ? 'Yes' : 'No'}</div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BasicAdFitBanner;