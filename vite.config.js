import {defineConfig} from "vite";
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  esbuild: {
    minifyIdentifiers: true,
    supported: {
      'top-level-await': true
    }
  },
  plugins: [wasm()]
});