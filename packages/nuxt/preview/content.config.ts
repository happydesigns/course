import { fileURLToPath } from 'node:url';
import { defineCollection, defineContentConfig } from '@nuxt/content';
import { courseCollectionSchema } from '../schemas';
export default defineContentConfig({
  collections: {
    coursePreview: defineCollection({
      type: 'page',
      source: { cwd: fileURLToPath(new URL('./content/courses', import.meta.url)), include: '**/*.md', prefix: '/courses' },
      schema: courseCollectionSchema
    })
  }
});
