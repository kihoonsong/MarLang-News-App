import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: 'localhost',
    strictPort: false,
    hmr: {
      timeout: 60000
    },
    // 연결 유지 설정
    middlewareMode: false,
    fs: {
      strict: false
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // 프로덕션에서 소스맵 비활성화
    minify: 'terser', // 더 나은 압축
    chunkSizeWarningLimit: 500, // 청크 크기 경고 한계
    rollupOptions: {
      output: {
        // 수동 청크 분할로 번들 최적화
        manualChunks: {
          // React 관련 라이브러리
          react: ['react', 'react-dom'],
          
          // MUI 라이브러리 (가장 큰 라이브러리)
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          
          // 라우팅 및 스타일
          router: ['react-router-dom', 'styled-components'],
          
          // 유틸리티 라이브러리 (브라우저 호환성)
          utils: ['axios']
        },
        
        // 더 나은 파일명 생성
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    
    // 압축 설정
    terserOptions: {
      compress: {
        drop_console: false, // 디버깅을 위해 console.log 보존
        drop_debugger: true // debugger 제거
      }
    }
  }
})
