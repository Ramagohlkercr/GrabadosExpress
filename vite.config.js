import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true
  }
  // Note: VITE_API_URL defaults to '/api' in the code (AuthContext.jsx, storageApi.js)
  // For local development with backend, create .env file with VITE_API_URL=http://localhost:3001/api
})
