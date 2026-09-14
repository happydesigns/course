import { isDeepStrictEqual } from "node:util";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { comarkContent } from "comark-content/runtime";
import snapshot from "comark-content/sources/snapshot";
import { textContent } from "comark/utils";
import type { Node } from "comark";
import { fileURLToPath } from "node:url";

import { createPreviewContent } from "../../packages/nuxt/preview/content";

const previewContent = createPreviewContent(fileURLToPath(new URL("../../packages/nuxt/preview/content", import.meta.url)));

// Unit tests alone cannot detect a stale prerender cache. Compare the shipped
// snapshot with fresh parsing, including code metadata and highlighted tokens.
let count = 0;
for (const [content, endpoint] of [[previewContent, "course-preview"]] as const) {
  await content.init({ partial: false, ignoreCache: true });
  const artifact = JSON.parse(await readFile(new URL("../.output/public/api/" + endpoint + "/snapshot.json", import.meta.url), "utf8"));
  const shipped = comarkContent({ source: snapshot(artifact) });
  for (const entry of await content.list()) {
    const expected = await content.get(entry.path);
    const actual = await shipped.get(entry.path);
    if (!isDeepStrictEqual(normalize(actual), normalize(JSON.parse(JSON.stringify(expected))))) {
      throw new Error("Built Comark document differs from current source: " + entry.path);
    }
    count++;
  }
}
console.log("Comark build matches " + count + " current source documents.");

// Prerendering can pass via raw sources even when server assets were omitted.
// Start the actual server with missing source paths to verify deployment isolation.
const serverPath = fileURLToPath(new URL("../.output/server/index.mjs", import.meta.url));
if (existsSync(serverPath)) {
  const server = spawn(process.execPath, [serverPath], {
    cwd: fileURLToPath(new URL("../.output/server", import.meta.url)),
    windowsHide: true,
    env: { ...process.env, PORT: "0", NITRO_PORT: "0", HOST: "127.0.0.1", NITRO_HOST: "127.0.0.1",
      NUXT_COURSE_PREVIEW_CONTENT_DIR: serverPath + ".missing" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  try {
    const origin = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Production server did not start.")), 20000);
      server.once("error", error => { clearTimeout(timeout); reject(error); });
      server.once("exit", code => { clearTimeout(timeout); reject(new Error("Production server exited: " + code)); });
      server.stdout.on("data", chunk => {
        const match = String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match) { clearTimeout(timeout); resolve(match[0]); }
      });
    });
    for (const [content, endpoint] of [[previewContent, "course-preview"]] as const) {
      const response = await fetch(origin + "/api/" + endpoint + "/list", { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error("Production content needs local Markdown: " + await response.text());
      const entries = await response.json() as unknown[];
      if (entries.length !== (await content.list()).length) throw new Error("Production snapshot is incomplete: " + endpoint);
    }
    const catalog = await fetch(origin + "/api/course-preview/catalog.json").then(response => {
      if (!response.ok) throw new Error("Production catalog is unavailable without sources");
      return response.json();
    }) as { path: string; nodes?: unknown }[];
    if (catalog.length !== count || catalog.some(entry => entry.nodes)) throw new Error("Production catalog is incomplete or contains bodies");
    for (const slug of new Set(catalog.map(entry => entry.path.split("/")[2]))) {
      const pages = await fetch(origin + "/api/course-preview/courses/" + slug + "/data.json").then(response => {
        if (!response.ok) throw new Error("Production course is unavailable without sources: " + slug);
        return response.json();
      }) as { path: string }[];
      const expected = catalog.filter(entry => entry.path === "/courses/" + slug || entry.path.startsWith("/courses/" + slug + "/"));
      if (!isDeepStrictEqual(pages.map(page => page.path).sort(), expected.map(page => page.path).sort())) throw new Error("Production course selection is incomplete: " + slug);
    }
    console.log("Production APIs work without local Markdown sources.");
  } finally {
    server.kill();
  }
}

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
