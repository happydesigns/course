# Happydesigns Course

Happydesigns Course is a deterministic toolkit for progressive technical courses. Authors write ordinary Markdown with Comark component syntax; learners read the explanation while an optional project view accumulates the files introduced by each step.

The reader provides course navigation, lesson outlines, checkpoints, client-side progress, parameters, and a synchronized code workspace. It deliberately does not own application routes, a Content collection, product workflows, or a backend.

Runtime AI is out of scope. AI tools may assist authors during conversion, but published courses run without model APIs or API keys.

## Packages

| Package | Responsibility |
| --- | --- |
| `@happydesigns/course` | Framework-independent Zod schemas, Markdown validation, interchange types, and CLI. |
| `@happydesigns/course-nuxt` | Nuxt 4 layer with the Comark reader, Course-specific UI, collection schema, and variants. |

`@happydesigns/ui` owns shared visual foundations. `@happydesigns/nuxt-variants` owns generic capability resolution. Course-specific navigation, progress, checkpoints, and code-workspace behavior stay in this repository.

## Requirements

- Node.js 22.19+, 24.11+, or 26+ (Node.js 24 LTS recommended)
- pnpm 11
- Nuxt 4.5+
- Nuxt UI 4.11.1+
- Comark 0.6.2 and Comark Content 0.4

## Nuxt quick start

Install the reader and extend its layer:

```bash
pnpm add @happydesigns/course-nuxt comark-content@0.4.0 comark@0.6.2 shiki@4.3.1
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ["@happydesigns/course-nuxt"]
});
```

The application owns its content source and routes. Define a Comark Content instance with the filesystem source, TOC and Shiki plugins; expose its standard `handler(toWebRequest(event))` in a Nitro API route. The [playground content configuration](playground/content.ts) and [Nuxt snapshot hook](playground/nuxt.config.ts) are the complete reference setup. The hook writes fresh snapshots into Nitro's build directory and bundles them as server assets.

In an application route, `useCourseContent().all()` uses Comark Content's parser-free snapshot runtime and validates frontmatter before returning native `CoursePage` documents. Select the current page, overview and ordered lessons from that result, then pass them to `CourseReader`. The composable accepts a different API base path for applications with another source.

The [playground route](playground/app/pages/courses/%5B...slug%5D.vue) is the complete reference adapter.

## Authoring

Courses are directories of Markdown pages:

```text
content/courses/my-course/
  0.index.md
  1.getting-started.md
  2.build-the-feature.md
  3.verify-the-result.md
```

The overview uses `pageType: course`; lessons use `pageType: lesson`, share the same `courseId`, and declare a stable `order`. Course-wide inputs use explicit `{{ $doc.input.<id> }}` bindings. Code steps use the `code-tree-intersection` MDC component, and meaningful outcomes use `course-checkpoint` components with stable IDs. Their order and the lesson progress are derived from the content tree, so checkpoint IDs do not need to be repeated in frontmatter.

The project view derives typed code steps directly from the content tree. Earlier lessons form its baseline; scrolling selects the current lesson's file versions through the active step. Changing a course input updates filenames, displayed code and clipboard text from the original placeholders. Historical lessons do not mount hidden renderers, and Vue components are created only for presentation in the code panel.

Published overviews use a Semantic Versioning `version` and a `date` in `YYYY-MM-DD` format. The date identifies when that content version was published and is rendered as “Updated”. Learner progress is keyed by the stable `courseId`; changing metadata alone does not reset it.

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

Provide the adapter in an ancestor of `CourseReader`. Each provider owns both persistence and the live progress state of its descendant readers. Separate providers stay isolated even when they render the same course; readers without a custom provider share learner progress across routes in the Nuxt application. Product-specific synchronization, accounts, permissions, and conflicts remain application concerns.

## Public surface

| Export | Use |
| --- | --- |
| package root | Nuxt layer used through `extends` |
| `/schemas` | Source-independent course metadata and variant schemas |
| `/types` | Course page, input, progress, link, and storage contracts |
| `/storage` | Default storage implementation and persistence injection helpers |

Reader components and composables under the Nuxt layer are auto-imported by Nuxt. `CourseReader` is the primary supported rendering entry point; smaller components remain composition details unless documented here.

`CourseReader` also exposes a `body` slot with `{ page, data, components }`. A custom renderer must render the supplied `page.nodes` (already annotated with code-step indices and resolved inputs), pass `data` to its binding context, and register `components` for Course checkpoints and code intersections. Omitting the slot uses Comark’s `MarkdownDocument` and the prose components registered by `@comark/nuxt`.

All regular course routes, the Academy preview, and the core Markdown validator now use Comark. See [Comark integration](docs/comark.md) for deployment details and the remaining inherited UI dependency.

## Development

```bash
pnpm install
pnpm dev
pnpm verify
```

`pnpm dev` starts the playground with a single-dev-server lock. `pnpm verify` runs unit tests, typechecking, all workspace builds, and deterministic example validation.

See [CONTRIBUTING.md](CONTRIBUTING.md) for repository boundaries, change expectations, and the validation matrix.

## Shared Academy example

`@happydesigns/course-nuxt/preview` is an optional Nuxt layer for a complete, neutral
Academy scenario. It owns `CourseAcademyPreview`, its two Markdown source documents,
the `coursePreview` collection and an optional `idStudio.templates.course` catalog
entry. The Course playground renders that exact component at `/academy`; a brand
studio can opt into the same layer. Course has no dependency on id.

The Studio catalog uses the capability name **Course** and stable key `course`.
Academy names the example website, not a separate capability. Other capabilities
follow the same convention: their optional `/preview` layer owns the catalog
entry, page IDs, fixtures and renderer; the consuming Studio opts into the layer.

```ts
export default defineNuxtConfig({
  extends: ['@happydesigns/course-nuxt/preview']
})
```

Render `<CourseAcademyPreview />` in your own page. This layer does not add routes.
It offers Home, Course overview and Lesson views and uses the actual CourseReader,
checkpoint components and Markdown rendering. The component optionally receives a
brand `document`, `mode` and a controlled `page`, and emits `navigate(pageId)`.
All theme styling uses semantic Nuxt UI tokens. Progress stays in a per-instance
memory store and never modifies normal learner storage or another preview frame.

Maintain the example content and UI here once. Do not copy it into brand, id or a
second playground. The global scene is loaded asynchronously; installing the normal
Course layer does not activate the preview component or its content source.
The scenario intentionally has one short lesson with real code and checkpoints;
there is no parallel minimal rendering to keep in sync. This is a preview, not a
production course or an automatic capability installer.
