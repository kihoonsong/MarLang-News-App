#!/usr/bin/env node

/**
 * 네이버 로그인 설정 및 문제 해결 스크립트
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 네이버 로그인 설정 확인 및 수정 시작...\n');

// 1. 환경변수 파일 확인
function checkEnvFiles() {
  console.log('📋 환경변수 파일 확인 중...');
  
  const envPath = '.env';
  const functionsEnvPath = 'functions/.env';
  
  // 메인 .env 파일 확인
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('VITE_NAVER_CLIENT_ID')) {
      console.log('✅ 메인 .env 파일에 VITE_NAVER_CLIENT_ID 설정됨');
      const match = envContent.match(/VITE_NAVER_CLIENT_ID=(.+)/);
      if (match && match[1] !== 'your_naver_client_id_here') {
        console.log('✅ 네이버 클라이언트 ID가 실제 값으로 설정됨');
      } else {
        console.log('❌ 네이버 클라이언트 ID가 기본값으로 설정됨');
      }
    } else {
      console.log('❌ 메인 .env 파일에 VITE_NAVER_CLIENT_ID 누락');
    }
  } else {
    console.log('❌ 메인 .env 파일이 존재하지 않음');
  }
  
  // Functions .env 파일 확인
  if (fs.existsSync(functionsEnvPath)) {
    const functionsEnvContent = fs.readFileSync(functionsEnvPath, 'utf8');
    if (functionsEnvContent.includes('NAVER_CLIENT_ID') && functionsEnvContent.includes('NAVER_CLIENT_SECRET')) {
      console.log('✅ Functions .env 파일에 네이버 설정됨');
      const clientIdMatch = functionsEnvContent.match(/NAVER_CLIENT_ID=(.+)/);
      const clientSecretMatch = functionsEnvContent.match(/NAVER_CLIENT_SECRET=(.+)/);
      if (clientIdMatch && clientIdMatch[1] !== 'your_naver_client_id_here' &&
          clientSecretMatch && clientSecretMatch[1] !== 'your_naver_client_secret_here') {
        console.log('✅ 네이버 클라이언트 정보가 실제 값으로 설정됨');
      } else {
        console.log('❌ 네이버 클라이언트 정보가 기본값으로 설정됨');
      }
    } else {
      console.log('❌ Functions .env 파일에 네이버 설정 누락');
    }
  } else {
    console.log('❌ Functions .env 파일이 존재하지 않음');
  }
  
  console.log('');
}

// 2. 네이버 로그인 관련 코드 확인
function checkNaverCode() {
  console.log('🔍 네이버 로그인 코드 확인 중...');
  
  const authContextPath = 'src/contexts/AuthContext.jsx';
  const naverCallbackPath = 'src/pages/NaverCallback.jsx';
  const functionsIndexPath = 'functions/index.js';
  
  const files = [
    { path: authContextPath, name: 'AuthContext' },
    { path: naverCallbackPath, name: 'NaverCallback' },
    { path: functionsIndexPath, name: 'Functions Index' }
  ];
  
  files.forEach(file => {
    if (fs.existsSync(file.path)) {
      const content = fs.readFileSync(file.path, 'utf8');
      if (content.includes('naver') || content.includes('Naver')) {
        console.log(`✅ ${file.name} 파일에 네이버 로그인 코드 존재`);
      } else {
        console.log(`❌ ${file.name} 파일에 네이버 로그인 코드 누락`);
      }
    } else {
      console.log(`❌ ${file.name} 파일이 존재하지 않음`);
    }
  });
  
  console.log('');
}

// 3. 다음 단계 안내
function printNextSteps() {
  console.log('🚀 다음 단계:');
  console.log('');
  console.log('1. Firebase Functions 배포:');
  console.log('   npm run build');
  console.log('   firebase deploy --only functions');
  console.log('');
  console.log('2. 개발 서버 재시작:');
  console.log('   npm run dev');
  console.log('');
  console.log('3. 네이버 로그인 테스트:');
  console.log('   - 브라우저에서 로그인 모달 열기');
  console.log('   - "네이버 계정으로 시작하기" 버튼 클릭');
  console.log('   - 네이버 로그인 페이지로 리디렉션 확인');
  console.log('');
}

// 메인 실행
function main() {
  checkEnvFiles();
  checkNaverCode();
  printNextSteps();
  
  console.log('✨ 네이버 로그인 설정 확인 완료!');
}

main();