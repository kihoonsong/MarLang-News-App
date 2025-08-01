/**
 * AdErrorBoundary - 광고 컴포넌트 에러 바운더리
 * 광고 로딩 중 발생하는 React 에러를 안전하게 처리
 */

import React from 'react';
import adLogger from '../../utils/AdLogger';

class AdErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // 다음 렌더링에서 폴백 UI가 보이도록 상태를 업데이트
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 에러 로깅
    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // AdLogger를 통한 에러 로깅
    adLogger.log('error', '광고 컴포넌트 에러 바운더리 활성화', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo,
      componentStack: errorInfo.componentStack,
      adUnitId: this.props.adUnitId || 'unknown',
      retryCount: this.state.retryCount
    });

    // 개발 모드에서 콘솔 출력
    if (import.meta.env.DEV) {
      console.error('광고 컴포넌트 에러:', error);
      console.error('에러 정보:', errorInfo);
    }

    // 에러 리포팅 (선택사항)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  // 재시도 핸들러
  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    // 최대 재시도 횟수 제한
    if (newRetryCount > (this.props.maxRetries || 2)) {
      adLogger.log('warn', '광고 컴포넌트 최대 재시도 횟수 초과', {
        retryCount: newRetryCount,
        maxRetries: this.props.maxRetries || 2
      });
      return;
    }

    adLogger.log('info', '광고 컴포넌트 재시도', {
      retryCount: newRetryCount
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: newRetryCount
    });
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 폴백 UI가 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 폴백 UI
      return (
        <div style={{
          margin: '32px 0',
          padding: '16px',
          borderTop: '1px solid #e0e0e0',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fafafa',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '11px',
            color: '#888',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '12px',
            fontWeight: '500'
          }}>
            광고
          </div>
          
          <div style={{
            width: '320px',
            height: '100px',
            maxWidth: '100%',
            margin: '0 auto',
            backgroundColor: '#f5f5f5',
            border: '1px dashed #bdbdbd',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#757575',
              marginBottom: '8px'
            }}>
              광고 로딩 중 오류가 발생했습니다
            </div>
            
            {this.state.retryCount < (this.props.maxRetries || 2) && (
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                다시 시도 ({this.state.retryCount + 1}/{this.props.maxRetries || 2})
              </button>
            )}
            
            {import.meta.env.DEV && (
              <div style={{
                position: 'absolute',
                bottom: '4px',
                left: '4px',
                fontSize: '9px',
                color: '#999',
                fontFamily: 'monospace'
              }}>
                Error: {this.state.error?.message}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdErrorBoundary;