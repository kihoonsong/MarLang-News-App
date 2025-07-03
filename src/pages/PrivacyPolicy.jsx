import React from 'react';
import styled from 'styled-components';
import MobileNavigation, { MobileContentWrapper } from '../components/MobileNavigation';
import PageContainer from '../components/PageContainer';

const PolicyContainer = styled.div`
  padding: 2rem;
  line-height: 1.6;
  
  h1, h2 {
    margin-bottom: 1rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
  }
`;

const PrivacyPolicy = () => {
  return (
    <>
      <MobileNavigation />
      <MobileContentWrapper>
        <PageContainer>
          <PolicyContainer>
            <h1>Privacy Policy</h1>
            <p>Last updated: {new Date().toLocaleDateString()}</p>

            <h2>1. Introduction</h2>
            <p>
              Welcome to MarLang News. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
            </p>

            <h2>2. Information We Collect</h2>
            <p>
              We may collect information about you in a variety of ways. The information we may collect on the App includes:
              <ul>
                <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, that you voluntarily give to us when you register with the App.</li>
                <li><strong>Usage Data:</strong> Information our servers automatically collect when you access the App, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the App.</li>
              </ul>
            </p>

            <h2>3. Use of Your Information</h2>
            <p>
              Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the App to:
              <ul>
                <li>Create and manage your account.</li>
                <li>Personalize your experience.</li>
                <li>Analyze usage and trends to improve our services.</li>
                <li>Display advertisements.</li>
              </ul>
            </p>
            
            <h2>4. Advertising</h2>
            <p>
              We may use third-party advertising companies to serve ads when you visit the App. These companies may use information about your visits to the App and other websites that are contained in web cookies in order to provide advertisements about goods and services of interest to you.
            </p>

            <h2>5. Contact Us</h2>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us at: [Your Contact Email]
            </p>
          </PolicyContainer>
        </PageContainer>
      </MobileContentWrapper>
    </>
  );
};

export default PrivacyPolicy;
