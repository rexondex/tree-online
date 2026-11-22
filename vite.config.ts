import { defineConfig } from 'vite';
export default defineConfig({ base: './', root: 'client', publicDir: '../public', server: { host: '127.0.0.1', port: 5173, strictPort: true }, build: { outDir: '../dist/client', emptyOutDir: true } });

