/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-icon.svg'],
      manifest: {
        name: 'MOAR',
        short_name: 'MOAR',
        description: 'Track your gains — fast workout logging that works offline.',
        theme_color: '#f97316',
        background_color: '#0f0f0f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Don't precache hero images — they're loaded on demand and too large for SW cache
        globIgnores: ['**/heroes/**'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Skip waiting so new versions activate immediately
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Cache hero images with a cache-first strategy
            urlPattern: /\/heroes\/hero-\d+\.webp$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'hero-images',
              expiration: { maxEntries: 20 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test-setup.ts'],
  },
});
