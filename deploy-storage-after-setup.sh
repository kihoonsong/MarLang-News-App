#!/bin/bash

# Firebase Storage 설정 완료 후 실행할 스크립트

echo "🔥 Firebase Storage 보안 규칙 배포 시작..."

# Storage 규칙 배포
firebase deploy --only storage

if [ $? -eq 0 ]; then
    echo "✅ Firebase Storage 보안 규칙 배포 완료!"
    echo ""
    echo "📋 다음 단계:"
    echo "1. https://marlang-app.web.app/dashboard 접속"
    echo "2. 새 기사 작성 테스트"
    echo "3. 이미지 파일 업로드 테스트"
    echo "4. 예약 발행 및 즉시 발행 테스트"
    echo ""
    echo "🎯 이제 이미지가 포함된 기사 발행이 정상 작동합니다!"
else
    echo "❌ Firebase Storage 보안 규칙 배포 실패"
    echo "Firebase Console에서 Storage가 설정되었는지 확인하세요:"
    echo "https://console.firebase.google.com/project/marlang-app/storage"
fi