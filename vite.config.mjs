export default {
  cacheDir: './node_modules/.vite',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/gsap') || id.includes('node_modules/@gsap')) return 'motion';
          if (id.includes('node_modules/react')) return 'react';
        }
      }
    }
  }
};
