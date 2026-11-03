import { configure } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// findBy*/waitFor wait up to 3s (default 1s): routes load lazily and themes resolve async, which
// can take longer than 1s on a busy machine or CI runner. Passing tests are not slowed down.
configure({ asyncUtilTimeout: 3000 });

// jsdom has no matchMedia. Tests default to the mobile layout; set `window.__desktop = true`
// before rendering to get the desktop layout.
declare global {
  interface Window {
    __desktop?: boolean;
  }
}
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('min-width') ? Boolean(window.__desktop) : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
