import type { InjectionKey, Ref, VNode } from "vue";
import { inject, provide } from "vue";

export interface CourseCodeItem {
  label: string;
  component: VNode;
  icon?: string;
}

export interface CourseCodeState {
  activePath: Ref<string>;
  changedPaths: Ref<ReadonlySet<string>>;
  contentRevision: Ref<number>;
  inputsReady: Ref<boolean>;
  tree: Ref<Record<string, VNode>>;
  register: (
    source: symbol,
    items: readonly CourseCodeItem[],
    options?: { activate?: boolean }
  ) => void;
  unregister: (source: symbol) => void;
}

const courseCodeStateKey: InjectionKey<CourseCodeState> = Symbol("course-code-state");

export function provideCourseCodeState(state: CourseCodeState): void {
  provide(courseCodeStateKey, state);
}

export function useCourseCodeState(): CourseCodeState | undefined {
  return inject(courseCodeStateKey, undefined);
}
