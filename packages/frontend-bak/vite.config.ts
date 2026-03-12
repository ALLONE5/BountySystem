import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // 使用不同的端口避免冲突
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // 更新为当前后端端口
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5174,
  },
});
