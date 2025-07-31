import React, { useEffect } from 'react';

const ArticleBottomBanner = ({ articleId = 'default', className = '' }) => {
  console.log('🎯 ArticleBottomBanner 시작:', { articleId });

  useEffect(() => {
    const insertKakaoAd = () => {
      console.log('🎯 카카오 광고 삽입 시작');
      
      // 광고 컨테이너 찾기
      const container = document.getElementById('kakao-ad-container');
      if (!container) {
        console.error('❌ 광고 컨테이너를 찾을 수 없음');
        return;
      }

      // 이미 광고가 있으면 제거
      container.innerHTML = '';

      // 카카오 애드핏 광고 HTML 직접 삽입
      const adHTML = `
        <ins class="kakao_ad_area" 
             style="display:none;" 
             data-ad-unit="DAN-ks07LuYMpBfOqPPa" 
             data-ad-width="320" 
             data-ad-height="50">
        </ins>
      `;
      
      container.innerHTML = adHTML;
      console.log('✅ 광고 HTML 삽입 완료');

      // 스크립트 로드
      if (!document.querySelector('script[src*="kas/static/ba.min.js"]')) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
        script.async = true;
        
        script.onload = () => {
          console.log('✅ 카카오 애드핏 스크립트 로드 완료');
        };
        
        script.onerror = (error) => {
          console.error('❌ 카카오 애드핏 스크립트 로드 실패:', error);
        };
        
        document.head.appendChild(script);
        console.log('📜 카카오 애드핏 스크립트 추가됨');
      } else {
        console.log('✅ 카카오 애드핏 스크립트 이미 존재');
      }
    };

    // 1초 후 광고 삽입
    const timer = setTimeout(insertKakaoAd, 1000);
    return () => clearTimeout(timer);
  }, [articleId]);

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
        fontSize: '12px',
        color: '#666',
        marginBottom: '10px'
      }}>
        React 전용 광고 (DAN-ks07LuYMpBfOqPPa)
      </div>
      
      <div 
        id="kakao-ad-container"
        style={{
          width: '320px',
          height: '50px',
          maxWidth: '100%',
          margin: '0 auto',
          border: '1px dashed #ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9f9f9',
          fontSize: '12px',
          color: '#999'
        }}
      >
        광고 로딩 중...
      </div>
    </div>
  );
};

export default ArticleBottomBanner;