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