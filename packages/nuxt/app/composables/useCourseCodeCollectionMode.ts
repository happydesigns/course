import type { InjectionKey } from "vue";
import { inject, provide } from "vue";

const courseCodeCollectionModeKey: InjectionKey<boolean> = Symbol("course-code-collection-mode");

export function provideCourseCodeCollectionMode(enabled: boolean): void {
  provide(courseCodeCollectionModeKey, enabled);
}

export function useCourseCodeCollectionMode(): boolean {
  return inject(courseCodeCollectionModeKey, false);
}
