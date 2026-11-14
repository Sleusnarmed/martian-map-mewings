import { defineConfig, mergeConfig } from 'vite'
import baseConfig from './vite.config.js'

// Isolated build for Gerardo’s preview; keeps the shared app entry unchanged.
export default mergeConfig(baseConfig, defineConfig({
  build: {
    outDir: 'dist/mission-detail',
    rollupOptions: { input: 'mission-demo.html' },
  },
}))
