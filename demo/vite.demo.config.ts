import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds the stand-alone sketch flame demo with relative paths, so it can be
// opened as a static page: npx vite build --config demo/vite.demo.config.ts --outDir <folder>
export default defineConfig({
    root: 'demo',
    base: './',
    plugins: [react()],
    build: {
        emptyOutDir: true,
        rollupOptions: { input: 'demo/sketch_flame.html' },
    },
});
