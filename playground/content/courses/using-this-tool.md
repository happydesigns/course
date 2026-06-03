---
title: Author Courses with an Agent Skill
description: Write a course as Markdown with MDC syntax, then use the repo-local agent skill to convert existing source material without adding runtime AI.
version: 0.1.0
date: 2026-06-03
category: Authoring Guide
authors:
  - name: happydesigns
    to: https://github.com/happydesigns
navigation: true
metadata:
  profile: generic
  runtimeAi: false
---

This course shows the authoring model we want to prove before turning anything into a bigger runtime package: deterministic `.md` course files, a reusable Nuxt UI-style reader, and an agent skill that helps convert existing material into reviewable Markdown.

## What we're building

By the end, you have a course source that:

- Uses normal Markdown for the learner-facing explanation
- Uses MDC for synchronized file snapshots
- Keeps every code pane file tied to explicit `[path]` metadata
- Uses an agent skill for conversion work only
- Marks uncertainty with `needsReview` instead of inventing missing content

::note
Runtime AI is not part of the course reader. The agent skill is an authoring aid that produces deterministic Markdown.
::

## Start with the Markdown file

Create a `.md` file under `playground/content/courses`. The frontmatter describes the article. The body reads like a Nuxt UI blog post: short outcome, sections, commands, and file snapshots where they help.

::code-tree-intersection

````mdc [playground/content/courses/my-course.md]
---
title: Build the Starter
description: Convert existing setup notes into a progressive course.
version: 0.1.0
date: 2026-06-03
category: Tutorial
authors:
  - name: happydesigns
    to: https://github.com/happydesigns
navigation: true
metadata:
  runtimeAi: false
---

## What we're building

This section states the learner outcome in plain Markdown.

## Create the app shell

Explain the action first. Show synchronized files only when the code pane should update.

::code-tree-intersection

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
````

```md [docs/course-format.md]
# MDC Course Format

A course is authored as a `.md` file with MDC syntax.
Markdown prose is the source of truth, and fenced code blocks inside
`::code-tree-intersection` blocks drive the synchronized file tree and code pane.
```

::

## Use MDC for synchronized code

Use `::code-tree-intersection` when the right pane should change as the reader scrolls. Each fenced block inside the section must include a normalized relative path in square brackets.

::code-tree-intersection

````mdc [docs/syntax/code-tree.md]
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

```text [docs/syntax/path-rules.txt]
Use forward-slash relative paths:

src/App.vue
src/main.ts
docs/course-format.md

Do not use:

C:\GitHub\project\src\App.vue
../src/App.vue
src\main.ts
```

::

Commands are usually normal fenced blocks, not code-tree files:

```bash
pnpm validate:examples
pnpm dev
```

## Add the agent skill

The skill owns the AI-assisted part of the workflow. It reads source material, drafts the `.md` course, and marks gaps for review. It does not belong in the runtime reader.

::code-tree-intersection

```md [skills/happydesigns-course-author/SKILL.md]
---
name: happydesigns-course-author
description: Convert existing repositories, Markdown docs, workshop notes, or legacy course material into happydesigns course Markdown using `.md` files with MDC syntax and synchronized code-tree sections.
---

# Happydesigns Course Author

Create deterministic `.md` course sources that can be rendered by the happydesigns/Nuxt UI course reader.
AI is only an authoring assistant; never add runtime AI dependencies, API key requirements, or generated claims that are not supported by the source material.

## Workflow

1. Read the repository instructions first, especially `AGENTS.md` if present.
2. Inventory the source material with `rg --files`.
3. Preserve source intent and sequence.
4. Write the course as a `.md` file with normal Markdown prose and MDC components.
5. Mark incomplete, ambiguous, or inconsistent source material with `needsReview`.
```

```md [skills/happydesigns-course-author/references/mdc-course-format.md]
# MDC Course Format

Use `.md` files with MDC syntax. Markdown prose is the primary content; MDC blocks provide synchronized file snapshots for the reader.

Required frontmatter:

- `title`
- `description`
- `version`

Every fenced block inside `::code-tree-intersection` needs `[path]` metadata.
```

::

## Ask the agent to convert source material

When the skill is installed, call it directly by name. When it is only available in this repository, point Codex at the repo-local skill path.

::code-tree-intersection

```md [prompts/convert-repository.md]
Use $happydesigns-course-author to convert this repository into
`playground/content/courses/my-course.md`.

Preserve the source sequence.
Do not invent missing steps.
Use `.md` with MDC syntax.
Use `::code-tree-intersection` for synchronized file snapshots.
Mark uncertainty with `needsReview`.
Run the available validation command before finishing.
```

```md [prompts/convert-with-repo-local-skill.md]
Use the skill at `skills/happydesigns-course-author` to convert the existing course notes
in `docs/source-notes` into `playground/content/courses/source-notes.md`.

Keep generated content reviewable and deterministic.
```

::

The agent should inspect real source files before writing the course. If the source is incomplete, the output should say so.

::note
needsReview belongs in the course source, not in hidden agent reasoning. A reviewer should be able to find every unresolved ambiguity in the rendered article or frontmatter.
::

## Review the generated course

Review the output like a pull request. The important checks are source faithfulness, path metadata, reader behavior, and the absence of runtime AI dependencies.

::code-tree-intersection

```md [review/checklist.md]
# Review Checklist

- Required frontmatter is present.
- The article reads in the same sequence as the source material.
- Every code-tree fence has `[path]` metadata.
- Paths are relative and normalized.
- Ambiguous source material is marked with `needsReview`.
- Commands are deterministic.
- No runtime AI keys or service calls were added.
```

```bash [commands/validate.sh]
pnpm validate:examples
pnpm --filter @happydesigns/course course validate ../../playground/content/courses/my-course.md
```

::

## Publish the docs and reader separately

The course source, agent skill, and reader can evolve independently. The useful boundary is:

- Course files are `.md` content.
- The skill helps produce `.md` content.
- The Nuxt UI reader visualizes `.md` content.
- A validator can remain optional authoring infrastructure.

That keeps the tool small while we prove the format and the visualization.
