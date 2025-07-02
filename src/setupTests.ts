import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { configure } from '@testing-library/react';

// Configure testing library
configure({
  asyncUtilTimeout: 2000,
  testIdAttribute: 'data-testid',
});

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn().mockImplementation(callback => {
  return setTimeout(() => callback(performance.now()), 0);
});

// Mock cancelAnimationFrame
global.cancelAnimationFrame = vi.fn().mockImplementation(id => {
  clearTimeout(id);
});

// Mock performance.now
global.performance.now = vi.fn().mockImplementation(() => Date.now());

// Mock MutationObserver
global.MutationObserver = vi.fn().mockImplementation(function MutationObserver(callback) {
  return {
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(),
  };
});

// Mock scheduler for React 18
declare global {
  interface Window {
    scheduler: {
      unstable_IdlePriority: number;
      unstable_ImmediatePriority: number;
      unstable_LowPriority: number;
      unstable_NormalPriority: number;
      unstable_Profiling: null;
      unstable_UserBlockingPriority: number;
      unstable_cancelCallback: () => void;
      unstable_continueExecution: () => void;
      unstable_getCurrentPriorityLevel: () => number;
      unstable_getFirstCallbackNode: () => null;
      unstable_next: (callback: () => void) => void;
      unstable_now: () => number;
      unstable_pauseExecution: () => void;
      unstable_requestPaint: () => void;
      unstable_runWithPriority: (priority: number, callback: () => void) => void;
      unstable_scheduleCallback: (priority: number, callback: () => void) => void;
      unstable_shouldYield: () => boolean;
      unstable_wrapCallback: (callback: () => void) => () => void;
    };
  }
}

window.scheduler = {
  unstable_IdlePriority: 1,
  unstable_ImmediatePriority: 1,
  unstable_LowPriority: 1,
  unstable_NormalPriority: 1,
  unstable_Profiling: null,
  unstable_UserBlockingPriority: 1,
  unstable_cancelCallback: vi.fn(),
  unstable_continueExecution: vi.fn(),
  unstable_getCurrentPriorityLevel: vi.fn(),
  unstable_getFirstCallbackNode: vi.fn(),
  unstable_next: vi.fn(),
  unstable_now: vi.fn(),
  unstable_pauseExecution: vi.fn(),
  unstable_requestPaint: vi.fn(),
  unstable_runWithPriority: vi.fn(),
  unstable_scheduleCallback: vi.fn(),
  unstable_shouldYield: vi.fn(),
  unstable_wrapCallback: vi.fn(),
};

// Mock React 18's concurrent mode
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useTransition: () => [false, (cb: () => void) => cb()],
    startTransition: (cb: () => void) => cb(),
  };
});

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
}); 