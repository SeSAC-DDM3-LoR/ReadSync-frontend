import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/v1': {
        target: 'http://localhost:8080/api', // Backend context path added
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:8080/api', // Proxy /api requests as well (for Notice/Inquiry/uploads)
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''), // Backend context path is /api, so we forward /api/notices -> /api/notices? 
        // Backend URL: http://localhost:8080/api /api / notices ?? 
        // Context path is /api. Controller is /api/notices. 
        // So full is /api/api/notices. If we proxy /api -> http://localhost:8080/api, then /api/notices -> http://localhost/api/api/notices.
        // This seems correct based on previous analysis.
      },
    },
  },
})
