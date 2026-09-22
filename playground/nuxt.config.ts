import { readFileSync } from "node:fs";

export default defineNuxtConfig({
  compatibilityDate: "2026-08-10",
  extends: ["../packages/nuxt/preview", ...(process.env.ID_BRAND_LAYER ? [process.env.ID_BRAND_LAYER] : [])],
  modules: process.env.ID_PREVIEW_MODULE ? [[process.env.ID_PREVIEW_MODULE, {
    studioOrigin: process.env.ID_STUDIO_ORIGIN,
    id: "course",
    brandUi: process.env.ID_BRAND_UI ? JSON.parse(readFileSync(process.env.ID_BRAND_UI, "utf8")) : undefined,
    routePrefix: "/courses",
    previewBuild: process.env.ID_PREVIEW_BUILD === "1"
  }]] : [],
  css: [process.env.ID_BRAND_CSS || "~/assets/css/main.css"],
  nitro: { prerender: { routes: ["/academy"] } },
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
