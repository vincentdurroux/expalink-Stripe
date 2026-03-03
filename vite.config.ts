
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Cloud Run nécessite que l'application écoute sur 0.0.0.0
// et utilise le port défini par la variable d'environnement PORT (souvent 8080)
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 8080,
    host: '0.0.0.0',
    strictPort: true,
  },
  preview: {
    port: Number(process.env.PORT) || 8080,
    host: '0.0.0.0',
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
  }
});
