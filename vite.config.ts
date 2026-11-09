/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Deterministic "user" time zone for component tests (workers inherit it at spawn).
if (process.env.VITEST) process.env.TZ = 'Europe/Paris';

// Absolute site URL for social previews (index.html uses %VITE_SITE_URL%). Netlify sets URL.
process.env.VITE_SITE_URL ??= process.env.SITE_URL ?? process.env.URL ?? '';

const APP_NAME = "Innkeeper's Almanac";

// Serve from a subpath on GitHub Pages ("/<repo>/"); "/" everywhere else (dev, tests, Netlify).
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: APP_NAME,
        short_name: 'Almanac',
        description:
          'A cozy fan-made calendar of in-game events for the Forever and Anniversary realms.',
        // Relative to the manifest, so the app installs correctly under any base path.
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'any',
        background_color: '#1c120c',
        theme_color: '#1c120c',
        categories: ['games', 'entertainment', 'lifestyle'],
        icons: [
          { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
          {
            src: `${base}icons/maskable-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell + bundled event data + lazy theme chunks + fonts: the whole app works offline.
        globPatterns: ['**/*.{js,css,html,svg,woff2}', 'icons/*.png'],
        navigateFallback: `${base}index.html`,
        // Calendar feeds are files, not app routes.
        navigateFallbackDenylist: [/\/calendars\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/calendars/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'calendar-feeds', expiration: { maxEntries: 20 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    coverage: {
      provider: 'v8',
      include: ['src/engine/**'],
      exclude: ['src/engine/**/__tests__/**'],
      thresholds: { 'src/engine/**': { lines: 90, functions: 90, branches: 90, statements: 90 } },
    },
  },
});
