import React from 'react';
import styled from 'styled-components';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';

const ContactContainer = styled.div`
  padding: 2rem;
  line-height: 1.6;
  max-width: 800px;
  margin: 0 auto;
  
  h1, h2 {
    margin-bottom: 1rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
  }
  
  .contact-info {
    background: #f5f5f5;
    padding: 1.5rem;
    border-radius: 8px;
    margin: 1rem 0;
  }
  
  .contact-info p {
    margin: 0.5rem 0;
  }
`;

const Contact = () => {
  return (
    <>
      <MobileNavigation />
      <MobileContentWrapper>
        <PageContainer>
          <ContactContainer>
            <h1>Contact Us</h1>
            <p>NEWStep Eng News에 대한 문의사항이나 제안이 있으시면 언제든지 연락해 주세요.</p>

            <h2>연락처 정보</h2>
            <div className="contact-info">
              <p><strong>서비스명:</strong> NEWStep Eng News</p>
              <p><strong>웹사이트:</strong> https://marlang-app.web.app</p>
              <p><strong>이메일:</strong> contact@marlang-app.web.app</p>
              <p><strong>운영팀:</strong> NEWStep Team</p>
            </div>

            <h2>문의 유형</h2>
            <ul>
              <li><strong>기술 지원:</strong> 사이트 이용 중 발생하는 기술적 문제</li>
              <li><strong>콘텐츠 문의:</strong> 뉴스 기사나 번역 관련 문의</li>
              <li><strong>계정 문의:</strong> 로그인이나 계정 관련 문제</li>
              <li><strong>제안 및 피드백:</strong> 서비스 개선을 위한 제안</li>
              <li><strong>비즈니스 문의:</strong> 파트너십이나 광고 관련 문의</li>
            </ul>

            <h2>응답 시간</h2>
            <p>
              일반적으로 영업일 기준 24-48시간 내에 답변드리며, 
              긴급한 기술적 문제의 경우 더 빠른 응답을 위해 노력하겠습니다.
            </p>

            <h2>자주 묻는 질문</h2>
            <p>
              문의하시기 전에 일반적인 질문들에 대한 답변을 확인해보세요:
            </p>
            <ul>
              <li><strong>Q: 회원가입은 어떻게 하나요?</strong><br />
                  A: Google 계정으로 간편하게 로그인할 수 있습니다.</li>
              <li><strong>Q: 단어장 기능은 어떻게 사용하나요?</strong><br />
                  A: 기사를 읽으며 모르는 단어를 클릭하면 자동으로 단어장에 저장됩니다.</li>
              <li><strong>Q: 번역 기능이 작동하지 않아요.</strong><br />
                  A: 브라우저를 새로고침하거나 로그인 상태를 확인해주세요.</li>
            </ul>

            <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
              © 2024 NEWStep Eng News. 모든 문의는 성실히 답변해드리겠습니다.
            </p>
          </ContactContainer>
        </PageContainer>
      </MobileContentWrapper>
    </>
  );
};

export default Contact;