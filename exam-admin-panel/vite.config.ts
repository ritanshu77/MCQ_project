import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/admin',
  server: {
    port: 3003,
    host: true
  },
  preview: {
    port: 3003,
    host: true
  }
})
