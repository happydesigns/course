import { describe, expect, it } from "vitest";
import { hasCourseCodeTree } from "../app/utils/course-content";

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
});
