import type { ComputedRef, MaybeRefOrGetter, Ref } from "vue";
import type { CourseInput, CoursePage } from "../types/course";
import { computed, onMounted, ref, toValue, watch } from "vue";
import { courseInputStorageKey, createCourseInputValueSchema, normalizeCourseInputValue } from "@happydesigns/course";
import { useCourseInputStore } from "./useCourseInputState";
import { createCourseInputValues } from "../utils/course-inputs";
import { useCourseStorage } from "./useCourseStorage";

export interface CourseInputsController {
  inputs: ComputedRef<CourseInput[]>;
  values: Ref<Record<string, string>>;
  resolvedValues: ComputedRef<Readonly<Record<string, string>>>;
  ready: Ref<boolean>;
  inputValue: (input: CourseInput) => string;
  setInputValue: (input: CourseInput, value: string | number) => void;
}

export function useCourseInputs(options: {
  course: MaybeRefOrGetter<CoursePage>;
  courseKey: MaybeRefOrGetter<string>;
  enabled: MaybeRefOrGetter<boolean>;
}): CourseInputsController {
  const storage = useCourseStorage();
  const store = useCourseInputStore();
  const ready = ref(false);
  const inputs = computed(() => toValue(options.enabled) ? (toValue(options.course).inputs ?? []) : []);
  const values = computed(() => Object.fromEntries(inputs.value.map((input) => [
    input.id,
    normalizeCourseInputValue(input, input.fixedValue ?? (ready.value ? store.value[storageKey(input)] ?? "" : ""))
  ])));
  const resolvedValues = computed(() => createCourseInputValues(inputs.value, values.value));

  function storageKey(input: CourseInput): string {
    return courseInputStorageKey(toValue(options.courseKey), input);
  }

  function restore(): void {
    for (const input of inputs.value) {
      if (input.fixedValue !== undefined) continue;
      const key = storageKey(input);
      const storedValue = Object.hasOwn(store.value, key) ? store.value[key] ?? "" : storage.getItem(key) ?? "";
      const normalizedValue = normalizeCourseInputValue(input, storedValue);
      store.value[key] = normalizedValue;
      if (storedValue !== normalizedValue) storage.setItem(key, normalizedValue);
    }
    ready.value = true;
  }

  function inputValue(input: CourseInput): string {
    return values.value[input.id] ?? "";
  }

  function setInputValue(input: CourseInput, value: string | number): void {
    if (!ready.value || input.fixedValue !== undefined) return;
    const normalizedValue = normalizeCourseInputValue(input, String(value));
    if (input.options && !input.allowCustom && !createCourseInputValueSchema(input).safeParse(normalizedValue).success) return;

    if (values.value[input.id] === normalizedValue) {
      return;
    }

    store.value[storageKey(input)] = normalizedValue;
    storage.setItem(storageKey(input), normalizedValue);
  }

  onMounted(restore);
  watch(
    [() => toValue(options.courseKey), inputs],
    () => {
      if (ready.value) {
        restore();
      }
    }
  );

  return { inputs, values, resolvedValues, ready, inputValue, setInputValue };
}
