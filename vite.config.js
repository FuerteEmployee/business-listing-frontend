import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3100',
        changeOrigin: true,
        // Without this, a backend restart dumps a raw ECONNRESET/ECONNREFUSED
        // stack trace and the browser sees a hung/empty response. Reply with a
        // real 502 so fetchWithAuth gets JSON it can handle.
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.warn(`[proxy] backend unreachable at 127.0.0.1:3100 (${err.code || err.message})`)
            if (res && !res.headersSent && res.writeHead) {
              res.writeHead(502, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ message: 'Backend not running on port 3100' }))
            }
          })
        },
      },
    },
  },
})
