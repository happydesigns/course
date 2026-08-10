import type { CoursePage, CourseProgressData } from "../types/course";
import type { ComputedRef, InjectionKey, Ref } from "vue";
import { computed, inject, provide } from "vue";

export interface CourseProgressContext {
  data: Ref<CourseProgressData>;
  ready: Ref<boolean>;
  currentLessonPath: ComputedRef<string | undefined>;
  requiredLessons: ComputedRef<CoursePage[]>;
  completedRequiredCount: ComputedRef<number>;
  percent: ComputedRef<number>;
  isLessonComplete: (path: string) => boolean;
  isCheckpointComplete: (lessonPath: string, checkpointId: string) => boolean;
  setCheckpointComplete: (lessonPath: string, checkpointId: string, complete: boolean) => void;
  setLessonComplete: (path: string, complete: boolean) => void;
  visitLesson: (path: string) => void;
}

const courseProgressKey: InjectionKey<CourseProgressContext> = Symbol("course-progress");

export function provideCourseProgress(context: CourseProgressContext): void {
  provide(courseProgressKey, context);
}

export function useCourseProgress(): CourseProgressContext | undefined {
  return inject(courseProgressKey, undefined);
}

export function createEmptyCourseProgress(): CourseProgressData {
  return {
    completedLessons: [],
    completedCheckpoints: {}
  };
}

export function parseCourseProgress(value: string | null): CourseProgressData {
  if (!value) {
    return createEmptyCourseProgress();
  }

  try {
    const parsed = JSON.parse(value) as Partial<CourseProgressData>;
    return {
      completedLessons: stringArray(parsed.completedLessons),
      completedCheckpoints: isRecord(parsed.completedCheckpoints)
        ? Object.fromEntries(
            Object.entries(parsed.completedCheckpoints).map(([path, checkpoints]) => [
              path,
              stringArray(checkpoints)
            ])
          )
        : {},
      ...(typeof parsed.lastVisitedLesson === "string"
        ? { lastVisitedLesson: parsed.lastVisitedLesson }
        : {})
    };
  } catch {
    return createEmptyCourseProgress();
  }
}

export function courseProgressStorageKey(courseId: string, prefix = "course-progress"): string {
  return `${prefix}:${courseId}`;
}

export function progressSummary(
  data: CourseProgressData,
  lessons: readonly CoursePage[]
): { completed: number; total: number; percent: number } {
  const required = lessons.filter((lesson) => !lesson.optional);
  const completed = required.filter((lesson) => data.completedLessons.includes(lesson.path)).length;
  return {
    completed,
    total: required.length,
    percent: required.length > 0 ? Math.round((completed / required.length) * 100) : 0
  };
}

export function useCourseProgressMetrics(
  data: Ref<CourseProgressData>,
  lessons: ComputedRef<CoursePage[]>
) {
  const requiredLessons = computed(() => lessons.value.filter((lesson) => !lesson.optional));
  const completedRequiredCount = computed(
    () => requiredLessons.value.filter((lesson) => data.value.completedLessons.includes(lesson.path)).length
  );
  const percent = computed(() =>
    requiredLessons.value.length > 0
      ? Math.round((completedRequiredCount.value / requiredLessons.value.length) * 100)
      : 0
  );

  return { requiredLessons, completedRequiredCount, percent };
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((entry): entry is string => typeof entry === "string"))]
    : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
