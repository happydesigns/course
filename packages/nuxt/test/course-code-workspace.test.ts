import { describe, expect, it } from "vitest";
import { selectCourseCodeSources } from "../app/composables/useCourseCodeWorkspace";

const sources = [
  { source: "previous:0", items: ["previous-a"], progressive: false },
  { source: "previous:1", items: ["previous-b"], progressive: false },
  { source: "current:0", items: ["first"], progressive: true },
  { source: "current:1", items: ["second-a", "second-b"], progressive: true },
  { source: "current:2", items: ["third"], progressive: true }
];

describe("course code workspace progression", () => {
  it("keeps previous pages while withholding the current page before its first step", () => {
    expect(selectCourseCodeSources(sources, undefined)).toEqual([
      "previous-a",
      "previous-b"
    ]);
  });

  it("includes current-page sources only through the active code step", () => {
    expect(selectCourseCodeSources(sources, "current:0")).toEqual([
      "previous-a",
      "previous-b",
      "first"
    ]);
    expect(selectCourseCodeSources(sources, "current:1")).toEqual([
      "previous-a",
      "previous-b",
      "first",
      "second-a",
      "second-b"
    ]);
  });

  it("returns to an earlier progressive snapshot when scrolling back", () => {
    expect(selectCourseCodeSources(sources, "current:2")).toContain("third");
    expect(selectCourseCodeSources(sources, "current:0")).not.toContain("third");
  });

  it("fails closed when the requested progressive source is unknown", () => {
    expect(selectCourseCodeSources(sources, "current:missing")).toEqual([
      "previous-a",
      "previous-b"
    ]);
  });
});
