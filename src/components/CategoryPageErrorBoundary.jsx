import React from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

const CategoryPageErrorBoundary = ({ children, categorySlug }) => {
  const navigate = useNavigate();

  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
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
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚨</div>
            <h2 style={{ 
              color: '#dc3545', 
              marginBottom: '1rem',
              fontSize: '1.5rem'
            }}>
              카테고리 페이지 오류
            </h2>
            <p style={{ 
              color: '#6c757d', 
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              "{categorySlug}" 카테고리 페이지를 불러오는 중 오류가 발생했습니다.
              <br />
              홈페이지로 돌아가서 다시 시도해주세요.
            </p>
            
            {import.meta.env.DEV && error && (
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
                  {error.message}
                  {'\n\n'}
                  {error.stack}
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
                  
                  // 홈으로 이동
                  navigate('/', { replace: true });
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
                홈으로 이동
              </button>
              
              <button
                onClick={() => {
                  // 전역 상태 정리 후 재시도
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
                  
                  resetError();
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
                다시 시도
              </button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

export default CategoryPageErrorBoundary;