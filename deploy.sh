#!/bin/bash

echo "🚀 Starting deployment process..."

# 1. 프로젝트 빌드
echo "📦 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# 2. Firebase 배포
echo "🔥 Deploying to Firebase..."
firebase deploy

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo "🌐 Your site is live at: https://marlang-app.web.app"
    echo ""
    echo "📋 Next steps:"
    echo "1. Visit https://marlang-app.web.app/google7b76ba589aed52e3.html to verify Google file"
    echo "2. Go to Google Search Console and click 'Verify'"
    echo "3. Submit sitemap: https://marlang-app.web.app/sitemap.xml"
    echo "4. Apply for Google AdSense!"
else
    echo "❌ Deployment failed!"
    echo "💡 Try: firebase login && firebase use marlang-app"
    exit 1
fi