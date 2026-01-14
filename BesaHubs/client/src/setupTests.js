// Jest test environment setup (CRA loads this automatically if present)
// Recharts/ResponsiveContainer relies on ResizeObserver which jsdom doesn't implement.
// This polyfill is intentionally minimal: enough to prevent crashes in unit tests.

import '@testing-library/jest-dom';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = ResizeObserverMock;
}


