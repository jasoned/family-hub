import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mochaPlugins } from '@getmocha/vite-plugins';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/', // Always use root path in development
  plugins: [...mochaPlugins(process.env as Record<string, string>), react()],
  server: {
    allowedHosts: true,
    port: 5173,
    strictPort: true,
    open: true
  },
  build: {
    chunkSizeWarningLimit: 5000,
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  preview: {
    port: 5173,
    strictPort: true
  }
});