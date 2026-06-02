import { defineCollection, defineContentConfig, z } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    courses: defineCollection({
      type: "page",
      source: "courses/**/*.md",
      schema: z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        version: z.string().min(1),
        category: z.string().optional(),
        navigation: z.boolean().optional(),
        metadata: z.record(z.string(), z.unknown()).optional()
      })
    })
  }
});
