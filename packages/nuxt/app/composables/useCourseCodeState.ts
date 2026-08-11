import type { ComputedRef, InjectionKey, Ref, VNode } from "vue";
import { inject, provide } from "vue";

export interface CourseCodeItem {
  label: string;
  component: VNode;
  icon?: string;
}

export type CourseCodeSource = string | symbol;

export interface CourseCodeState {
  activePath: Ref<string>;
  changedPaths: Ref<ReadonlySet<string>>;
  contentRevision: Ref<number>;
  inputValues: ComputedRef<Readonly<Record<string, string>>>;
  inputsReady: Ref<boolean>;
  tree: Ref<Record<string, VNode>>;
  activate: (source: CourseCodeSource, items: readonly CourseCodeItem[]) => void;
  resetProgression: () => void;
  register: (
    source: CourseCodeSource,
    items: readonly CourseCodeItem[],
    options?: { activate?: boolean; progressive?: boolean }
  ) => void;
  unregister: (source: CourseCodeSource) => void;
}

const courseCodeStateKey: InjectionKey<CourseCodeState> = Symbol("course-code-state");

export function provideCourseCodeState(state: CourseCodeState): void {
  provide(courseCodeStateKey, state);
}

export function useCourseCodeState(): CourseCodeState | undefined {
  return inject(courseCodeStateKey, undefined);
}
