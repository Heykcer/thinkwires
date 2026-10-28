import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from both monorepo root and apps/frontend
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '../../'), '');
  const localEnv = loadEnv(mode, __dirname, '');
  const env = { ...rootEnv, ...localEnv };

  const backendPort = env.PORT || 5000;
  const frontendPort = parseInt(env.FRONTEND_PORT || '5173', 10);
  const targetUrl = `http://127.0.0.1:${backendPort}`;

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      proxy: {
        '/api': {
          target: targetUrl,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              const isConnRefused =
                err.code === 'ECONNREFUSED' ||
                (err.message && err.message.includes('ECONNREFUSED'));
              if (!isConnRefused) {
                console.warn('[vite proxy error]', err.message);
              }
            });
          },
        },
        '/uploads': {
          target: targetUrl,
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');
            if (normalizedId.includes('/node_modules/')) {
              if (normalizedId.includes('/three/')) return 'vendor-three';
              if (normalizedId.includes('/recharts/')) return 'vendor-charts';
              if (normalizedId.includes('/framer-motion/'))
                return 'vendor-motion';
              if (
                normalizedId.includes('/react/') ||
                normalizedId.includes('/react-dom/') ||
                normalizedId.includes('/@reduxjs/')
              )
                return 'vendor-react';
            }
          },
        },
      },
    },
  };
});
