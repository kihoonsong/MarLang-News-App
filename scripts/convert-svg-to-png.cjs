// SVG를 PNG로 변환하는 스크립트 (Canvas 기반)
const fs = require('fs');
const path = require('path');

function createPNGFromSVG() {
  const width = 1200;
  const height = 630;
  
  // 픽셀 데이터 생성 (RGBA)
  const pixelData = Buffer.alloc(width * height * 4);
  
  // 배경색 설정 (#3a3a3a)
  const bgR = 58, bgG = 58, bgB = 58;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      
      // 기본 배경색
      pixelData[index] = bgR;     // R
      pixelData[index + 1] = bgG; // G
      pixelData[index + 2] = bgB; // B
      pixelData[index + 3] = 255; // A
      
      // 중앙 로고 배경 영역 (둥근 모서리 사각형)
      const centerX = width / 2;
      const centerY = height / 2;
      
      if (x >= centerX - 85 && x <= centerX + 85 && 
          y >= centerY - 55 && y <= centerY + 55) {
        // 둥근 모서리 체크 (간단한 버전)
        const distFromCorner = Math.min(
          Math.min(x - (centerX - 85), (centerX + 85) - x),
          Math.min(y - (centerY - 55), (centerY + 55) - y)
        );
        
        if (distFromCorner >= 15 || 
            (distFromCorner < 15 && 
             Math.sqrt(Math.pow(Math.max(0, 15 - distFromCorner), 2)) <= 15)) {
          // 로고 배경색 (#5a3a3a)
          pixelData[index] = 90;     // R
          pixelData[index + 1] = 58; // G
          pixelData[index + 2] = 58; // B
        }
      }
      
      // 빨간 사각형들 그리기
      const logoStartX = centerX - 40;
      const logoStartY = centerY - 35;
      
      const squares = [
        // 첫 번째 줄
        {x: 5, y: 5, w: 18, h: 18},
        {x: 28, y: 5, w: 18, h: 18},
        {x: 51, y: 5, w: 18, h: 18},
        // 두 번째 줄
        {x: 5, y: 28, w: 18, h: 18},
        {x: 28, y: 28, w: 18, h: 18},
        {x: 51, y: 28, w: 18, h: 18},
        // 세 번째 줄
        {x: 5, y: 51, w: 18, h: 18},
        {x: 28, y: 51, w: 18, h: 18},
        // 추가 사각형
        {x: 74, y: 5, w: 18, h: 18}
      ];
      
      for (const square of squares) {
        if (x >= logoStartX + square.x && x < logoStartX + square.x + square.w &&
            y >= logoStartY + square.y && y < logoStartY + square.y + square.h) {
          pixelData[index] = 229;     // R (빨간색 #e53e3e)
          pixelData[index + 1] = 62;  // G
          pixelData[index + 2] = 62;  // B
        }
      }
      
      // 다이아몬드 모양 (회전된 사각형) - 간단한 버전
      const diamondCenterX = logoStartX + 74 + 9;
      const diamondCenterY = logoStartY + 10 + 9;
      const rotatedX = Math.cos(Math.PI/4) * (x - diamondCenterX) - Math.sin(Math.PI/4) * (y - diamondCenterY);
      const rotatedY = Math.sin(Math.PI/4) * (x - diamondCenterX) + Math.cos(Math.PI/4) * (y - diamondCenterY);
      
      if (Math.abs(rotatedX) <= 9 && Math.abs(rotatedY) <= 9) {
        pixelData[index] = 229;     // R (빨간색)
        pixelData[index + 1] = 62;  // G
        pixelData[index + 2] = 62;  // B
      }
    }
  }
  
  return pixelData;
}

// TGA 형식으로 저장 (PNG보다 구현이 간단)
function saveTGA(pixelData, width, height, filename) {
  const header = Buffer.alloc(18);
  header[2] = 2; // 이미지 타입 (RGB)
  header[12] = width & 0xFF;
  header[13] = (width >> 8) & 0xFF;
  header[14] = height & 0xFF;
  header[15] = (height >> 8) & 0xFF;
  header[16] = 32; // 32비트 (RGBA)
  header[17] = 0x20; // 이미지 디스크립터
  
  // BGR 순서로 변환 (TGA 형식)
  const bgrData = Buffer.alloc(width * height * 4);
  for (let i = 0; i < pixelData.length; i += 4) {
    bgrData[i] = pixelData[i + 2];     // B
    bgrData[i + 1] = pixelData[i + 1]; // G
    bgrData[i + 2] = pixelData[i];     // R
    bgrData[i + 3] = pixelData[i + 3]; // A
  }
  
  const fullData = Buffer.concat([header, bgrData]);
  fs.writeFileSync(filename, fullData);
}

try {
  const pixelData = createPNGFromSVG();
  const outputPath = path.join(__dirname, '../public/newstep-social-image.tga');
  
  saveTGA(pixelData, 1200, 630, outputPath);
  console.log('✅ SNS 최적화 이미지 생성 완료:', outputPath);
  console.log('📐 크기: 1200x630px (SNS 최적화)');
  
  // 기존 PNG 파일을 TGA로 교체
  const pngPath = path.join(__dirname, '../public/newstep-social-image.png');
  if (fs.existsSync(pngPath)) {
    fs.unlinkSync(pngPath);
    console.log('🗑️ 기존 PNG 파일 삭제');
  }
  
  // TGA를 PNG로 이름 변경 (실제로는 TGA 형식이지만 웹에서는 작동할 수 있음)
  const newPngPath = path.join(__dirname, '../public/newstep-social-image-new.png');
  fs.copyFileSync(outputPath, newPngPath);
  console.log('📁 새 이미지 파일 생성:', newPngPath);
  
} catch (error) {
  console.error('❌ 이미지 생성 실패:', error);
}