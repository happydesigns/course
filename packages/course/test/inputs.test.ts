import { describe, expect, it } from "vitest";
import { CourseInputSchema, courseInputStorageKey, createCourseInputValueSchema } from "../src/inputs.js";
import { validateCourseMarkdown } from "../src/markdown.js";

const ide = { id: "ide", label: "Editor", options: ["Eclipse", "VS Code"], defaultValue: "Eclipse" };

describe("course parameters", () => {
  it("validates fixed values without removing alternative variant options", () => {
    const fixed = { ...ide, defaultValue: undefined, fixedValue: "Eclipse" };
    expect(CourseInputSchema.safeParse(fixed).success).toBe(true);
    expect(CourseInputSchema.safeParse({ ...fixed, fixedValue: "unknown" }).success).toBe(false);
    expect(CourseInputSchema.safeParse({ ...fixed, defaultValue: "Eclipse" }).success).toBe(false);
    expect(CourseInputSchema.safeParse({ id: "client", label: "Client", fixedValue: "100", pattern: "[0-9]{3}" }).success).toBe(true);
    expect(CourseInputSchema.safeParse({ id: "client", label: "Client", fixedValue: "x", pattern: "[0-9]{3}" }).success).toBe(false);
  });

  it("preserves legacy text definitions and placeholder defaults", () => {
    const input = CourseInputSchema.parse({ id: "group", label: "Group", defaultValue: "###", pattern: "[0-9]{3}" });
    const valueSchema = createCourseInputValueSchema(input);
    expect(valueSchema.safeParse("007").success).toBe(true);
    expect(valueSchema.safeParse("x007x").success).toBe(false);
  });
  it("distinguishes fixed options from free text with suggestions", () => {
    expect(CourseInputSchema.safeParse(ide).success).toBe(true);
    expect(createCourseInputValueSchema(ide).safeParse("Vim").success).toBe(false);
    expect(createCourseInputValueSchema({ ...ide, allowCustom: true }).safeParse("Vim").success).toBe(true);
  });
  it.each([
    { options: [] },
    { options: ["Eclipse", { value: "Eclipse", label: "Other" }] },
    { defaultValue: "unknown" },
    { options: undefined, allowCustom: true },
    { minLength: 10, maxLength: 2 },
    { pattern: "[" },
    { options: ["invalid"], pattern: "[0-9]+", defaultValue: "invalid" }
  ])("rejects inconsistent definitions %j", (overrides) => {
    expect(CourseInputSchema.safeParse({ ...ide, ...overrides }).success).toBe(false);
  });
  it("isolates local IDs and only shares an explicitly shared ID", () => {
    expect(courseInputStorageKey("a", ide)).toBe("course:a:input:ide");
    expect(courseInputStorageKey("a", ide)).not.toBe(courseInputStorageKey("b", ide));
    expect(courseInputStorageKey("a", { ...ide, sharedId: "event.editor" }))
      .toBe(courseInputStorageKey("b", { id: "differentLocalName", sharedId: "event.editor" }));
    expect(courseInputStorageKey("shared", ide)).not.toBe(courseInputStorageKey("a", { ...ide, sharedId: "ide" }));
  });
});

describe("instruction variants", () => {
  const source = (body: string) => `---
title: Example
description: Example
inputs:
  - id: ide
    label: Editor
    options: [Eclipse, VS Code]
---
${body}
`;
  it("counts variant conditions as parameter usage", async () => {
    expect((await validateCourseMarkdown(source('::course-variant{parameter="ide" value="Eclipse"}\nOpen the project.\n::'))).success).toBe(true);
  });
  it.each([
    '::course-variant{parameter="unknown" value="Eclipse"}\nOpen.\n::',
    '::course-variant{parameter="ide" value="typo"}\nOpen.\n::',
    '::course-variant{parameter="ide" value="Eclipse"}\n## Hidden outline\n::',
    ':::course-variant{parameter="ide" value="Eclipse"}\n::course-checkpoint{id="hidden"}\nDone.\n::\n:::',
    ':::course-variant{parameter="ide" value="Eclipse"}\n::code-tree-intersection\n```ts [a.ts]\ncode\n```\n::\n:::'
  ])("rejects unknown conditions and conditional course structure", async (body) => {
    const result = await validateCourseMarkdown(source(body));
    expect(result.issues.some((issue) => issue.code === "course-input")).toBe(true);
  });
});
