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

  // AdFit 스크립트 로드 함수 (안정적인 전역 관리)
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
        // 기존 스크립트가 있으면 로드 완료로 처리
        setIsAdFitLoaded(true);
        setIsLoading(false);
        console.log('✅ AdFit script already exists');
        return Promise.resolve();
      }

      // 새 스크립트 로드
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
        script.async = true;
        script.id = 'kakao-adfit-script'; // ID 추가로 중복 방지
        
        script.onload = () => {
          console.log('✅ AdFit script loaded successfully');
          setIsAdFitLoaded(true);
          setIsLoading(false);
          resolve();
        };
        
        script.onerror = (err) => {
          console.error('❌ Failed to load AdFit script:', err);
          setError('Failed to load AdFit script');
          setIsLoading(false);
          reject(err);
        };
        
        document.head.appendChild(script);
      });
    } catch (err) {
      console.error('AdFit loading error:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }, [isAdFitLoaded]);

  // 광고 단위 등록
  const registerAdUnit = useCallback((unitConfig) => {
    const { id, size, position } = unitConfig;
    
    setAdUnits(prev => {
      const newUnits = new Map(prev);
      if (!newUnits.has(id)) {
        const adUnit = createAdUnit(id, size, position);
        newUnits.set(id, adUnit);
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
        console.log(`🗑️ AdUnit unregistered: ${unitId}`);
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

  // 간단한 광고 표시
  const displayAd = useCallback(async (unitId) => {
    try {
      await loadAdFit();
      updateAdUnit(unitId, { isLoaded: true });
      console.log(`✅ Ad unit ready: ${unitId}`);
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
    console.log('🔄 Ads reset for page transition (script preserved)');
  }, []);

  // 광고 새로고침
  const refreshAd = useCallback((unitId) => {
    try {
      if (window.adfit && window.adfit.refresh) {
        window.adfit.refresh(unitId);
        console.log(`🔄 Ad refreshed: ${unitId}`);
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
        console.log(`💥 Ad destroyed: ${unitId}`);
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
        
        if (isBlocked) {
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