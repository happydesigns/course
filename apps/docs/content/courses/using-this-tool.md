---
title: How to Use This Course Tool
description: Author a Markdown course, validate the source, and preview it in the Nuxt UI reader without any runtime AI dependency.
version: 0.1.0
date: 2026-06-01
category: Authoring Guide
authors:
  - name: happydesigns
    to: https://github.com/happydesigns
navigation: true
metadata:
  profile: generic
  runtimeAi: false
---

## Create a Markdown Course

Write courses as `.md` files under `apps/docs/content/courses`. The frontmatter describes the course, while the body uses normal Markdown and MDC components.

::code-tree-intersection

```mdc [apps/docs/content/courses/my-course.md]
---
title: My Course
description: A short description of the outcome.
version: 0.1.0
category: Authoring Guide
navigation: true
metadata:
  runtimeAi: false
---

## Start Here

Explain the first learner action in normal Markdown.
```

```ts [apps/docs/content.config.ts]
import { defineCollection, defineContentConfig, z } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    courses: defineCollection({
      type: "page",
      source: "courses/**/*.md",
      schema: z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        version: z.string().min(1)
      })
    })
  }
});
```

::

## Add Synchronized Code States

Place fenced code blocks inside `::code-tree-intersection` blocks when the right pane should update as the reader scrolls. Every fence needs `[path]` metadata so the validator and reader know which file it represents.

::code-tree-intersection

```vue [src/App.vue]
<template>
  <main>
    <h1>My Course</h1>
  </main>
</template>
```

```ts [src/main.ts]
import { createApp } from "vue";
import App from "./App.vue";

createApp(App).mount("#app");
```

::

## Validate the Source

Run the package CLI before publishing the course. Validation is deterministic: it checks frontmatter, MDC parsing, `code-tree-intersection` blocks, and normalized relative file paths.

::code-tree-intersection

```json [package.json]
{
  "scripts": {
    "validate:examples": "pnpm --filter @happydesigns/course course validate ../../apps/docs/content/courses/basic.md && pnpm --filter @happydesigns/course course validate ../../apps/docs/content/courses/using-this-tool.md",
    "dev": "pnpm --filter @happydesigns/docs dev"
  }
}
```

```bash [terminal]
pnpm validate:examples
pnpm dev
```

::

## Preview the Blog Reader

Start the docs app and open `/blog`. The index lists every Markdown course, and each article renders the prose on the left with the synchronized code pane on the right.

::code-tree-intersection

```vue [apps/docs/app/pages/blog/index.vue]
<script setup lang="ts">
const { data: courses } = await useAsyncData("blog-posts", () => queryCollection("courses").all());
</script>

<template>
  <UPageHero title="Course Blog" />
</template>
```

```vue [apps/docs/app/pages/blog/[...slug].vue]
<script setup lang="ts">
const route = useRoute();
const coursePath = computed(() => route.path.replace(/^\/blog\//, "/courses/"));
const { data: course } = await useAsyncData(`course-${route.path}`, () =>
  queryCollection("courses").path(coursePath.value).first()
);
</script>

<template>
  <ContentRenderer v-if="course" :value="course" />
</template>
```

::
