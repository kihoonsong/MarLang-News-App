export const membershipConfig = {
  ads: {
    enabled: true,
    frequency: 3, // 3개 기사마다 광고 표시
    randomPlacement: true, // 랜덤 배치 활성화
    minGap: 2, // 광고 간 최소 간격 (기사 수)
    maxGap: 5, // 광고 간 최대 간격 (기사 수)
  },
  freeTier: {
    monthlyArticleLimit: 10, // 월간 무료 기사 갯수 (나중에 사용)
  },
  // 나중에 추가될 다른 유료 기능 플래그
  // advancedSearch: { enabledForPremium: true },
};
