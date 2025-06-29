import React from 'react';
import styled, { keyframes } from 'styled-components';
import { CircularProgress, Skeleton, Box, Typography, Card } from '@mui/material';
import { designTokens, getShadow, getBorderRadius } from '../utils/designTokens';

// 메인 로딩 스피너
export const LoadingSpinner = ({ size = 40, message = "Loading..." }) => (
  <LoadingContainer>
    <CircularProgress size={size} />
    {message && (
      <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
        {message}
      </Typography>
    )}
  </LoadingContainer>
);

// 페이지 전체 로딩
export const PageLoading = ({ message = "Loading page..." }) => (
  <FullPageLoading>
    <LoadingContent>
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
        {message}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Please wait while we load your content
      </Typography>
    </LoadingContent>
  </FullPageLoading>
);

// 기사 카드 스켈레톤
export const ArticleCardSkeleton = () => (
  <SkeletonCard>
    <Skeleton variant="rectangular" height={200} />
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="100%" height={60} sx={{ mb: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton variant="text" width="80px" height={20} />
        <Skeleton variant="text" width="100px" height={20} />
      </Box>
    </Box>
  </SkeletonCard>
);

// 기사 목록 스켈레톤
export const ArticleListSkeleton = ({ count = 6 }) => (
  <SkeletonGrid>
    {Array.from({ length: count }).map((_, index) => (
      <ArticleCardSkeleton key={index} />
    ))}
  </SkeletonGrid>
);

// 기사 상세 스켈레톤
export const ArticleDetailSkeleton = () => (
  <DetailSkeletonContainer>
    <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2, mb: 2 }} />
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Skeleton variant="text" width={80} height={30} />
      <Skeleton variant="text" width={100} height={20} />
      <Skeleton variant="circular" width={40} height={40} sx={{ ml: 'auto' }} />
    </Box>
    <Skeleton variant="text" width="100%" height={60} sx={{ mb: 3 }} />
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Skeleton variant="text" width={100} height={40} />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="circular" width={40} height={40} />
      </Box>
    </Box>
    <SkeletonCard>
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="200px" height={30} sx={{ mb: 2 }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="text" width={`${Math.random() * 40 + 60}%`} height={24} sx={{ mb: 1 }} />
        ))}
      </Box>
    </SkeletonCard>
  </DetailSkeletonContainer>
);

// 검색 결과 스켈레톤
export const SearchResultSkeleton = () => (
  <SearchSkeletonContainer>
    <Box sx={{ mb: 3 }}>
      <Skeleton variant="text" width="200px" height={30} sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Skeleton variant="rectangular" width={120} height={40} />
        <Skeleton variant="rectangular" width={120} height={40} />
        <Skeleton variant="rectangular" width={120} height={40} />
      </Box>
    </Box>
    <ArticleListSkeleton count={4} />
  </SearchSkeletonContainer>
);

// 단어장 스켈레톤
export const WordbookSkeleton = ({ count = 5 }) => (
  <WordbookSkeletonContainer>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Skeleton variant="text" width="200px" height={40} />
      <Skeleton variant="rectangular" width={150} height={40} />
    </Box>
    
    {Array.from({ length: count }).map((_, index) => (
      <WordSkeletonCard key={index}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="text" width="150px" height={30} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="circular" width={35} height={35} />
            <Skeleton variant="circular" width={35} height={35} />
          </Box>
        </Box>
        <Skeleton variant="text" width="100%" height={50} sx={{ mb: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant="text" width="120px" height={20} />
          <Skeleton variant="text" width="100px" height={20} />
        </Box>
      </WordSkeletonCard>
    ))}
  </WordbookSkeletonContainer>
);

// 펄스 애니메이션
const pulse = keyframes`
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 0.6;
  }
`;

// 인라인 로딩 (버튼 내부 등)
export const InlineLoading = ({ size = 20 }) => (
  <InlineLoadingSpinner size={size}>
    <CircularProgress size={size} color="inherit" />
  </InlineLoadingSpinner>
);

// 버튼 로딩 상태
export const ButtonLoading = ({ children, loading, loadingText = "Loading...", ...props }) => (
  <button {...props} disabled={loading || props.disabled}>
    {loading ? (
      <ButtonLoadingContent>
        <CircularProgress size={16} color="inherit" />
        <span style={{ marginLeft: 8 }}>{loadingText}</span>
      </ButtonLoadingContent>
    ) : (
      children
    )}
  </button>
);

// 스타일드 컴포넌트들
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${designTokens.spacing.lg};
  text-align: center;
`;

const FullPageLoading = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${designTokens.zIndex.modal};
`;

const LoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: ${designTokens.colors.background.paper};
  padding: ${designTokens.spacing.xl};
  border-radius: ${getBorderRadius('large')};
  box-shadow: ${getShadow('large')};
`;

const SkeletonCard = styled(Card)`
  border-radius: ${getBorderRadius('large')} !important;
  overflow: hidden;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: ${designTokens.spacing.lg};
  padding: ${designTokens.spacing.lg};
  
  @media (max-width: ${designTokens.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: ${designTokens.spacing.sm};
    padding: ${designTokens.spacing.sm};
  }
`;

const DetailSkeletonContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${designTokens.spacing.lg};
  
  @media (max-width: ${designTokens.breakpoints.mobile}) {
    padding: ${designTokens.spacing.sm};
  }
`;

const SearchSkeletonContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${designTokens.spacing.lg};
  
  @media (max-width: ${designTokens.breakpoints.mobile}) {
    padding: ${designTokens.spacing.sm};
  }
`;

const WordbookSkeletonContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${designTokens.spacing.lg};
  
  @media (max-width: ${designTokens.breakpoints.mobile}) {
    padding: ${designTokens.spacing.sm};
  }
`;

const WordSkeletonCard = styled(Card)`
  padding: ${designTokens.spacing.md} !important;
  margin-bottom: ${designTokens.spacing.sm} !important;
  border-radius: ${getBorderRadius('large')} !important;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const InlineLoadingSpinner = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
`;

const ButtonLoadingContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;