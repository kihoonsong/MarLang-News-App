import './polyfills/reactDomFindNodePolyfill'; // findDOMNode 폴리필 추가 (가장 먼저)
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import './utils/errorReporting' // 에러 리포팅 초기화
import './utils/performanceMonitor' // 성능 모니터링 초기화

createRoot(document.getElementById('root')).render(
  <App />
)
