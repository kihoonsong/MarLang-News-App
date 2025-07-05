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
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          router: ['react-router-dom', 'styled-components'],
          utils: ['axios']
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
        drop_console: false, // 디버깅을 위해 console.log 보존
        drop_debugger: true // debugger 제거
      }
    }
  }
})
