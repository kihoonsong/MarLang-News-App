import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';

const AboutContainer = styled.div`
  padding: 2rem;
  line-height: 1.6;
  max-width: 800px;
  margin: 0 auto;
  
  h1, h2 {
    margin-bottom: 1rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
  }
  
  h1 {
    color: #1976d2;
    font-size: 2rem;
  }
  
  h2 {
    color: #333;
    font-size: 1.5rem;
  }
  
  p {
    margin-bottom: 1rem;
  }
  
  ul {
    margin: 1rem 0;
    padding-left: 2rem;
  }
  
  li {
    margin: 0.5rem 0;
  }
`;

const About = () => {
  return (
    <>
      <MobileNavigation />
      <MobileContentWrapper>
        <PageContainer>
          <AboutContainer>
            <h1>About NEWStep Eng News</h1>
            
            <h2>Our Mission</h2>
            <p>
              NEWStep Eng News는 영어 뉴스를 통해 실용적인 영어 학습을 제공하는 교육 플랫폼입니다. 
              우리는 영어 학습자들이 실제 뉴스 콘텐츠를 통해 자연스럽고 효과적으로 영어 실력을 향상시킬 수 있도록 돕습니다.
            </p>
            
            <h2>What We Offer</h2>
            <ul>
              <li><strong>English News Learning:</strong> Technology, Business, Politics, Culture 등 다양한 분야의 영어 뉴스</li>
              <li><strong>AI-Powered Translation:</strong> Gemini API를 활용한 정확하고 자연스러운 번역 서비스</li>
              <li><strong>Personal Vocabulary:</strong> 개인화된 단어장으로 체계적인 어휘 학습</li>
              <li><strong>Text-to-Speech:</strong> 정확한 발음으로 듣기 연습 지원</li>
              <li><strong>Categorized Learning:</strong> 관심 분야별 맞춤형 학습 경험</li>
            </ul>
            
            <h2>Our Approach</h2>
            <p>
              전통적인 교과서 영어가 아닌, 실제 사용되는 살아있는 영어를 학습할 수 있도록 합니다. 
              엄선된 영어 뉴스를 통해 현재 트렌드와 함께 영어를 배우며, 
              AI 기술을 활용하여 개인별 맞춤 학습을 제공합니다.
            </p>
            
            <h2>Target Audience</h2>
            <p>
              NEWStep Eng News는 다음과 같은 분들을 위해 설계되었습니다:
            </p>
            <ul>
              <li>실용적인 영어 실력 향상을 원하는 학습자</li>
              <li>최신 트렌드와 함께 영어를 배우고 싶은 분들</li>
              <li>비즈니스, 기술, 과학 분야의 영어 어휘를 확장하고 싶은 전문가</li>
              <li>뉴스를 통해 세계 정보와 영어를 동시에 습득하고 싶은 분들</li>
            </ul>
            
            <h2>Technology</h2>
            <p>
              우리는 최신 웹 기술과 AI를 활용하여 최고의 학습 경험을 제공합니다:
            </p>
            <ul>
              <li>React 기반의 반응형 웹 애플리케이션</li>
              <li>Google Gemini API를 통한 고품질 번역</li>
              <li>Firebase를 활용한 실시간 데이터 동기화</li>
              <li>체계적인 콘텐츠 관리 시스템</li>
            </ul>
            
            <h2>Contact Information</h2>
            <p>
              <strong>Website:</strong> https://marlang-app.web.app<br/>
              <strong>Email:</strong> contact@marlang-app.web.app<br/>
              <strong>Service Name:</strong> NEWStep Eng News<br/>
              <strong>Team:</strong> NEWStep Team
            </p>
            
            <h2>Get in Touch</h2>
            <p>
              궁금한 점이나 제안사항이 있으시면 언제든지 <Link to="/contact" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 'bold' }}>문의해 주세요</Link>.
              저희 팀이 신속하게 답변드리겠습니다.
            </p>
            
            <h2>Privacy & Terms</h2>
            <p>
              사용자의 개인정보 보호를 최우선으로 생각합니다. 
              자세한 내용은 <Link to="/privacy" style={{ color: '#1976d2' }}>개인정보처리방침</Link>과 
              <Link to="/terms" style={{ color: '#1976d2' }}>이용약관</Link>을 참고해 주세요.
            </p>
            
            <p style={{ marginTop: '2rem', textAlign: 'center', color: '#666' }}>
              © 2024 NEWStep Eng News. All rights reserved.
            </p>
          </AboutContainer>
        </PageContainer>
      </MobileContentWrapper>
    </>
  );
};

export default About;