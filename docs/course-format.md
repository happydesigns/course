# MDC Course Format

A course is authored as a Comark directory. Its `0.index.md` file is the overview; each additional Markdown file is an independently addressable lesson. Markdown prose remains the source of truth, while Course components add navigation, progress, checkpoints, and the synchronized code workspace.

```text
content/courses/my-course/
  0.index.md
  1.getting-started.md
  2.build-the-feature.md
  3.verify-the-result.md
```

The overview and every lesson are ordinary Comark pages. Nuxt owns routes; Comark parses component syntax and headings, and Comark Content supplies documents without a second course format.

The JSON schema remains available as a compatibility and interchange format for deterministic tools, but new authored courses should use Markdown.

## Markdown Source

Required overview frontmatter:

- `title`: Human-readable course title.
- `description`: Short summary of the course.
- `courseId`: Stable kebab-case identifier shared by all pages in the course.
- `pageType: course`: Marks the page as the course overview.

Recommended overview frontmatter:

- `version`: Semantic Versioning identifier for the published content state, such as `1.2.0`.
- `date`: Publication date of that version in `YYYY-MM-DD` format. The reader labels it as “Updated”.
- `inputs`: Course-wide interactive values inherited by lessons.

Required lesson frontmatter:

- `title`: Lesson title.
- `description`: Short lesson summary.
- `courseId`: The overview's course identifier.
- `pageType: lesson`: Marks the page as a lesson.
- `order`: Stable numeric position in the curriculum.

Recommended lesson frontmatter:

- `estimatedMinutes`: Expected completion time.
- `optional`: Excludes the lesson from required-progress totals when `true`.

Optional frontmatter:

- `category`: Course grouping label.
- `navigation`: Whether the course should appear in navigation.
- `authors`: Author metadata for the reader.
- `metadata`: Generic metadata for authoring, profiles, or `needsReview` markers.

## Navigation and Progress

Applications query the overview and all pages with the same `courseId`, order lessons by `order`, and pass them to `CourseReader`. The reader composes Nuxt UI's page, aside, content navigation, table-of-contents, progress, slideover, and surrounding-page components. URLs remain normal Nuxt routes, so learners can bookmark, reload, and navigate directly to any lesson.

Progress is deliberately client-side and product-neutral. The default adapter stores it per `courseId` in `localStorage` and contains only completed lesson paths, completed checkpoint IDs, and the last visited lesson. Content and routing do not depend on progress. Applications can provide the `CourseStorage` contract from `@happydesigns/course-nuxt/storage` to use authenticated or synchronized storage without changing the Markdown or reader rules.

`courseId` is the durable identity used for progress. Updating `version` or `date` does not reset a learner's state. Keep checkpoint IDs stable when revising content. If a new release is intentionally a separate learning experience and old progress must not carry over, publish it under a new `courseId` or migrate progress in the application's storage adapter.

Use version changes to communicate the scope of a content release:

- Patch: corrections and clarifications that preserve the curriculum.
- Minor: backward-compatible lesson, checkpoint, or example additions.
- Major: a substantially redesigned or incompatible curriculum. A major number alone still does not reset progress.

Add a checkpoint where the learner has reached a meaningful, verifiable outcome:

```mdc
---
title: Build the feature
description: Implement and verify the first working version.
courseId: my-course
pageType: lesson
order: 2
estimatedMinutes: 20
---

## Verify the result

Run the application and confirm the expected result.

::course-checkpoint{id="feature-runs"}
I verified that the feature runs as described.
::
```

Checkpoint IDs come directly from the corresponding MDC components, so authors maintain each ID only once. Validation rejects missing or duplicate IDs. A lesson with checkpoints is complete when all its checkpoints are complete. Optional lessons are tracked but do not reduce required-course progress.

## Course Inputs

Interactive values are declared in frontmatter and referenced through explicit,
named placeholders. An input does not define arbitrary search strings:

````mdc
---
inputs:
  - id: groupId
    label: Group ID
    defaultValue: ABC
---

Create `ZR_TRAVEL{{ $doc.input.groupId }}`.

```abap [src/ZR_TRAVEL{{ $doc.input.groupId }}.bdef]
define behavior for ZR_TRAVEL{{ $doc.input.groupId }}
```
````

The supported Course binding form is
`{{ $doc.input.<id> }}` syntax. Every binding must reference a declared input,
every locally declared input on a standalone page must be used (overviews may declare inputs for their lessons), and input IDs must be unique. The Course
reader resolves native Comark binding nodes as well as fenced code and filename metadata,
where CommonMark preserves it as literal text.

Code pane state is declared with MDC:

````mdc
::code-tree-intersection

```ts [src/main.ts]
export const appName = "Course starter";
```

::
````

Each fenced code block inside `code-tree-intersection` must include normalized relative file metadata in square brackets, such as `[src/main.ts]`.

### Text, selection and suggestions

Definitions remain serializable YAML/JSON. `CourseInputSchema` validates them with Zod;
`createCourseInputValueSchema(input)` exposes the corresponding Zod string/enum validator.
Existing text inputs continue to work unchanged.

```yaml
inputs:
  - id: projectName
    label: Project name
    defaultValue: my-app
  - id: packageName
    label: Development package
    normalization:
      trim: true
      case: uppercase
    minLength: 2
    maxLength: 30
    pattern: "[A-Z0-9_/$]+"
  - id: ide
    label: Development environment
    sharedId: workshop-2026.ide
    defaultValue: vscode
    options:
      - value: vscode
        label: VS Code
      - value: eclipse
        label: Eclipse
  - id: shell
    label: Terminal
    options: [Bash, PowerShell]
    allowCustom: true
```

