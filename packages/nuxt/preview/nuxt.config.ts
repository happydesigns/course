import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeSnapshots } from 'comark-content/build';
import { createPreviewContent } from './content';
const sourceDir = fileURLToPath(new URL('./content', import.meta.url));
const previewContent = createPreviewContent(sourceDir);
export default defineNuxtConfig({
  runtimeConfig: { coursePreviewContentDir: sourceDir },
  $meta: { name: '@happydesigns/course-preview' },
  extends: ['..'],
  css: [fileURLToPath(new URL('./app/assets/css/transitions.css', import.meta.url))],
  app: { pageTransition: { name: 'course-page', mode: 'out-in' } },
  hooks: {
    'nitro:config': async (config) => {
      const dir = resolve(config.buildDir!, 'course-preview');
      config.serverAssets ??= [];
      config.serverAssets.push({ baseName: 'course-preview', dir });
      config.prerender ??= {};
      config.prerender.routes ??= [];
      config.prerender.routes.push("/api/course-preview/snapshot.json", "/api/course-preview/catalog.json", "/courses");
    },
    "nitro:build:before": async (nitro) => {
      // Nitro resolves the build-directory alias before server assets are read.
      const asset = nitro.options.serverAssets.find(item => item.baseName === "course-preview")!;
      await writeSnapshots(previewContent, { dir: asset.dir });
      const entries = await previewContent.list();
      nitro.options.prerender.routes.push(...entries.map(file => file.path));
      const slugs = new Set(entries.map(file => file.path.split("/")[2]));
      nitro.options.prerender.routes.push(...[...slugs].map(slug => `/api/course-preview/courses/${slug}/data.json`));
    }
  }
});
