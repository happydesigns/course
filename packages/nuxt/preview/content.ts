import { comarkContent } from "comark-content";
import fs from "comark-content/sources/fs";
import { withSnapshot } from "comark-content/sources/snapshot";
import { courseInputHighlighting } from "@happydesigns/course-nuxt/highlighting";
import shiki from "comark/plugins/shiki";
import toc from "comark/plugins/toc";
import abap from "shiki/langs/abap.mjs";

export function createPreviewContent(sourceDir: string) {
  const source = fs(sourceDir);
  const watch = source.watch;
  // The fs driver emits native Windows separators, while Comark's index uses '/'.
  // Normalize before parsing so updates/removals address the original document.
  if (watch) source.watch = callback => watch((event, key) => callback(event, key.replace(/\\/g, "/")));

  return comarkContent("coursePreview", {
    basePath: "/api/course-preview",
    source: withSnapshot(source,
      () => import("nitropack/runtime").then(({ useStorage }) => useStorage("assets:course-preview").getItem("coursePreview/snapshot.json"))),
    markdown: { autoClose: false, plugins: [toc({ depth: 2 }), shiki({ languages: [abap], transformers: [courseInputHighlighting()] })] },
    onError: "throw"
  });
}