Without `options`, the reader uses Nuxt UI `Input`. With `options`, it uses `Select` and
accepts only listed values. `allowCustom: true` uses `InputMenu mode="autocomplete"`:
the learner can select a suggestion or type any string. Suggestions can have labels; selecting one inserts its stored value. `minLength`, `maxLength`, and `pattern` validate text and suggestions;
invalid drafts display an error and do not substitute into course content. Text defaults
may remain authoring placeholders such as `###`. Fixed-selection defaults must be listed.
Empty fields use `defaultValue` as their placeholder unless an explicit `placeholder` is set.
The collapsed summary uses the current value or its default; a custom placeholder is only an input hint.

Optional `normalization` transforms learner input before validation, persistence, and content
substitution. `trim: true` removes surrounding whitespace; `case` accepts `uppercase` or
`lowercase`. Authored defaults, fixed values, and option values must already use their normalized
form. Previously persisted values are normalized when restored, so adding normalization also
migrates existing browser state without separate data handling.

`id` is the local binding name (`{{ $doc.input.ide }}`). By default, values persist per
course and input ID. Optional `sharedId` gives a value a stable identity across courses
on the same site and storage provider, even when their local IDs differ. Use the same
definition and shared ID in each participating overview. Different events should use
different IDs. Sharing does not cross browser profiles or websites. Changing a shared
ID starts a new value; existing per-course storage keys are unchanged.

Shared values update mounted readers immediately. With browser storage, changes and deletions also synchronize across open tabs on the same origin. Values restore after hydration and
are checked against each receiving course's definition. An obsolete selection falls
back to the course's default. A custom `CourseStorage` provider isolates both live and
persisted values. Storage failures do not block reading; values remain in memory.

### Alternative instructions

```md
::course-variant{parameter="ide" value="vscode" label="In VS Code"}
Open the command palette and select the command described in this step.
::

::course-variant{parameter="ide" value="eclipse" label="In Eclipse"}
Select the corresponding action from the project context menu.
::
```

`course-variant` renders only when the resolved parameter equals `value`. No application
component or executable condition is needed. Labels are optional. Bindings and variant
conditions both count as parameter usage during validation; unknown IDs and invalid
fixed values are rejected.

Variants adapt instructions, not the curriculum: keep headings, checkpoints and
`code-tree-intersection` outside them. The validator enforces this so the outline,
resume links, progress and cumulative code workspace stay consistent when switching.
Ordinary prose, lists, images and standalone code fences can be conditional.

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

## Comark Reader

`@happydesigns/course-nuxt` exports `courseCollectionSchema`. Applications use that schema in their own page collection and pass the queried overview, current page, and ordered lessons to `CourseReader`. The package deliberately does not choose a collection name, source glob, route, or URL prefix.

The reader resolves the `course` capability with `@happydesigns/nuxt-variants`. Structural features such as course inputs, the synchronized code stage, and the file tree can be configured or disabled through registered variant entries. Individual content remains in Markdown rather than `app.config.ts`.

Every `code-tree-intersection` contributes the files declared in that block to a cumulative project state. A later block with the same normalized path replaces the previous content for that file. The right-hand desktop stage follows the current reading position; the fenced blocks remain available inline on smaller screens, with the accumulated project also available in a fixed, expandable mobile panel.

## JSON Compatibility

JSON is not the primary authoring format. Keep it only for compatibility, interchange, or deterministic tooling that needs a structured representation.

## Course

Required fields:

- `id`: Stable course identifier.
- `title`: Human-readable course title.
- `description`: Short summary of the course.
- `version`: Semantic Versioning identifier for the content state.
- `lessons`: Ordered lessons.

Optional fields:

- `date`: Publication date of the current version in `YYYY-MM-DD` format.
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

## Next courses

Define optional successors on the course overview using stable course IDs:

```yaml
courseId: getting-started
nextCourses:
  - first-project
  - another-project
```

Order is explicit; it is not inferred from catalog ordering. Each ID must resolve to
one course (not a lesson). Duplicate IDs, self references, and unknown targets are errors.
The Markdown validator checks the local definition; catalog references are checked
when the host calls `resolveNextCourses(course, catalog)` from `@happydesigns/course`.
Pass the result to `<CourseReader :next-courses="nextCourses" />`. Catalog entries need
`courseId`, `path`, `title`, and `description`; include `pageType` if lessons are present.
The preview integrates this automatically. Hosts should resolve every overview during
content validation or build to catch missing targets before deployment.

Cards appear below the overview, at the last required lesson, and at the final lesson.
They never require completed checkpoints and do not replace lesson navigation. No
successors means no section. Titles and descriptions come from the target courses.
Customize `courseNavigation.nextCoursesTitle` and `nextCourseLinkLabel` through the
existing variant configuration to localize the section and its link label.

### Fixed course parameters

Use `fixedValue` instead of `defaultValue` for author-controlled values:

```yaml
inputs:
  - id: environment
    label: Environment
    fixedValue: training
  - id: editor
    label: Editor
    fixedValue: vscode
    options:
      - value: vscode
        label: VS Code
      - value: eclipse
        label: Eclipse
```

Fixed values use the same `{{ $doc.input.environment }}` placeholders and
`course-variant` conditions as editable parameters. They appear as information,
without input controls. With only fixed parameters there is no parameter toggle.
Stored preferences and update attempts cannot override them, and fixed values
are not written to learner storage. Existing preferences remain available if
the parameter becomes editable again.

A fixed value must satisfy the configured options and constraints.
`fixedValue` and `defaultValue` cannot be combined. Keep alternative options and
variant content to support future course configurations. Fixed values are public
course content, not a place for secrets or an authorization mechanism.
