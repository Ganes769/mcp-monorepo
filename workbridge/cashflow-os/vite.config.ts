import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, '')
  const render = (env.VITE_API_BASE_URL || 'https://cash-flow-5gdu.onrender.com').replace(/\/$/, '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, './src') },
    },
    server: {
      port: 5190,
      proxy: {
        '/db-test': { target: render, changeOrigin: true, secure: true },
        '/xero': { target: render, changeOrigin: true, secure: true },
      },
    },
  }
})
