import { courseCollectionSchema } from "@happydesigns/course-nuxt/schemas";
import { defineCollection, defineContentConfig } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    courses: defineCollection({
      type: "page",
      source: "courses/**/*.md",
      schema: courseCollectionSchema
    })
  }
});
