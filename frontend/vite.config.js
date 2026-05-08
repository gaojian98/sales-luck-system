import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 前端默认 5173；后端默认 3001（backend/.env 的 PORT）。
// 开发时可用 http://127.0.0.1:5173/admin 打开客服后台（代理到后端），避免 3001 被 Vite 占用时出现 Cannot GET /admin。
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': { target: 'http://127.0.0.1:3001', changeOrigin: true },
      '/admin': { target: 'http://127.0.0.1:3001', changeOrigin: true },
      '/sls-health': { target: 'http://127.0.0.1:3001', changeOrigin: true }
    }
  }
})
