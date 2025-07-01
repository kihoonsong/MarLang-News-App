import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';
import AuthGuard from '../components/AuthGuard';

const Profile = () => {
  const { user, logout, isAdmin } = useAuth();
  const { 
    userSettings, 
    updateSettings, 
    getStats, 
    savedWords, 
    likedArticles 
  } = useData();
  const navigate = useNavigate();
  
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
                <p style={{color: '#6b7280', marginBottom: '0.5rem'}}>{user?.email}</p>
                
                {/* 역할 배지 */}
                <div style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  backgroundColor: isAdmin ? '#fef3c7' : '#dbeafe',
                  color: isAdmin ? '#92400e' : '#1d4ed8',
                  marginBottom: '1.5rem'
                }}>
                  {isAdmin ? '👑 관리자' : '👤 일반 사용자'}
                </div>
                
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
                    onClick={() => navigate('/like')}
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
                  
                  {/* 관리자만 볼 수 있는 대시보드 버튼 */}
                  {isAdmin && (
                    <button 
                      onClick={() => navigate('/dashboard')}
                      style={{
                        ...styles.button,
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: '#ffffff',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #f59e0b',
                        boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                      }}
                    >
                      🔧 관리자 대시보드 
                    </button>
                  )}
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

            {/* 최근 활동 - 전체 너비로 확장 */}
            <div style={{...styles.card, marginBottom: '2rem'}}>
              <h3 style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem'}}>
                📊 최근 활동
              </h3>
              
              {/* 최근 활동을 2칸 그리드로 좌우 확장 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem'
              }}>
                {/* 최근 저장 단어 */}
                <div>
                  <h4 style={{
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '1rem',
                    fontSize: '1.1rem',
                    borderBottom: '2px solid #f3f4f6',
                    paddingBottom: '0.5rem'
                  }}>
                    💾 최근 저장한 단어
                  </h4>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                    {recentWords.length > 0 ? recentWords.slice(0, 5).map(word => (
                      <div key={word.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f1f5f9';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#f8fafc';
                        e.target.style.transform = 'translateY(0)';
                      }}
                      >
                        <div>
                          <div style={{
                            fontWeight: '600',
                            color: '#1f2937',
                            fontSize: '1rem',
                            marginBottom: '0.25rem'
                          }}>
                            {word.word}
                          </div>
                          <div style={{
                            fontSize: '0.8rem',
                            color: '#6b7280',
                            fontStyle: 'italic'
                          }}>
                            {word.articleTitle}
                          </div>
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#9ca3af',
                          fontWeight: '500'
                        }}>
                          {formatTimeAgo(word.addedAt)}
                        </div>
                      </div>
                    )) : (
                      <div style={{
                        fontSize: '0.9rem',
                        color: '#6b7280',
                        fontStyle: 'italic',
                        textAlign: 'center',
                        padding: '2rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '2px dashed #d1d5db'
                      }}>
                        아직 저장한 단어가 없습니다
                      </div>
                    )}
                  </div>
                </div>

                {/* 최근 좋아요 기사 */}
                <div>
                  <h4 style={{
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '1rem',
                    fontSize: '1.1rem',
                    borderBottom: '2px solid #f3f4f6',
                    paddingBottom: '0.5rem'
                  }}>
                    ❤️ 최근 좋아요한 기사
                  </h4>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                    {recentArticles.length > 0 ? recentArticles.slice(0, 5).map(article => (
                      <div key={article.id} style={{
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f1f5f9';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#f8fafc';
                        e.target.style.transform = 'translateY(0)';
                      }}
                      >
                        <div style={{
                          fontWeight: '600',
                          color: '#1f2937',
                          fontSize: '0.95rem',
                          lineHeight: '1.4',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          marginBottom: '0.5rem'
                        }}>
                          {article.title}
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{
                            fontSize: '0.8rem',
                            color: '#6b7280',
                            fontWeight: '500'
                          }}>
                            {article.category}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#9ca3af',
                            fontWeight: '500'
                          }}>
                            {formatTimeAgo(article.likedAt)}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div style={{
                        fontSize: '0.9rem',
                        color: '#6b7280',
                        fontStyle: 'italic',
                        textAlign: 'center',
                        padding: '2rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '2px dashed #d1d5db'
                      }}>
                        아직 좋아요한 기사가 없습니다
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </PageContainer>
        </div>
      </MobileContentWrapper>
    </AuthGuard>
  );
};

export default Profile; 