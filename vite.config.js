import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'FIREBASE_'],
  server: {
    port: 5180,
    strictPort: true,
    open: false
  }
});

