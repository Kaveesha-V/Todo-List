import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for standalone Admin Command Center portal running on dedicated port 5181
export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'FIREBASE_'],
  server: {
    port: 5181,
    strictPort: true,
    open: false
  },
  build: {
    rollupOptions: {
      input: {
        admin: 'admin.html'
      }
    }
  }
});
