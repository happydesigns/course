# Comark migration pilot

This is a limited parser/renderer experiment, not a replacement for Nuxt Content collections. It uses Comark and `@comark/vue` 0.7.0, with Shiki 4.3.1. The existing RAP120 Markdown files are the source; no course content is copied or rewritten.

## Try it

Run `pnpm dev` and open `/comark/abap-platform-rap120`. All eight lessons use the normal Course reader, with a separate `comark-pilot-rap120` storage key. Existing learner progress under `/courses` is independent. The pilot is deliberately absent from the regular catalog and marked `noindex`.

The Nitro endpoint `/api/comark-course` parses the source on the server. Prerendering includes the endpoint and pilot pages; the client receives document data and the Vue renderer, not the Comark parser or Shiki highlighter.

## Adapter responsibilities

- Keep the current Course page envelope, routes, metadata and table of contents.
- Put Comark tuples into `body.value`, so the existing code-step model can consume them without another collector.
- Preserve explicit `{{ $doc.input.<id> }}` authoring bindings when Comark turns them into binding nodes. Course resolves these before rendering, including placeholders split across highlighted spans.
- Supply the raw code string from Comark's code subtree to Nuxt UI v4, including in the side panel.
- Apply Comark's `--shiki-dark` token colors in both the body and the mobile/desktop code panel. The pilot marks its code blocks so this rule does not change the regular MDC pages.
- Map prose components explicitly in the pilot Vue renderer. Course owns the checkpoint and intersection mappings through the reader's `body` slot.

The parser comparison checks every RAP document's title, checkpoint IDs, code-step ordering, filenames, languages, and file contents against MDC. Comark omits the final fence newline, so that single trailing newline is normalized in the comparison; whitespace inside code remains significant.

## Scope of a later migration

This pilot does not migrate collection queries, Studio, the core validator, or the full Nuxt UI integration. Before replacing the default engine, expand parity coverage to the remaining courses and custom prose components, settle the final-newline contract, and decide how collections and Studio will be provided. Avoid keeping this explicit prose map as a second production component registry.

The next source-layer candidate is `comark-content`: its official Nuxt guide uses a server Content instance, an API handler and a client, rather than a drop-in `queryCollection` replacement. Evaluate that source layer separately, including its build-time snapshot deployment, before removing Nuxt Content.

References: [Comark migration from MDC](https://comark.dev/kb/migration-from-mdc), [Comark document model](https://comark.dev/getting-started/document-model), [code-block compatibility](https://comark.dev/kb/custom-code-block), [Comark Content with Nuxt](https://content.comark.dev/integrations/nuxt).
