export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],

  devtools: { enabled: true },

  devServer: {
    port: 3000,
  },

  typescript: {
    strict: true,
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: 'http://localhost/api/v1',
      oauthClientId: '',
      reverbHost: 'localhost',
      reverbPort: '8080',
      reverbKey: 'shopchain-key',
    },
  },
})
