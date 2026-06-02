import { defineCollection, defineContentConfig, z } from "@nuxt/content";

const authorSchema = z.object({
  name: z.string().min(1),
  to: z.string().optional(),
  avatar: z
    .object({
      src: z.string().optional()
    })
    .optional()
});

export default defineContentConfig({
  collections: {
    courses: defineCollection({
      type: "page",
      source: "courses/**/*.md",
      schema: z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        version: z.string().min(1),
        date: z.string().optional(),
        image: z.string().optional(),
        category: z.string().optional(),
        authors: z.array(authorSchema).optional(),
        navigation: z.boolean().optional(),
        seo: z
          .object({
            title: z.string().optional(),
            description: z.string().optional()
          })
          .optional(),
        metadata: z.record(z.string(), z.unknown()).optional()
      })
    })
  }
});
