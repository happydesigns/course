import { comarkContent } from "comark-content";
import fs from "comark-content/sources/fs";
import { withSnapshot } from "comark-content/sources/snapshot";
import shiki from "comark/plugins/shiki";
import toc from "comark/plugins/toc";

export function createPreviewContent(sourceDir: string) {
  return comarkContent("coursePreview", {
    basePath: "/api/course-preview",
    source: withSnapshot(fs(sourceDir),
      () => import("nitropack/runtime").then(({ useStorage }) => useStorage("assets:course-preview").getItem("coursePreview/snapshot.json"))),
    markdown: { autoClose: false, plugins: [toc({ depth: 2 }), shiki()] },
    onError: "throw"
  });
}
