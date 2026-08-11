import { describe, expect, it } from "vitest";
import {
  courseResumePath,
  courseProgressStorageKey,
  parseCourseProgress,
  progressSummary
} from "../app/composables/useCourseProgress";

describe("course progress", () => {
  const lessons = [
    {
      path: "/courses/demo/required",
      optional: false,
      checkpoints: ["prepared", "verified"]
    },
    { path: "/courses/demo/optional", optional: true }
  ];

  it("recovers safely from missing or invalid local data", () => {
    expect(parseCourseProgress(null)).toEqual({
      completedLessons: [],
      completedCheckpoints: {}
    });
    expect(parseCourseProgress("not-json")).toEqual({
      completedLessons: [],
      completedCheckpoints: {}
    });
  });

  it("normalizes persisted progress and removes duplicates", () => {
    expect(parseCourseProgress(JSON.stringify({
      completedLessons: ["/lesson", "/lesson", 7],
      completedCheckpoints: { "/lesson": ["done", "done", null] },
      lastVisitedLesson: "/lesson"
    }))).toEqual({
      completedLessons: ["/lesson"],
      completedCheckpoints: { "/lesson": ["done"] },
      lastVisitedLesson: "/lesson"
    });
  });

  it("counts only required lessons in course completion", () => {
    expect(progressSummary({
      completedLessons: ["/courses/demo/optional"],
      completedCheckpoints: {}
    }, lessons)).toEqual({ completed: 0, total: 1, percent: 0 });

    expect(progressSummary({
      completedLessons: lessons.map((lesson) => lesson.path),
      completedCheckpoints: {}
    }, lessons)).toEqual({ completed: 1, total: 1, percent: 100 });
  });

  it("measures partial progress using required checkpoints", () => {
    expect(progressSummary({
      completedLessons: [],
      completedCheckpoints: {
        "/courses/demo/required": ["prepared"]
      }
    }, lessons)).toEqual({ completed: 0, total: 1, percent: 50 });
  });

  it("resumes after the contiguous completed checkpoint prefix", () => {
    expect(courseResumePath({
      completedLessons: [],
      completedCheckpoints: {
        "/courses/demo/required": ["prepared"]
      }
    }, lessons)).toBe("/courses/demo/required#checkpoint-prepared");

    expect(courseResumePath({
      completedLessons: [],
      completedCheckpoints: {
        "/courses/demo/required": ["verified"]
      }
    }, lessons)).toBe("/courses/demo/required");
  });

  it("namespaces storage by course", () => {
    expect(courseProgressStorageKey("demo", "hd-course")).toBe("hd-course:demo");
  });
});
