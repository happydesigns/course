---
name: happydesigns-course-author
description: Convert existing repositories, Markdown docs, workshop notes, or legacy course material into happydesigns course Markdown using `.md` files with MDC syntax and synchronized code-tree sections. Use when Codex is asked to create, convert, revise, or review a progressive technical course for the happydesigns course reader, especially from source repos or existing documentation.
---

# happydesigns Course Author

Create deterministic `.md` course sources that can be rendered by the happydesigns/Nuxt UI course reader. AI is only an authoring assistant; never add runtime AI dependencies, API key requirements, or generated claims that are not supported by the source material.

## Required Reference

Before writing or revising a course, read `references/mdc-course-format.md`. Use it as the syntax contract for frontmatter, MDC blocks, fenced file metadata, and review markers.

## Workflow

1. Read the repository instructions first, especially `AGENTS.md` if present.
2. Inventory the source material with `rg --files`, then read only the files needed to understand the learner path.
3. Identify the course outcome, ordered sections, commands, source files, and verification points from the existing material.
4. Preserve source intent and sequence. Do not invent missing steps, APIs, commands, screenshots, or code.
5. Write the course as a `.md` file with normal Markdown prose and MDC components.
6. Use `::code-tree-intersection` blocks when the right code pane should update while the reader scrolls.
7. Put fenced code blocks inside each code-tree section with normalized relative `[path]` metadata.
8. Keep shell commands as normal fenced blocks unless they are intentionally displayed as a file snapshot.
9. Mark incomplete, ambiguous, or inconsistent source material with `needsReview` in prose or frontmatter metadata.
10. Validate with the project command when available, for example `pnpm validate:examples` or `pnpm --filter @happydesigns/course course validate <path>`.

## Output Rules

- Default to `playground/content/courses/<slug>.md` in this repository unless the user names another target.
- Keep prose concise and tutorial-like, similar to Nuxt UI blog articles: outcome first, then sections with concrete actions and file snapshots.
- Use `.md` as the file extension even when the body contains MDC syntax.
- Use forward-slash relative file paths in code fence metadata.
- Do not include absolute paths, drive letters, backslashes, `.` segments, or `..` segments in code fence metadata.
- Do not convert generated files, lockfiles, caches, build output, or dependency folders unless the source course explicitly teaches them.
- Prefer one focused code-tree section per learner concept.
- Keep authoring notes out of runtime code.

## Review Checklist

Before finishing, check:

- Required frontmatter is present: `title`, `description`, `version`.
- The file has at least one `::code-tree-intersection` block.
- Every fenced file in a code-tree block has `[path]` metadata.
- Every path is normalized and relative.
- Any uncertain source claim is marked with `needsReview`.
- The course can be rendered without AI services or API keys.
- Validation has been run, or the reason it was not run is reported.
