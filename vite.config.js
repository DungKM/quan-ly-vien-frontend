import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Trong lúc phát triển, mọi request /api được chuyển tới backend Node.js
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_API_TARGET || 'http://127.0.0.1:5000', changeOrigin: false },
    },
  },
});
