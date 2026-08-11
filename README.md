# Happydesigns Course

Happydesigns Course is a deterministic toolkit for progressive technical courses. Authors write ordinary Markdown and MDC with Nuxt Content; learners read the explanation while an optional project view accumulates the files introduced by each step.

The reader provides course navigation, lesson outlines, checkpoints, client-side progress, parameters, and a synchronized code workspace. It deliberately does not own application routes, a Content collection, product workflows, or a backend.

Runtime AI is out of scope. AI tools may assist authors during conversion, but published courses run without model APIs or API keys.

## Packages

| Package | Responsibility |
| --- | --- |
| `@happydesigns/course` | Framework-independent Zod schemas, Markdown validation, interchange types, and CLI. |
| `@happydesigns/course-nuxt` | Nuxt 4 layer with the Nuxt Content reader, Course-specific UI, collection schema, and variants. |

`@happydesigns/ui` owns shared visual foundations. `@happydesigns/nuxt-variants` owns generic capability resolution. Course-specific navigation, progress, checkpoints, and code-workspace behavior stay in this repository.

## Requirements

- Node.js 22 or newer
- pnpm 11
- Nuxt 4.5+
- Nuxt UI 4.10+
- Nuxt Content 3.15+

## Nuxt quick start

Install the reader and extend its layer:

```bash
pnpm add @happydesigns/course-nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ["@happydesigns/course-nuxt"]
});
```

The application owns its Content collection. Use the package schema so frontmatter is validated and typed by Nuxt Content:

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

A route adapter queries the current page, its overview, and the ordered lessons. The package intentionally leaves the collection name and URL structure to the application:

```vue
<script setup lang="ts">
const route = useRoute();

const { data } = await useAsyncData(
  () => `course:${route.path}`,
  async () => {
    const page = await queryCollection("courses").path(route.path).first();
    if (!page) return;

    const overviewPath = page.pageType === "lesson"
      ? page.path.split("/").slice(0, 3).join("/")
      : page.path;
    const course = page.pageType === "lesson"
      ? await queryCollection("courses").path(overviewPath).first()
      : page;
    if (!course) return;

    const lessons = course.courseId
      ? await queryCollection("courses")
          .where("courseId", "=", course.courseId)
          .where("pageType", "=", "lesson")
          .order("order", "ASC")
          .all()
      : [];

    return { course, page, lessons };
  },
  { watch: [() => route.path] }
);
</script>

<template>
  <CourseReader
    v-if="data"
    :course="data.course"
    :page="data.page"
    :lessons="data.lessons"
    :course-key="data.course.courseId ?? data.course.path"
  />
</template>
```

The [playground route](playground/app/pages/courses/%5B...slug%5D.vue) is the complete reference adapter.

## Authoring

Courses are directories of Nuxt Content pages:

```text
content/courses/my-course/
  0.index.md
  1.getting-started.md
  2.build-the-feature.md
  3.verify-the-result.md
```

The overview uses `pageType: course`; lessons use `pageType: lesson`, share the same `courseId`, and declare a stable `order`. Course-wide inputs use explicit `{{ $doc.input.<id> }}` bindings. Code steps use the `code-tree-intersection` MDC component, and meaningful outcomes use declared `course-checkpoint` IDs.

See [MDC course format](docs/course-format.md) for the complete contract and [conversion guidelines](docs/conversion-guidelines.md) for source-preserving imports.

Validate authored content with the core CLI:

```bash
pnpm --filter @happydesigns/course course validate path/to/course
```

## Configuration

Course capabilities are configured through `@happydesigns/nuxt-variants`. The layer provides defaults, while applications may override presentation behavior in `app.config.ts`:

```ts
export default defineAppConfig({
  variants: {
    courseMetadata: {
      config: {
        courseMetadata: { dateLocale: "de-DE", draftLabel: "Entwurf" }
      }
    },
    courseInputs: {
      config: {
        courseInputs: { enabled: true }
      }
    },
    courseCodeStage: {
      config: {
        courseCodeStage: { label: "Projektdateien", defaultTreeWidth: 320 }
      }
    }
  }
});
```

Content remains in Markdown. Variants configure structural capabilities and defaults, not individual course data.

## Persistence

The default adapter stores progress, parameter values, and reader preferences in browser `localStorage`. Reads and writes fail safely during SSR or when browser storage is unavailable.

Applications can replace persistence without changing course content:

```ts
import type { CourseStorage } from "@happydesigns/course-nuxt/types";
import { provideCourseStorage } from "@happydesigns/course-nuxt/storage";

const storage: CourseStorage = {
  getItem: (key) => myStore.read(key),
  setItem: (key, value) => myStore.write(key, value)
};

provideCourseStorage(storage);
```

Provide the adapter in an ancestor of `CourseReader`. Product-specific synchronization, accounts, permissions, and conflicts remain application concerns.

## Public surface

| Export | Use |
| --- | --- |
| package root | Nuxt layer used through `extends` |
| `/schemas` | `courseCollectionSchema` for an application-owned Content collection |
| `/types` | Course page, input, progress, link, and storage contracts |
| `/storage` | Default storage implementation and persistence injection helpers |

Reader components and composables under the Nuxt layer are auto-imported by Nuxt. `CourseReader` is the primary supported rendering entry point; smaller components remain composition details unless documented here.

## Development

```bash
pnpm install
pnpm dev
pnpm verify
```

`pnpm dev` starts the playground with a single-dev-server lock. `pnpm verify` runs unit tests, typechecking, all workspace builds, and deterministic example validation.

See [CONTRIBUTING.md](CONTRIBUTING.md) for repository boundaries, change expectations, and the validation matrix.
