import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: '0.0.0.0',
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
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // React 관련
          'react-vendor': ['react', 'react-dom'],
          // MUI 관련 (emotion과 함께 묶어서 초기화 순서 문제 해결)
          'mui-core': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'mui-icons': ['@mui/icons-material'],
          // 라우팅 관련
          'router': ['react-router-dom'],
          // 스타일링 관련
          'styling': ['styled-components'],
          // 유틸리티
          'utils': ['axios', 'dompurify'],
          // Firebase를 더 세분화
          'firebase-core': ['firebase/app'],
          'firebase-auth': ['firebase/auth'],
          'firebase-firestore': ['firebase/firestore'],
          'firebase-storage': ['firebase/storage'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        // 더 안전한 chunk 로딩
        inlineDynamicImports: false,
        // 브라우저 호환성 개선
        format: 'es',
        generatedCode: 'es2015'
      }
    },
    
    // 압축 설정
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production', // 프로덕션에서만 console 제거
        drop_debugger: true, // debugger 제거
        pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log', 'console.info'] : [], // 프로덕션에서만 특정 함수 제거
      },
      mangle: {
        safari10: true, // Safari 10 호환성
      }
    }
  },
  // 의존성 최적화
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      'react-router-dom',
      'styled-components'
    ],
    exclude: ['firebase'] // Firebase는 동적 import로 처리
  }
})
