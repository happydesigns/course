export default defineNuxtConfig({
  compatibilityDate: "2026-08-10",
  extends: ["../packages/nuxt"],
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
