import { readFile, readdir } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseMarkdown as parseMdc } from "@nuxtjs/mdc/runtime";
import { parseComarkCourse } from "../server/utils/comark-course";
import { validateCourseMarkdown } from "../../packages/course/src/markdown";
import { extractCourseCodeDocument } from "../../packages/nuxt/app/utils/course-code-document";
import { getCourseCheckpointIds } from "../../packages/nuxt/app/utils/course-content";
import { resolveCourseCodeSteps } from "../../packages/nuxt/app/utils/course-code";

const sources = new URL("../content/courses/abap-platform-rap120/", import.meta.url);
const filenames = (await readdir(sources)).filter((name) => name.endsWith(".md")).sort();

describe("Comark pilot against the existing MDC authoring contract", () => {
  it.each(filenames)("preserves code versions and checkpoints in %s", async (filename) => {
    const source = await readFile(new URL(filename, sources), "utf8");
    const mdc = await validateCourseMarkdown(source, {
      inheritedInputs: [{ id: "groupId", label: "Group ID", defaultValue: "###" }]
    });
    expect(mdc.success, JSON.stringify(mdc.issues)).toBe(true);
    const page = await parseComarkCourse(source, filename);
    const { steps } = extractCourseCodeDocument(page.body);
    const compact = (files: { path: string; code: string; language?: string }[]) =>
      files.map(({ path, code, language }) => ({ path, code: code.replace(/\n$/, ""), language }));
    // The parsers differ only in the final fence newline. Compare every actual code byte.
    expect(steps.map((step) => compact(step.files))).toEqual(mdc.snapshots.map((step) => compact(step.files)));
    expect(page.title).toBe(mdc.metadata?.title);
    expect(getCourseCheckpointIds(page.body)).toEqual(getCourseCheckpointIds((await parseMdc(source)).body));
    for (const step of resolveCourseCodeSteps(steps, { groupId: "XYZ" })) {
      for (const file of step.files) {
        expect(file.path).not.toContain("{{");
        expect(file.code).not.toContain("{{");
      }
    }
  });
});
