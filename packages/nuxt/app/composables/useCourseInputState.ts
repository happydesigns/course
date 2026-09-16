import type { ComputedRef, InjectionKey, Ref } from "vue";
import { inject, onMounted, onBeforeUnmount, provide, ref } from "vue";

type InputStore = Record<string, string>;
const storeKey: InjectionKey<Ref<InputStore>> = Symbol("course-input-store");
const valuesKey: InjectionKey<ComputedRef<Readonly<InputStore>>> = Symbol("course-input-values");

export function provideCourseInputStore(): void {
  provide(storeKey, ref<InputStore>({}));
}

export function useCourseInputStore(): Ref<InputStore> {
  const providedStore = inject(storeKey, undefined);
  if (providedStore) return providedStore;

  const store = useState<InputStore>("happydesigns-course:inputs", () => ({}));
  function syncStorage(event: StorageEvent): void {
    if (event.storageArea !== window.localStorage) return;
    if (event.key === null) {
      store.value = {};
    } else if (Object.hasOwn(store.value, event.key)) {
      store.value[event.key] = event.newValue ?? "";
    }
  }
  onMounted(() => window.addEventListener("storage", syncStorage));
  onBeforeUnmount(() => window.removeEventListener("storage", syncStorage));
  return store;
}

export function provideCourseInputValues(values: ComputedRef<Readonly<InputStore>>): void {
  provide(valuesKey, values);
}

export function useCourseInputValues() {
  return inject(valuesKey, undefined);
}
