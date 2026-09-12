import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
  nitro: {
    serverAssets: [{
      baseName: "comark-course",
      dir: fileURLToPath(new URL("./content/courses/abap-platform-rap120", import.meta.url))
    }],
    prerender: { routes: ["/comark/abap-platform-rap120", "/api/comark-course"] }
  },
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
