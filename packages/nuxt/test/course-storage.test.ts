import { describe, expect, it } from "vitest";
import { createBrowserCourseStorage } from "../app/composables/useCourseStorage";

describe("course storage", () => {
  it("is safe when rendered without browser storage", () => {
    const storage = createBrowserCourseStorage();

    expect(storage.getItem("course:test")).toBeNull();
    expect(() => storage.setItem("course:test", "value")).not.toThrow();
  });
});
