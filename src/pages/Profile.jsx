import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';
import AuthGuard from '../components/AuthGuard';

const Profile = () => {
  const { user, logout } = useAuth();
  const { 
    userSettings, 
    updateSettings, 
    getStats, 
    savedWords, 
    likedArticles, 
    exportData, 
    clearAllData 
  } = useData();
  const navigate = useNavigate();
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [recentWords, setRecentWords] = useState([]);
  const [recentArticles, setRecentArticles] = useState([]);
  const [saveMessage, setSaveMessage] = useState('');

  const stats = getStats();

  // 최근 활동 데이터 준비
  useEffect(() => {
    // 최근 5개 단어
    const recent = [...savedWords]
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
      .slice(0, 5);
    setRecentWords(recent);

    // 최근 5개 좋아요 기사
    const recentLiked = [...likedArticles]
      .sort((a, b) => new Date(b.likedAt) - new Date(a.likedAt))
      .slice(0, 5);
    setRecentArticles(recentLiked);
  }, [savedWords, likedArticles]);

  // 설정 변경 - 즉시 저장
  const handleSettingChange = (key, value) => {
    updateSettings({ [key]: value });
    
    // 저장 성공 메시지 표시
    setSaveMessage('✅ 저장됨');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  // 데이터 내보내기
  const handleExportData = () => {
    if (exportData()) {
      alert('📄 데이터가 성공적으로 내보내졌습니다!');
    } else {
      alert('❌ 데이터 내보내기에 실패했습니다.');
    }
  };

  // 데이터 삭제 확인
  const handleClearData = () => {
    if (clearAllData()) {
      setShowClearConfirm(false);
      alert('🗑️ 모든 데이터가 삭제되었습니다.');
    } else {
      alert('❌ 데이터 삭제에 실패했습니다.');
    }
  };

  // 시간 형식 함수
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMinutes = Math.floor((now - past) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
  };

  // 언어 옵션
  const languageOptions = [
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
  ];

  // 스타일
  const styles = {
    container: {
      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      minHeight: '100vh',
      paddingTop: '1rem'
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '0.5rem'
    },
    subtitle: {
      color: '#6b7280',
      fontSize: '1rem'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e5e7eb'
    },
    button: {
      padding: '0.75rem 1.5rem',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontSize: '0.875rem'
    },
    primaryButton: {
      backgroundColor: '#2563eb',
      color: '#ffffff'
    },
    secondaryButton: {
      backgroundColor: '#6b7280',
      color: '#ffffff'
    },
    successButton: {
      backgroundColor: '#059669',
      color: '#ffffff'
    },
    dangerButton: {
      backgroundColor: '#dc2626',
      color: '#ffffff'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '0.875rem'
    },
    toggleContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 0'
    },
    toggle: {
      position: 'relative',
      width: '44px',
      height: '24px',
      backgroundColor: '#d1d5db',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    toggleActive: {
      backgroundColor: '#2563eb'
    },
    toggleKnob: {
      position: 'absolute',
      top: '2px',
      left: '2px',
      width: '20px',
      height: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '50%',
      transition: 'transform 0.2s'
    },
    toggleKnobActive: {
      transform: 'translateX(20px)'
    }
  };

  return (
    <AuthGuard>
      <MobileNavigation />
      <MobileContentWrapper>
        <div style={styles.container}>
          <PageContainer>
            
            {/* 헤더 */}
            <div style={styles.header}>
              <h1 style={styles.title}>프로필 & 설정</h1>
              <p style={styles.subtitle}>나만의 학습 환경을 설정해보세요</p>
            </div>

            {/* 메인 그리드 */}
            <div style={styles.grid}>
              
              {/* 프로필 카드 */}
              <div style={{...styles.card, textAlign: 'center'}}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#ffffff'
                }}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <h2 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem'}}>
                  {user?.name}
                </h2>
                <p style={{color: '#6b7280', marginBottom: '1.5rem'}}>{user?.email}</p>
                
                {/* 레벨 시스템 */}
                <div style={{marginBottom: '1.5rem'}}>
                  <div style={{fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem'}}>학습 레벨</div>
                  <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb', marginBottom: '0.5rem'}}>
                    레벨 {Math.floor(stats.totalWords / 10) + 1}
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{
                      width: `${(stats.totalWords % 10) * 10}%`,
                      height: '100%',
                      backgroundColor: '#2563eb',
                      transition: 'width 0.3s'
                    }}></div>
                  </div>
                  <div style={{fontSize: '0.75rem', color: '#6b7280'}}>
                    다음 레벨까지 {10 - (stats.totalWords % 10)}개 단어
                  </div>
                </div>

                {/* 배지 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.5rem',
                  marginBottom: '1.5rem'
                }}>
                  {stats.totalWords >= 50 && (
                    <div style={{
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      textAlign: 'center'
                    }}>
                      🏆 단어 수집가
                    </div>
                  )}
                  {stats.totalLikedArticles >= 20 && (
                    <div style={{
                      backgroundColor: '#fecaca',
                      color: '#b91c1c',
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      textAlign: 'center'
                    }}>
                      ❤️ 독서광
                    </div>
                  )}
                  {stats.wordsThisWeek >= 20 && (
                    <div style={{
                      backgroundColor: '#bbf7d0',
                      color: '#059669',
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      textAlign: 'center'
                    }}>
                      🔥 이번 주 MVP
                    </div>
                  )}
                  <div style={{
                    backgroundColor: '#dbeafe',
                    color: '#1d4ed8',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    textAlign: 'center'
                  }}>
                    📚 학습자
                  </div>
                </div>

                <button 
                  onClick={logout}
                  style={{
                    ...styles.button,
                    backgroundColor: '#f3f4f6',
                    color: '#4b5563',
                    width: '100%'
                  }}
                >
                  로그아웃
                </button>
              </div>

              {/* 학습 통계 */}
              <div style={styles.card}>
                <h3 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem'}}>
                  📊 학습 통계
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem'
                }}>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb'}}>
                      {stats.totalWords}
                    </div>
                    <div style={{fontSize: '0.875rem', color: '#6b7280'}}>저장 단어</div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626'}}>
                      {stats.totalLikedArticles}
                    </div>
                    <div style={{fontSize: '0.875rem', color: '#6b7280'}}>좋아요 기사</div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#059669'}}>
                      {stats.wordsThisWeek}
                    </div>
                    <div style={{fontSize: '0.875rem', color: '#6b7280'}}>이번 주 단어</div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#7c3aed'}}>
                      {Math.floor((stats.totalWords + stats.totalLikedArticles) / 7)}
                    </div>
                    <div style={{fontSize: '0.875rem', color: '#6b7280'}}>연속 학습일</div>
                  </div>
                </div>
              </div>

              {/* 빠른 액션 */}
              <div style={styles.card}>
                <h3 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem'}}>
                  🚀 빠른 액션
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  <button 
                    onClick={() => navigate('/wordbook')}
                    style={{
                      ...styles.button,
                      ...styles.primaryButton,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    📚 단어장 보기 ({stats.totalWords}개)
                  </button>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    style={{
                      ...styles.button,
                      backgroundColor: '#7c3aed',
                      color: '#ffffff',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ❤️ 좋아요 기사 ({stats.totalLikedArticles}개)
                  </button>
                </div>
              </div>
            </div>

            {/* 설정 섹션 */}
            <div style={{...styles.card, marginBottom: '2rem'}}>
              <div style={{marginBottom: '1.5rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <h3 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937'}}>⚙️ 실제 작동 설정</h3>
                  {saveMessage && (
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#059669',
                      fontWeight: '500',
                      backgroundColor: '#d1fae5',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px',
                      animation: 'fadeIn 0.3s ease-in-out'
                    }}>
                      {saveMessage}
                    </div>
                  )}
                </div>
                <p style={{fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem'}}>
                  아래 모든 설정은 실제로 작동하며, 변경 시 즉시 적용됩니다
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem'
              }}>
                
                {/* 번역 언어 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    🌍 번역 언어 (단어 클릭 시 번역 언어)
                  </label>
                  <select 
                    value={userSettings.translationLanguage}
                    onChange={(e) => handleSettingChange('translationLanguage', e.target.value)}
                    style={styles.input}
                  >
                    {languageOptions.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TTS 속도 */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    ⚡ TTS 속도: {userSettings.ttsSpeed}x (음성 재생 속도)
                  </label>
                  <input 
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={userSettings.ttsSpeed}
                    onChange={(e) => handleSettingChange('ttsSpeed', parseFloat(e.target.value))}
                    style={{width: '100%'}}
                  />
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280'}}>
                    <span>0.5x</span>
                    <span>1.0x</span>
                    <span>2.0x</span>
                  </div>
                </div>

                {/* 토글 설정들 */}
                {/* 자동 저장 단어 */}
                <div style={styles.toggleContainer}>
                  <div>
                    <div style={{fontWeight: '500', color: '#374151'}}>💾 자동 단어 저장</div>
                    <div style={{fontSize: '0.875rem', color: '#6b7280'}}>단어 클릭 시 자동으로 저장</div>
                  </div>
                  <div 
                    onClick={() => handleSettingChange('autoSaveWords', !userSettings.autoSaveWords)}
                    style={{
                      ...styles.toggle,
                      ...(userSettings.autoSaveWords ? styles.toggleActive : {}),
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      ...styles.toggleKnob,
                      ...(userSettings.autoSaveWords ? styles.toggleKnobActive : {})
                    }}></div>
                  </div>
                </div>

                {/* 자동 음성 재생 */}
                <div style={styles.toggleContainer}>
                  <div>
                    <div style={{fontWeight: '500', color: '#374151'}}>🔊 자동 음성 재생</div>
                    <div style={{fontSize: '0.875rem', color: '#6b7280'}}>단어 팝업 시 자동 발음</div>
                  </div>
                  <div 
                    onClick={() => handleSettingChange('autoPlay', !userSettings.autoPlay)}
                    style={{
                      ...styles.toggle,
                      ...(userSettings.autoPlay ? styles.toggleActive : {}),
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      ...styles.toggleKnob,
                      ...(userSettings.autoPlay ? styles.toggleKnobActive : {})
                    }}></div>
                  </div>
                </div>

                {/* 저장된 단어 하이라이트 */}
                <div style={styles.toggleContainer}>
                  <div>
                    <div style={{fontWeight: '500', color: '#374151'}}>✨ 저장된 단어 하이라이트</div>
                    <div style={{fontSize: '0.875rem', color: '#6b7280'}}>기사에서 저장된 단어 강조 표시</div>
                  </div>
                  <div 
                    onClick={() => handleSettingChange('highlightSavedWords', !userSettings.highlightSavedWords)}
                    style={{
                      ...styles.toggle,
                      ...(userSettings.highlightSavedWords ? styles.toggleActive : {}),
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      ...styles.toggleKnob,
                      ...(userSettings.highlightSavedWords ? styles.toggleKnobActive : {})
                    }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 데이터 관리 & 최근 활동 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              
              {/* 데이터 관리 */}
              <div style={styles.card}>
                <h3 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem'}}>
                  🔐 데이터 관리
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  <button 
                    onClick={handleExportData}
                    style={{
                      ...styles.button,
                      ...styles.successButton,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    📄 데이터 내보내기 (JSON)
                  </button>
                  <button 
                    onClick={() => setShowClearConfirm(true)}
                    style={{
                      ...styles.button,
                      ...styles.dangerButton,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    🗑️ 모든 데이터 삭제
                  </button>
                </div>
              </div>

              {/* 최근 활동 */}
              <div style={styles.card}>
                <h3 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem'}}>
                  📊 최근 활동
                </h3>
                
                {/* 최근 저장 단어 */}
                <div style={{marginBottom: '1.5rem'}}>
                  <h4 style={{fontWeight: '500', color: '#374151', marginBottom: '0.75rem'}}>💾 최근 저장한 단어</h4>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                    {recentWords.length > 0 ? recentWords.slice(0, 3).map(word => (
                      <div key={word.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px'
                      }}>
                        <div>
                          <div style={{fontWeight: '500', color: '#1f2937'}}>{word.word}</div>
                          <div style={{fontSize: '0.75rem', color: '#6b7280'}}>{word.articleTitle}</div>
                        </div>
                        <div style={{fontSize: '0.75rem', color: '#9ca3af'}}>
                          {formatTimeAgo(word.addedAt)}
                        </div>
                      </div>
                    )) : (
                      <div style={{fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic'}}>
                        아직 저장한 단어가 없습니다
                      </div>
                    )}
                  </div>
                </div>

                {/* 최근 좋아요 기사 */}
                <div>
                  <h4 style={{fontWeight: '500', color: '#374151', marginBottom: '0.75rem'}}>❤️ 최근 좋아요한 기사</h4>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                    {recentArticles.length > 0 ? recentArticles.slice(0, 3).map(article => (
                      <div key={article.id} style={{
                        padding: '0.5rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px'
                      }}>
                        <div style={{
                          fontWeight: '500',
                          color: '#1f2937',
                          fontSize: '0.875rem',
                          lineHeight: '1.25',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {article.title}
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '0.25rem'
                        }}>
                          <div style={{fontSize: '0.75rem', color: '#6b7280'}}>{article.category}</div>
                          <div style={{fontSize: '0.75rem', color: '#9ca3af'}}>
                            {formatTimeAgo(article.likedAt)}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div style={{fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic'}}>
                        아직 좋아요한 기사가 없습니다
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 데이터 삭제 확인 다이얼로그 */}
            {showClearConfirm && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50
              }}>
                <div style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  maxWidth: '400px',
                  width: '90%',
                  margin: '0 1rem'
                }}>
                  <h3 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem'}}>
                    ⚠️ 경고
                  </h3>
                  <p style={{color: '#6b7280', marginBottom: '1.5rem'}}>
                    모든 학습 데이터(저장된 단어, 좋아요한 기사, 설정 등)가 영구적으로 삭제됩니다. 
                    이 작업은 되돌릴 수 없습니다.
                  </p>
                  <div style={{display: 'flex', gap: '1rem'}}>
                    <button 
                      onClick={handleClearData}
                      style={{
                        ...styles.button,
                        ...styles.dangerButton,
                        flex: 1
                      }}
                    >
                      삭제
                    </button>
                    <button 
                      onClick={() => setShowClearConfirm(false)}
                      style={{
                        ...styles.button,
                        ...styles.secondaryButton,
                        flex: 1
                      }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}

          </PageContainer>
        </div>
      </MobileContentWrapper>
    </AuthGuard>
  );
};

export default Profile; 