import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({ exclude: ['league-connect'] })
    ],
    build: {
      rollupOptions: {
        // bufferutil and utf-8-validate are optional native addons for ws — not installed, mark external
        external: ['bufferutil', 'utf-8-validate']
      }
    },
    resolve: {
      alias: {
        '@shared': resolve('src/renderer/src/types')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/renderer/src/types')
      }
    },
    plugins: [react()]
  }
})
