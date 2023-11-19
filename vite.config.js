import {defineConfig} from "vite";
import wasm from 'vite-plugin-wasm';
// import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  esbuild: {
    minifyIdentifiers: true,
    supported: {
      'top-level-await': true
    }
  },
  plugins: [wasm()/*, legacy()*/]
});
