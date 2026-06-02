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
2. Extract prose without changing technical meaning.
3. Map file states into `fileSnapshots` and step-level `codeChanges`.
4. Convert instructions into deterministic `CourseAction` entries.
5. Add validation hints from source checks, expected outputs, or commands.
6. Mark uncertainty with `needsReview` and document the reason in prose or metadata.
7. Run `pnpm validate:examples` or `course validate <path>`.

## Runtime Boundary

No converted course should depend on runtime AI. If AI was used during conversion, that fact belongs in authoring notes, not in runtime code paths.
