import { describe, expect, it } from "vitest";
import { courseCollectionSchema } from "../schemas/collections";

describe("course collection schema", () => {
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
});
