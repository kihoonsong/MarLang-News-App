import React from 'react';
import styled from 'styled-components';
import { Container, Typography, Divider } from '@mui/material';
import MainNavigation, { MobileContentWrapper } from '../components/MobileNavigation';

const TermsOfService = () => {
  return (
    <>
      <MainNavigation />
      <MobileContentWrapper>
        <Container maxWidth="md">
          <ContentContainer>
            <Header>
              <Typography variant="h3" component="h1" gutterBottom>
                Terms of Service
              </Typography>
              <Typography variant="h5" component="h2" color="text.secondary" gutterBottom>
                Haru Eng News 이용약관
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last updated: {new Date().toLocaleDateString('ko-KR')}
              </Typography>
            </Header>

            <Divider sx={{ my: 4 }} />

            <Section>
              <SectionTitle variant="h5" component="h2">
                1. 서비스 이용 동의
              </SectionTitle>
              <Typography variant="body1" paragraph>
                Haru Eng News(이하 "서비스")를 이용함으로써 귀하는 본 이용약관에 동의하는 것으로 간주됩니다. 
                본 약관에 동의하지 않으시는 경우 서비스 이용을 중단해 주시기 바랍니다.
              </Typography>
            </Section>

            <Section>
              <SectionTitle variant="h5" component="h2">
                2. 서비스 제공 내용
              </SectionTitle>
              <Typography variant="body1" paragraph>
                본 서비스는 다음과 같은 기능을 제공합니다:
              </Typography>
              <ul>
                <li>최신 영어 뉴스 기사 제공</li>
                <li>AI 기반 번역 서비스</li>
                <li>개인화된 단어장 기능</li>
                <li>음성 읽기(TTS) 기능</li>
                <li>기사 검색 및 카테고리별 분류</li>
                <li>사용자 계정 및 프로필 관리</li>
              </ul>
            </Section>

            <Section>
              <SectionTitle variant="h5" component="h2">
                3. 사용자 계정
              </SectionTitle>
              <Typography variant="body1" paragraph>
                일부 서비스 이용을 위해서는 Google 계정을 통한 로그인이 필요합니다. 
                사용자는 계정 정보의 정확성과 보안에 대한 책임을 집니다.
              </Typography>
              <Typography variant="body1" paragraph>
                사용자는 다음과 같은 행위를 해서는 안 됩니다:
              </Typography>
              <ul>
                <li>타인의 계정을 무단으로 사용하는 행위</li>
                <li>허위 정보를 제공하는 행위</li>
                <li>서비스의 정상적인 운영을 방해하는 행위</li>
                <li>저작권을 침해하는 행위</li>
              </ul>
            </Section>

            <Section>
              <SectionTitle variant="h5" component="h2">
                4. 콘텐츠 이용 및 저작권
              </SectionTitle>
              <Typography variant="body1" paragraph>
                본 서비스에서 제공하는 뉴스 콘텐츠는 외부 뉴스 API로부터 제공받은 것이며, 
                해당 콘텐츠의 저작권은 원저작자에게 있습니다. 
                사용자는 개인적, 비상업적 목적으로만 콘텐츠를 이용할 수 있습니다.
              </Typography>
            </Section>

            <Section>
              <SectionTitle variant="h5" component="h2">
                5. 개인정보 보호
              </SectionTitle>
              <Typography variant="body1" paragraph>
                개인정보 처리에 관한 자세한 내용은 
                <a href="/privacy" style={{ color: '#1976d2', textDecoration: 'none' }}>
                  개인정보 처리방침
                </a>
                을 참고해 주시기 바랍니다.
              </Typography>
            </Section>

            <Section>
              <SectionTitle variant="h5" component="h2">
                6. 광고 및 쿠키
              </SectionTitle>
              <Typography variant="body1" paragraph>
                본 서비스는 Google AdSense를 통한 광고를 표시할 수 있으며, 
                서비스 개선을 위해 쿠키 및 유사 기술을 사용합니다. 
                사용자는 브라우저 설정을 통해 쿠키 사용을 제어할 수 있습니다.
              </Typography>
            </Section>

            <Section>
              <SectionTitle variant="h5" component="h2">
                7. 서비스 중단 및 변경
              </SectionTitle>
              <Typography variant="body1" paragraph>
                운영상의 이유로 서비스의 일부 또는 전부를 일시적으로 중단하거나 
                변경할 수 있으며, 이 경우 사전에 공지하도록 노력하겠습니다.
              </Typography>
            </Section>

            <Section>
              <SectionTitle variant="h5" component="h2">
                8. 면책 조항
              </SectionTitle>
              <Typography variant="body1" paragraph>
                본 서비스는 뉴스 정보를 제공하는 플랫폼으로서, 
                제공되는 정보의 정확성이나 완전성을 보장하지 않습니다. 
                서비스 이용으로 인한 직간접적 손해에 대해서는 책임을 지지 않습니다.
              </Typography>
            </Section>

            <Section>
              <SectionTitle variant="h5" component="h2">
                9. 약관 변경
              </SectionTitle>
              <Typography variant="body1" paragraph>
                본 이용약관은 필요에 따라 변경될 수 있으며, 
                변경 시 서비스 내 공지사항을 통해 알려드립니다. 
                변경된 약관은 공지 후 7일이 경과한 시점부터 효력이 발생합니다.
              </Typography>
            </Section>

            <Section>
              <SectionTitle variant="h5" component="h2">
                10. 연락처
              </SectionTitle>
              <Typography variant="body1" paragraph>
                본 이용약관과 관련된 문의사항이 있으시면 다음으로 연락해 주시기 바랍니다:
              </Typography>
              <ContactInfo>
                <Typography variant="body1">
                  <strong>서비스명:</strong> Haru Eng News
                </Typography>
                <Typography variant="body1">
                  <strong>웹사이트:</strong> https://marlang-app.web.app
                </Typography>
                <Typography variant="body1">
                  <strong>이메일:</strong> contact@haru-app.web.app
                </Typography>
              </ContactInfo>
            </Section>

            <Footer>
              <Typography variant="body2" color="text.secondary" align="center">
                © 2024 Haru Eng News. All rights reserved.
              </Typography>
            </Footer>
          </ContentContainer>
        </Container>
      </MobileContentWrapper>
    </>
  );
};

// 스타일드 컴포넌트
const ContentContainer = styled.div`
  padding: 2rem 0;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Section = styled.section`
  margin-bottom: 2rem;
  
  ul {
    margin: 1rem 0;
    padding-left: 2rem;
    
    li {
      margin: 0.5rem 0;
      line-height: 1.6;
    }
  }
  
  a {
    color: #1976d2;
    text-decoration: underline;
    
    &:hover {
      text-decoration: none;
    }
  }
`;

const SectionTitle = styled(Typography)`
  color: #1976d2;
  margin-bottom: 1rem !important;
  font-weight: 600 !important;
`;

const ContactInfo = styled.div`
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 1rem 0;
  
  p {
    margin: 0.5rem 0;
  }
`;

const Footer = styled.div`
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
`;

export default TermsOfService; 