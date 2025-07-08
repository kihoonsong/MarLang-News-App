import * as ReactDOM from 'react-dom';

// React 19부터 findDOMNode가 제거되었으므로, 필요한 라이브러리(react-quill 등)가 호출할 때를 대비해
// 간단한 폴리필을 제공한다. div/span 등 실제 DOM 노드 ref를 넘기는 경우만 지원한다.
// 컴포넌트 인스턴스를 넘기면 null 을 반환해 의도치 않은 부작용을 방지한다.
if (!ReactDOM.findDOMNode) {
  try {
    // Object.freeze 환경에서 안전한 polyfill
    Object.defineProperty(ReactDOM, 'findDOMNode', {
      value: function (componentOrElement) {
        if (componentOrElement && (componentOrElement.nodeType === 1 || componentOrElement.nodeType === 3)) {
          return componentOrElement;
        }
        return null;
      },
      writable: false,
      configurable: false
    });
  } catch (error) {
    console.warn('ReactDOM.findDOMNode polyfill failed:', error);
  }
}

// CJS interop: react-quill는 require('react-dom').default로 접근할 수 있음
const reactDomDefault = ReactDOM.default || ReactDOM;
if (reactDomDefault && !reactDomDefault.findDOMNode) {
  try {
    Object.defineProperty(reactDomDefault, 'findDOMNode', {
      value: ReactDOM.findDOMNode,
      writable: false,
      configurable: false
    });
  } catch (error) {
    console.warn('ReactDOM.default.findDOMNode polyfill failed:', error);
  }
} 