# Repository Instructions

This repository contains `@happydesigns/course`, a generic toolkit for progressive technical courses. It is not SAP-specific. SAP material is only an example profile that can live under `docs/profiles` or `examples`.

## Non-Negotiable Product Constraints

- Runtime AI is forbidden.
- Do not require OpenAI API keys or other AI service keys in shipped packages, validators, CLIs, or reader apps.
- AI tools such as Codex may be used externally for authoring, cleanup, and conversion assistance only.
- Use `pnpm` only. Do not use `npm` or `yarn`.

## Implementation Preferences

- Prefer small TypeScript modules with clear ownership.
- Use Zod for runtime schemas and infer TypeScript types from those schemas.
- Keep Nuxt rendering separate from the core schema and validation package.
- Keep the core schema generic. Do not add SAP-only fields to `packages/course`.
- Avoid broad framework/tooling additions unless they directly serve the MVP.

## Conversion Rules

- Never invent course content during conversions.
- If a source document is ambiguous, incomplete, or inconsistent, preserve what is known and mark the affected step or field with `needsReview`.
- SAP-specific conversion guidance belongs in `docs/profiles/sap.md`.
