import type { ComputedRef, InjectionKey, Ref } from "vue";
import { inject, provide, ref } from "vue";

type InputStore = Record<string, string>;
const storeKey: InjectionKey<Ref<InputStore>> = Symbol("course-input-store");
const valuesKey: InjectionKey<ComputedRef<Readonly<InputStore>>> = Symbol("course-input-values");

export function provideCourseInputStore(): void {
  provide(storeKey, ref<InputStore>({}));
}

export function useCourseInputStore(): Ref<InputStore> {
  return inject(storeKey, undefined) ?? useState<InputStore>("happydesigns-course:inputs", () => ({}));
}

export function provideCourseInputValues(values: ComputedRef<Readonly<InputStore>>): void {
  provide(valuesKey, values);
}

export function useCourseInputValues() {
  return inject(valuesKey, undefined);
}
