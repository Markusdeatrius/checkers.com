// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // Provide a public runtime config value for API base so deployments
  // (Render, Vercel) and local dev can use the same code path.
  runtimeConfig: {
    public: {
      NUXT_PUBLIC_API_BASE: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3002'
    }
  }
})
