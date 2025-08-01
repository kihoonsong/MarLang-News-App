/**
 * ArticleBottomBanner 통합 테스트
 * 전체 광고 로딩 플로우를 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ArticleBottomBanner from '../ArticleBottomBanner';

// Mock dependencies
vi.mock('../../../utils/AdLoadingManager', () => {
  const mockManager = {
    loadAd: vi.fn(),
    cleanup: vi.fn(),
    getState: vi.fn().mockReturnValue({
      currentState: 'idle',
      retryCount: 0,
      lastError: null,
      loadStartTime: null,
      loadEndTime: null,
      errorStats: {}
    })
  };

  return {
    default: vi.fn().mockImplementation(() => mockManager),
    AdLoadingStates: {
      IDLE: 'idle',
      LOADING: 'loading',
      SUCCESS: 'success',
      ERROR: 'error',
      FALLBACK: 'fallback'
    }
  };
});

vi.mock('../../../utils/AdLogger', () => ({
  default: {
    updateConfig: vi.fn()
  }
}));

// DOM 환경 설정
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    display: 'block',
    visibility: 'visible'
  })
});

describe('ArticleBottomBanner Integration Tests', () => {
  let mockAdManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // AdLoadingManager mock 설정
    const AdLoadingManager = await import('../../../utils/AdLoadingManager');
    mockAdManager = {
      loadAd: vi.fn(),
      cleanup: vi.fn(),
      getState: vi.fn().mockReturnValue({
        currentState: 'idle',
        retryCount: 0,
        lastError: null,
        loadStartTime: null,
        loadEndTime: null,
        errorStats: {}
      })
    };
    AdLoadingManager.default.mockImplementation(() => mockAdManager);
    
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Successful Ad Loading Flow', () => {
    it('should complete full loading cycle successfully', async () => {
      // Mock successful loading
      mockAdManager.loadAd.mockResolvedValue(true);
      
      const onStateChange = vi.fn();
      const onSuccess = vi.fn();
      
      render(
        <ArticleBottomBanner
          articleId="test-article"
          adUnitId="test-ad-unit"
          debug={true}
        />
      );

      // 초기 로딩 상태 확인
      expect(screen.getByText('광고 로딩 중...')).toBeInTheDocument();

      // 타이머 진행하여 초기화 트리거
      vi.advanceTimersByTime(100);

      // AdLoadingManager가 호출되었는지 확인
      await waitFor(() => {
        expect(mockAdManager.loadAd).toHaveBeenCalled();
      });

      // 성공 상태로 변경 시뮬레이션
      const AdLoadingManager = await import('../../../utils/AdLoadingManager');
      const { AdLoadingStates } = AdLoadingManager;
      
      // 상태 변경 콜백 호출 시뮬레이션
      const managerInstance = AdLoadingManager.default.mock.results[0].value;
      const onStateChangeCallback = AdLoadingManager.default.mock.calls[0][0].onStateChange;
      const onSuccessCallback = AdLoadingManager.default.mock.calls[0][0].onSuccess;

      // 성공 상태로 변경
      onStateChangeCallback({
        oldState: AdLoadingStates.LOADING,
        newState: AdLoadingStates.SUCCESS,
        retryCount: 0
      });

      onSuccessCallback({
        loadTime: 1500,
        retryCount: 0
      });

      // 로딩 인디케이터가 사라졌는지 확인
      await waitFor(() => {
        expect(screen.queryByText('광고 로딩 중...')).not.toBeInTheDocument();
      });
    });

    it('should handle retry mechanism correctly', async () => {
      // 첫 번째 시도 실패, 두 번째 시도 성공
      mockAdManager.loadAd
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(true);

      render(
        <ArticleBottomBanner
          articleId="test-article"
          maxRetries={2}
          debug={true}
        />
      );

      // 초기화 트리거
      vi.advanceTimersByTime(100);

      await waitFor(() => {
        expect(mockAdManager.loadAd).toHaveBeenCalled();
      });

      // 에러 상태로 변경 시뮬레이션
      const AdLoadingManager = await import('../../../utils/AdLoadingManager');
      const { AdLoadingStates } = AdLoadingManager;
      const onStateChangeCallback = AdLoadingManager.default.mock.calls[0][0].onStateChange;
      const onErrorCallback = AdLoadingManager.default.mock.calls[0][0].onError;

      // 에러 상태
      onStateChangeCallback({
        oldState: AdLoadingStates.LOADING,
        newState: AdLoadingStates.ERROR,
        retryCount: 1
      });

      onErrorCallback({
        error: new Error('First attempt failed'),
        retryCount: 1
      });

      // 재시도 표시 확인
      await waitFor(() => {
        expect(screen.getByText(/재시도 1\/2/)).toBeInTheDocument();
      });

      // 재시도 버튼 클릭
      const retryButton = screen.getByText('다시 시도');
      fireEvent.click(retryButton);

      // 두 번째 시도 성공 시뮬레이션
      onStateChangeCallback({
        oldState: AdLoadingStates.ERROR,
        newState: AdLoadingStates.SUCCESS,
        retryCount: 1
      });

      // 성공 상태 확인
      await waitFor(() => {
        expect(screen.queryByText('광고 로딩 실패')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Flow', () => {
    it('should display error state and allow retry', async () => {
      // Mock failed loading
      mockAdManager.loadAd.mockRejectedValue(new Error('Loading failed'));

      render(
        <ArticleBottomBanner
          articleId="test-article"
          maxRetries={2}
          debug={true}
        />
      );

      // 초기화 트리거
      vi.advanceTimersByTime(100);

      await waitFor(() => {
        expect(mockAdManager.loadAd).toHaveBeenCalled();
      });

      // 에러 상태 시뮬레이션
      const AdLoadingManager = await import('../../../utils/AdLoadingManager');
      const { AdLoadingStates } = AdLoadingManager;
      const onStateChangeCallback = AdLoadingManager.default.mock.calls[0][0].onStateChange;
      const onErrorCallback = AdLoadingManager.default.mock.calls[0][0].onError;

      onStateChangeCallback({
        oldState: AdLoadingStates.LOADING,
        newState: AdLoadingStates.ERROR,
        retryCount: 1
      });

      onErrorCallback({
        error: new Error('Loading failed'),
        retryCount: 1
      });

      // 에러 메시지 확인
      await waitFor(() => {
        expect(screen.getByText('광고 로딩 실패')).toBeInTheDocument();
        expect(screen.getByText('Loading failed')).toBeInTheDocument();
      });

      // 재시도 버튼 확인
      const retryButton = screen.getByText('다시 시도');
      expect(retryButton).toBeInTheDocument();

      // 재시도 버튼 클릭
      fireEvent.click(retryButton);

      // 로딩 상태로 변경 확인
      await waitFor(() => {
        expect(screen.getByText('광고 로딩 중...')).toBeInTheDocument();
      });
    });

    it('should display fallback state after max retries', async () => {
      render(
        <ArticleBottomBanner
          articleId="test-article"
          maxRetries={2}
          debug={true}
        />
      );

      // 폴백 상태 시뮬레이션
      const AdLoadingManager = await import('../../../utils/AdLoadingManager');
      const { AdLoadingStates } = AdLoadingManager;
      const onStateChangeCallback = AdLoadingManager.default.mock.calls[0][0].onStateChange;

      onStateChangeCallback({
        oldState: AdLoadingStates.ERROR,
        newState: AdLoadingStates.FALLBACK,
        retryCount: 2
      });

      // 폴백 메시지 확인
      await waitFor(() => {
        expect(screen.getByText('광고를 불러올 수 없습니다')).toBeInTheDocument();
        expect(screen.getByText('2/2 재시도 완료')).toBeInTheDocument();
      });

      // 재시도 버튼이 없는지 확인
      expect(screen.queryByText('다시 시도')).not.toBeInTheDocument();
    });
  });

  describe('Component Props and Configuration', () => {
    it('should pass correct props to AdLoadingManager', async () => {
      const props = {
        articleId: 'custom-article',
        adUnitId: 'custom-ad-unit',
        maxRetries: 5,
        loadTimeout: 15000,
        width: 728,
        height: 90,
        debug: true
      };

      render(<ArticleBottomBanner {...props} />);

      // 초기화 트리거
      vi.advanceTimersByTime(100);

      const AdLoadingManager = await import('../../../utils/AdLoadingManager');
      
      await waitFor(() => {
        expect(AdLoadingManager.default).toHaveBeenCalledWith(
          expect.objectContaining({
            adUnitId: props.adUnitId,
            maxRetries: props.maxRetries,
            loadTimeout: props.loadTimeout,
            width: props.width,
            height: props.height,
            debug: props.debug
          })
        );
      });
    });

    it('should use default props when not provided', async () => {
      render(<ArticleBottomBanner />);

      // 초기화 트리거
      vi.advanceTimersByTime(100);

      const AdLoadingManager = await import('../../../utils/AdLoadingManager');
      
      await waitFor(() => {
        expect(AdLoadingManager.default).toHaveBeenCalledWith(
          expect.objectContaining({
            adUnitId: 'DAN-RNzVkjnBfLSGDxqM',
            maxRetries: 3,
            loadTimeout: 10000,
            width: 320,
            height: 100,
            debug: false
          })
        );
      });
    });
  });

  describe('Debug Mode', () => {
    it('should display debug information when enabled', async () => {
      render(
        <ArticleBottomBanner
          articleId="test-article"
          debug={true}
        />
      );

      // 디버그 정보 확인
      await waitFor(() => {
        expect(screen.getByText(/상태:/)).toBeInTheDocument();
        expect(screen.getByText(/재시도:/)).toBeInTheDocument();
      });
    });

    it('should not display debug information when disabled', async () => {
      render(
        <ArticleBottomBanner
          articleId="test-article"
          debug={false}
        />
      );

      // 디버그 정보가 없는지 확인
      expect(screen.queryByText(/상태:/)).not.toBeInTheDocument();
      expect(screen.queryByText(/재시도:/)).not.toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup AdLoadingManager on unmount', async () => {
      const { unmount } = render(
        <ArticleBottomBanner articleId="test-article" />
      );

      // 초기화 트리거
      vi.advanceTimersByTime(100);

      await waitFor(() => {
        expect(mockAdManager.loadAd).toHaveBeenCalled();
      });

      // 컴포넌트 언마운트
      unmount();

      // cleanup이 호출되었는지 확인
      expect(mockAdManager.cleanup).toHaveBeenCalled();
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('should work with different user agents', async () => {
      // Mobile user agent 시뮬레이션
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });

      render(
        <ArticleBottomBanner
          articleId="test-article"
          debug={true}
        />
      );

      // 초기화 트리거
      vi.advanceTimersByTime(100);

      await waitFor(() => {
        expect(mockAdManager.loadAd).toHaveBeenCalled();
      });

      // 모바일에서도 정상 작동하는지 확인
      expect(screen.getByText('광고')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not cause memory leaks with rapid mount/unmount', async () => {
      const { unmount, rerender } = render(
        <ArticleBottomBanner articleId="test-article-1" />
      );

      // 첫 번째 마운트
      vi.advanceTimersByTime(100);
      await waitFor(() => {
        expect(mockAdManager.loadAd).toHaveBeenCalled();
      });

      // 언마운트
      unmount();
      expect(mockAdManager.cleanup).toHaveBeenCalled();

      // 새로운 인스턴스로 재마운트
      vi.clearAllMocks();
      const AdLoadingManager = await import('../../../utils/AdLoadingManager');
      AdLoadingManager.default.mockImplementation(() => mockAdManager);

      render(<ArticleBottomBanner articleId="test-article-2" />);

      // 두 번째 마운트
      vi.advanceTimersByTime(100);
      await waitFor(() => {
        expect(mockAdManager.loadAd).toHaveBeenCalled();
      });

      // 메모리 누수 없이 정상 작동하는지 확인
      expect(screen.getByText('광고')).toBeInTheDocument();
    });

    it('should handle rapid state changes gracefully', async () => {
      render(
        <ArticleBottomBanner
          articleId="test-article"
          debug={true}
        />
      );

      const AdLoadingManager = await import('../../../utils/AdLoadingManager');
      const { AdLoadingStates } = AdLoadingManager;
      const onStateChangeCallback = AdLoadingManager.default.mock.calls[0][0].onStateChange;

      // 빠른 상태 변경 시뮬레이션
      onStateChangeCallback({
        oldState: AdLoadingStates.IDLE,
        newState: AdLoadingStates.LOADING,
        retryCount: 0
      });

      onStateChangeCallback({
        oldState: AdLoadingStates.LOADING,
        newState: AdLoadingStates.ERROR,
        retryCount: 1
      });

      onStateChangeCallback({
        oldState: AdLoadingStates.ERROR,
        newState: AdLoadingStates.LOADING,
        retryCount: 1
      });

      onStateChangeCallback({
        oldState: AdLoadingStates.LOADING,
        newState: AdLoadingStates.SUCCESS,
        retryCount: 1
      });

      // 최종 상태가 올바른지 확인
      await waitFor(() => {
        expect(screen.queryByText('광고 로딩 중...')).not.toBeInTheDocument();
        expect(screen.queryByText('광고 로딩 실패')).not.toBeInTheDocument();
      });
    });
  });
});