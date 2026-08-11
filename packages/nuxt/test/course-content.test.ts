import { describe, expect, it } from "vitest";
import { getCourseCheckpointIds, hasCourseCodeTree } from "../app/utils/course-content";

describe("course content capabilities", () => {
  it("finds code intersections in Nuxt Content minimark values", () => {
    expect(hasCourseCodeTree({
      type: "minimark",
      value: [
        ["p", {}, "Introduction"],
        ["code-tree-intersection", {}, ["pre", { language: "text" }, "code"]]
      ]
    })).toBe(true);
  });

  it("keeps prose-only pages in reading mode", () => {
    expect(hasCourseCodeTree({
      type: "minimark",
      value: [["p", {}, "Introduction"]]
    })).toBe(false);
  });

  it("derives checkpoint ids in document order from minimark", () => {
    expect(getCourseCheckpointIds({
      type: "minimark",
      value: [
        ["course-checkpoint", { id: "project-ready" }, "Ready"],
        ["div", {}, ["course-checkpoint", { id: "preview-verified" }, "Verified"]],
        ["course-checkpoint", { id: "project-ready" }, "Duplicate"]
      ]
    })).toEqual(["project-ready", "preview-verified"]);
  });

  it("supports object-shaped MDC nodes", () => {
    expect(getCourseCheckpointIds({
      type: "root",
      children: [
        { type: "element", tag: "course-checkpoint", props: { id: "done" } }
      ]
    })).toEqual(["done"]);
  });
});
