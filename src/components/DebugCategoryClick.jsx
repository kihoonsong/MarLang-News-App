import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategoryPageUrl, isValidCategory } from '../utils/categoryUtils';

const DebugCategoryClick = ({ category }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    console.log('🔍 Debug Category Click:', {
      category,
      isValid: isValidCategory(category),
      url: getCategoryPageUrl(category)
    });

    if (category.type === 'category' && isValidCategory(category)) {
      const url = getCategoryPageUrl(category);
      if (url) {
        console.log('✅ Navigating to:', url);
        navigate(url);
      }
    }
  };

  if (category.type !== 'category') {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      style={{
        padding: '4px 8px',
        margin: '2px',
        fontSize: '10px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Debug: {category.name}
    </button>
  );
};

export default DebugCategoryClick;