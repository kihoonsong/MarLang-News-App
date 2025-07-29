import React, { useMemo } from 'react';
import { Grid } from '@mui/material';
import AdCard from './AdCard';

// 모바일 광고 카드 스타일
const adCardMobileStyle = `
  @media (max-width: 768px) {
    .ad-card-wrapper {
      flex: 0 0 85vw !important;
      width: 85vw !important;
      scroll-snap-align: center !important;
    }
  }
`;

const ContentWithAds = ({
    articles = [],
    adInterval = 4,
    maxAds = 1, // 기본값을 1로 변경
    renderArticle,
    gridProps = {},
    layout = 'grid' // 'grid' 또는 'horizontal'
}) => {
    // 기사와 광고를 믹싱하는 로직
    const mixedContent = useMemo(() => {
        if (!articles.length) return [];

        const mixed = [];
        let adCount = 0;

        articles.forEach((article, index) => {
            // 기사 추가
            mixed.push({
                type: 'article',
                data: article,
                key: `article-${article.id || index}`
            });

            // 광고 삽입 조건 확인 (3번째 위치에만)
            const position = index + 1; // 1-based position
            const shouldInsertAd = (
                position === 3 && // 3번째 위치에만
                adCount < 1 && // 최대 1개 광고만
                index < articles.length - 1 // 마지막 아이템이 아님
            );

            if (shouldInsertAd) {
                mixed.push({
                    type: 'ad',
                    data: { adIndex: adCount },
                    key: `ad-${adCount}`
                });
                adCount++;
            }
        });

        console.log('🎯 ContentWithAds 믹싱 결과:', {
            originalCount: articles.length,
            mixedCount: mixed.length,
            adCount,
            layout
        });

        return mixed;
    }, [articles, adInterval, maxAds, layout]);

    // 가로 스크롤 레이아웃
    if (layout === 'horizontal') {
        return (
            <>
                <style>{adCardMobileStyle}</style>
                {mixedContent.map((item, index) => {
                    if (item.type === 'ad') {
                        return (
                            <div
                                key={item.key}
                                style={{
                                    flex: '0 0 320px',
                                    width: '320px',
                                    scrollSnapAlign: 'start'
                                }}
                                className="ad-card-wrapper"
                            >
                                <AdCard
                                    index={item.data.adIndex}
                                    lazy={index > 2}
                                />
                            </div>
                        );
                    } else {
                        return renderArticle ? renderArticle(item.data, index) : null;
                    }
                })}
            </>
        );
    }

    // 기본 그리드 레이아웃
    const defaultGridProps = {
        container: true,
        spacing: 3,
        ...gridProps
    };

    return (
        <Grid {...defaultGridProps}>
            {mixedContent.map((item, index) => (
                <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    key={item.key}
                >
                    {item.type === 'ad' ? (
                        <AdCard
                            index={item.data.adIndex}
                            lazy={index > 2} // 처음 3개는 즉시 로드
                        />
                    ) : (
                        renderArticle ? renderArticle(item.data, index) : null
                    )}
                </Grid>
            ))}
        </Grid>
    );
};

export default ContentWithAds;