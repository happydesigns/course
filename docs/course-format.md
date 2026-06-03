# MDC Course Format

A course is authored as a `.md` file with MDC syntax, similar to Nuxt UI's blog content. Markdown prose is the source of truth, and fenced code blocks inside `::code-tree-intersection` blocks drive the synchronized file tree and code pane.

The JSON schema remains available as a compatibility and interchange format for deterministic tools, but new authored courses should use Markdown.

## Markdown Source

Required frontmatter:

- `title`: Human-readable course title.
- `description`: Short summary of the course.
- `version`: Course content version.

Optional frontmatter:

- `date`: Publication or revision date.
- `category`: Course grouping label.
- `navigation`: Whether the course should appear in navigation.
- `authors`: Author metadata for the reader.
- `metadata`: Generic metadata for authoring, profiles, or `needsReview` markers.

Code pane state is declared with MDC:

````mdc
::code-tree-intersection

```ts [src/main.ts]
export const appName = "Course starter";
```

::
````

Each fenced code block inside `code-tree-intersection` must include normalized relative file metadata in square brackets, such as `[src/main.ts]`.

## Review Markers

AI-assisted conversion may be used during authoring, but converted content must remain reviewable. If the source material is ambiguous, incomplete, or inconsistent, preserve what is known and mark the affected content:

````mdc
::note
needsReview: The source document says to deploy the app but does not name the target platform.
::
````

Frontmatter metadata can also collect review notes:

```yaml
metadata:
  runtimeAi: false
  needsReview:
    - The source has two setup commands and does not identify the canonical one.
```

## Agent Skill

Use `skills/happydesigns-course-author` for AI-assisted conversion from existing repositories, Markdown docs, or workshop notes. The skill should draft the `.md` source, preserve the source sequence, mark uncertainty with `needsReview`, and run deterministic validation when available.

## JSON Compatibility

JSON is not the primary authoring format. Keep it only for compatibility, interchange, or deterministic tooling that needs a structured representation.

## Course

Required fields:

- `id`: Stable course identifier.
- `title`: Human-readable course title.
- `description`: Short summary of the course.
- `version`: Course content version.
- `lessons`: Ordered lessons.

Optional fields:

- `fileSnapshots`: Known files available to the reader.
- `metadata`: Generic metadata for authoring or profiles.

## Lesson

Required fields:

- `id`: Unique lesson identifier.
- `title`: Lesson title.
- `steps`: Ordered steps.

Optional fields:

- `description`: Lesson summary.

## Step

Required fields:

- `id`: Unique step identifier within the course.
- `title`: Step title.
- `prose`: Tutorial prose shown to the learner.
- `actions`: Ordered actions for the learner.

Optional fields:

- `codeChanges`: File changes introduced by the step.
- `visibleFiles`: File paths that should be shown for the step.
- `validation`: Deterministic hints for checking work.
- `assets`: Referenced images or other supporting assets.
- `needsReview`: Marks uncertain converted content that requires human review.

## Actions

`CourseAction` is a discriminated union:

- `edit-file`: Edit a known file.
- `run-command`: Run a deterministic command.
- `open-url`: Open a URL.
- `use-tool`: Use a named non-AI tool.
- `manual`: Perform a manual action.

## File Paths

Course file paths must be normalized relative paths with forward slashes. Do not use absolute paths, drive letters, backslashes, empty segments, `.`, or `..`.
