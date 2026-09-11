import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  // Relative URLs keep local development working and allow deployment under
  // GitHub Pages' /one-tail-flower-letter/ project path.
  base: './',
});
