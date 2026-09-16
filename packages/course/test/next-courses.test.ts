import { describe, expect, it } from "vitest";
import { resolveNextCourses } from "../src/next-courses.js";
import { validateCourseMarkdown } from "../src/markdown.js";

const catalog = [
  { courseId: "first", path: "/first", title: "First", description: "First course" },
  { courseId: "second", path: "/second", title: "Second", description: "Second course" }
];
describe("next courses", () => {
  it("resolves ordered metadata and supports no successors", () => {
    expect(resolveNextCourses({}, catalog)).toEqual([]);
    expect(resolveNextCourses({ nextCourses: ["second", "first"] }, catalog)).toEqual([catalog[1], catalog[0]]);
  });
  it("rejects missing, ambiguous, duplicate and self references", () => {
    expect(() => resolveNextCourses({ nextCourses: ["missing"] }, catalog)).toThrow('found 0');
    expect(() => resolveNextCourses({ nextCourses: ["first"] }, [...catalog, catalog[0]!])).toThrow('found 2');
    expect(() => resolveNextCourses({ nextCourses: ["first", "first"] }, catalog)).toThrow('duplicate');
    expect(() => resolveNextCourses({ courseId: "first", nextCourses: ["first"] }, catalog)).toThrow('itself');
    expect(resolveNextCourses({ nextCourses: ["first"] }, [...catalog, { ...catalog[0]!, pageType: "lesson" }])).toEqual([catalog[0]]);
  });
  it("validates frontmatter and restricts definitions to overviews", async () => {
    const markdown = (fields: string) => `---\ntitle: Course\ndescription: Description\ncourseId: first\n${fields}\n---\n`;
    expect((await validateCourseMarkdown(markdown('pageType: course\nnextCourses: [second]'))).metadata?.nextCourses).toEqual(['second']);
    for (const fields of ['pageType: lesson\nnextCourses: [second]', 'nextCourses: [first]', 'nextCourses: [second, second]', 'nextCourses: [/invalid]']) {
      expect((await validateCourseMarkdown(markdown(fields))).success).toBe(false);
    }
  });
});
