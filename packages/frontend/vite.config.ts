/**
 * Vite 前端构建配置
 *
 * 配置 React + TailwindCSS v4 项目的构建环境：
 * - 路径别名 @ 指向 src/
 * - 开发服务器端口 5173
 * - API 代理将 /api 请求转发至后端 :3001
 * - 允许 monkeycode 在线预览域名访问
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // React Fast Refresh + JSX 编译
import tailwindcss from '@tailwindcss/vite'; // TailwindCSS v4 Vite 集成
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // @ 别名 → src 目录
    },
  },
  server: {
    port: 5173, // 开发服务器端口
    allowedHosts: ['.monkeycode-ai.online'], // 允许在线预览域名
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // 后端 API 地址
        changeOrigin: true, // 修改请求头中的 Origin
      },
    },
  },
});
