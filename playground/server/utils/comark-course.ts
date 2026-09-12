import { createMarkdownParser } from "comark";
import type { Node, ElementNode } from "comark";
import { textContent } from "comark/utils";
import shiki from "comark/plugins/shiki";
import toc from "comark/plugins/toc";
import abap from "shiki/langs/abap.mjs";
import type { CoursePage } from "@happydesigns/course-nuxt/types";

const parse = createMarkdownParser({
  autoClose: false,
  plugins: [toc({ depth: 2 }), shiki({ languages: [abap] })]
});

/** Pilot boundary: retain Course's page envelope, but parse every body with Comark. */
export async function parseComarkCourse(source: string, filename: string): Promise<CoursePage> {
  const document = await parse(source);
  const nodes = document.nodes.map(adaptNode);
  const slug = filename.replace(/^\d+\./, "").replace(/\.md$/, "");
  const path = `/comark/abap-platform-rap120${slug === "index" ? "" : `/${slug}`}`;
  return {
    ...document.frontmatter,
    id: path,
    path,
    stem: filename.replace(/\.md$/, ""),
    extension: "md",
    title: String(document.frontmatter.title ?? ""),
    description: String(document.frontmatter.description ?? ""),
    meta: {},
    seo: {},
    body: {
      type: "minimark",
      value: nodes as CoursePage["body"]["value"],
      toc: document.meta.toc
    }
  };
}

function adaptNode(node: Node): Node {
  if (!Array.isArray(node) || node[0] === null) return node;
  const [tag, attrs, ...children] = node;
  // Course's author-facing binding remains explicit and engine-independent.
  if (tag === "binding" && typeof attrs[":value"] === "string"
    && /^\$doc\.input\.[A-Za-z][A-Za-z0-9_.-]*$/.test(attrs[":value"])) {
    return `{{ ${attrs[":value"]} }}`;
  }
  const adapted: ElementNode = [tag, { ...attrs }, ...children.map(adaptNode)];
  // Keep copy text deterministic in Nuxt UI v4 instead of relying on its DOM fallback.
  if (tag === "pre") adapted[1].code = textContent(node);
  return adapted;
}
