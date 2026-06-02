# Product Vision

`@happydesigns/course` is a generic toolkit for progressive technical tutorials.

The toolkit represents courses where prose stays synchronized with technical state: file trees, file contents, diffs, commands, manual actions, assets, and validation hints. A reader can move through lessons step by step and see the relevant files for the current point in the tutorial.

The package is deliberately deterministic. It does not integrate AI at runtime and does not require OpenAI API keys. AI tools such as Codex can assist authors while converting or cleaning source material, but the published package, CLI, validator, and Nuxt reader must run without AI services.

## MVP Scope

- A generic Zod-backed course schema.
- Structured validation with useful error output.
- A small CLI for validating course JSON and Markdown files.
- A Nuxt Content reader that renders one Markdown/MDC example course.
- Documentation for the course format and conversion workflow.

## Out of Scope for the MVP

- Runtime AI features.
- SAP-only schema fields in the core package.
- Multi-user authoring workflows.
- Hosted backend services.
