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
      includeAssets: [],
      manifest: {
        name: 'Task Manager',
        short_name: 'Tasks',
        description: '개인 업무 관리 앱',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/TASK_MANAGER_NEW/',
        start_url: '/TASK_MANAGER_NEW/',
        icons: [],
      },
    }),
  ],
})
