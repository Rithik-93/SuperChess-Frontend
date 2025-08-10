import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'https://4f02-103-239-38-122.ngrok-free.app', // allow ngrok tunnel host
    ],
  },
})
