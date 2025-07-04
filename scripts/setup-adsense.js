#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 색상 출력을 위한 ANSI 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`),
};

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupAdsense() {
  try {
    log.title('\n🚀 구글 애드센스 설정 도우미');
    console.log('이 스크립트는 구글 애드센스 설정을 도와드립니다.\n');

    // 1. 애드센스 계정 정보 수집
    log.info('1. 애드센스 계정 정보를 입력해주세요.');
    
    const clientId = await question('클라이언트 ID (ca-pub-xxxxxxxxxx): ');
    if (!clientId || !clientId.startsWith('ca-pub-')) {
      log.error('올바른 클라이언트 ID를 입력해주세요 (ca-pub-로 시작)');
      process.exit(1);
    }

    log.info('\n2. 광고 슬롯 ID를 입력해주세요.');
    const articleBannerSlot = await question('기사 배너 광고 슬롯 ID: ');
    const sidebarSlot = await question('사이드바 광고 슬롯 ID: ');
    const searchResultsSlot = await question('검색 결과 광고 슬롯 ID: ');

    // 3. 광고 표시 정책 설정
    log.info('\n3. 광고 표시 정책을 설정해주세요.');
    const showToLoggedIn = await question('로그인 사용자에게 광고 표시? (y/n): ');
    const showToPremium = await question('프리미엄 사용자에게 광고 표시? (y/n): ');
    const showOnMobile = await question('모바일에서 광고 표시? (y/n): ');
    const adFrequency = await question('광고 빈도 (몇 개 기사마다 광고 표시?): ');

    // 4. 소유권 확인 방법 선택
    log.info('\n4. 소유권 확인 방법을 선택해주세요.');
    console.log('1. 애드센스 코드 스니펫 (권장) - 승인 후 바로 광고 표시');
    console.log('2. 메타 태그 - 가장 가벼운 방법');
    console.log('3. 둘 다 사용 - 최고 승인률');
    const verificationMethod = await question('선택하세요 (1/2/3): ');
    
    // 5. 개발 환경 설정
    log.info('\n5. 개발 환경 설정을 해주세요.');
    const devEnabled = await question('개발 환경에서 광고 활성화? (y/n): ');
    const useTestAds = await question('테스트 광고 사용? (y/n): ');

    // 6. 설정 파일 업데이트
    log.info('\n6. 설정 파일을 업데이트합니다...');
    
    // adsenseConfig.js 업데이트
    const adsenseConfigPath = path.join(__dirname, '../src/config/adsenseConfig.js');
    const adsenseConfig = `export const adsenseConfig = {
  // 구글 애드센스 클라이언트 ID
  CLIENT_ID: '${clientId}',
  
  // 광고 슬롯 설정
  adSlots: {
    // 기사 사이 배너 광고
    articleBanner: {
      slot: '${articleBannerSlot}',
      format: 'horizontal',
      responsive: true,
    },
    // 사이드바 광고
    sidebar: {
      slot: '${sidebarSlot}', 
      format: 'vertical',
      responsive: true,
    },
    // 검색 결과 광고
    searchResults: {
      slot: '${searchResultsSlot}',
      format: 'auto',
      responsive: true,
    }
  },
  
  // 광고 표시 제어
  displayRules: {
    // 로그인 사용자에게 광고 표시 여부
    showToLoggedInUsers: ${showToLoggedIn.toLowerCase() === 'y'},
    // 프리미엄 사용자에게 광고 표시 여부
    showToPremiumUsers: ${showToPremium.toLowerCase() === 'y'},
    // 모바일에서 광고 표시 여부
    showOnMobile: ${showOnMobile.toLowerCase() === 'y'},
  },
  
  // 개발 환경 설정
  development: {
    // 개발 모드에서 애드센스 비활성화
    enabled: ${devEnabled.toLowerCase() === 'y'},
    // 테스트 광고 사용 여부
    useTestAds: ${useTestAds.toLowerCase() === 'y'},
  }
};

// 환경별 설정 함수
export const getAdsenseConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    ...adsenseConfig,
    enabled: isDevelopment ? adsenseConfig.development.enabled : true,
    clientId: isDevelopment && adsenseConfig.development.useTestAds 
      ? 'ca-pub-TEST_CLIENT_ID' 
      : adsenseConfig.CLIENT_ID,
  };
};

// 광고 로드 함수
export const loadAdsenseScript = () => {
  return new Promise((resolve, reject) => {
    if (window.adsbygoogle) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = \`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=\${getAdsenseConfig().clientId}\`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      resolve();
    };
    
    script.onerror = () => {
      reject(new Error('AdSense script loading failed'));
    };
    
    document.head.appendChild(script);
  });
};`;

    fs.writeFileSync(adsenseConfigPath, adsenseConfig);
    log.success('adsenseConfig.js 파일이 업데이트되었습니다.');

    // membershipConfig.js 업데이트
    const membershipConfigPath = path.join(__dirname, '../src/config/membershipConfig.js');
    const membershipConfig = `export const membershipConfig = {
  ads: {
    enabled: true,
    frequency: ${parseInt(adFrequency) || 3}, // ${parseInt(adFrequency) || 3}개 기사마다 광고 표시
  },
  freeTier: {
    monthlyArticleLimit: 10, // 월간 무료 기사 갯수 (나중에 사용)
  },
  // 나중에 추가될 다른 유료 기능 플래그
  // advancedSearch: { enabledForPremium: true },
};`;

    fs.writeFileSync(membershipConfigPath, membershipConfig);
    log.success('membershipConfig.js 파일이 업데이트되었습니다.');

    // index.html 업데이트
    const indexHtmlPath = path.join(__dirname, '../index.html');
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // 선택된 방법에 따라 HTML 업데이트
    if (verificationMethod === '1' || verificationMethod === '3') {
      // 애드센스 코드 스니펫 추가
      const oldScriptPattern = /<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-[^"]*"\s*crossorigin="anonymous"><\/script>/g;
      const newScript = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}"
     crossorigin="anonymous"></script>`;
      
      if (oldScriptPattern.test(indexHtml)) {
        indexHtml = indexHtml.replace(oldScriptPattern, newScript);
      } else {
        indexHtml = indexHtml.replace(
          '<title>MarLang Eng News</title>',
          `<title>MarLang Eng News</title>
    <!-- Google AdSense script -->
    ${newScript}`
        );
      }
    }
    
    if (verificationMethod === '2' || verificationMethod === '3') {
      // 메타 태그 추가
      const metaTag = `<meta name="google-adsense-account" content="${clientId}">`;
      
      if (!indexHtml.includes('google-adsense-account')) {
        indexHtml = indexHtml.replace(
          '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
          `<meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- Google AdSense verification meta tag -->
    ${metaTag}`
        );
      }
    }
    
    fs.writeFileSync(indexHtmlPath, indexHtml);
    log.success('index.html 파일이 업데이트되었습니다.');

    // ads.txt 파일 업데이트
    const adsTxtPath = path.join(__dirname, '../public/ads.txt');
    let adsTxtContent = fs.readFileSync(adsTxtPath, 'utf8');
    adsTxtContent = adsTxtContent.replace(/pub-YOUR_CLIENT_ID/g, clientId.replace('ca-', ''));
    fs.writeFileSync(adsTxtPath, adsTxtContent);
    log.success('ads.txt 파일이 업데이트되었습니다.');

    // 7. 환경 변수 파일 생성 (선택사항)
    const createEnvFile = await question('\n환경 변수 파일(.env)을 생성하시겠습니까? (y/n): ');
    if (createEnvFile.toLowerCase() === 'y') {
      const envPath = path.join(__dirname, '../.env');
      const envContent = `# 구글 애드센스 설정
VITE_ADSENSE_CLIENT_ID=${clientId}
VITE_ADSENSE_ENABLED=true

# 개발 환경 설정
VITE_NODE_ENV=development
`;
      fs.writeFileSync(envPath, envContent);
      log.success('.env 파일이 생성되었습니다.');
    }

    // 8. 설정 완료 메시지
    log.title('\n🎉 애드센스 설정이 완료되었습니다!');
    
    console.log('\n✅ 설정된 내용:');
    console.log(`- 클라이언트 ID: ${clientId}`);
    console.log(`- 광고 슬롯: ${Object.keys(adsenseConfig.adSlots).length}개`);
    console.log(`- 광고 빈도: ${parseInt(adFrequency) || 3}개 기사마다`);
    
    // 선택된 확인 방법에 따른 안내
    if (verificationMethod === '1') {
      console.log('- 소유권 확인 방법: 애드센스 코드 스니펫');
      console.log('  → 승인 후 바로 광고가 표시됩니다.');
    } else if (verificationMethod === '2') {
      console.log('- 소유권 확인 방법: 메타 태그');
      console.log('  → 승인 후 별도로 광고 코드를 활성화해야 합니다.');
    } else if (verificationMethod === '3') {
      console.log('- 소유권 확인 방법: 애드센스 코드 + 메타 태그');
      console.log('  → 최고 승인률로 설정되었습니다.');
    }
    
    console.log('\n🚀 다음 단계:');
    console.log('1. 웹사이트 배포 (Firebase/Vercel 등)');
    console.log('2. 구글 애드센스에서 사이트 추가');
    console.log('3. 사이트 승인 신청');
    console.log('4. 승인 대기 (1-14일)');
    console.log('5. 광고 단위 생성 및 설정');
    
    console.log('\n📋 승인 전 체크리스트:');
    console.log('- [ ] 최소 15-20개의 고품질 콘텐츠');
    console.log('- [ ] 개인정보 처리방침 페이지 추가');
    console.log('- [ ] 이용약관 페이지 추가');
    console.log('- [ ] 연락처 정보 페이지 추가');
    console.log('- [ ] SSL 인증서 설치 (HTTPS)');
    console.log('- [ ] 모바일 반응형 디자인');
    console.log('- [ ] 정기적인 트래픽 (일 100-500명)');
    
    console.log('\n🔗 유용한 링크:');
    console.log('- 애드센스 계정: https://www.google.com/adsense');
    console.log('- 승인 가이드: https://support.google.com/adsense/answer/7299563');
    console.log('- ads.txt 확인: https://yourdomain.com/ads.txt');
    console.log('- 자세한 가이드: ./GOOGLE_ADSENSE_SETUP_GUIDE.md');
    
    log.warning('\n⚠️  주의사항:');
    console.log('- 개발 환경에서는 테스트 광고만 표시됩니다.');
    console.log('- 실제 광고는 프로덕션 환경에서 확인하세요.');
    console.log('- 애드센스 정책을 반드시 준수하세요.');
    console.log('- 자체 클릭이나 클릭 유도는 금지됩니다.');

  } catch (error) {
    log.error(`설정 중 오류가 발생했습니다: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  setupAdsense();
}

module.exports = { setupAdsense }; 