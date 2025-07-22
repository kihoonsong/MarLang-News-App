// SNS 최적화된 1200x630 이미지 생성 스크립트
const fs = require('fs');
const path = require('path');

function createOptimizedSocialImage() {
  const width = 1200;
  const height = 630;
  
  // SVG 형태로 최적화된 소셜 이미지 생성
  const svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- 배경 그라디언트 -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2c2c2c;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.5)"/>
    </filter>
  </defs>
  
  <!-- 배경 -->
  <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
  
  <!-- 중앙 로고 영역 -->
  <g transform="translate(${width/2}, ${height/2})">
    <!-- 로고 배경 (어두운 사각형) -->
    <rect x="-80" y="-40" width="160" height="80" rx="8" fill="#4a2c2a" filter="url(#shadow)"/>
    
    <!-- 빨간 사각형들 (로고 패턴) -->
    <g transform="translate(-40, -20)">
      <!-- 첫 번째 줄 -->
      <rect x="0" y="0" width="12" height="12" fill="#e53e3e"/>
      <rect x="16" y="0" width="12" height="12" fill="#e53e3e"/>
      <rect x="32" y="0" width="12" height="12" fill="#e53e3e"/>
      
      <!-- 두 번째 줄 -->
      <rect x="0" y="16" width="12" height="12" fill="#e53e3e"/>
      <rect x="16" y="16" width="12" height="12" fill="#e53e3e"/>
      <rect x="32" y="16" width="12" height="12" fill="#e53e3e"/>
      
      <!-- 세 번째 줄 -->
      <rect x="0" y="32" width="12" height="12" fill="#e53e3e"/>
      <rect x="16" y="32" width="12" height="12" fill="#e53e3e"/>
      
      <!-- 다이아몬드 모양 -->
      <rect x="48" y="8" width="12" height="12" fill="#e53e3e" transform="rotate(45 54 14)"/>
      <rect x="64" y="0" width="12" height="12" fill="#e53e3e"/>
    </g>
  </g>
  
  <!-- NEWS 텍스트 -->
  <text x="${width/2}" y="${height/2 + 80}" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white">NEWS</text>
  <text x="${width/2}" y="${height/2 + 110}" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#cccccc">tep</text>
  
  <!-- 부제목 -->
  <text x="${width/2}" y="${height/2 + 150}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#999999">영어 뉴스로 배우는 영어 학습 플랫폼</text>
  
  <!-- URL -->
  <text x="${width/2}" y="${height - 40}" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#666666">marlang-app.web.app</text>
</svg>`;

  return svgContent;
}

// SVG 파일 생성
try {
  const svgContent = createOptimizedSocialImage();
  const outputPath = path.join(__dirname, '../public/newstep-social-optimized.svg');
  
  fs.writeFileSync(outputPath, svgContent);
  console.log('✅ 최적화된 소셜 이미지 생성 완료:', outputPath);
  console.log('📐 크기: 1200x630px (SNS 최적화)');
  
} catch (error) {
  console.error('❌ 이미지 생성 실패:', error);
}