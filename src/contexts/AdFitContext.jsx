import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// AdFit Context 타입 정의
const AdFitContext = createContext();

export const useAdFit = () => {
  const context = useContext(AdFitContext);
  if (!context) {
    throw new Error('useAdFit must be used within an AdFitProvider');
  }
  return context;
};

// 광고 단위 타입 정의
const createAdUnit = (id, size, position) => ({
  id,
  size,
  position,
  isLoaded: false,
  isVisible: false,
  element: null,
  createdAt: Date.now()
});

export const AdFitProvider = ({ children }) => {
  const [isAdFitLoaded, setIsAdFitLoaded] = useState(false);
  const [adUnits, setAdUnits] = useState(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 개선된 AdFit 스크립트 로드 함수 (타이밍 이슈 해결)
  const loadAdFit = useCallback(async () => {
    // 이미 로드되어 있으면 바로 반환
    if (isAdFitLoaded && document.querySelector('script[src*="kas/static/ba.min.js"]')) {
      return Promise.resolve();
    }

    setIsLoading(true);
    setError(null);

    try {
      // 스크립트가 이미 존재하는지 확인
      let existingScript = document.querySelector('script[src*="kas/static/ba.min.js"]');
      
      if (existingScript) {
        // 스크립트가 완전히 로드되었는지 확인
        await waitForScriptReady();
        setIsAdFitLoaded(true);
        setIsLoading(false);
        if (import.meta.env.DEV) {
          console.log('✅ AdFit script already exists and ready');
        }
        return Promise.resolve();
      }

      // 스크립트 로드
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
        script.async = true;
        script.defer = true;
        script.id = 'kakao-adfit-script';
        
        // 타임아웃 설정 (10초)
        const timeout = setTimeout(() => {
          script.remove();
          setError('AdFit script loading timeout');
          setIsLoading(false);
          reject(new Error('AdFit script loading timeout'));
        }, 10000);
        
        script.onload = async () => {
          clearTimeout(timeout);
          
          try {
            // 스크립트 실행 완료까지 대기
            await waitForScriptReady();
            
            if (import.meta.env.DEV) {
              console.log('✅ AdFit script loaded and ready');
            }
            setIsAdFitLoaded(true);
            setIsLoading(false);
            resolve();
          } catch (initError) {
            console.error('AdFit 초기화 실패:', initError);
            setError('AdFit initialization failed');
            setIsLoading(false);
            reject(initError);
          }
        };
        
        script.onerror = (err) => {
          clearTimeout(timeout);
          console.error('❌ Failed to load AdFit script:', err);
          setError('Failed to load AdFit script');
          setIsLoading(false);
          reject(err);
        };
        
        // 스크립트를 head에 추가 (더 안정적)
        document.head.appendChild(script);
      });
    } catch (err) {
      console.error('AdFit loading error:', err);
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, [isAdFitLoaded]);

  // 스크립트 준비 상태 확인 함수
  const waitForScriptReady = useCallback(() => {
    return new Promise((resolve) => {
      const maxAttempts = 30; // 3초 최대 대기
      let attempts = 0;
      
      const checkReady = () => {
        attempts++;
        
        // 카카오 애드핏 관련 객체나 함수가 준비되었는지 확인
        if (window.kakaoAdFit || 
            typeof window.adfit !== 'undefined' ||
            document.querySelector('.kakao_ad_area')) {
          resolve();
          return;
        }
        
        if (attempts >= maxAttempts) {
          // 타임아웃이어도 resolve (광고가 안 나와도 페이지는 동작해야 함)
          console.warn('AdFit script ready check timeout');
          resolve();
          return;
        }
        
        setTimeout(checkReady, 100);
      };
      
      // 즉시 체크 후 필요시 재시도
      checkReady();
    });
  }, []);

  // 광고 단위 등록
  const registerAdUnit = useCallback((unitConfig) => {
    const { id, size, position } = unitConfig;
    
    setAdUnits(prev => {
      // 이미 존재하면 상태 업데이트 하지 않음
      if (prev.has(id)) {
        return prev;
      }
      
      const newUnits = new Map(prev);
      const adUnit = createAdUnit(id, size, position);
      newUnits.set(id, adUnit);
      
      if (import.meta.env.DEV) {
        console.log(`📝 AdUnit registered: ${id} (${size}) at ${position}`);
      }
      return newUnits;
    });
  }, []);

  // 광고 단위 해제
  const unregisterAdUnit = useCallback((unitId) => {
    setAdUnits(prev => {
      const newUnits = new Map(prev);
      if (newUnits.has(unitId)) {
        newUnits.delete(unitId);
        if (import.meta.env.DEV) {
          console.log(`🗑️ AdUnit unregistered: ${unitId}`);
        }
      }
      return newUnits;
    });
  }, []);

  // 광고 단위 상태 업데이트
  const updateAdUnit = useCallback((unitId, updates) => {
    setAdUnits(prev => {
      const newUnits = new Map(prev);
      const unit = newUnits.get(unitId);
      if (unit) {
        newUnits.set(unitId, { ...unit, ...updates });
      }
      return newUnits;
    });
  }, []);

  // 비동기 광고 표시 (메인 스레드 블로킹 방지)
  const displayAd = useCallback(async (unitId) => {
    try {
      // 비동기로 광고 로드 (메인 스레드 블로킹 방지)
      setTimeout(async () => {
        try {
          await loadAdFit();
          updateAdUnit(unitId, { isLoaded: true });
          if (import.meta.env.DEV) {
            console.log(`✅ Ad unit ready: ${unitId}`);
          }
        } catch (err) {
          console.error(`❌ Failed to display ad ${unitId}:`, err);
          updateAdUnit(unitId, { isLoaded: false });
        }
      }, 0); // 다음 이벤트 루프에서 실행
    } catch (err) {
      console.error(`❌ Failed to display ad ${unitId}:`, err);
      updateAdUnit(unitId, { isLoaded: false });
      throw err;
    }
  }, [loadAdFit, updateAdUnit]);

  // 페이지 전환 시 광고 초기화 (스크립트는 유지)
  const resetAds = useCallback(() => {
    setAdUnits(new Map());
    // 스크립트는 유지하고 상태만 초기화
    // setIsAdFitLoaded(false);
    setError(null);
    if (import.meta.env.DEV) {
      console.log('🔄 Ads reset for page transition (script preserved)');
    }
  }, []);

  // 광고 새로고침
  const refreshAd = useCallback((unitId) => {
    try {
      if (window.adfit && window.adfit.refresh) {
        window.adfit.refresh(unitId);
        if (import.meta.env.DEV) {
          console.log(`🔄 Ad refreshed: ${unitId}`);
        }
      }
    } catch (err) {
      console.error(`❌ Failed to refresh ad ${unitId}:`, err);
    }
  }, []);

  // 광고 제거
  const destroyAd = useCallback((unitId) => {
    try {
      if (window.adfit && window.adfit.destroy) {
        window.adfit.destroy(unitId);
        if (import.meta.env.DEV) {
          console.log(`💥 Ad destroyed: ${unitId}`);
        }
      }
      updateAdUnit(unitId, { isLoaded: false });
    } catch (err) {
      console.error(`❌ Failed to destroy ad ${unitId}:`, err);
    }
  }, [updateAdUnit]);

  // 모든 광고 단위 정보 가져오기
  const getAdUnit = useCallback((unitId) => {
    return adUnits.get(unitId);
  }, [adUnits]);

  const getAllAdUnits = useCallback(() => {
    return Array.from(adUnits.values());
  }, [adUnits]);

  // 광고 차단기 감지
  const [isAdBlocked, setIsAdBlocked] = useState(false);

  useEffect(() => {
    const detectAdBlock = () => {
      const testAd = document.createElement('div');
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox';
      testAd.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;';
      document.body.appendChild(testAd);

      setTimeout(() => {
        const isBlocked = testAd.offsetHeight === 0;
        setIsAdBlocked(isBlocked);
        document.body.removeChild(testAd);
        
        if (isBlocked && import.meta.env.DEV) {
          console.warn('⚠️ Ad blocker detected');
        }
      }, 100);
    };

    detectAdBlock();
  }, []);

  // Context value
  const value = {
    // 상태
    isAdFitLoaded,
    isLoading,
    error,
    isAdBlocked,
    adUnits: getAllAdUnits(),
    
    // 함수
    loadAdFit,
    registerAdUnit,
    unregisterAdUnit,
    updateAdUnit,
    displayAd,
    refreshAd,
    destroyAd,
    getAdUnit,
    getAllAdUnits,
    resetAds
  };

  return (
    <AdFitContext.Provider value={value}>
      {children}
    </AdFitContext.Provider>
  );
};

export default AdFitProvider;