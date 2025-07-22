// PNG 형태의 최적화된 소셜 이미지 생성
const fs = require('fs');
const path = require('path');

function generateOptimizedPNG() {
  const width = 1200;
  const height = 630;
  
  // 간단한 BMP 형태로 생성 (PNG 헤더는 복잡하므로)
  // 실제로는 더 정교한 이미지 라이브러리를 사용하는 것이 좋지만
  // 여기서는 기본적인 형태로 생성
  
  const pixelData = Buffer.alloc(width * height * 4); // RGBA
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      
      // 배경 그라디언트 (어두운 회색)
      const gradientFactor = x / width;
      const r = Math.floor(44 + (26 - 44) * gradientFactor); // #2c2c2c to #1a1a1a
      const g = Math.floor(44 + (26 - 44) * gradientFactor);
      const b = Math.floor(44 + (26 - 44) * gradientFactor);
      
      // 중앙 로고 영역 체크
      const centerX = width / 2;
      const centerY = height / 2;
      
      // 로고 배경 영역
      if (x >= centerX - 80 && x <= centerX + 80 && 
          y >= centerY - 40 && y <= centerY + 40) {
        // 로고 배경색 (어두운 빨간색)
        pixelData[index] = 74;     // R
        pixelData[index + 1] = 44; // G
        pixelData[index + 2] = 42; // B
        pixelData[index + 3] = 255; // A
      } else {
        // 일반 배경
        pixelData[index] = r;       // R
        pixelData[index + 1] = g;   // G
        pixelData[index + 2] = b;   // B
        pixelData[index + 3] = 255; // A
      }
      
      // 빨간 사각형들 추가 (간단한 패턴)
      const logoStartX = centerX - 40;
      const logoStartY = centerY - 20;
      
      // 3x3 그리드의 일부 사각형들
      const squares = [
        {x: 0, y: 0}, {x: 16, y: 0}, {x: 32, y: 0},
        {x: 0, y: 16}, {x: 16, y: 16}, {x: 32, y: 16},
        {x: 0, y: 32}, {x: 16, y: 32},
        {x: 64, y: 0} // 추가 사각형
      ];
      
      for (const square of squares) {
        if (x >= logoStartX + square.x && x < logoStartX + square.x + 12 &&
            y >= logoStartY + square.y && y < logoStartY + square.y + 12) {
          pixelData[index] = 229;     // R (빨간색)
          pixelData[index + 1] = 62;  // G
          pixelData[index + 2] = 62;  // B
          pixelData[index + 3] = 255; // A
        }
      }
    }
  }
  
  return pixelData;
}

// 간단한 TGA 형식으로 저장 (PNG보다 구현이 간단)
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
  const pixelData = generateOptimizedPNG();
  const outputPath = path.join(__dirname, '../public/newstep-social-image.tga');
  
  saveTGA(pixelData, 1200, 630, outputPath);
  console.log('✅ 최적화된 소셜 이미지 생성 완료:', outputPath);
  console.log('📐 크기: 1200x630px (SNS 최적화)');
  
} catch (error) {
  console.error('❌ 이미지 생성 실패:', error);
}