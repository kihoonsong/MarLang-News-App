import './polyfills/reactDomFindNodePolyfill'; // findDOMNode 폴리필 추가 (가장 먼저)
import React from 'react'
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// ReactQuill 호환성을 위한 findDOMNode polyfill
if (!ReactDOM.findDOMNode) {
  ReactDOM.findDOMNode = (component) => {
    if (component && component.nodeType === 1) {
      return component;
    }
    return null;
  };
}

createRoot(document.getElementById('root')).render(
  <App />
)
