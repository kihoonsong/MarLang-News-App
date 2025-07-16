import styled from 'styled-components';

const PageContainer = styled.div`
  padding: 0 0.25rem 1rem 0.25rem;
  width: 100%;
  box-sizing: border-box;
  
  @media (max-width: 480px) {
    padding: 0 0.125rem 0.75rem 0.125rem;
  }
  
  @media (min-width: 768px) {
    padding: 0 2rem 2rem 2rem;
  }
  
  @media (min-width: 1200px) {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem 2rem 2rem;
  }
`;

export default PageContainer; 