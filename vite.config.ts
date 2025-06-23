import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mochaPlugins } from '@getmocha/vite-plugins';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/fam-hub/' : '/',
  plugins: [...mochaPlugins(process.env as Record<string, string>), react()],
  server: {
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
});