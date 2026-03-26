import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    proxy: {
      '/api': {
        target: 'https://saka-rice-store-backend.onrender.com',
        changeOrigin: true,
      }
    }
  }
})
