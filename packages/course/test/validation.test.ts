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

  it("rejects a non-semantic Markdown version", async () => {
    const source = markdownWithCodeFence("ts [src/main.ts]")
      .replace("version: 0.1.0", "version: next");

    const result = await validateCourseMarkdown(source);

    expect(result.success).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "frontmatter" })
      ])
    );
  });

  it("requires a semantic course version", () => {
    const course = cloneCourse();
    course.version = "August release";

    const result = validateCourse(course);

    expect(result.success).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "schema", path: ["version"] })
      ])
    );
  });

  it("validates the course update date", () => {
    const result = validateCourse({ ...cloneCourse(), date: "2026-02-30" });

    expect(result.success).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "schema", path: ["date"] })
      ])
    );
  });

  it("rejects an invalid Markdown update date", async () => {
    const source = markdownWithCodeFence("ts [src/main.ts]")
      .replace("version: 0.1.0", "version: 0.1.0\ndate: 2026-02-30");

    const result = await validateCourseMarkdown(source);

    expect(result.success).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "frontmatter" })
      ])
    );
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

  it("accepts configured Markdown inputs", async () => {
    const result = await validateCourseMarkdown(markdownWithInputs());

    expect(result.success).toBe(true);
    expect(result.metadata?.inputs).toEqual([
      expect.objectContaining({
        id: "groupId",
        label: "Group ID"
      })
    ]);
  });

  it("rejects placeholders without a configured input", async () => {
    const result = await validateCourseMarkdown(
      markdownWithInputs([])
    );

    expect(result.success).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "course-input"
        })
      ])
    );
  });

  it("rejects configured inputs that are not used", async () => {
    const result = await validateCourseMarkdown(
      markdownWithInputs([
        "inputs:",
        "  - id: unused",
        "    label: Unused"
      ])
    );

    expect(result.success).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "course-input"
        })
      ])
    );
  });

  it("accepts lesson placeholders inherited from the course overview", async () => {
    const result = await validateCourseMarkdown(
      lessonMarkdown(),
      {
        inheritedInputs: [
          { id: "groupId", label: "Group ID", defaultValue: "###" }
        ]
      }
    );

    expect(result.success).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("derives checkpoints without a duplicated frontmatter list", async () => {
    const result = await validateCourseMarkdown(
      lessonMarkdown().replace("checkpoints:\n  - lesson-done\n", ""),
      {
        inheritedInputs: [
          { id: "groupId", label: "Group ID", defaultValue: "###" }
        ]
      }
    );

    expect(result.success).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("rejects checkpoints that are not both declared and rendered", async () => {
    const result = await validateCourseMarkdown(
      lessonMarkdown().replace('id="lesson-done"', 'id="different-id"'),
      {
        inheritedInputs: [
          { id: "groupId", label: "Group ID", defaultValue: "###" }
        ]
      }
    );

    expect(result.success).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "checkpoint" })
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

function markdownWithInputs(inputs: string[] = [
  "inputs:",
  "  - id: groupId",
  "    label: Group ID",
  "    defaultValue: \"ABC\""
]): string {
  return [
    "---",
    "title: Demo",
    "description: Demo course",
    "version: 0.1.0",
    ...inputs,
    "---",
    "",
    "## Setup",
    "",
    "::code-tree-intersection",
    "",
    "```ts [src/main-{{ $doc.input.groupId }}.ts]",
    "export const id = '{{ $doc.input.groupId }}';",
    "```",
    "",
    "::"
  ].join("\n");
}

function lessonMarkdown(): string {
  return [
    "---",
    "title: Lesson",
    "description: A course lesson",
    "courseId: demo-course",
    "pageType: lesson",
    "order: 1",
    "checkpoints:",
    "  - lesson-done",
    "---",
    "",
    "Create `ZR_TRAVEL{{ $doc.input.groupId }}`.",
    "",
    '::course-checkpoint{id="lesson-done"}',
    "I completed the lesson.",
    "::"
  ].join("\n");
}
