import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  plugins: [react()],
  define: {
    'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || ''),
    'globalThis.__LINKPAY_API_URL__': JSON.stringify(env.VITE_API_URL || '')
  },
  resolve: {
    preserveSymlinks: true
  }
  };
});
