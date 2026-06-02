import { describe, expect, it } from "vitest";
import basicCourse from "../../../examples/basic-course/course.json";
import { validateCourse } from "../src/index.js";

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
