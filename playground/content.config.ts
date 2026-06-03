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

const inputSchema = z.object({
  id: z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]*$/),
  label: z.string().min(1),
  replace: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
  pattern: z.string().optional()
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
        inputs: z.array(inputSchema).optional(),
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
