# Contributing to Happydesigns Course

Thanks for improving Happydesigns Course. This repository combines a framework-independent authoring package, a reusable Nuxt reader layer, and a playground that exercises the integration contract.

## Prerequisites

- Node.js 22.19+, 24.11+, or 26+ (Node.js 24 LTS recommended)
- pnpm 11 (the version is pinned in `package.json`)
- A current checkout of sibling Happydesigns packages when working through local workspace overrides

Use pnpm only. Install dependencies from the repository root:

```bash
pnpm install
```

## Workspace ownership

| Path | Owns | Must not own |
| --- | --- | --- |
| `packages/course` | Generic schemas, Markdown parsing, deterministic validation, CLI, interchange types | Nuxt rendering, product workflows, SAP-specific fields |
| `packages/nuxt` | Course reader composition, Course-specific components and state, Nuxt Content schema, Course variants | Routes, collection names, product persistence, generic UI primitives |
| `packages/nuxt/preview` | Shared reference /courses routes, layout, course fixtures, demo collection and Studio route metadata | Normal Course runtime defaults or production course data |
| `playground` | Development host for the shared Course reference application | Copies of the shared catalog, reader routes or course fixtures |
| `docs` | Authoring contract, product boundaries, conversion guidance | Duplicated live Cora policy |
| `examples` | Small deterministic format examples | Production application logic |
| `skills` | Source-preserving AI-assisted authoring workflow | Runtime AI behavior |

Move a component to `happydesigns/ui` only when it is genuinely product-neutral. Keep Course navigation, progress, checkpoints, parameters, and project synchronization in this repository. Keep generic variant registry and resolution mechanics in `happydesigns/nuxt-variants`; Course capability names and defaults belong here.

## Development workflow

1. Start from a clean worktree and inspect the relevant package boundary.
2. Add or update tests before changing behavior where practical.
3. Keep Vue components focused. Put reusable state transitions and derived reader data in composables or pure utilities.
4. Use Nuxt conventions (`app/components`, `app/composables`, `app/utils`) so layer consumers receive normal auto-import behavior.
5. Prefer Nuxt UI components and semantic utilities such as `text-muted`, `bg-elevated`, and `border-default`. Check the generated `.nuxt/ui/<component>.ts` theme before overriding slots.
6. Keep routes and `content.config.ts` in the consuming application or playground.
7. Run the smallest relevant checks while iterating, then run the complete verification command before handing off.

Use conventional commits with a focused scope, for example:

```text
feat(nuxt): add replaceable course storage
refactor(reader): extract navigation model
docs: document the contribution workflow
```

## Validation

Run everything from the repository root:

```bash
pnpm verify
```

The command covers:

- all Vitest suites
- Nuxt runtime regression tests for progress sharing, preview isolation, and course changes
- TypeScript and Nuxt typechecking
- package and playground builds
- deterministic validation of the checked-in course examples

Pull requests run the same verification plus the GitHub Pages build. Nuxt runtime tests use a minimal fixture under `packages/nuxt/test/fixtures/runtime`, separate from the reader layer and playground build directories.

Keep TypeScript on the 6.x line while `vue-tsc` relies on the JavaScript compiler API. A TypeScript 7 upgrade needs a compatible Vue compiler integration, not only a newer CLI.

During development, narrower commands are available:

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm validate:examples
pnpm --filter @happydesigns/course-nuxt test
pnpm --filter @happydesigns/course-playground typecheck
```

Nuxt commands that write generated workspace state run through `scripts/with-nuxt-lock.mjs`. The lock prevents a development server, build, or typecheck from mutating the same Nuxt Content and `.nuxt` artifacts concurrently. Stop the dev server before running a build or typecheck, and do not leave background development servers running after validation.

## Change expectations

### Core schema or validation

- Define runtime contracts with Zod and infer TypeScript types from them.
- Add positive and negative tests.
- Preserve normalized, platform-independent file paths.
- Update the format documentation when author-facing behavior changes.

### Nuxt Content schema

- Reuse core Zod fragments instead of copying shared fields.
- Keep the application-owned collection source and name configurable.
- Verify frontmatter against both the Content schema and deterministic CLI where applicable.
- Remember that fenced code is parsed as literal content; Course only adapts explicit `{{ $doc.input.<id> }}` bindings where Nuxt Content does not resolve them itself.

### Reader behavior

- Keep `CourseReader` as the stable composition root.
- Separate derived data, persistence, progress rules, and code-workspace state from presentation.
- Keep parser-specific code extraction in `app/utils/course-code-document.ts`. The code-step model and snapshot utilities contain data, not Vue VNodes; `CourseCodePanel` adapts this model to Nuxt UI. New content engines should supply the same model, including syntax tokens and code metadata.
- Preserve SSR and hydration safety; browser APIs must be accessed through guarded adapters.
- Use Nuxt UI/Reka UI interaction primitives for popovers, slideovers, collapsibles, focus management, and keyboard behavior.
- Test route changes without assuming the reader component is remounted.
- Check narrow mobile, narrow split-pane desktop, standard desktop, large desktop, keyboard navigation, and reduced motion.

### Public API

- Keep the supported surface deliberately small.
- Document new package exports in the README.
- Treat the `CourseReader` props, collection schema, exported types, and storage adapter as compatibility contracts.
- Avoid exporting internal components solely to make an implementation detail convenient.

### Course content or conversion

- Never invent missing source material.
- Preserve source order and meaning.
- Mark ambiguity with `needsReview`.
- Keep runtime AI and API-key requirements out of shipped packages and content.
- Put SAP-specific guidance in the SAP profile rather than the generic schema.

## Documentation

- [README](README.md): installation, integration, configuration, and public surface
- [MDC course format](docs/course-format.md): authoring contract
- [Conversion guidelines](docs/conversion-guidelines.md): source-preserving imports
- [Product vision](docs/product-vision.md): product and ecosystem boundaries

Documentation should describe stable repository behavior. Do not copy Cora's internal policy, schedules, or autonomous workflow rules into this repository.
