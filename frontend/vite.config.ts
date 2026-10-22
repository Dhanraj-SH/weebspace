import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const configuredApiUrl = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL?.trim()
  const target = configuredApiUrl
    ? configuredApiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '') || 'http://localhost:3000'
    : 'http://localhost:3000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/v1': {
          target,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
