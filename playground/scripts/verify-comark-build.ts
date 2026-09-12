import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { parseComarkCourse } from "../server/utils/comark-course";

// Unit tests alone cannot detect a stale prerender cache. Compare the shipped
// snapshot with fresh parsing, including code metadata and highlighted tokens.
const sources = new URL("../content/courses/abap-platform-rap120/", import.meta.url);
const filenames = (await readdir(sources)).filter((name) => name.endsWith(".md")).sort();
const expected = await Promise.all(filenames.map(async (filename) =>
  parseComarkCourse(await readFile(new URL(filename, sources), "utf8"), filename)
));
const actual = JSON.parse(await readFile(new URL("../.output/public/api/comark-course", import.meta.url), "utf8"));
assert.deepEqual(actual, JSON.parse(JSON.stringify(expected)), "The built Comark snapshot must match current sources and adapter output");
console.log(`Comark build matches ${filenames.length} current source documents.`);
