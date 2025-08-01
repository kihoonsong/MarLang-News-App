// 카테고리명을 URL 안전한 slug로 변환
export const categoryToSlug = (categoryName) => {
  if (!categoryName) return '';
  
  return categoryName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속 하이픈을 하나로
    .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
};

// slug에서 카테고리 찾기 (모바일 환경에서 안전하게)
export const findCategoryBySlug = (slug, categories) => {
  try {
    console.log('🔍 findCategoryBySlug 시작:', { slug, categoriesCount: categories?.length });
    
    if (!slug || !categories || !Array.isArray(categories)) {
      console.warn('❌ findCategoryBySlug: 잘못된 매개변수', { 
        slug: slug || 'null/undefined', 
        categoriesLength: categories?.length || 'null/undefined',
        categoriesType: typeof categories
      });
      return null;
    }
    
    // 디버깅을 위한 상세 로그
    console.log('📋 사용 가능한 카테고리들:', categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      slug: categoryToSlug(cat.name)
    })));
    
    // 1. 정확한 매칭 시도
    const exactMatch = categories.find(cat => {
      try {
        if (!cat || !cat.name) {
          console.warn('⚠️ 잘못된 카테고리 객체:', cat);
          return false;
        }
        const catSlug = categoryToSlug(cat.name);
        const isMatch = catSlug === slug;
        console.log(`🔍 정확 매칭 시도: "${cat.name}" -> "${catSlug}" === "${slug}" ? ${isMatch}`);
        return isMatch;
      } catch (error) {
        console.warn('❌ 카테고리 매칭 중 오류:', error, cat);
        return false;
      }
    });
    
    if (exactMatch) {
      console.log('✅ 정확 매칭 성공:', exactMatch.name);
      return exactMatch;
    }
    
    // 2. 대소문자 무시 매칭 시도
    const caseInsensitiveMatch = categories.find(cat => {
      try {
        if (!cat || !cat.name) return false;
        const catSlug = categoryToSlug(cat.name).toLowerCase();
        const targetSlug = slug.toLowerCase();
        const isMatch = catSlug === targetSlug;
        console.log(`🔍 대소문자 무시 매칭: "${cat.name}" -> "${catSlug}" === "${targetSlug}" ? ${isMatch}`);
        return isMatch;
      } catch (error) {
        console.warn('❌ 대소문자 무시 매칭 중 오류:', error, cat);
        return false;
      }
    });
    
    if (caseInsensitiveMatch) {
      console.log('✅ 대소문자 무시 매칭 성공:', caseInsensitiveMatch.name);
      return caseInsensitiveMatch;
    }
    
    // 3. 부분 매칭 시도 (더 관대한 매칭)
    const partialMatch = categories.find(cat => {
      try {
        if (!cat || !cat.name) return false;
        const catName = cat.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const targetName = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
        const isMatch = catName === targetName;
        console.log(`🔍 부분 매칭: "${cat.name}" -> "${catName}" === "${targetName}" ? ${isMatch}`);
        return isMatch;
      } catch (error) {
        console.warn('❌ 부분 매칭 중 오류:', error, cat);
        return false;
      }
    });
    
    if (partialMatch) {
      console.log('✅ 부분 매칭 성공:', partialMatch.name);
      return partialMatch;
    }
    
    console.warn('❌ 모든 매칭 실패:', { 
      slug, 
      availableCategories: categories.map(c => ({
        name: c.name,
        slug: categoryToSlug(c.name),
        type: c.type
      }))
    });
    return null;
  } catch (error) {
    console.error('🚨 findCategoryBySlug 치명적 오류:', error);
    return null;
  }
};

// 카테고리 유효성 검사
export const isValidCategory = (category) => {
  if (!category) return false;
  
  // Recent, Popular 카테고리는 제외
  const excludedTypes = ['recent', 'popular'];
  if (excludedTypes.includes(category.type)) return false;
  
  // 일반 카테고리만 허용
  return category.type === 'category';
};

// 카테고리 페이지 URL 생성
export const getCategoryPageUrl = (category) => {
  if (!category || !isValidCategory(category)) return null;
  
  return `/${categoryToSlug(category.name)}`;
};

// 모든 유효한 카테고리의 slug 목록 가져오기
export const getValidCategorySlugs = (categories) => {
  if (!categories) return [];
  
  return categories
    .filter(isValidCategory)
    .map(cat => categoryToSlug(cat.name))
    .filter(slug => slug !== '');
};

// 카테고리별 파스텔 색상 매핑 (기존 5개 카테고리)
const categoryColorMap = {
  'Technology': { bg: '#d6eaff', text: '#1f5582' },
  'Science': { bg: '#e0f0ff', text: '#0066cc' },
  'Business': { bg: '#ffe2c6', text: '#b5671f' },
  'Culture': { bg: '#ffd6ec', text: '#a0316b' },
  'Society': { bg: '#e6ffe6', text: '#2d5a2d' }
};

// 카테고리 색상 가져오기 (카테고리 객체 또는 이름으로 처리)
export const getCategoryColor = (categoryOrName) => {
  if (!categoryOrName) return { bg: '#e3f2fd', text: '#1976d2' };
  
  // 카테고리 객체인 경우 (color 필드가 있는 경우)
  if (typeof categoryOrName === 'object' && categoryOrName.color) {
    return { bg: categoryOrName.color, text: getContrastColor(categoryOrName.color) };
  }
  
  // 카테고리 이름인 경우 (기존 매핑 확인)
  const categoryName = typeof categoryOrName === 'string' ? categoryOrName : categoryOrName.name;
  const colors = categoryColorMap[categoryName];
  if (colors) return colors;
  
  // 기본 색상 (매핑되지 않은 카테고리)
  return { bg: '#e3f2fd', text: '#1976d2' };
};

// 배경 색상에 따른 텍스트 대비 색상 계산
const getContrastColor = (bgColor) => {
  if (!bgColor) return '#1976d2';
  
  // hex 색상을 RGB로 변환
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // 명도 계산 (0.299*R + 0.587*G + 0.114*B)
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
  
  // 밝은 배경이면 어두운 텍스트, 어두운 배경이면 밝은 텍스트
  return brightness > 128 ? '#333333' : '#ffffff';
}; 