// 소셜 공유용 동적 이미지 생성 유틸리티
import html2canvas from 'html2canvas';

// 기사 카드 이미지 생성을 위한 HTML 템플릿
const createArticleCardHTML = (article) => {
  const { title, category, publishedAt, image } = article;
  
  // 제목 길이에 따른 폰트 크기 조정
  const titleLength = title.length;
  let titleFontSize = '36px';
  if (titleLength > 80) titleFontSize = '28px';
  else if (titleLength > 60) titleFontSize = '32px';
  
  // 날짜 포맷팅
  const formattedDate = new Date(publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  // 이미지가 있는 경우 이미지만 표시 (썸네일용)
  if (image) {
    return `
      <div style="
        width: 1200px;
        height: 630px;
        background: white;
        position: relative;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
      ">
        <!-- 전체 이미지 영역 -->
        <div style="
          width: 100%;
          height: 100%;
          background-image: url('${image}');
          background-size: cover;
          background-position: center;
          position: relative;
        ">
        </div>
      </div>
    `;
  } else {
    // 이미지가 없는 경우 기존 그라디언트 배경 사용
    return `
      <div style="
        width: 1200px;
        height: 630px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        position: relative;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 60px;
        box-sizing: border-box;
      ">
        <!-- 배경 패턴 -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%);
          z-index: 1;
        "></div>
        
        <!-- 메인 콘텐츠 -->
        <div style="position: relative; z-index: 2; flex: 1; display: flex; flex-direction: column;">
          <!-- 헤더 -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
            <div style="
              background: rgba(255,255,255,0.2);
              padding: 12px 24px;
              border-radius: 25px;
              backdrop-filter: blur(10px);
            ">
              <span style="
                color: white;
                font-size: 16px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
              ">${category || 'NEWS'}</span>
            </div>
            <div style="
              color: rgba(255,255,255,0.8);
              font-size: 16px;
              font-weight: 500;
            ">${formattedDate}</div>
          </div>
          
          <!-- 제목 -->
          <div style="
            color: white;
            font-size: ${titleFontSize};
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 30px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            flex: 1;
            display: flex;
            align-items: center;
          ">
            ${title}
          </div>
        </div>
        
        <!-- 푸터 -->
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 2;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 15px;
          ">
            <div style="
              width: 50px;
              height: 50px;
              background: white;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: #667eea;
              font-size: 20px;
            ">N</div>
            <div>
              <div style="
                color: white;
                font-size: 20px;
                font-weight: 600;
              ">NEWStep</div>
              <div style="
                color: rgba(255,255,255,0.8);
                font-size: 14px;
              ">Learn English Through News</div>
            </div>
          </div>
          
          <div style="
            background: rgba(255,255,255,0.2);
            padding: 12px 20px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
          ">
            <span style="
              color: white;
              font-size: 14px;
              font-weight: 500;
            ">marlang-app.web.app</span>
          </div>
        </div>
      </div>
    `;
  }
};

// Canvas를 이용한 이미지 생성 (html2canvas 대안)
const createImageWithCanvas = async (article) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 캔버스 크기 설정 (Open Graph 권장 크기)
    canvas.width = 1200;
    canvas.height = 630;
    
    // 배경색 설정 (흰색)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 기사 이미지가 있는 경우 전체 화면에 표시 (썸네일용)
    if (article.image && !article.image.includes('firebasestorage.googleapis.com')) {
      // Firebase Storage 이미지는 CORS 문제로 인해 스킵하고 텍스트 버전 사용
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // 전체 캔버스 크기
        const imageHeight = canvas.height;
        const imageWidth = canvas.width;
        
        // 이미지를 캔버스 크기에 맞게 조정하여 그리기 (cover 방식)
        const imgAspect = img.width / img.height;
        const canvasAspect = imageWidth / imageHeight;
        
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
        
        if (imgAspect > canvasAspect) {
          // 이미지가 더 넓은 경우 - 높이를 맞추고 폭을 자름
          drawHeight = imageHeight;
          drawWidth = drawHeight * imgAspect;
          offsetX = -(drawWidth - imageWidth) / 2;
        } else {
          // 이미지가 더 높은 경우 - 폭을 맞추고 높이를 자름
          drawWidth = imageWidth;
          drawHeight = drawWidth / imgAspect;
          offsetY = -(drawHeight - imageHeight) / 2;
        }
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        // Canvas를 Blob으로 변환 (텍스트 없이 이미지만)
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 0.9);
      };
      
      img.onerror = () => {
        // 이미지 로드 실패 시 텍스트만 그리기
        drawTextOnlyVersion();
      };
      
      img.src = article.image;
    } else {
      // 이미지가 없는 경우 텍스트만 그리기
      drawTextOnlyVersion();
    }
    
    function drawTextArea() {
      const textAreaY = canvas.height * 0.65; // 409px부터 시작
      const textAreaHeight = canvas.height * 0.35; // 221px 높이
      
      // 하단 텍스트 배경 (흰색)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, textAreaY, canvas.width, textAreaHeight);
      
      // 제목 그리기
      const titleFontSize = article.title.length > 100 ? 24 : article.title.length > 80 ? 28 : article.title.length > 60 ? 32 : 36;
      ctx.font = `bold ${titleFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = '#1a1a1a';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      // 제목 줄바꿈 처리
      const words = article.title.split(' ');
      const lines = [];
      let currentLine = '';
      const maxWidth = canvas.width - 80; // 좌우 패딩 40px씩
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      
      // 제목 그리기 (최대 3줄로 증가)
      const titleLines = lines.slice(0, 3);
      const lineHeight = titleFontSize * 1.1;
      const titleStartY = textAreaY + 25;
      
      titleLines.forEach((line, index) => {
        ctx.fillText(line, 40, titleStartY + (index * lineHeight));
      });
      
      // 하단 메타 정보
      const metaY = canvas.height - 45;
      
      // 카테고리
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#667eea';
      ctx.textAlign = 'left';
      ctx.fillText((article.category || 'NEWS').toUpperCase(), 40, metaY);
      
      // 날짜
      const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#666666';
      ctx.textAlign = 'center';
      ctx.fillText(formattedDate, canvas.width / 2, metaY);
      
      // 브랜드
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#667eea';
      ctx.textAlign = 'right';
      ctx.fillText('NEWStep', canvas.width - 40, metaY);
    }
    
    function drawTextOnlyVersion() {
      // 배경 그라디언트
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 텍스트 설정
      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      // 제목 그리기
      const titleFontSize = article.title.length > 80 ? 32 : article.title.length > 60 ? 36 : 42;
      ctx.font = `bold ${titleFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      
      // 제목 줄바꿈 처리
      const words = article.title.split(' ');
      const lines = [];
      let currentLine = '';
      const maxWidth = canvas.width - 120; // 좌우 패딩
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      
      // 제목 그리기 (최대 3줄)
      const titleLines = lines.slice(0, 3);
      const lineHeight = titleFontSize * 1.2;
      const titleStartY = 200;
      
      titleLines.forEach((line, index) => {
        ctx.fillText(line, 60, titleStartY + (index * lineHeight));
      });
      
      // 카테고리 그리기
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText((article.category || 'NEWS').toUpperCase(), 60, 60);
      
      // 날짜 그리기
      const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      ctx.textAlign = 'right';
      ctx.fillText(formattedDate, canvas.width - 60, 60);
      
      // 브랜드 로고/텍스트
      ctx.textAlign = 'left';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = 'white';
      ctx.fillText('NEWStep', 60, canvas.height - 80);
      
      ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('Learn English Through News', 60, canvas.height - 50);
      
      // URL
      ctx.textAlign = 'right';
      ctx.fillText('marlang-app.web.app', canvas.width - 60, canvas.height - 50);
      
      // Canvas를 Blob으로 변환
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png', 0.9);
    }
  });
};

