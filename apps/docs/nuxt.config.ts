export default defineNuxtConfig({
  devtools: { enabled: false },
  typescript: {
    strict: true
  },
  vite: {
    server: {
      fs: {
        allow: ["../.."]
      }
    }
  }
});
