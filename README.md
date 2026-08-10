# Happydesigns Course

Happydesigns Course provides a deterministic Markdown format and a Nuxt reader for progressive technical courses. Learners read normal prose while a synchronized project view accumulates the files introduced by each course step.

The repository contains two public packages:

- `@happydesigns/course` validates course Markdown and structured interchange data without owning any UI.
- `@happydesigns/course-nuxt` provides the Nuxt Content reader, Course components, schemas, and `@happydesigns/nuxt-variants` capabilities.

Runtime AI is intentionally out of scope. AI tools may help authors convert material, but published courses run without model APIs or API keys.

## Development

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
pnpm dev
```

The playground reads `.md` files from `playground/content/courses` and demonstrates the complete reader integration.

## Nuxt integration

Extend the Nuxt layer and define the application-owned Content collection:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ["@happydesigns/course-nuxt"]
});
```

```ts
// content.config.ts
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
```

Routes and collection names remain owned by the consuming application. Query a course and pass it to `CourseReader`; the playground page is the reference adapter.

See `docs/course-format.md` for the authoring contract.
