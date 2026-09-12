import { comarkContent } from "comark-content";
import fs from "comark-content/sources/fs";
import { withSnapshot } from "comark-content/sources/snapshot";
import shiki from "comark/plugins/shiki";
import toc from "comark/plugins/toc";
import abap from "shiki/langs/abap.mjs";

export function createCourses(sourceDir: string) {
  return comarkContent("courses", {
    source: withSnapshot(fs(sourceDir),
      () => import("nitropack/runtime").then(({ useStorage }) => useStorage("assets:courses").getItem("courses/snapshot.json"))),
    markdown: { autoClose: false, plugins: [toc({ depth: 2 }), shiki({ languages: [abap] })] },
    onError: "throw"
  });
}
