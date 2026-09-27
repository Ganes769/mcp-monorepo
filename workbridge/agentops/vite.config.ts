import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiBase = env.VITE_API_BASE_URL?.replace(/\/$/, '')
  const gatewayPort = process.env.AGENTMESH_GATEWAY_PORT ?? '8787'

  return {
    plugins: [react()],
    server: {
      port: 5180,
      proxy: {
        // The WorkBridge API's CORS allowlist doesn't include this dev origin, so proxy it.
        ...(apiBase
          ? {
              '/api': {
                target: apiBase,
                changeOrigin: true,
                rewrite: (path: string) => path.replace(/^\/api/, ''),
              },
            }
          : {}),
        '/gateway': {
          target: `http://127.0.0.1:${gatewayPort}`,
          rewrite: (path: string) => path.replace(/^\/gateway/, ''),
        },
      },
    },
  }
})
