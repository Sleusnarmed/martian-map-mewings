import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { cpSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

function cesiumAssets() {
  return {
    name: 'cesium-local-assets',
    buildStart() {
      mkdirSync('public/cesium', { recursive: true })
      for (const name of ['Assets', 'Workers', 'ThirdParty', 'Widgets']) {
        cpSync(resolve('node_modules/cesium/Build/Cesium', name), resolve('public/cesium', name), { recursive: true })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [cesiumAssets(), react(),
    tailwindcss(),
  ],
})
