import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // The active game is served from a GitHub Pages project path in production.
  base: './',
});
