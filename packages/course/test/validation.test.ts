import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import basicCourse from "../../../examples/basic-course/course.json";
import { validateCourse, validateCourseMarkdown } from "../src/index.js";

describe("validateCourse", () => {
  it("accepts the basic example", () => {
    const result = validateCourse(cloneCourse());

    expect(result.success).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("rejects duplicate step ids within a course", () => {
    const course = cloneCourse();
    course.lessons[1].steps[0].id = course.lessons[0].steps[0].id;

    const result = validateCourse(course);

    expect(result.success).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "duplicate-step-id"
        })
      ])
    );
  });

  it("rejects invalid file paths", () => {
    const course = cloneCourse();
    course.fileSnapshots.push({
      path: "../outside.ts",
      language: "typescript",
      content: "export {};\n"
    });

    const result = validateCourse(course);

    expect(result.success).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "invalid-file-path"
        })
      ])
    );
  });

  it("reports unknown visible file references", () => {
    const course = cloneCourse();
    course.lessons[0].steps[0].visibleFiles = ["src/Missing.vue"];

    const result = validateCourse(course);

    expect(result.success).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "unknown-file-reference"
        })
      ])
    );
  });
});

function cloneCourse(): typeof basicCourse {
  return JSON.parse(JSON.stringify(basicCourse)) as typeof basicCourse;
}

describe("validateCourseMarkdown", () => {
  it("accepts the basic Markdown course", async () => {
    const sourceUrl = new URL("../../../playground/content/courses/how-to-build-an-ai-chat.md", import.meta.url);
    const source = await readFile(sourceUrl, "utf8");
    const result = await validateCourseMarkdown(source, { filePath: fileURLToPath(sourceUrl) });

    expect(result.success).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.metadata?.title).toBe("Build an AI Chatbot with Nuxt, Nuxt UI, and AI SDK");
    expect(result.snapshots.length).toBeGreaterThan(0);
  });

  it("rejects Markdown without frontmatter", async () => {
    const result = await validateCourseMarkdown([
      "## Setup",
      "",
      "::code-tree-intersection",
      "",
      "```ts [src/main.ts]",
      "export {};",
      "```",
      "",
      "::"
    ].join("\n"));

    expect(result.success).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "frontmatter"
        })
      ])
    );
  });

  it("rejects invalid code fence paths", async () => {
    const result = await validateCourseMarkdown(markdownWithCodeFence("ts [../outside.ts]"));

    expect(result.success).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "file-path"
        })
      ])
    );
  });

  it("rejects code-tree fences without file metadata", async () => {
    const result = await validateCourseMarkdown(markdownWithCodeFence("ts"));

    expect(result.success).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "code-tree"
        })
      ])
    );
  });
});

function markdownWithCodeFence(info: string): string {
  return [
    "---",
    "title: Demo",
    "description: Demo course",
    "version: 0.1.0",
    "---",
    "",
    "## Setup",
    "",
    "::code-tree-intersection",
    "",
    `\`\`\`${info}`,
    "export {};",
    "```",
    "",
    "::"
  ].join("\n");
}
