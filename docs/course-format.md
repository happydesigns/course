# Course Format

A course is a progressive technical tutorial. It contains lessons, steps, file snapshots, actions, code changes, validation hints, and optional assets.

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
