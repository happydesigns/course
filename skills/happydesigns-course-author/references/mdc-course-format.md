# MDC Course Format

Use `.md` files with MDC syntax. Markdown prose is the primary content; MDC blocks provide synchronized file snapshots for the reader.

## Frontmatter

Required:

- `title`: Course title.
- `description`: Short outcome-focused summary.

Optional:

- `version`: Course content version, when provided by the source.

Recommended:

- `date`: ISO calendar date (`YYYY-MM-DD`).
- `category`: Broad grouping such as `Authoring Guide`.
- `authors`: List of author objects with `name`, optional `to`, optional `avatar.src`.
- `inputs`: List of learner-provided text inputs whose values resolve explicit named bindings in rendered prose, code blocks, and code-tree file paths.
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
navigation: true
---
```

Do not add hidden authoring metadata unless the app consumes and displays it.

## Multi-page courses and progress

Use a directory with an overview (`0.index.md`) and ordered lesson files. The shared preview reads these from `packages/nuxt/preview/content/courses/<slug>/`.

Overview frontmatter:

```yaml
title: Build the Starter App
description: Create and verify a working app.
courseId: starter-app
pageType: course
```

Lesson frontmatter:

```yaml
title: Create the First Route
description: Add a route and verify its output.
courseId: starter-app
pageType: lesson
order: 1
estimatedMinutes: 10
```

Keep `courseId` stable across the overview and all lessons. Mark an optional lesson with `optional: true`. A single Markdown course may omit these structure fields.

Use a checkpoint where the learner can verify an outcome:

```md
::course-checkpoint{id="first-route-working" title="First route works"}
The browser shows the expected heading at the new route.
::
```

The reader derives checkpoint order from the content tree; do not duplicate these IDs in frontmatter. Preserve existing IDs when revising prose. Continue Course links target anchors such as `#checkpoint-first-route-working` and depend on these stable IDs.

Course-wide parameters belong on the overview. Lessons inherit them; use explicit bindings such as `{{ $doc.input.projectName }}` for configured input IDs.

## Comark and highlighting

Comark parses these `.md` files with component syntax; the file format does not require Nuxt Content. The shared parser is `packages/nuxt/preview/content.ts`, using the official TOC and Shiki plugins. Use supported Shiki language IDs. Add a required language there when needed; do not create a Nuxt Content highlight configuration or edit generated snapshots.

Server snapshots, compact catalog JSON, and per-course JSON are generated from these sources. Validate the source with `pnpm --filter @happydesigns/course course validate <path>` (the path is relative to `packages/course` when using this command). Run `pnpm verify` for repository examples; browser navigation is covered separately by `pnpm test:e2e` after a static build under `/course/`.

## Learner Inputs

Use frontmatter `inputs` when a course has a repeated placeholder that the learner should set once, such as a generated package suffix, project name, or resource prefix. Keep inputs generic and course-authored; do not hard-code them into the reader.

Each input supports:

- `id`: Stable identifier, starting with a letter and containing letters, numbers, `_`, `.`, or `-`.
- `label`: Visible field label.
- `defaultValue`: Optional value used before the learner enters one.
- `placeholder`, `description`, `minLength`, `maxLength`, `pattern`: Optional input hints and HTML constraints.

Example:

```yaml
inputs:
  - id: groupId
    label: Group ID
    description: "Replaces ### in generated object names."
    placeholder: ABC
    defaultValue: "###"
    maxLength: 3
```

### Text, selection and suggestions

Definitions remain serializable YAML/JSON. `CourseInputSchema` validates them with Zod;
`createCourseInputValueSchema(input)` exposes the corresponding Zod string/enum validator.
Existing text inputs continue to work unchanged.

```yaml
inputs:
  - id: projectName
    label: Project name
    defaultValue: my-app
  - id: ide
    label: Development environment
    sharedId: workshop-2026.ide
    defaultValue: vscode
    options:
      - value: vscode
        label: VS Code
      - value: eclipse
        label: Eclipse
  - id: shell
    label: Terminal
    options: [Bash, PowerShell]
    allowCustom: true
```

Without `options`, the reader uses Nuxt UI `Input`. With `options`, it uses `Select` and
accepts only listed values. `allowCustom: true` uses `InputMenu mode="autocomplete"`:
the learner can select a suggestion or type any string. Suggestions can have labels; selecting one inserts its stored value. `minLength`, `maxLength`, and `pattern` validate text and suggestions;
invalid drafts display an error and do not substitute into course content. Text defaults
may remain authoring placeholders such as `###`. Fixed-selection defaults must be listed.

`id` is the local binding name (`{{ $doc.input.ide }}`). By default, values persist per
course and input ID. Optional `sharedId` gives a value a stable identity across courses
on the same site and storage provider, even when their local IDs differ. Use the same
definition and shared ID in each participating overview. Different events should use
different IDs. Sharing does not cross browser profiles or websites. Changing a shared
ID starts a new value; existing per-course storage keys are unchanged.

Shared values update mounted readers immediately. Values restore after hydration and
are checked against each receiving course's definition. An obsolete selection falls
back to the course's default. A custom `CourseStorage` provider isolates both live and
persisted values. Storage failures do not block reading; values remain in memory.

### Alternative instructions

```md
::course-variant{parameter="ide" value="vscode" label="In VS Code"}
Open the command palette and select the command described in this step.
::

::course-variant{parameter="ide" value="eclipse" label="In Eclipse"}
Select the corresponding action from the project context menu.
::
```

`course-variant` renders only when the resolved parameter equals `value`. No application
component or executable condition is needed. Labels are optional. Bindings and variant
conditions both count as parameter usage during validation; unknown IDs and invalid
fixed values are rejected.

Variants adapt instructions, not the curriculum: keep headings, checkpoints and
`code-tree-intersection` outside them. The validator enforces this so the outline,
resume links, progress and cumulative code workspace stay consistent when switching.
Ordinary prose, lists, images and standalone code fences can be conditional.



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
Use $happydesigns-course-author to convert this repository into `packages/nuxt/preview/content/courses/<semantic-slug>.md`.
Preserve the source sequence, do not invent missing steps, and use rendered needsReview notes only when uncertainty affects learner action.
```

## Next courses

Define optional successors on the course overview using stable course IDs:

```yaml
courseId: getting-started
nextCourses:
  - first-project
  - another-project
```

Order is explicit; it is not inferred from catalog ordering. Each ID must resolve to
one course (not a lesson). Duplicate IDs, self references, and unknown targets are errors.
The Markdown validator checks the local definition; catalog references are checked
when the host calls `resolveNextCourses(course, catalog)` from `@happydesigns/course`.
Pass the result to `<CourseReader :next-courses="nextCourses" />`. Catalog entries need
`courseId`, `path`, `title`, and `description`; include `pageType` if lessons are present.
The preview integrates this automatically. Hosts should resolve every overview during
content validation or build to catch missing targets before deployment.

Cards appear below the overview, at the last required lesson, and at the final lesson.
They never require completed checkpoints and do not replace lesson navigation. No
successors means no section. Titles and descriptions come from the target courses.
Customize `courseNavigation.nextCoursesTitle` and `nextCourseLinkLabel` through the
existing variant configuration to localize the section and its link label.
