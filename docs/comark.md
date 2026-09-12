# Comark integration

Course uses native Comark nodes and metadata, with no minimark envelope. The core validator parses with Comark; the reader uses MarkdownDocument. The official @comark/nuxt module registers Markdown components and discovers Nuxt UI prose components. Only Course-specific checkpoints and code intersections are supplied explicitly.

The playground and optional Academy preview each own a Comark Content instance and standard API handler. Their filesystem sources preserve the existing Markdown files and normalized course URLs. TOC and Shiki run on the server/build side. ABAP is registered through the documented Shiki plugin language option. Course resolves explicit learner input bindings before rendering; code-token interpolation also handles placeholders split across syntax tokens.

Nuxt's nitro:build:before hook calls the public writeSnapshots API and bundles the output as Nitro server assets. withSnapshot loads those artifacts in production and retains the filesystem origin for builds and development. The standard snapshot.json endpoints are prerendered for static deployments. The reader uses the documented parser-free comark-content/runtime with a snapshot source, avoiding filesystem collisions between an overview endpoint and its child lesson endpoints. The development Nitro plugin watches source changes and closes the watcher with Nitro.

The published @happydesigns/ui 0.19.3 base layer still enables @nuxt/content, so that transitive dependency remains installed and loaded. Course no longer uses its renderer, collections, or query API. Removing that inherited module belongs in a coordinated UI release; this migration does not override the shared layer's modules. MDC remains a playground development dependency solely for regression comparisons against existing authoring behavior.

References: [Nuxt rendering](https://comark.dev/rendering/nuxt), [Shiki plugin](https://comark.dev/plugins/built-in/shiki), [Comark Content with Nuxt](https://content.comark.dev/integrations/nuxt), [snapshot deployment](https://content.comark.dev/deployment/with-a-snapshot).

The integration pins Comark and @comark/nuxt to 0.6.2 because Comark Content 0.4.0 declares Comark ^0.6.2. Upgrading the parser to 0.7 independently changes plugin types; update this set together when Content supports it. Source paths are resolved by the Nuxt configuration and passed through private runtime config, avoiding import.meta.url assumptions inside Nitro bundles.
