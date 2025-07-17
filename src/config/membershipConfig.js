export const membershipConfig = {
  ads: {
    enabled: true,
    frequency: 4, // 4개 기사마다 광고 표시 (밀도 감소)
    randomPlacement: true, // 랜덤 배치 활성화
    minGap: 3, // 광고 간 최소 간격 (기사 수) 증가
    maxGap: 6, // 광고 간 최대 간격 (기사 수) 증가
    minContentThreshold: 5, // 광고 표시를 위한 최소 콘텐츠 수 증가 (애드센스 정책 준수)
  },
  freeTier: {
    monthlyArticleLimit: 10, // 월간 무료 기사 갯수 (나중에 사용)
  },
  // 나중에 추가될 다른 유료 기능 플래그
  // advancedSearch: { enabledForPremium: true },
};
