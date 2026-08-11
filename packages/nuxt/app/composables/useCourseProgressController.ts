import type { CoursePage, CourseProgressData } from "../types/course";
import type { ComputedRef, MaybeRefOrGetter } from "vue";
import { computed, onMounted, ref, toValue, watch } from "vue";
import {
  courseProgressStorageKey,
  createEmptyCourseProgress,
  parseCourseProgress,
  provideCourseProgress,
  useCourseProgressMetrics,
  type CourseProgressContext
} from "./useCourseProgress";
import { useCourseStorage } from "./useCourseStorage";

export function useCourseProgressController(options: {
  course: MaybeRefOrGetter<CoursePage>;
  currentPage: MaybeRefOrGetter<CoursePage>;
  orderedLessons: ComputedRef<CoursePage[]>;
  courseKey: MaybeRefOrGetter<string>;
  storagePrefix?: MaybeRefOrGetter<string | undefined>;
}): CourseProgressContext {
  const storage = useCourseStorage();
  const data = ref<CourseProgressData>(createEmptyCourseProgress());
  const ready = ref(false);
  const currentLessonPath = computed(() => {
    const page = toValue(options.currentPage);
    return page.pageType === "lesson" ? page.path : undefined;
  });
  const storageKey = computed(() => courseProgressStorageKey(
    toValue(options.course).courseId ?? toValue(options.courseKey),
    toValue(options.storagePrefix)
  ));
  const { requiredLessons, completedRequiredCount, percent } = useCourseProgressMetrics(
    data,
    options.orderedLessons
  );

  function persist(): void {
    if (ready.value) {
      storage.setItem(storageKey.value, JSON.stringify(data.value));
    }
  }

  function isLessonComplete(path: string): boolean {
    return data.value.completedLessons.includes(path);
  }

  function isCheckpointComplete(lessonPath: string, checkpointId: string): boolean {
    return data.value.completedCheckpoints[lessonPath]?.includes(checkpointId) ?? false;
  }

  function updateLessonCompletion(path: string, complete: boolean): boolean {
    if (isLessonComplete(path) === complete) {
      return false;
    }

    const completedLessons = new Set(data.value.completedLessons);
    if (complete) {
      completedLessons.add(path);
    } else {
      completedLessons.delete(path);
    }
    data.value = { ...data.value, completedLessons: [...completedLessons] };
    return true;
  }

  function setLessonComplete(path: string, complete: boolean): void {
    if (updateLessonCompletion(path, complete)) {
      persist();
    }
  }

  function reconcileLessonCompletion(page: CoursePage): boolean {
    const checkpoints = page.checkpoints ?? [];

    return page.pageType === "lesson" && checkpoints.length > 0
      ? updateLessonCompletion(
          page.path,
          checkpoints.every((checkpointId) => isCheckpointComplete(page.path, checkpointId))
        )
      : false;
  }

  function setCheckpointComplete(lessonPath: string, checkpointId: string, complete: boolean): void {
    const checkpoints = new Set(data.value.completedCheckpoints[lessonPath] ?? []);
    if (complete) {
      checkpoints.add(checkpointId);
    } else {
      checkpoints.delete(checkpointId);
    }

    data.value = {
      ...data.value,
      completedCheckpoints: {
        ...data.value.completedCheckpoints,
        [lessonPath]: [...checkpoints]
      }
    };

    if (toValue(options.currentPage).path === lessonPath) {
      reconcileLessonCompletion(toValue(options.currentPage));
    }

    persist();
  }

  function updateLastVisitedLesson(path: string): boolean {
    if (data.value.lastVisitedLesson === path) {
      return false;
    }

    data.value = { ...data.value, lastVisitedLesson: path };
    return true;
  }

  function visitLesson(path: string): void {
    if (updateLastVisitedLesson(path)) {
      persist();
    }
  }

  function reconcileCurrentLesson(path?: string): void {
    if (!path) {
      return;
    }

    const visitedChanged = updateLastVisitedLesson(path);
    const completionChanged = reconcileLessonCompletion(toValue(options.currentPage));

    if (visitedChanged || completionChanged) {
      persist();
    }
  }

  function restore(): void {
    data.value = parseCourseProgress(storage.getItem(storageKey.value));
    ready.value = true;
    reconcileCurrentLesson(currentLessonPath.value);
  }

  const context: CourseProgressContext = {
    data,
    ready,
    currentLessonPath,
    requiredLessons,
    completedRequiredCount,
    percent,
    isLessonComplete,
    isCheckpointComplete,
    setCheckpointComplete,
    setLessonComplete,
    visitLesson
  };

  provideCourseProgress(context);
  onMounted(restore);
  watch(storageKey, () => {
    if (ready.value) {
      restore();
    }
  });
  watch(currentLessonPath, (path) => {
    if (ready.value) {
      reconcileCurrentLesson(path);
    }
  });

  return context;
}
