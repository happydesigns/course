import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { writeSnapshots } from "comark-content/build";
import { createCourses } from "./content";

const sourceDir = fileURLToPath(new URL('./content', import.meta.url));
const courses = createCourses(sourceDir);
export default defineNuxtConfig({
  runtimeConfig: { courseContentDir: sourceDir },
  hooks: {
    "nitro:config": async (config) => {
      const dir = resolve(config.buildDir!, "courses");
      config.serverAssets ??= [];
      config.serverAssets.push({ baseName: "courses", dir });
      config.prerender ??= {};
      config.prerender.routes ??= [];
      config.prerender.routes.push("/api/content/snapshot.json", "/courses", "/academy");
    },
    "nitro:build:before": async (nitro) => {
      // Nitro resolves the build-directory alias before server assets are read.
      const asset = nitro.options.serverAssets.find(item => item.baseName === "courses")!;
      await writeSnapshots(courses, { dir: asset.dir });
      nitro.options.prerender.routes.push(...(await courses.list()).map(file => file.path));
    }
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
