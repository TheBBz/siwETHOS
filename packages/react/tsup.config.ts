import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    modal: 'src/modal/index.ts',
    hooks: 'src/hooks/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  // Only externalize React - bundle siwe-ethos SDK to avoid pnpm resolution issues
  external: ['react', 'react-dom'],
  // Don't externalize siwe-ethos - it will be bundled into the react package
  noExternal: ['@thebbz/siwe-ethos'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  treeshake: true,
  minify: false,
});
