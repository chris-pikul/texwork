import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Precache the full app shell + static assets; exclude HDRI files (too large)
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/*.exr'],
        runtimeCaching: [
          {
            // EXR environment maps: cache-first after first fetch
            urlPattern: /\.exr$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'hdri-cache',
              expiration: { maxEntries: 4 },
            },
          },
        ],
      },
      manifest: {
        name: 'texwork',
        short_name: 'texwork',
        description: 'PBR texture workbench — compose, preview, and export material maps',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0c0c0c',
        theme_color: '#0c0c0c',
        icons: [
          { src: 'pwa-64x64.png',           sizes: '64x64',   type: 'image/png' },
          { src: 'pwa-192x192.png',          sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png',          sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  worker: { format: 'es' },
})
