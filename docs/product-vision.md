# Product Vision

This repository explores a generic authoring format for progressive technical tutorials.

The core experience is a Nuxt UI-style reader where Markdown prose stays synchronized with technical state: file trees, file contents, commands, manual actions, assets, and validation hints. A reader can move through an article-like course and see the relevant files for the current point in the tutorial.

The shipped reader and course files are deliberately deterministic. They do not integrate AI at runtime and do not require OpenAI API keys. AI tools such as Codex can assist authors while converting or cleaning source material, but the published content and reader must run without AI services.

## Current Direction

- Document the `.md`/MDC course authoring format.
- Provide an agent skill for converting existing repositories or course material into the format.
- Keep the reader as a Nuxt Content/Nuxt UI playground until the visualization is stable.
- Move reusable reader components into `happydesigns/ui` when the component contract is clear.
- Keep any package or CLI small and deterministic, focused on optional authoring guardrails rather than runtime rendering.

## Ownership Boundaries

`playground` is a local Nuxt app for validating reader behavior and example content. It is not the happydesigns docs product. Reader components can incubate there until their contract is stable enough to promote into `happydesigns/ui`.

`skills/happydesigns-course-author` is the AI-assisted authoring workflow. It can inspect source material and draft course Markdown, but it must preserve ambiguity with `needsReview` instead of inventing content.

`packages/course` is optional authoring infrastructure. If it remains, it owns deterministic schemas, validation, Markdown projection, and CLI checks. It must stay brand-neutral and must not depend on Nuxt rendering, Nuxt UI components, or happydesigns brand defaults.

The eventual shared reader belongs in `happydesigns/ui` as a brand-neutral interface pattern. Brand expression should arrive through a brand or identity layer that provides tokens, app config, logos, metadata, and component defaults without changing course authoring semantics.

## Out of Scope for the MVP

- Runtime AI features.
- SAP-only schema fields in the core package.
- Multi-user authoring workflows.
- Hosted backend services.
- A broad course runtime package before the docs, skill, and UI contract prove the need.
