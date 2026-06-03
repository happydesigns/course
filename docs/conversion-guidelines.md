# Agent Conversion Guidelines

Codex and other authoring tools may assist with conversion, but generated course files must remain deterministic and reviewable. Use `skills/happydesigns-course-author` as the repo-local skill for this workflow.

## Principles

- Keep the core course format generic.
- Preserve source intent and sequence.
- Do not invent missing course content.
- Mark uncertain converted material with `needsReview`.
- Prefer explicit file snapshots and code changes over vague prose.
- Keep commands deterministic and runnable by a learner.
- Keep validation hints concrete and local where possible.
- Do not add runtime AI dependencies, API key requirements, or model calls to the reader.

## Suggested Workflow

1. Ask Codex to use `$happydesigns-course-author` or the repo-local skill at `skills/happydesigns-course-author`.
2. Identify lessons and step boundaries from the source material.
3. Extract prose into normal Markdown headings and paragraphs without changing technical meaning.
4. Put synchronized file states in `::code-tree-intersection` blocks using fenced code metadata like ````ts [src/main.ts]````.
5. Keep commands as normal fenced code blocks unless they represent a synchronized file state.
6. Add validation hints in prose near the relevant section.
7. Mark uncertainty in prose or frontmatter metadata instead of inventing missing content.
8. Run `pnpm validate:examples` or `course validate <path-to-course.md>` when the validator is present.

## Runtime Boundary

No converted course should depend on runtime AI. If AI was used during conversion, that fact belongs in authoring notes, not in runtime code paths.
