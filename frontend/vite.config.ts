import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://api-gateway:8080',
        changeOrigin: true
      },
      '/oauth2': {
        target: 'http://api-gateway:8080',
        changeOrigin: true
      },
      '/login': {
        target: 'http://api-gateway:8080',
        changeOrigin: true
      }
    }
  }
})
