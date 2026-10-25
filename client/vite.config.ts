import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    unstubGlobals: true,
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:3001',
      '/external-api': {
        target: 'http://127.0.0.1:5006',
        rewrite: (path) => path.replace(/^\/external-api/, '/api'),
      },
    },
  },
})
