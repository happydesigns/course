# MDC Course Format

Use `.md` files with MDC syntax. Markdown prose is the primary content; MDC blocks provide synchronized file snapshots for the reader.

## Frontmatter

Required:

- `title`: Course title.
- `description`: Short outcome-focused summary.
- `version`: Course content version.

Recommended:

- `date`: ISO date or date-time.
- `category`: Broad grouping such as `Authoring Guide`.
- `authors`: List of author objects with `name`, optional `to`, optional `avatar.src`.
- `navigation`: Whether the course appears in navigation.
- `metadata`: Generic authoring metadata. Use this for `needsReview` entries when needed.

Example:

```md
---
title: Author a Course with an Agent Skill
description: Convert existing source material into a reviewable MDC course.
version: 0.1.0
date: 2026-06-03
category: Authoring Guide
authors:
  - name: happydesigns
    to: https://github.com/happydesigns
navigation: true
metadata:
  runtimeAi: false
---
```

## Synchronized Code

Use `::code-tree-intersection` when the article should update the right file tree/code pane as the reader scrolls.

````md
::code-tree-intersection

```vue [src/App.vue]
<template>
  <main>Course reader</main>
</template>
```

```ts [src/main.ts]
export const appName = "Course reader";
```

::
````

Rules:

- Every fenced block inside `::code-tree-intersection` needs `[path]` metadata.
- Paths must be normalized relative paths with forward slashes.
- Do not use absolute paths, drive letters, backslashes, empty segments, `.`, or `..`.
- Keep commands outside `::code-tree-intersection` unless intentionally represented as a file.

## Review Markers

Never invent missing content. Mark uncertainty close to the affected content:

```md
::note
needsReview: The source material names the deployment step but does not provide the target environment.
::
```

Or in frontmatter metadata:

```yaml
metadata:
  needsReview:
    - The source repo has two setup commands and does not explain which one is canonical.
```

## Agent Invocation

Example prompt:

```text
Use $happydesigns-course-author to convert this repository into `playground/content/courses/my-course.md`.
Preserve the source sequence, do not invent missing steps, and mark uncertainty with needsReview.
```
