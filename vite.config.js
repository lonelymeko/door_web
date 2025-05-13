// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // Proxy for Gaode Reverse Geocoding API
      '/proxy-regeo': {
        target: 'https://restapi.amap.com', // Target Gaode API domain
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-regeo/, '/v3/geocode/regeo'), // Rewrite path to the correct endpoint
        configure: (proxy, options) => { /* Optional: Add logging */ }
      },
      // Proxy for Gaode Weather API
      '/proxy-weather': {
        target: 'https://restapi.amap.com', // Target Gaode API domain
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-weather/, '/v3/weather/weatherInfo'), // Rewrite path to the correct endpoint
        configure: (proxy, options) => { /* Optional: Add logging */ }
      },
       // Keep your Sohu proxy if you still use it elsewhere, otherwise remove
       '/sohu-api': {
         target: 'http://pv.sohu.com',
         changeOrigin: true,
         rewrite: (path) => path.replace(/^\/sohu-api/, ''),
         configure: (proxy, options) => { /* Optional: Add logging */ }
       }
    },
    hmr: {
      overlay: false // 设置为 false
    }
  }
})