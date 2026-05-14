// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3002',
          changeOrigin: true
        }
      }
    }
  }
})
