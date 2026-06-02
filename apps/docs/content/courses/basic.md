---
title: Build a Tiny Progressive Tutorial
description: A small generic course that demonstrates synchronized Markdown prose, actions, file snapshots, and validation hints.
version: 0.1.0
category: Tutorial Infrastructure
navigation: true
metadata:
  profile: generic
  runtimeAi: false
---

## Inspect the Starter

Start by reading the starter files. The course reader keeps this prose aligned with the files that matter at this point in the tutorial.

::code-tree-intersection

```json [package.json]
{
  "scripts": {
    "dev": "nuxt dev",
    "test": "vitest run"
  },
  "dependencies": {
    "nuxt": "latest",
    "vue": "latest"
  }
}
```

```vue [src/App.vue]
<template>
  <main>
    <h1>Course starter</h1>
  </main>
</template>
```

```ts [src/main.ts]
export const appName = "Course starter";
```

::

## Personalize the Heading

Replace the placeholder heading with a clearer tutorial title. This section demonstrates the course's progressive code state: the article describes one change while the code pane shows the resulting file.

::code-tree-intersection

```vue [src/App.vue]
<template>
  <main>
    <h1>Progressive Tutorial</h1>
  </main>
</template>
```

::

## Run the Project

Use the normal package script to start the local project. The course records the command and the validation hint, but it does not call an AI service at runtime.

```bash
pnpm dev
```

::code-tree-intersection

```json [package.json]
{
  "scripts": {
    "dev": "nuxt dev",
    "test": "vitest run"
  },
  "dependencies": {
    "nuxt": "latest",
    "vue": "latest"
  }
}
```

```vue [src/App.vue]
<template>
  <main>
    <h1>Progressive Tutorial</h1>
  </main>
</template>
```

::

## Record the Manual Check

Open the rendered page and confirm the visible heading matches the code state from the previous section.

::code-tree-intersection

```vue [src/App.vue]
<template>
  <main>
    <h1>Progressive Tutorial</h1>
  </main>
</template>
```

::
