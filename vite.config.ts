import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-32x32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'IT Toolbox',
        short_name: 'IT Toolbox',
        description: '开发者工具箱，纯本地处理的编码、格式化、加密、网络与设计工具集',
        theme_color: '#10b981',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
        categories: ['developer', 'utilities', 'productivity'],
        shortcuts: [
          {
            name: 'JSON 格式化',
            short_name: 'JSON',
            url: '/tool/json-formatter',
          },
          {
            name: 'Base64 编解码',
            short_name: 'Base64',
            url: '/tool/base64',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{css,html,ico,png,svg,woff2}', 'assets/vendor-react-*.js', 'assets/index-*.js'],
        globIgnores: ['tools/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // 工具 chunk 首次访问后按需缓存，不再全量预缓存
            urlPattern: /\/tools\/.*\.js$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tool-chunks',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // 共享 vendor / 应用 chunk 按需缓存
            urlPattern: /\/assets\/.*\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'app-chunks',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-resources',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
        rewrite: (p) => p,
      },
    },
  },
  assetsInclude: ['**/*.wasm'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './packages/core'),
      '@toolbox/types': path.resolve(__dirname, './packages/types'),
      '@it-toolbox/core': path.resolve(__dirname, './packages/core'),
      '@it-toolbox/types': path.resolve(__dirname, './packages/types'),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  esbuild: {
    target: 'esnext',
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        chunkFileNames: (chunkInfo) => {
          const id = chunkInfo.facadeModuleId ?? ''
          const tool = id.match(/[\\/]src[\\/]tools[\\/]([^\\/]+)[\\/]index\.tsx$/)
          return tool ? `tools/${tool[1]}-[hash].js` : 'assets/[name]-[hash].js'
        },
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          // 仅固定分组首屏必需的 React 运行时；其余依赖交给 Rollup 按实际共享关系分块，
          // 避免把互不相关的库绑成一个 chunk 被所有工具连带下载。
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|@tanstack|i18next|react-i18next|i18next-browser-languagedetector)[\\/]/.test(id)) {
            return 'vendor-react'
          }
          return undefined
        },
      },
    },
  },
})
