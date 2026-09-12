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
  hooks: {
    'nitro:config': async (config) => {
      const dir = resolve(config.buildDir!, 'course-preview');
      config.serverAssets ??= [];
      config.serverAssets.push({ baseName: 'course-preview', dir });
      config.prerender ??= {};
      config.prerender.routes ??= [];
      config.prerender.routes.push("/api/course-preview/snapshot.json");
    },
    "nitro:build:before": async (nitro) => {
      // Nitro resolves the build-directory alias before server assets are read.
      const asset = nitro.options.serverAssets.find(item => item.baseName === "course-preview")!;
      await writeSnapshots(previewContent, { dir: asset.dir });
    }
  },
  components: [{ path: fileURLToPath(new URL('./components', import.meta.url)), pathPrefix: false, global: true }]
});
