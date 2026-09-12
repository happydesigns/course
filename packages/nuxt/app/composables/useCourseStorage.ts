import type { CourseStorage } from "../types/course";
import type { InjectionKey } from "vue";
import { inject, provide } from "vue";
import { provideCourseProgressStore } from "./useCourseProgressState";

export type { CourseStorage } from "../types/course";

const courseStorageKey: InjectionKey<CourseStorage> = Symbol("course-storage");

export function provideCourseStorage(storage: CourseStorage): void {
  provide(courseStorageKey, storage);
  provideCourseProgressStore();
}

export function useCourseStorage(): CourseStorage {
  return inject(courseStorageKey, createBrowserCourseStorage, true);
}

export function createBrowserCourseStorage(): CourseStorage {
  return {
    getItem(key) {
      if (!import.meta.client) {
        return null;
      }

      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      if (!import.meta.client) {
        return;
      }

      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Persistence is an enhancement. Reading a course must continue in
        // restricted, private, or quota-constrained browser contexts.
      }
    }
  };
}