// DOM 기반 이미지 생성 (html2canvas 사용)
const createImageWithDOM = async (article) => {
  // 임시 DOM 요소 생성
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = createArticleCardHTML(article);
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  document.body.appendChild(tempDiv);
  
  try {
    // html2canvas로 이미지 생성
    const canvas = await html2canvas(tempDiv.firstElementChild, {
      width: 1200,
      height: 630,
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null
    });
    
    // Canvas를 Blob으로 변환
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png', 0.9);
    });
  } finally {
    // 임시 DOM 요소 제거
    document.body.removeChild(tempDiv);
  }
};

// 메인 이미지 생성 함수
export const generateSocialImage = async (article, method = 'canvas') => {
  try {
    if (method === 'dom' && typeof html2canvas !== 'undefined') {
      return await createImageWithDOM(article);
    } else {
      return await createImageWithCanvas(article);
    }
  } catch (error) {
    console.error('소셜 이미지 생성 실패:', error);
    return null;
  }
};

// 이미지를 Data URL로 변환
export const blobToDataURL = (blob) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

// 이미지를 Firebase Storage에 업로드하고 URL 반환
export const uploadSocialImage = async (blob, articleId) => {
  try {
    // Firebase Storage 업로드 로직은 별도 구현 필요
    // 현재는 Data URL 반환
    return await blobToDataURL(blob);
  } catch (error) {
    console.error('소셜 이미지 업로드 실패:', error);
    return null;
  }
};

// 기사별 소셜 이미지 캐시 관리
const imageCache = new Map();

export const getCachedSocialImage = (articleId) => {
  return imageCache.get(articleId);
};

export const setCachedSocialImage = (articleId, imageUrl) => {
  imageCache.set(articleId, imageUrl);
};

export const clearImageCache = () => {
  imageCache.clear();
};