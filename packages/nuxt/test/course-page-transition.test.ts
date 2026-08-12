import { describe, expect, it } from "vitest";
import {
  normalizeCourseRoutePath,
  shouldRunCoursePageTransition
} from "../app/composables/useCoursePageTransition";

describe("course page transition", () => {
  it("ignores initial hydration and same-route updates", () => {
    expect(shouldRunCoursePageTransition("/courses/demo", "/", 0)).toBe(false);
    expect(shouldRunCoursePageTransition("/courses/demo", "/courses/demo", 1)).toBe(false);
    expect(shouldRunCoursePageTransition(
      "/courses/demo/",
      "/courses/demo",
      1,
      true,
      true
    )).toBe(false);
  });

  it("treats trailing-slash variants as the same route", () => {
    expect(normalizeCourseRoutePath("/courses/demo///")).toBe("/courses/demo");
    expect(normalizeCourseRoutePath("/")).toBe("/");
    expect(shouldRunCoursePageTransition(
      "/courses/demo/",
      "/courses/demo",
      1
    )).toBe(false);
  });

  it("runs for navigation between mounted routes", () => {
    expect(shouldRunCoursePageTransition(
      "/courses/demo/next",
      "/courses/demo/current",
      1
    )).toBe(true);
  });
});
