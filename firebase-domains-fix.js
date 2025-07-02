#!/usr/bin/env node

// Firebase 도메인 설정 스크립트
import { execSync } from 'child_process';

const domains = [
  'marlang-app.web.app',
  'marlang-app.firebaseapp.com',
  'localhost'
];

const requiredAPIs = [
  'identitytoolkit.googleapis.com',
  'firebase.googleapis.com'
];

console.log('🔧 Firebase 도메인 및 API 설정 확인 중...');

try {
  // 현재 프로젝트 확인
  const currentProject = execSync('firebase use', { encoding: 'utf8' }).trim();
  console.log(`📋 현재 프로젝트: ${currentProject}`);

  // API 활성화 확인
  console.log('\n🔍 필요한 API 활성화 확인 중...');
  requiredAPIs.forEach(api => {
    try {
      execSync(`gcloud services enable ${api} --project=${currentProject}`, { encoding: 'utf8' });
      console.log(`✅ ${api} 활성화됨`);
    } catch (error) {
      console.log(`❌ ${api} 활성화 실패: ${error.message}`);
    }
  });

  console.log('\n📝 Firebase Console에서 수동 설정이 필요합니다:');
  console.log('1. 승인된 도메인 추가:');
  domains.forEach(domain => {
    console.log(`   - ${domain}`);
  });
  
  console.log('\n2. Google 로그인 공급자 활성화');
  console.log('3. OAuth 클라이언트 도메인 설정');
  
  console.log('\n🔗 Firebase Console 링크:');
  console.log(`   Authentication: https://console.firebase.google.com/project/${currentProject}/authentication`);
  console.log(`   Settings: https://console.firebase.google.com/project/${currentProject}/authentication/settings`);

} catch (error) {
  console.error('❌ 오류:', error.message);
  console.log('\n💡 수동으로 Firebase Console에서 설정하세요:');
  console.log('   https://console.firebase.google.com/project/marlang-app/authentication/settings');
}