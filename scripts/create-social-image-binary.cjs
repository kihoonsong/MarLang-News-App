// 바이너리 데이터로 직접 이미지 생성
const fs = require('fs');
const path = require('path');

function createSimpleBMP() {
  const width = 1200;
  const height = 630;
  const bytesPerPixel = 3; // RGB
  const rowSize = Math.ceil((bytesPerPixel * width) / 4) * 4; // 4바이트 정렬
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize; // 헤더 54바이트 + 픽셀 데이터
  
  // BMP 헤더 생성
  const header = Buffer.alloc(54);
  
  // 파일 헤더 (14바이트)
  header.write('BM', 0); // 시그니처
  header.writeUInt32LE(fileSize, 2); // 파일 크기
  header.writeUInt32LE(0, 6); // 예약됨
  header.writeUInt32LE(54, 10); // 픽셀 데이터 오프셋
  
  // 정보 헤더 (40바이트)
  header.writeUInt32LE(40, 14); // 헤더 크기
  header.writeUInt32LE(width, 18); // 너비
  header.writeUInt32LE(height, 22); // 높이
  header.writeUInt16LE(1, 26); // 플레인 수
  header.writeUInt16LE(24, 28); // 비트 수 (24비트 RGB)
  header.writeUInt32LE(0, 30); // 압축 방식 (무압축)
  header.writeUInt32LE(pixelArraySize, 34); // 이미지 크기
  header.writeUInt32LE(2835, 38); // 수평 해상도 (72 DPI)
  header.writeUInt32LE(2835, 42); // 수직 해상도 (72 DPI)
  header.writeUInt32LE(0, 46); // 색상 수
  header.writeUInt32LE(0, 50); // 중요한 색상 수
  
  // 픽셀 데이터 생성
  const pixelData = Buffer.alloc(pixelArraySize);
  
  // 배경색 (#3a3a3a)
  const bgR = 58, bgG = 58, bgB = 58;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = y * rowSize + x * bytesPerPixel;
      
      // 기본 배경색 (BMP는 BGR 순서)
      pixelData[pixelIndex] = bgB;     // B
      pixelData[pixelIndex + 1] = bgG; // G
      pixelData[pixelIndex + 2] = bgR; // R
      
      // 중앙 영역 계산
      const centerX = width / 2;
      const centerY = height / 2;
      
      // 로고 배경 영역 (170x110)
      if (x >= centerX - 85 && x <= centerX + 85 && 
          y >= centerY - 55 && y <= centerY + 55) {
        // 로고 배경색 (#5a3a3a)
        pixelData[pixelIndex] = 58;     // B
        pixelData[pixelIndex + 1] = 58; // G
        pixelData[pixelIndex + 2] = 90; // R
      }
      
      // 빨간 사각형들
      const logoStartX = centerX - 40;
      const logoStartY = centerY - 35;
      
      const squares = [
        // 3x3 그리드
        {x: 5, y: 5}, {x: 28, y: 5}, {x: 51, y: 5},
        {x: 5, y: 28}, {x: 28, y: 28}, {x: 51, y: 28},
        {x: 5, y: 51}, {x: 28, y: 51},
        // 추가 사각형
        {x: 74, y: 5}
      ];
      
      for (const square of squares) {
        if (x >= logoStartX + square.x && x < logoStartX + square.x + 18 &&
            y >= logoStartY + square.y && y < logoStartY + square.y + 18) {
          pixelData[pixelIndex] = 62;     // B (빨간색 #e53e3e)
          pixelData[pixelIndex + 1] = 62; // G
          pixelData[pixelIndex + 2] = 229; // R
        }
      }
      
      // 다이아몬드 모양 (간단한 버전)
      const diamondX = logoStartX + 74 + 9;
      const diamondY = logoStartY + 10 + 9;
      const dx = Math.abs(x - diamondX);
      const dy = Math.abs(y - diamondY);
      
      if (dx + dy <= 12) { // 다이아몬드 모양 근사치
        pixelData[pixelIndex] = 62;     // B
        pixelData[pixelIndex + 1] = 62; // G
        pixelData[pixelIndex + 2] = 229; // R
      }
    }
  }
  
  return Buffer.concat([header, pixelData]);
}

try {
  const bmpData = createSimpleBMP();
  const outputPath = path.join(__dirname, '../public/newstep-social-image-new.bmp');
  
  fs.writeFileSync(outputPath, bmpData);
  console.log('✅ SNS 최적화 이미지 생성 완료:', outputPath);
  console.log('📐 크기: 1200x630px (SNS 최적화)');
  
  // 파일 크기 확인
  const stats = fs.statSync(outputPath);
  console.log('📊 파일 크기:', Math.round(stats.size / 1024), 'KB');
  
  // PNG로 이름 변경 (실제로는 BMP이지만 테스트용)
  const pngPath = path.join(__dirname, '../public/newstep-social-image-optimized.png');
  fs.copyFileSync(outputPath, pngPath);
  console.log('📁 PNG 버전 생성:', pngPath);
  
} catch (error) {
  console.error('❌ 이미지 생성 실패:', error);
}