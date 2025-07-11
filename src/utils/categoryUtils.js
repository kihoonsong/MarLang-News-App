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

// slug에서 카테고리 찾기 (ID 기반으로 안전하게)
export const findCategoryBySlug = (slug, categories) => {
  if (!slug || !categories) return null;
  
  // 먼저 현재 이름으로 직접 매칭 시도
  const directMatch = categories.find(cat => 
    categoryToSlug(cat.name) === slug
  );
  
  if (directMatch) return directMatch;
  
  // 매칭되지 않으면 null 반환 (카테고리가 변경되었거나 삭제됨)
  return null;
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