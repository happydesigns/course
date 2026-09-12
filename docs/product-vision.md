# Product Vision

This repository explores a generic authoring format for progressive technical tutorials.

The core experience is a Nuxt UI-style reader where Markdown prose stays synchronized with technical state: file trees, file contents, commands, manual actions, assets, and validation hints. A reader can move through an article-like course and see the relevant files for the current point in the tutorial.

The shipped reader and course files are deliberately deterministic. They do not integrate AI at runtime and do not require OpenAI API keys. AI tools such as Codex can assist authors while converting or cleaning source material, but the published content and reader must run without AI services.

## Current Direction

- Document the `.md`/MDC course authoring format.
- Provide an agent skill for converting existing repositories or course material into the format.
- Keep deterministic schema, parsing, validation, and CLI behavior in `@happydesigns/course`.
- Provide the shared reader as `@happydesigns/course-nuxt`, using Comark, Nuxt UI, and `@happydesigns/nuxt-variants`.
- Keep routes, collection names, persistence, and product workflows in consuming applications.
- Promote only genuinely general-purpose primitives into `happydesigns/ui`; the composed Course reader remains owned by this repository.

## Ownership Boundaries

`playground` is a local Nuxt app for validating reader behavior and example content. It is not the happydesigns docs product and owns only its routes, shell, and Content collection.

`skills/happydesigns-course-author` is the AI-assisted authoring workflow. It can inspect source material and draft course Markdown, but it must preserve ambiguity with `needsReview` instead of inventing content.

`packages/course` is optional authoring infrastructure. If it remains, it owns deterministic schemas, validation, Markdown projection, and CLI checks. It must stay brand-neutral and must not depend on Nuxt rendering, Nuxt UI components, or happydesigns brand defaults.

`packages/nuxt` owns the Course-specific reader experience. It receives a native Comark document, renders with Nuxt UI, and uses Nuxt Variants for structural capabilities and configurable defaults. It does not own a route or Content collection.

`happydesigns/ui` and `happydesigns/course` are siblings built on the same Nuxt UI foundation. A website may compose both, but neither package imports product workflows from the other. Brand expression arrives through the consuming app or UI layer without changing course semantics.

UKI remains the owner of document structure, revisions, permissions, storage, and conflicts. A future UKI adapter should map its safe reader blocks to the Course reader contract instead of introducing Comark as UKI persistence.

## Out of Scope for the MVP

- Runtime AI features.
- SAP-only schema fields in the core package.
- Multi-user authoring workflows.
- Hosted backend services.
- Executing course commands or writing directly into a learner's project.
