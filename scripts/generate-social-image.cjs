// 소셜 미디어용 이미지 생성 스크립트
const fs = require('fs');
const path = require('path');

// 간단한 Base64 인코딩된 1200x630 이미지 생성
function generateSocialImage() {
  // 1200x630 크기의 간단한 이미지를 Base64로 생성
  // 실제로는 더 복잡한 이미지 생성 라이브러리를 사용할 수 있지만,
  // 여기서는 간단한 단색 이미지를 생성합니다.
  
  const width = 1200;
  const height = 630;
  
  // 간단한 BMP 헤더 생성 (54바이트)
  const fileSize = 54 + (width * height * 3);
  const header = Buffer.alloc(54);
  
  // BMP 파일 헤더
  header.write('BM', 0); // 시그니처
  header.writeUInt32LE(fileSize, 2); // 파일 크기
  header.writeUInt32LE(54, 10); // 데이터 오프셋
  header.writeUInt32LE(40, 14); // 헤더 크기
  header.writeUInt32LE(width, 18); // 너비
  header.writeUInt32LE(height, 22); // 높이
  header.writeUInt16LE(1, 26); // 플레인
  header.writeUInt16LE(24, 28); // 비트 수
  
  // 이미지 데이터 (파란색 그라디언트)
  const imageData = Buffer.alloc(width * height * 3);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 3;
      
      // 그라디언트 효과
      const gradientFactor = x / width;
      const blue = Math.floor(25 + (101 - 25) * gradientFactor); // #1976d2 to #1565c0
      const green = Math.floor(118 + (101 - 118) * gradientFactor);
      const red = Math.floor(210 + (192 - 210) * gradientFactor);
      
      // BMP는 BGR 순서
      imageData[index] = blue;
      imageData[index + 1] = green;
      imageData[index + 2] = red;
    }
  }
  
  return Buffer.concat([header, imageData]);
}

// 이미지 생성 및 저장
try {
  const imageBuffer = generateSocialImage();
  const outputPath = path.join(__dirname, '../public/newstep-social-image.bmp');
  
  fs.writeFileSync(outputPath, imageBuffer);
  console.log('✅ 소셜 이미지 생성 완료:', outputPath);
  
  // 파일 정보 출력
  const stats = fs.statSync(outputPath);
  console.log('📊 파일 크기:', Math.round(stats.size / 1024), 'KB');
  
} catch (error) {
  console.error('❌ 이미지 생성 실패:', error);
}