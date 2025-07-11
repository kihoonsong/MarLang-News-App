import styled from 'styled-components';

const PageContainer = styled.div`
  padding: 0 0.5rem 2rem 0.5rem;
  width: 100%;
  box-sizing: border-box;
  
  /* 모바일에서 하단 네비게이션 여백 추가 */
  @media (max-width: 767px) {
    padding-bottom: 100px; /* 80px(네비게이션 높이) + 20px(여백) */
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