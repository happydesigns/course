import type { ComputedRef, InjectionKey, Ref } from "vue";
import type { CourseProgressData } from "../types/course";
import { computed, inject, provide, ref } from "vue";
import { createEmptyCourseProgress } from "./useCourseProgress";

type CourseProgressStore = Record<string, CourseProgressData>;

const courseProgressStoreKey: InjectionKey<Ref<CourseProgressStore>> = Symbol("course-progress-store");

/** A storage provider also owns the live progress of its descendant readers. */
export function provideCourseProgressStore(): void {
  provide(courseProgressStoreKey, ref<CourseProgressStore>({}));
}

export function useCourseProgressState(storageKey: ComputedRef<string>): Ref<CourseProgressData> {
  const providedStore = inject(courseProgressStoreKey, undefined);
  // Normal route pages share state within the Nuxt app. Custom storage
  // providers isolate both persistence and live state, including previews.
  const store = providedStore ?? useState<CourseProgressStore>(
    "happydesigns-course:progress",
    () => ({})
  );

  return computed({
    get: () => store.value[storageKey.value] ??= createEmptyCourseProgress(),
    set: (value) => { store.value[storageKey.value] = value; }
  });
}
