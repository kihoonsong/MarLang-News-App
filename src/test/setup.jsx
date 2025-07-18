import { expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers);

// Clean up after each test case
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = vi.fn(() => ({
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
  x: 0,
  y: 0,
}));

// Mock window.speechSynthesis for TTS tests
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => []),
    speaking: false,
    pending: false,
    paused: false,
    onvoiceschanged: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
});

// Mock SpeechSynthesisUtterance
global.SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
  text: text || '',
  lang: 'en-US',
  voice: null,
  volume: 1,
  rate: 1,
  pitch: 1,
  onstart: null,
  onend: null,
  onerror: null,
  onpause: null,
  onresume: null,
  onmark: null,
  onboundary: null,
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock FileReader
global.FileReader = vi.fn(() => ({
  readAsDataURL: vi.fn(),
  readAsText: vi.fn(),
  readAsArrayBuffer: vi.fn(),
  readAsBinaryString: vi.fn(),
  onload: null,
  onerror: null,
  onabort: null,
  onloadstart: null,
  onloadend: null,
  onprogress: null,
  result: null,
  error: null,
  readyState: 0,
  EMPTY: 0,
  LOADING: 1,
  DONE: 2,
}));

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('')),
  },
  writable: true,
});

// Mock navigator.share
Object.defineProperty(navigator, 'share', {
  value: vi.fn(() => Promise.resolve()),
  writable: true,
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000,
    },
  },
  writable: true,
});

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}));

// Mock visualViewport
Object.defineProperty(window, 'visualViewport', {
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    width: 1024,
    height: 768,
    offsetLeft: 0,
    offsetTop: 0,
    pageLeft: 0,
    pageTop: 0,
    scale: 1,
  },
  writable: true,
});

// Mock crypto.randomUUID
if (!crypto.randomUUID) {
  Object.defineProperty(crypto, 'randomUUID', {
    value: vi.fn(() => 'mocked-uuid-' + Math.random().toString(36).substr(2, 9)),
    writable: true,
    configurable: true
  });
}

// Mock console methods to reduce noise in tests (can be overridden in individual tests)
const originalConsole = { ...console };
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Restore console for specific tests that need it
global.restoreConsole = () => {
  global.console = originalConsole;
};

// Mock environment variables commonly used in tests
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-firebase-api-key');
vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test-project.firebaseapp.com');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');
vi.stubEnv('VITE_GEMINI_API_KEY', 'test-gemini-api-key');
vi.stubEnv('VITE_NEWS_API_KEY', 'test-news-api-key');
vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-google-client-id');
vi.stubEnv('VITE_NAVER_CLIENT_ID', 'test-naver-client-id');

// Global test utilities
global.createMockEvent = (type, properties = {}) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, properties);
  return event;
};

global.createMockFile = (name = 'test.jpg', type = 'image/jpeg', size = 1024) => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Mock timers helper
global.advanceTimersByTime = (ms) => {
  vi.advanceTimersByTime(ms);
};

// Error boundary for tests
global.suppressErrorBoundaryErrors = () => {
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });
};

// Test data factories
global.createMockArticle = (overrides = {}) => ({
  id: 'test-article-' + Math.random().toString(36).substr(2, 9),
  title: 'Test Article Title',
  summary: 'This is a test article summary.',
  content: 'This is the full content of the test article.',
  category: 'Technology',
  publishedAt: new Date().toISOString(),
  image: 'https://example.com/test-image.jpg',
  url: 'https://example.com/test-article',
  source: 'Test Source',
  ...overrides,
});

global.createMockUser = (overrides = {}) => ({
  uid: 'test-user-' + Math.random().toString(36).substr(2, 9),
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/avatar.jpg',
  role: 'user',
  provider: 'google',
  createdAt: new Date().toISOString(),
  ...overrides,
});

global.createMockCategory = (overrides = {}) => ({
  id: 'test-category-' + Math.random().toString(36).substr(2, 9),
  name: 'Test Category',
  type: 'category',
  slug: 'test-category',
  color: '#1976d2',
  ...overrides,
});

// Cleanup function for tests
global.cleanupTest = () => {
  cleanup();
  vi.clearAllMocks();
  vi.clearAllTimers();
  localStorage.clear();
  sessionStorage.clear();
};