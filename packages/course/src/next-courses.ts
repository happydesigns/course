import { z } from "zod";

export const CourseNextCoursesSchema = z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/))
  .refine(ids => new Set(ids).size === ids.length, "Next courses must not contain duplicate IDs.");

export interface CourseRelations {
  courseId?: string;
  pageType?: "course" | "lesson";
  nextCourses?: string[];
}

export function refineCourseRelations(course: CourseRelations, ctx: z.RefinementCtx) {
  if (course.nextCourses?.length && course.pageType === "lesson") {
    ctx.addIssue({ code: "custom", path: ["nextCourses"], message: "Define next courses on the course overview, not a lesson." });
  }
  if (course.courseId && course.nextCourses?.includes(course.courseId)) {
    ctx.addIssue({ code: "custom", path: ["nextCourses"], message: "A course cannot follow itself." });
  }
}

/** Resolve explicit successor IDs against the host's catalog, preserving authored order. */
export function resolveNextCourses<T extends { courseId?: string; pageType?: string; path: string; title: string; description: string }>(course: CourseRelations, catalog: readonly T[]): T[] {
  const ids = CourseNextCoursesSchema.parse(course.nextCourses ?? []);
  return ids.map(id => {
    if (id === course.courseId) throw new Error(`Course "${id}" cannot follow itself.`);
    const matches = catalog.filter(item => item.courseId === id && item.pageType !== "lesson");
    if (matches.length !== 1) throw new Error(`Next course "${id}" of "${course.courseId ?? "course"}" must resolve to exactly one course; found ${matches.length}.`);
    return matches[0]!;
  });
}
