# SAP Profile Guidance

SAP content is a profile and example domain for `@happydesigns/course`. It must not shape the core schema unless the requirement is also useful for non-SAP technical courses.

## Scope

- Put SAP-specific conversion guidance in this file.
- Keep SAP examples under `examples`.
- Keep `packages/course` generic.

## Conversion Notes

- Preserve SAP exercise terminology exactly when it appears in source material.
- Do not invent missing transaction names, object names, service bindings, screenshots, or expected outputs.
- Mark uncertain SAP steps with `needsReview`.
- Represent SAP-specific manual UI work as `manual` actions unless a deterministic command or tool is explicitly present in the source.
- Use validation hints for known commands, activation checks, expected UI state, or test results when the source material provides them.
