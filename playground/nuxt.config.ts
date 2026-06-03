export default defineNuxtConfig({
  modules: ["@nuxt/content", "@nuxt/ui"],
  css: ["~/assets/css/main.css"],
  devtools: { enabled: false },
  typescript: {
    strict: true
  },
  content: {
    build: {
      markdown: {
        highlight: {
          langs: ["abap", "bash", "css", "json", "mdc", "ts", "typescript", "vue"]
        }
      }
    }
  },
  vite: {
    server: {
      fs: {
        allow: ["../.."]
      }
    }
  }
});
