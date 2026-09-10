import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            if (
              id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/scheduler/') ||
              id.includes('/node_modules/use-sync-external-store/')
            ) {
              return 'vendor-react';
            }
            if (id.includes('/node_modules/lucide-react/')) {
              return 'vendor-icons';
            }
            if (
              id.includes('/node_modules/recharts/') ||
              id.includes('/node_modules/d3-') ||
              id.includes('/node_modules/victory-vendor/')
            ) {
              return 'vendor-charts';
            }
            if (
              id.includes('/node_modules/framer-motion/') ||
              id.includes('/node_modules/motion/')
            ) {
              return 'vendor-motion';
            }
            if (id.includes('/node_modules/firebase/') || id.includes('/node_modules/@firebase/')) {
              return 'vendor-firebase';
            }
          },
        },
      },
    },
  };
});
