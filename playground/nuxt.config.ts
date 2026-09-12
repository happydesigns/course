export default defineNuxtConfig({
  compatibilityDate: "2026-08-10",
  extends: ["../packages/nuxt/preview"],
  css: ["~/assets/css/main.css"],
  app: {
    pageTransition: {
      name: "course-page"
    }
  },
  devtools: { enabled: false },
  typescript: {
    strict: true
  },
  icon: {
    clientBundle: {
      icons: [
        "lucide:square-library",
        "material-icon-theme:abap",
        "material-icon-theme:cds",
        "simple-icons:github",
        "vscode-icons:file-type-bun",
        "vscode-icons:file-type-css",
        "vscode-icons:file-type-dotenv",
        "vscode-icons:file-type-markdown",
        "vscode-icons:file-type-npm",
        "vscode-icons:file-type-nuxt",
        "vscode-icons:file-type-pnpm",
        "vscode-icons:file-type-shell",
        "vscode-icons:file-type-text",
        "vscode-icons:file-type-typescript",
        "vscode-icons:file-type-vue",
        "vscode-icons:file-type-yarn"
      ],
      scan: true
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
