import type { CoursePage, CourseProgressData } from "../types/course";
import type { ComputedRef, InjectionKey, Ref } from "vue";
import { computed, inject, provide } from "vue";
import { getCourseCheckpointIds } from "../utils/course-content";

export interface CourseProgressContext {
  data: Ref<CourseProgressData>;
  ready: Ref<boolean>;
  currentLessonPath: ComputedRef<string | undefined>;
  requiredLessons: ComputedRef<CoursePage[]>;
  completedRequiredCount: ComputedRef<number>;
  completedRequiredStepCount: ComputedRef<number>;
  requiredStepCount: ComputedRef<number>;
  percent: ComputedRef<number>;
  resumePath: ComputedRef<string | undefined>;
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
  const steps = requiredProgressSteps(data, required);
  return {
    completed,
    total: required.length,
    percent: steps.total > 0 ? Math.round((steps.completed / steps.total) * 100) : 0
  };
}

export function courseResumePath(
  data: CourseProgressData,
  lessons: readonly CoursePage[]
): string | undefined {
  const required = lessons.filter((lesson) => !lesson.optional);
  const lesson = required.find((entry) => !data.completedLessons.includes(entry.path));

  if (!lesson) {
    return required[0]?.path;
  }

  const completed = new Set(data.completedCheckpoints[lesson.path] ?? []);
  let lastCompletedCheckpoint: string | undefined;

  for (const checkpointId of checkpointIds(lesson)) {
    if (!completed.has(checkpointId)) {
      break;
    }

    lastCompletedCheckpoint = checkpointId;
  }

  return lastCompletedCheckpoint
    ? `${lesson.path}#checkpoint-${lastCompletedCheckpoint}`
    : lesson.path;
}

export function useCourseProgressMetrics(
  data: Ref<CourseProgressData>,
  lessons: ComputedRef<CoursePage[]>
) {
  const requiredLessons = computed(() => lessons.value.filter((lesson) => !lesson.optional));
  const completedRequiredCount = computed(
    () => requiredLessons.value.filter((lesson) => data.value.completedLessons.includes(lesson.path)).length
  );
  const requiredSteps = computed(() => requiredProgressSteps(data.value, requiredLessons.value));
  const completedRequiredStepCount = computed(() => requiredSteps.value.completed);
  const requiredStepCount = computed(() => requiredSteps.value.total);
  const percent = computed(() => requiredStepCount.value > 0
    ? Math.round((completedRequiredStepCount.value / requiredStepCount.value) * 100)
    : 0
  );
  const resumePath = computed(() => courseResumePath(data.value, lessons.value));

  return {
    requiredLessons,
    completedRequiredCount,
    completedRequiredStepCount,
    requiredStepCount,
    percent,
    resumePath
  };
}

function requiredProgressSteps(
  data: CourseProgressData,
  lessons: readonly CoursePage[]
): { completed: number; total: number } {
  return lessons.reduce((summary, lesson) => {
    const checkpoints = checkpointIds(lesson);
    const complete = data.completedLessons.includes(lesson.path);

    if (checkpoints.length === 0) {
      return {
        completed: summary.completed + (complete ? 1 : 0),
        total: summary.total + 1
      };
    }

    const completedCheckpoints = new Set(data.completedCheckpoints[lesson.path] ?? []);
    return {
      completed: summary.completed + (complete
        ? checkpoints.length
        : checkpoints.filter((id) => completedCheckpoints.has(id)).length),
      total: summary.total + checkpoints.length
    };
  }, { completed: 0, total: 0 });
}

function checkpointIds(lesson: CoursePage): string[] {
  const derived = getCourseCheckpointIds(lesson.body);
  return derived.length > 0 ? derived : lesson.checkpoints ?? [];
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((entry): entry is string => typeof entry === "string"))]
    : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
