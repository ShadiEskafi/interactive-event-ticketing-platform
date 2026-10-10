import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'TicketCraft Gate Scanner',
        short_name: 'GateScanner',
        description: 'High-throughput PWA Gate Scanner for TicketCraft event turnstiles',
        theme_color: '#0f172a',
        background_color: '#090d16',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    testTimeout: 15000,
  },
})

