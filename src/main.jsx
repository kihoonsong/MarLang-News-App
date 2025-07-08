import './polyfills/reactDomFindNodePolyfill'; // findDOMNode 폴리필 추가 (가장 먼저)
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <App />
)
