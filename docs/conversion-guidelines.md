# Conversion Guidelines

Codex and other authoring tools may assist with conversion, but generated course files must remain deterministic and reviewable.

## Principles

- Keep the core course format generic.
- Preserve source intent and sequence.
- Do not invent missing course content.
- Mark uncertain converted material with `needsReview`.
- Prefer explicit file snapshots and code changes over vague prose.
- Keep commands deterministic and runnable by a learner.
- Keep validation hints concrete and local where possible.

## Suggested Workflow

1. Identify lessons and step boundaries from the source material.
2. Extract prose into normal Markdown headings and paragraphs without changing technical meaning.
3. Put synchronized file states in `::code-tree-intersection` blocks using fenced code metadata like ````ts [src/main.ts]````.
4. Keep commands as normal fenced code blocks unless they represent a synchronized file state.
5. Add validation hints in prose near the relevant section.
6. Mark uncertainty in prose or frontmatter metadata instead of inventing missing content.
7. Run `pnpm validate:examples` or `course validate <path-to-course.md>`.

## Runtime Boundary

No converted course should depend on runtime AI. If AI was used during conversion, that fact belongs in authoring notes, not in runtime code paths.
