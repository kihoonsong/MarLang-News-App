import { useRef, useEffect } from 'react';

/**
 * Enhanced cleanup hook for preventing memory leaks
 * Automatically handles cleanup functions on component unmount
 */
export const useCleanup = (cleanupFn) => {
  const cleanupRef = useRef(cleanupFn);
  
  // Update cleanup function reference
  useEffect(() => {
    cleanupRef.current = cleanupFn;
  }, [cleanupFn]);
  
  // Execute cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current && typeof cleanupRef.current === 'function') {
        try {
          cleanupRef.current();
        } catch (error) {
          console.error('Cleanup function error:', error);
        }
      }
    };
  }, []);
};

/**
 * Hook for managing multiple cleanup functions
 */
export const useMultipleCleanup = () => {
  const cleanupFunctions = useRef([]);
  
  const addCleanup = (cleanupFn) => {
    if (typeof cleanupFn === 'function') {
      cleanupFunctions.current.push(cleanupFn);
    }
  };
  
  const removeCleanup = (cleanupFn) => {
    const index = cleanupFunctions.current.indexOf(cleanupFn);
    if (index > -1) {
      cleanupFunctions.current.splice(index, 1);
    }
  };
  
  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach(cleanupFn => {
        try {
          cleanupFn();
        } catch (error) {
          console.error('Multiple cleanup function error:', error);
        }
      });
      cleanupFunctions.current = [];
    };
  }, []);
  
  return { addCleanup, removeCleanup };
};

/**
 * Hook for safe event listener management
 */
export const useSafeEventListener = (element, event, handler, options) => {
  useEffect(() => {
    if (!element || !event || !handler) return;
    
    const targetElement = element.current || element;
    if (!targetElement || !targetElement.addEventListener) return;
    
    targetElement.addEventListener(event, handler, options);
    
    return () => {
      if (targetElement && targetElement.removeEventListener) {
        targetElement.removeEventListener(event, handler, options);
      }
    };
  }, [element, event, handler, options]);
};