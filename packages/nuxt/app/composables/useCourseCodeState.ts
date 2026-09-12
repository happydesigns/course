import type { InjectionKey, Ref } from "vue";
import { inject, provide } from "vue";

export interface CourseCodeState {
  inputsReady: Ref<boolean>;
  activate: (stepIndex: number) => void;
  resetProgression: () => void;
}

const courseCodeStateKey: InjectionKey<CourseCodeState> = Symbol("course-code-state");

export function provideCourseCodeState(state: CourseCodeState): void {
  provide(courseCodeStateKey, state);
}

export function useCourseCodeState(): CourseCodeState | undefined {
  return inject(courseCodeStateKey, undefined);
}
