import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/TASK_MANAGER_NEW/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'favicon.ico'],
      manifest: {
        name: 'Task Manager',
        short_name: 'Tasks',
        description: '개인 업무 관리 앱',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/TASK_MANAGER_NEW/',
        start_url: '/TASK_MANAGER_NEW/',
        icons: [
          {
            src: '/TASK_MANAGER_NEW/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/TASK_MANAGER_NEW/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
