import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import UnoCss from 'unocss/vite'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    UnoCss()
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
