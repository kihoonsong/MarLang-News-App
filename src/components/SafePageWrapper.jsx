import React from 'react';
import { useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

const SafePageWrapper = ({ children, pageName }) => {
  const location = useLocation();

  return (
    <ErrorBoundary
      key={`${location.pathname}-${Date.now()}`} // 강제 리셋을 위한 고유 키
      fallback={(props) => (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          minHeight: '50vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f8f9fa'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h2 style={{ 
              color: '#dc3545', 
              marginBottom: '1rem',
              fontSize: '1.5rem'
            }}>
              페이지 로딩 오류
            </h2>
            <p style={{ 
              color: '#6c757d', 
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              {pageName} 페이지를 불러오는 중 오류가 발생했습니다.
              <br />
              잠시 후 다시 시도해주세요.
            </p>
            
            {import.meta.env.DEV && props.error && (
              <details style={{ 
                marginBottom: '1.5rem',
                textAlign: 'left',
                background: '#f8f9fa',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  기술적 세부사항 (개발 모드)
                </summary>
                <pre style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.8rem', 
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  color: '#dc3545'
                }}>
                  {props.error.message}
                  {'\n\n'}
                  {props.error.stack}
                </pre>
              </details>
            )}
            
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => {
                  // 전역 상태 정리
                  try {
                    if (window.globalStopTTS) {
                      window.globalStopTTS();
                    }
                    if (window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                    }
                  } catch (cleanupError) {
                    console.warn('정리 작업 실패:', cleanupError);
                  }
                  
                  // 페이지 새로고침
                  window.location.reload();
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                페이지 새로고침
              </button>
              
              <button
                onClick={() => {
                  // 전역 상태 정리 후 홈으로 이동
                  try {
                    if (window.globalStopTTS) {
                      window.globalStopTTS();
                    }
                    if (window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                    }
                  } catch (cleanupError) {
                    console.warn('정리 작업 실패:', cleanupError);
                  }
                  
                  window.location.href = '/';
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                홈으로 이동
              </button>
            </div>
          </div>
        </div>
      )}
    >
      <React.Suspense 
        fallback={
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            minHeight: '50vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #007bff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
            <p style={{ color: '#6c757d' }}>
              {pageName} 로딩 중...
            </p>
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        }
      >
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
};

export default SafePageWrapper;