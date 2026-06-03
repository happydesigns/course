# Product Vision

`@happydesigns/course` is a generic toolkit for progressive technical tutorials.

The toolkit represents courses where prose stays synchronized with technical state: file trees, file contents, diffs, commands, manual actions, assets, and validation hints. A reader can move through lessons step by step and see the relevant files for the current point in the tutorial.

The package is deliberately deterministic. It does not integrate AI at runtime and does not require OpenAI API keys. AI tools such as Codex can assist authors while converting or cleaning source material, but the published package, CLI, validator, and Nuxt reader must run without AI services.

## MVP Scope

- A generic Zod-backed course schema.
- Structured validation with useful error output.
- A small CLI for validating course JSON and Markdown files.
- A Nuxt Content playground that renders Markdown/MDC example courses while the reader contract is still local.
- Documentation for the course format and conversion workflow.

## Ownership Boundaries

`packages/course` is the reusable product. It owns deterministic schemas, validation, Markdown projection, and the CLI. It must stay brand-neutral and must not depend on Nuxt rendering, Nuxt UI components, or happydesigns brand defaults.

`playground` is a local Nuxt app for validating reader behavior and example content. It is not the happydesigns docs product. Reader components can incubate there until their contract is stable enough to promote into `happydesigns/ui`.

The eventual shared reader belongs in `happydesigns/ui` as a brand-neutral interface pattern. Brand expression should arrive through a brand or identity layer that provides tokens, app config, logos, metadata, and component defaults without changing course validation or reader behavior.

## Out of Scope for the MVP

- Runtime AI features.
- SAP-only schema fields in the core package.
- Multi-user authoring workflows.
- Hosted backend services.
