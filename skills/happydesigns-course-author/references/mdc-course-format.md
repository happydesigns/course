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
- `inputs`: List of learner-provided text inputs whose values replace configured tokens in rendered prose, code blocks, and code-tree file paths.
- `navigation`: Whether the course appears in navigation.

Example:

```md
---
title: Build the Starter App
description: Create the starter app, add the first route, and verify it in the browser.
version: 0.1.0
date: 2026-06-03
category: Web App
authors:
  - name: Course Team
inputs:
  - id: projectName
    label: Project name
    defaultValue: my-app
    replace: __PROJECT_NAME__
navigation: true
---
```

Do not add hidden authoring metadata unless the app consumes and displays it.

## Learner Inputs

Use frontmatter `inputs` when a course has a repeated placeholder that the learner should set once, such as a generated package suffix, project name, or resource prefix. Keep inputs generic and course-authored; do not hard-code them into the reader.

Each input supports:

- `id`: Stable identifier, starting with a letter and containing letters, numbers, `_`, `.`, or `-`.
- `label`: Visible field label.
- `replace`: String token or list of string tokens to replace.
- `defaultValue`: Optional value used before the learner enters one.
- `placeholder`, `description`, `minLength`, `maxLength`, `pattern`: Optional input hints and HTML constraints.

Example:

```yaml
inputs:
  - id: groupId
    label: Group ID
    description: "Replaces ### in generated object names."
    placeholder: ABC
    replace: "###"
    maxLength: 3
```

Input values persist across reloads per course and input id.

## Compression Boundary

Compress source material that is only course logistics:

- Repeated navigation and "next exercise" summaries.
- Screenshot references when the action can be stated directly.
- Repository chrome, badges, licensing footers, and support links.
- Event-specific notes that do not change the learner action.
- Repeated reminders that have already been established.

Do not compress source material that carries course learning:

- Concepts the learner is meant to understand.
- Prompts that drive generated output.
- Code changes and target file states.
- Required setup that changes the learner's work.
- Warnings, review notes, or variability that affect learner action.
- Verification steps and expected outcomes.
- The reason for each meaningful change.

## Synchronized Code

Use `::code-tree-intersection` when the article should update the right file tree/code pane as the reader scrolls.

````md
::code-tree-intersection

```vue [src/App.vue]
<template>
  <main>Starter app</main>
</template>
```

```ts [src/main.ts]
export const appName = "Starter app";
```

::
````

Rules:

- Every fenced block inside `::code-tree-intersection` needs `[path]` metadata.
- Paths must be normalized relative paths with forward slashes.
- Do not use absolute paths, drive letters, backslashes, empty segments, `.`, or `..`.
- For generated packages with many artifact types, keep the generated package as the root and use at most one shallow semantic folder level, such as `cds`, `metadata`, `behavior`, `access`, `tables`, `services`, or `classes`.
- Keep commands outside `::code-tree-intersection` unless intentionally represented as a file.

## Review Notes

Never invent missing content. Mark uncertainty only when it changes what the learner should do, and place the note close to the affected content:

```md
::note
needsReview: Confirm the target environment before running the deployment step.
::
```

Do not put review notes in frontmatter metadata.

## Agent Invocation

Example prompt:

```text
Use $happydesigns-course-author to convert this repository into `playground/content/courses/<semantic-slug>.md`.
Preserve the source sequence, do not invent missing steps, and use rendered needsReview notes only when uncertainty affects learner action.
```
