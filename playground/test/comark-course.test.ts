import { readFile, readdir } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseMarkdown as parseMdc } from "@nuxtjs/mdc/runtime";
import { fileURLToPath } from "node:url";
import { createPreviewContent } from "../../packages/nuxt/preview/content";
import { extractCourseMarkdownSnapshots } from "../../packages/course/src/markdown";
import { validateCourseMarkdown } from "../../packages/course/src/markdown";
import { extractCourseCodeDocument } from "../../packages/nuxt/app/utils/course-code-document";
import { getCourseCheckpointIds } from "../../packages/nuxt/app/utils/course-content";
import { resolveCourseCodeSteps } from "../../packages/nuxt/app/utils/course-code";

const courses = createPreviewContent(fileURLToPath(new URL("../../packages/nuxt/preview/content", import.meta.url)));

const sources = new URL("../../packages/nuxt/preview/content/courses/abap-platform-rap120/", import.meta.url);
const filenames = (await readdir(sources)).filter((name) => name.endsWith(".md")).sort();

describe("Comark Content against the existing MDC authoring contract", () => {
  it.each(filenames)("preserves code versions and checkpoints in %s", async (filename) => {
    const source = await readFile(new URL(filename, sources), "utf8");
    const mdc = await validateCourseMarkdown(source, {
      inheritedInputs: [{ id: "groupId", label: "Group ID", defaultValue: "###" }]
    });
    expect(mdc.success, JSON.stringify(mdc.issues)).toBe(true);
    await courses.init({ partial: false, ignoreCache: true });
    const entries = await courses.list();
    const entry = entries.find(item => item.meta.key.endsWith(filename) && item.path.includes("abap-platform-rap120"));
    expect(entry).toBeDefined();
    const page = (await courses.get(entry!.path))!;
    const legacy = await parseMdc(source);
    const { steps } = extractCourseCodeDocument(page.nodes);
    const compact = (files: { path: string; code: string; language?: string }[]) =>
      files.map(({ path, code, language }) => ({ path, code: code.replace(/\n$/, ""), language }));
    // The parsers differ only in the final fence newline. Compare every actual code byte.
    expect(steps.map((step) => compact(step.files))).toEqual(extractCourseMarkdownSnapshots(legacy.body).map((step) => compact(step.files)));
    expect(page.data.title).toBe(mdc.metadata?.title);
    expect(getCourseCheckpointIds(page.nodes)).toEqual(getCourseCheckpointIds(legacy.body));
    for (const step of resolveCourseCodeSteps(steps, { groupId: "XYZ" })) {
      for (const file of step.files) {
        expect(file.path).not.toContain("{{");
        expect(file.code).not.toContain("{{");
      }
    }
  });
});
