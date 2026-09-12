import { isDeepStrictEqual } from "node:util";
import { readFile, readdir } from "node:fs/promises";
import { textContent } from "comark/utils";
import type { Node } from "comark";
import { parseComarkCourse } from "../server/utils/comark-course";

// Unit tests alone cannot detect a stale prerender cache. Compare the shipped
// snapshot with fresh parsing, including code metadata and highlighted tokens.
const sources = new URL("../content/courses/abap-platform-rap120/", import.meta.url);
const filenames = (await readdir(sources)).filter((name) => name.endsWith(".md")).sort();
const expected = await Promise.all(filenames.map(async (filename) =>
  parseComarkCourse(await readFile(new URL(filename, sources), "utf8"), filename)
));
const actual = JSON.parse(await readFile(new URL("../.output/public/api/comark-course", import.meta.url), "utf8"));
if (!isDeepStrictEqual(normalize(actual), normalize(JSON.parse(JSON.stringify(expected))))) {
  throw new Error("The built Comark snapshot does not match current source text, metadata or syntax palettes.");
}
console.log(`Comark build matches ${filenames.length} current source documents.`);

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    if (value[0] === "pre") {
      // Shiki may attach inter-token spaces to either adjacent span in Nitro.
      // Compare exact text and palettes, without depending on those boundaries.
      const palettes = new Set<string>();
      const collect = (node: unknown): void => {
        if (!Array.isArray(node)) return;
        if (node[1] && typeof node[1] === "object" && "style" in node[1]) {
          palettes.add(String(node[1].style));
        }
        node.slice(2).forEach(collect);
      };
      collect(value);
      return ["pre", value[1], textContent(value as Node), [...palettes].sort()];
    }
    return value.map(normalize);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalize(entry)]));
  }
  return value;
}
