import { fileURLToPath } from 'node:url';
export default defineNuxtConfig({
  $meta: { name: '@happydesigns/course-preview' },
  extends: ['..'],
  components: [{ path: fileURLToPath(new URL('./components', import.meta.url)), pathPrefix: false, global: true }]
});
