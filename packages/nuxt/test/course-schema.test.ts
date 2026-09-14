import type { MarkdownDocument } from "comark";
import { describe, expect, it } from "vitest";
import { toCoursePage } from "../app/utils/course-page";
import { courseCollectionSchema } from "../schemas/collections";

describe("course collection schema", () => {
  it("preserves schema metadata and native Comark nodes in the reader adapter", () => {
    const nodes: MarkdownDocument["nodes"] = [["p", {}, "Hello"]];
    const page = toCoursePage({ path: "/courses/demo", data: { title: "Demo", description: "Course", image: "/cover.png" }, nodes, meta: {} });
    expect(page.image).toBe("/cover.png");
    expect(page.nodes).toBe(nodes);
    expect(() => toCoursePage({ path: "/courses/invalid", data: { title: "" }, nodes, meta: {} })).toThrow();
  });

  it("reuses the core input contract", () => {
    const valid = courseCollectionSchema.safeParse({
      title: "Course",
      description: "Description",
      inputs: [{ id: "groupId", label: "Group ID", minLength: 3 }]
    });
    const invalid = courseCollectionSchema.safeParse({
      title: "Course",
      description: "Description",
      inputs: [{ id: "1-invalid", label: "Group ID" }]
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it("validates lesson structure fields", () => {
    expect(courseCollectionSchema.safeParse({
      title: "Lesson",
      description: "Description",
      courseId: "demo-course",
      pageType: "lesson",
      order: 2,
      estimatedMinutes: 15,
      checkpoints: ["verified-result"]
    }).success).toBe(true);
  });

  it("validates published course metadata", () => {
    expect(courseCollectionSchema.safeParse({
      title: "Course",
      description: "Description",
      version: "1.2.0",
      date: "2026-08-11"
    }).success).toBe(true);

    expect(courseCollectionSchema.safeParse({
      title: "Course",
      description: "Description",
      version: "latest",
      date: "2026-02-30"
    }).success).toBe(false);
  });
});
