import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: { proxy: { '/api': 'http://localhost:8787' } },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { navigateFallbackDenylist: [/^\/api/] },
      manifestFilename: 'manifest.webmanifest',
      includeAssets: ['favicon-32.png', 'favicon-48.png', 'apple-touch-icon.png', 'logo-mark.png'],
      manifest: {
        name: 'SHAFARE', short_name: 'SHAFARE', description: 'Everything useful. One place.',
        theme_color: '#05070B', background_color: '#05070B', display: 'standalone', start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
