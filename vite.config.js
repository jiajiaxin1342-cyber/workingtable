import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dataStoragePlugin from './data-storage-plugin.js'

export default defineConfig({
  plugins: [react(), tailwindcss(), dataStoragePlugin()],
  server: {
    port: 9527,
    watch: {
      // 忽略 data/ 目录，避免写入 storage.json 时触发 HMR reload
      ignored: ['**/data/**'],
    },
  },
})
