---
name: happydesigns-course-author
description: Convert existing repositories, Markdown docs, workshop notes, or legacy course material into learner-facing course Markdown using `.md` files with MDC syntax and synchronized code-tree sections. Use when Codex is asked to create, convert, revise, or review a progressive technical course from source repos or existing documentation, including generator-led workshops where prompts create files before later code adjustments.
---

# happydesigns Course Author

Create deterministic, learner-facing `.md` course sources from existing source material. The output should read like the course itself, not like an audit of how the conversion was done.

## Required Reference

Before writing or revising a course, read `references/mdc-course-format.md`. Use it as the syntax contract for frontmatter, MDC blocks, fenced file metadata, and review markers.

## Runtime and ownership

The shared reference content lives in `packages/nuxt/preview/content/courses`; both the playground and Studio preview consume it. Consumer applications may own separate sources. Edit Markdown sources, never generated snapshots or `.nuxt` output.

Comark parses the Markdown and its component syntax; highlighting uses `comark/plugins/shiki` in `packages/nuxt/preview/content.ts`. Keep parsing, code-tree snapshots, and metadata compatible with the installed versions. The reader does not require AI services.

Use `packages/course/src` schemas for CLI contracts and `packages/nuxt/schemas/traits.ts` for reader metadata. Single-page courses may omit `courseId`; the path then identifies local reader state. Existing IDs should remain stable when moving files.

## Workflow

1. Read the repository instructions first, especially `AGENTS.md` if present.
2. Inventory the source material with `rg --files`, then read only the files needed to understand the learner path.
3. Identify the course outcome, ordered sections, course learnings, commands, source files, generator prompts, generated artifacts, follow-up edits, and verification points from the existing material.
4. Preserve source intent, sequence, and learning content. Do not invent missing steps, APIs, commands, screenshots, or code.
5. If the requested target filename is a placeholder such as `my-course.md`, `course.md`, or `draft.md`, use a semantic slug from the source repository or course title unless the user explicitly says the exact filename must be used.
6. Write the course as a `.md` file with normal Markdown prose and MDC components.
7. Use `::code-tree-intersection` blocks when the right code pane should update while the reader scrolls.
8. For generator-led courses, show the generator prompts in sequence when they explain learner actions, then show the generated or adjusted file snapshots that result from those steps.
9. Put fenced code blocks inside each code-tree section with normalized relative `[path]` metadata.
10. Keep shell commands as normal fenced blocks unless they are intentionally displayed as a file snapshot.
11. Mark incomplete, ambiguous, or inconsistent source material only when it affects learner action. Put review notes next to the affected step as rendered prose or `::note`; do not hide them in frontmatter metadata.
12. Validate with the project command when available, for example `pnpm validate:examples` or `pnpm --filter @happydesigns/course course validate <path>`.

## Output Rules

- Default to `packages/nuxt/preview/content/courses/<slug>.md` in this repository unless the user names another target.
- Write a direct course, not a conversion report. The course body must not mention happydesigns, the reader, validators, shipped packages, runtime policy, conversion mechanics, or authoring metadata.
- Keep prose concise and tutorial-like, similar to Nuxt UI blog articles: outcome first, then sections with concrete actions and file snapshots.
- Compress course logistics, repeated navigation, screenshot references, repository chrome, event-specific notes, and redundant summaries.
- Do not compress course learnings: preserve concepts, decisions, required setup, prompts that drive generated output, code changes, verification steps, warnings that affect learner action, and the reason a learner makes each meaningful change.
- Match the existing course schema. Multi-page courses use a shared, stable `courseId`, a `pageType: course` overview, and `pageType: lesson` pages with `order`. Preserve existing checkpoint IDs and course IDs: saved learner progress depends on them. Do not invent additional metadata.
- Use frontmatter `inputs` when the source course has repeated learner-specific placeholders such as package suffixes, resource prefixes, or project names. Configure inputs with stable `id`, visible `label`, `replace`, and optional `defaultValue`; do not hard-code one-off replacement behavior in prose.
- Make `description` learner-facing and outcome-focused. Do not describe the conversion process.
- Use `.md` as the file extension even when the body contains MDC syntax.
- Use forward-slash relative file paths in code fence metadata.
- Do not include absolute paths, drive letters, backslashes, `.` segments, or `..` segments in code fence metadata.
- Do not convert generated files, lockfiles, caches, build output, or dependency folders unless the source course explicitly teaches them.
- Prefer one focused code-tree section per learner concept or scroll activation.
- Do not create `.diff` files for changes. Show the target file snapshot and use Nuxt UI-style line highlight metadata on the fenced block for added or adjusted lines.
- Do not invent generated before-state code. If the baseline is produced by a generator and not included in the source material, tell the learner to update the generated object and show the supported target state.
- Avoid conversion-audit phrases in learner prose, including "source says", "source-provided", "source-backed", "source material", and "this course keeps". Phrase content as workshop instructions.
- Keep authoring notes out of runtime code.

## Code Tree Rules

- Preserve the project/package structure learners see. For generated application objects, use the generated package or project name as the root folder rather than generic folders such as `objects`.
- Follow the source project structure. Do not apply SAP-specific folder conventions to unrelated technologies.
- Keep stable file paths across the course when the same artifact is generated and later adjusted.
- Split large unrelated files into separate `::code-tree-intersection` blocks so the active file changes at the correct scroll point. The current code tree activates the last file in a block by default, so do not put two large files in one block if the first one should be shown first.
- Use real file extensions when possible so Nuxt UI can infer standard icons. Do not add custom icon metadata unless the reader explicitly supports it.
- Use Shiki language IDs in fences. If the playground has a highlight language allow-list and the course uses a bundled Shiki language, configure it in `packages/nuxt/preview/content.ts` using the Comark Shiki plugin. Do not add Nuxt Content configuration.

## Prompt Rules

- Treat prompts as generator inputs, not project files.
- If prompts are useful for preserving sequence, put them under `prompts/<n>.<short-name>.md` and fence them as `text`.
- Do not use custom `.prompt` extensions or custom icons for prompts.
- Do not highlight prompt text unless the source explicitly teaches editing part of the prompt.

## Review Checklist

Before finishing, check:

- Frontmatter matches the applicable schema; `title` and `description` are required. Preserve a source version when available.
- No hidden metadata was added unless the app consumes it.
- The slug is semantic and not a placeholder such as `my-course`.
- The course reads as a direct learner tutorial, not as a conversion report.
- Course logistics may be compressed, but no learning objective, concept, prompt, code change, or verification step from the source path was silently dropped.
- Code-tree blocks are included only where file snapshots help teach the source material.
- Every fenced file in a code-tree block has `[path]` metadata.
- Every path is normalized and relative.
- Generator prompts, generated snapshots, manual edits, and verification steps follow the source sequence.
- Large files are split when separate scroll points should activate different files.
- Any uncertainty that affects learner action is rendered near the affected step, not hidden in frontmatter.
- The course can be rendered without AI services or API keys.
- Validation has been run, or the reason it was not run is reported.
